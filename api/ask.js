// api/ask.js  — Node serverless function (simplest & stable)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Content-Type", "application/json");
    res.status(405).json({ error: "Use POST" });
    return;
  }

  let message = "";
  try {
    const body = req.body && typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    message = body?.message || "";
  } catch {
    // ignore
  }
  if (!message) {
    res.status(400).json({ error: "Missing message" });
    return;
  }

  const SYS_PROMPT = `
You are "Shradha IVF Assistant" for Shradha IVF & Maternity, Patna.
- Reply warmly and clearly in Hindi unless the user writes English.
- Always add: "यह जानकारी शिक्षण हेतु है—व्यक्तिगत सलाह के लिए डॉक्टर से मिलें।"
- Keep answers short (5–8 lines). No prescriptions/doses.
- For appointments/cost: "कॉल/WhatsApp: 9162562266 • shradhaivf.com"
`;

  const payload = {
    model: "gpt-4o-mini",
    input: [
      { role: "system", content: SYS_PROMPT },
      { role: "user", content: message }
    ]
  };

  try {
    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": Bearer ${process.env.OPENAI_API_KEY},
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!r.ok) {
      const e = await r.text();
      res.status(500).json({ error: "OpenAI error", detail: e });
      return;
    }

    const data = await r.json();
    const reply =
      data.output_text ||
      data.choices?.[0]?.message?.content ||
      "क्षमा करें, अभी उत्तर उपलब्ध नहीं।";

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");
    res.status(200).json({ reply });
  } catch (err) {
    res.status(500).json({ error: "Server error", detail: String(err) });
  }
}
