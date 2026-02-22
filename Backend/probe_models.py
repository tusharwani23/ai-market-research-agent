import requests

API_KEY = "AIzaSyCi1f_S-nCggbPjtzJcoYVY00bwe7J12fQ"
models = [
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-flash-latest",
]
payload = {
    "contents": [
        {"role": "user", "parts": [{"text": "Say hello in one word."}]}
    ]
}

found = False
for m in models:
    for v in ("v1beta", "v1"):
        url = f"https://generativelanguage.googleapis.com/{v}/models/{m}:generateContent?key={API_KEY}"
        try:
            r = requests.post(url, json=payload, timeout=20)
            status = r.status_code
            print(f"[{status}] {v} / {m}")
            if status == 200:
                text = r.json()["candidates"][0]["content"]["parts"][0]["text"]
                print(f"  --> WORKS! Response: {text[:80]}")
                found = True
                break
        except Exception as e:
            print(f"[ERR] {v} / {m}: {e}")
    if found:
        break

if not found:
    print("\nNo working model found. Check API key validity.")
