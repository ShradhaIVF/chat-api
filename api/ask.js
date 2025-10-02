export const config = { runtime: "edge" };

const SYS_PROMPT = `
You are "Shradha IVF Assistant" for Shradha IVF & Maternity, Patna.
- Be clear, warm, and precise. Prefer Hindi unless the user writes English (then reply in English). 
- Always include a short disclaimer: "यह जानकारी शिक्षण हेतु है—व्यक्तिगत सलाह के लिए डॉक्टर से मिलें।"
- Keep answers brief (5-8 lines) with bullet points when helpful.
- Never give treatment prescriptions, dosages, or medical diagnosis.
- If the question is about pricing or appointments, guide: "कॉल/WhatsApp: 9162562266 • shradhaivf.com".
- Sensitive/urgent cases → advise immediate doctor consult or emergency.
`;

function pickLang(text) {
  // Light-weight language hint
  const hiMatch = /[ऀ-ॿ]/.test(text);
  return hiMatch ? "hi" : "en";
}

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Use POST" }), { status: 405 });
  }

  // Basic rate-limit by IP (very simple, stateless)
  const ip = req.headers.get("x-forwarded-for") || "ip";
  if (typeof ip === "string" && ip.split(",").length > 20) {
    return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const { message } = body || {};
  if (!message || typeof message !== "string") {
    return new Response(JSON.stringify({ error: "Missing message" }), { status: 400 });
  }

  const lang = pickLang(message);

  // Optional lightweight "knowledge": FAQs you want the bot to prefer.
  const MINI_KB = `
Q: IVF की सफलता दर क्या है?
A: उम्र, एग क्वालिटी, स्पर्म, और क्लिनिक प्रोटोकॉल पर निर्भर; व्यक्तिगत मूल्यांकन ज़रूरी।
Q: IUI vs IVF?
A: IUI कम-इनवेसिव; IVF में एग रिट्रीवल, लैब फर्टिलाइजेशन, एम्ब्रियो ट्रांसफर होता है।
Q: क्या EMI उपलब्ध है?
A: हाँ, EMI/फाइनेंसिंग विकल्प उपलब्ध; डिटेल्स परामर्श में मिलती हैं।
`;

  const payload = {
    model: "gpt-4o-mini",
    // Using the universal Responses API:
    input: [
      { role: "system", content: SYS_PROMPT },
      { role: "system", content: Language preference: ${lang} },
      { role: "system", content: MiniKB:\n${MINI_KB} },
      { role: "user", content: message }
    ],
  };

  const r = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": Bearer ${process.env.OPENAI_API_KEY},
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
  });

  if (!r.ok) {
    const e = await r.text();
    return new Response(JSON.stringify({ error: "OpenAI error", detail: e }), { status: 500 });
  }

  const data = await r.json();
  const reply =
    data.output_text ||
    data.choices?.[0]?.message?.content ||
    "क्षमा करें, अभी उत्तर नहीं दे पाया। कृपया दोबारा पूछें।";

  // CORS so Durable front-end can call it
  return new Response(JSON.stringify({ reply }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "content-type"
    }
  });
}
