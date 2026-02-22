import os
import json
import fitz   # PyMuPDF
import requests
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

# ── Gemini REST API configuration ─────────────────────────────────────────────
API_KEY = "AIzaSyCi1f_S-nCggbPjtzJcoYVY00bwe7J12fQ"

# Models tried in order until one succeeds
CANDIDATE_MODELS = [
    "gemini-2.0-flash",        # fast, usually available
    "gemini-2.5-flash",        # confirmed working fallback
    "gemini-2.0-flash-lite",   # lightweight option
    "gemini-flash-latest",     # alias
]

def _gemini_url(model: str, version: str = "v1beta") -> str:
    return (
        f"https://generativelanguage.googleapis.com/{version}/models/{model}"
        f":generateContent?key={API_KEY}"
    )

SYSTEM_PROMPT = """Role:
You are an AI-powered Market Research Analyst.

Objective:
Analyze the content of an uploaded yearly business report and return structured business insights strictly in JSON format.

Your Task:
Carefully analyze the provided business report text and generate clear, concise, decision-oriented insights.

Output Format (STRICT JSON ONLY):
Return ONLY valid JSON. Do NOT include explanations, markdown, comments, or extra text.

JSON Structure:
{
  "current_business_situation": "...",
  "strong_points": ["...", "..."],
  "weak_points": ["...", "..."],
  "smart_suggestions": ["...", "..."],
  "next_strategic_moves": ["...", "..."]
}

Field Guidelines:
- current_business_situation: Summarize the company's present state (growth, decline, stability, challenges, opportunities).
- strong_points: Identify competitive advantages, good performance indicators, strengths, successful strategies.
- weak_points: Identify risks, inefficiencies, declining metrics, operational or strategic concerns.
- smart_suggestions: Provide practical, realistic improvement ideas based on weaknesses and context.
- next_strategic_moves: Recommend forward-looking actions (expansion, optimization, innovation, cost control, diversification, etc.).

Analysis Rules:
- Base insights ONLY on provided text.
- Do NOT hallucinate missing data.
- If information is insufficient, state cautiously (e.g., "Limited financial detail available").
- Keep insights business-focused and actionable.
- Use professional, analytical tone.

Response Constraints:
- Output MUST be valid JSON.
- No markdown, no prose outside JSON, no formatting errors."""


def extract_text_from_pdf(file_stream) -> str:
    """Extract all readable text from a PDF using PyMuPDF."""
    pdf_bytes = file_stream.read()
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    parts = []
    for i, page in enumerate(doc, start=1):
        text = page.get_text("text")
        if text.strip():
            parts.append(f"--- Page {i} ---\n{text.strip()}")
    doc.close()
    if not parts:
        raise ValueError("No readable text found in the PDF.")
    return "\n\n".join(parts)


def analyze_with_gemini(report_text: str) -> dict:
    """Call Gemini REST API, trying multiple models until one succeeds."""
    # Embed system prompt directly in the user message for maximum compatibility
    full_prompt = f"{SYSTEM_PROMPT}\n\nBusiness Report Text:\n\n{report_text}"

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": full_prompt}]
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 4096
        }
    }

    last_error = None
    for model in CANDIDATE_MODELS:
        for version in ("v1beta", "v1"):
            url = _gemini_url(model, version)
            try:
                resp = requests.post(url, json=payload, timeout=120)
                if resp.status_code in (404, 429):
                    last_error = f"HTTP {resp.status_code} for {version}/{model}"
                    continue        # try next model/version
                resp.raise_for_status()
                data = resp.json()
                raw = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                # Strip markdown code fences if Gemini wraps the JSON
                if raw.startswith("```"):
                    lines = raw.splitlines()
                    raw = "\n".join(l for l in lines if not l.strip().startswith("```"))
                return json.loads(raw.strip())
            except requests.HTTPError as e:
                last_error = f"HTTP {e.response.status_code}: {e.response.text[:200]}"
                continue
            except Exception as e:
                last_error = str(e)
                continue

    raise RuntimeError(
        f"All Gemini models failed. Last error: {last_error}"
    )


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/analyze", methods=["POST"])
def analyze():
    if "pdf" not in request.files:
        return jsonify({"error": "No PDF file provided. Use field name 'pdf'."}), 400

    uploaded = request.files["pdf"]
    if not uploaded.filename:
        return jsonify({"error": "Empty filename."}), 400
    if not uploaded.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Only PDF files are accepted."}), 400

    try:
        report_text = extract_text_from_pdf(uploaded.stream)
    except Exception as e:
        return jsonify({"error": f"PDF extraction failed: {e}"}), 422

    if len(report_text.strip()) < 100:
        return jsonify({"error": "PDF contains too little readable text."}), 422

    # Limit tokens (~800k chars ≈ 200k tokens — well within Gemini's window)
    if len(report_text) > 800_000:
        report_text = report_text[:800_000]

    try:
        insights = analyze_with_gemini(report_text)
    except requests.HTTPError as e:
        return jsonify({"error": f"Gemini API HTTP error: {e.response.text}"}), 502
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 502
    except json.JSONDecodeError:
        return jsonify({"error": "Gemini returned non-JSON content. Please try again."}), 500
    except Exception as e:
        return jsonify({"error": f"Analysis error: {str(e)}"}), 500

    return jsonify(insights)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
