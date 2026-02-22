# 🔍 AI Market Research Analyst

An AI-powered web application that analyzes annual business report PDFs and returns structured, decision-ready insights — rendered on a beautiful interactive dashboard.

Built with **Flask** + **Gemini AI** + **Chart.js**.

---

## ✨ Features

- 📄 **PDF Upload** — Drag-and-drop or click-to-browse your business report
- 🤖 **AI Analysis** — Text is analyzed by Google's Gemini AI with a Market Analyst system prompt
- 📊 **Interactive Dashboard** with:
  - 🏢 Current Business Situation summary
  - ✅ Strong Points & ⚠️ Weak Points (side-by-side)
  - 📈 Radar chart (Strengths vs Weaknesses)
  - 📊 Bar chart (Insight category overview)
  - 💡 Smart Suggestions & 🚀 Next Strategic Moves
  - 🔢 Animated KPI counters
- 🎨 **Dark glassmorphism UI** with animated ambient background

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.8+ · Flask |
| PDF Extraction | PyMuPDF (`fitz`) |
| AI Analysis | Google Gemini REST API |
| Frontend | HTML · Vanilla CSS · JavaScript |
| Charts | Chart.js (Radar + Bar) |
| Fonts | Google Fonts — Inter |

---

## 📁 Project Structure

```
market-analyst/
├── app.py                  ← Flask server, PDF extraction, Gemini API calls
├── requirements.txt        ← Python dependencies
├── README.md
├── templates/
│   └── index.html          ← Main HTML page (served by Flask)
└── static/
    ├── style.css           ← All styling (dark glassmorphism theme)
    └── script.js           ← Dashboard logic, charts, file upload handling
```

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/market-analyst.git
cd market-analyst
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Add your Gemini API key

Open `app.py` and replace the `API_KEY` value with your own key:

```python
API_KEY = "your-gemini-api-key-here"
```

> Get a free API key at [Google AI Studio](https://aistudio.google.com/app/apikey)

### 4. Run the app

```bash
python app.py
```

Then open **http://127.0.0.1:5000** in your browser.

---

## 📖 How It Works

1. **Upload** your annual business report (PDF)
2. **Flask** extracts all readable text using PyMuPDF
3. The text is sent to the **Gemini REST API** with a structured Market Analyst prompt
4. Gemini returns a strict **JSON response** with 5 insight categories
5. The frontend **renders the dashboard** with animated charts and cards

### JSON Output Structure

```json
{
  "current_business_situation": "...",
  "strong_points": ["...", "..."],
  "weak_points": ["...", "..."],
  "smart_suggestions": ["...", "..."],
  "next_strategic_moves": ["...", "..."]
}
```

---

## ⚙️ Gemini Model Fallback

The app tries multiple Gemini models in order until one succeeds:

```
gemini-2.0-flash → gemini-2.5-flash → gemini-2.0-flash-lite → gemini-flash-latest
```

This makes the app resilient to model quota limits or availability issues.

---

## 📦 Requirements

```
flask
PyMuPDF
google-generativeai
```

Install with:

```bash
pip install -r requirements.txt
```

---

## 📝 Notes

- Only **PDF** files are accepted
- The PDF must contain extractable (non-scanned) text
- Large PDFs are automatically truncated to ~800,000 characters to stay within Gemini's token window
- All analysis happens server-side; no data is stored or sent to third parties beyond the Gemini API

---

## 📄 License

MIT License — feel free to use, modify, and distribute.
