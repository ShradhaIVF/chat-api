// api/ask.js — Vercel Node serverless function using /v1/responses
export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  // Parse body
  let message = "";
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    message = body?.message || "";
  } catch {}
  if (!message) return res.status(400).json({ error: "Missing 'message'" });

  const SYS_PROMPT = `
You are "Shradha IVF Assistant" for Shradha IVF & Maternity, Patna.
- Reply warmly and clearly in Hindi unless the user writes in English.
- Always add: "यह जानकारी शिक्षण हेतु है—व्यक्तिगत सलाह के लिए डॉक्टर से मिलें।"
- Keep answers short (5–8 lines). No prescriptions/doses.
- For appointments/cost: "कॉल/WhatsApp: 9162562266 • shradhaivf.com"
`;

  try {
    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: [
          { role: "system", content: SYS_PROMPT },
          { role: "user", content: message },
        ],
        temperature: 0.6,
      }),
    });

    const text = await r.text(); // keep raw for debugging
    let data;
    try { data = JSON.parse(text); } catch { data = null; }

    if (!r.ok) {
      // Pass through real status + message so you can see exact reason in the browser
      return res.status(r.status).json({
        error: "OpenAI error",
        status: r.status,
        detail: data?.error || text,
      });
    }

    const reply = (data && (data.output_text || data?.choices?.[0]?.message?.content))
      || "क्षमा करें, अभी उत्तर उपलब्ध नहीं।";
    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: "Server error", detail: String(err) });
  }
}
