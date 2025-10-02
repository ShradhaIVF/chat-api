// api/ask.js — Vercel Node serverless function with CORS + OpenAI

export default async function handler(req, res) {
  // --- CORS (allow your website to call this endpoint from the browser)
  res.setHeader("Access-Control-Allow-Origin", "*");            // or replace * with https://www.shradhaivf.com for stricter
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Preflight request from browsers
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  // --- Read JSON body safely
  let message = "";
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    message = (body && body.message) || "";
  } catch {
    // ignore JSON parse error
  }
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Missing 'message' string in body" });
  }

  // --- System prompt to keep answers short, bilingual, safe
  const SYS_PROMPT = `
You are "Shradha IVF Assistant" for Shradha IVF & Maternity, Patna.
- Reply warmly and clearly in Hindi unless the user writes in English.
- Always add: "यह जानकारी शिक्षण हेतु है—व्यक्तिगत सलाह के लिए डॉक्टर से मिलें।"
- Keep answers short (5–8 lines). No prescriptions/doses.
- For appointments/cost: "कॉल/WhatsApp: 9162562266 • shradhaivf.com"
`;

  try {
    // --- Call OpenAI (Chat Completions)
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYS_PROMPT },
          { role: "user", content: message },
        ],
        temperature: 0.6,
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      // Surface OpenAI error back to client for easier debugging
      return res.status(500).json({
        error: "OpenAI error",
        detail: data?.error || data,
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content ||
      "क्षमा करें, अभी उत्तर उपलब्ध नहीं।";

    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: "Server error", detail: String(err) });
  }
}
