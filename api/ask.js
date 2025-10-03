// api/ask.js — Shradha IVF Assistant (Chat Completions, reliable parsing)
// Works on Vercel Node serverless. No external files needed.

export default async function handler(req, res) {
  // --- CORS for browser embedding
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  // --- API key check
  const KEY = process.env.OPENAI_API_KEY;
  if (!KEY || !KEY.startsWith("sk-")) {
    return res.status(500).json({ error: "Server missing OPENAI_API_KEY" });
  }

  // --- Read incoming message safely
  let message = "";
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    message = (body?.message || "").toString().slice(0, 4000);
  } catch {
    return res.status(400).json({ error: "Invalid JSON body" });
  }
  if (!message) return res.status(400).json({ error: "Missing 'message'" });

  // --- Condensed Clinic Fact Book (edit any time)
  const FACTS = `
Shradha IVF & Maternity, Patna | Lead: Dr. Shradha Chakhaiyar (MRCOG London)
OPD: 9am–9pm daily | Emergency: 24×7 | Call/WhatsApp: 9162562266 | shradhaivf.com
What we do best: patient-centric, ethical fertility care; individualized plans; advanced IVF/ICSI lab; empathetic counselling.

Services:
• Evaluation & personalized plan (history, hormones, ultrasound, semen analysis)
• Female: ovulation disorders, tubal factor, endometriosis, uterine issues
• Male: semen analysis, medical/surgical options; ICSI for severe factor
• IUI: processed sperm placed in uterus at ovulation
• IVF/ICSI: stimulation → egg retrieval → lab fertilization → embryo transfer
• Fertility preservation (egg freezing); Laparoscopy/Hysteroscopy; Counselling & support

Pricing & EMI:
• Typical India IVF range ₹1.5–3.0L; Shradha IVF average ₹1.35–1.80L (protocol, medicines, add-ons like ICSI/freezing/PGT)
• Clear inclusions/exclusions; Easy EMI available (ask team)

IVF journey:
Consult/tests → stimulation (injections+monitoring) → egg retrieval (sedation) → lab fertilization & culture (Day3/5) → embryo transfer → β-hCG test ~9–10 days later

Who needs IVF: blocked tubes, severe male factor, endometriosis, low reserve, prior IUI failures, unexplained infertility, time-sensitive (age/AMH)

Success (per retrieval, age-wise): <35 ~46.7% | 35–37 ~34.2% | 38–40 ~21.6% | 41–42 ~10.6% | ≥43 ~3.2%

Risks & safety: OHSS (rarer now), retrieval complications (uncommon), multiple pregnancy, ectopic/miscarriage; emotional stress—counselling included

Lifestyle/prep: healthy weight, no smoking/alcohol, sleep & stress care; correct thyroid/vit-D; gentle exercise

Smart cost flow: For “kitna kharcha hoga?”, ask age, reports (AMH/FSH/TSH/semen), past treatments, likely add-ons → reply with bracket + invite for written estimate & EMI options
  `;

  const SYSTEM_PROMPT = `
You are “Shradha IVF Assistant” for Shradha IVF & Maternity, Patna.

Guidelines:
- Prefer Hindi unless the user writes in English (mirror user language).
- Answer briefly (5–8 lines), warm and reassuring; no drug names or exact doses.
- For clinic queries (timings, services, cost policy, contact), use only the FACTS below.
- For general fertility/IVF queries, give clear layperson explanations.
- If urgent or needs a doctor, say so and advise visit/call.
- Always append: "यह जानकारी शिक्षण हेतु है—व्यक्तिगत सलाह के लिए डॉक्टर से मिलें।"
- Always end with: "Call/WhatsApp: 9162562266 • shradhaivf.com"

FACTS:
${FACTS}
  `;

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message }
        ],
        temperature: 0.5,
        max_tokens: 600
      }),
    });

    const raw = await r.text();
    let data = null;
    try { data = JSON.parse(raw); } catch (e) {
      return res.status(502).json({ error: "OpenAI returned non-JSON", detail: raw });
    }

    if (!r.ok) {
      return res.status(r.status).json({ error: "OpenAI error", detail: data?.error || data });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();
    return res.status(200).json({
      reply: reply || "माफ़ करें, अभी उत्तर तैयार नहीं हो पाया—कृपया फिर से पूछें।"
    });

  } catch (err) {
    return res.status(500).json({ error: "Server error", detail: String(err) });
  }
}
