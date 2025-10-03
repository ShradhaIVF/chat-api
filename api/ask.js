// api/ask.js — Shradha IVF Assistant (RAG-free, prompt-powered)
// Uses OpenAI Responses API + strong error reporting + Hindi-first tone.

export default async function handler(req, res) {
  // --- CORS: allow your website to call this endpoint
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  // --- Ensure API key exists
  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_API_KEY.startsWith("sk-")) {
    return res.status(500).json({
      error: "Server is missing OPENAI_API_KEY (Vercel env var)."
    });
  }

  // --- Read request body safely
  let message = "";
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    message = (body && body.message ? String(body.message) : "").slice(0, 4000);
  } catch (e) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }
  if (!message) {
    return res.status(400).json({ error: "Missing 'message' in body" });
  }

  // --- Shradha IVF Fact Book (condensed but rich; edit freely)
  const FACTS = `
Name: Shradha IVF & Maternity, Patna | Lead Consultant: Dr. Shradha Chakhaiyar (MRCOG London)
OPD: 9:00 AM – 9:00 PM (daily) | Emergency: 24×7 | Phone/WhatsApp: 9162562266 | Web: shradhaivf.com
What we do best: Patient-centric, ethical fertility care; individualized plans; advanced IVF/ICSI lab; empathetic counselling.

Services (snap):
- Infertility evaluation (history, hormones, ultrasound, semen analysis) → personalized plan.
- Female: ovulation disorders, tubal factors, endometriosis, uterine issues.
- Male: semen analysis, medical/surgical options; ICSI for severe male factor.
- IUI: processed sperm placed in uterus at ovulation.
- IVF/ICSI: stimulation → egg retrieval → lab fertilization → embryo transfer.
- Fertility preservation (egg freezing). Laparoscopy/Hysteroscopy. Counselling & emotional support.

Pricing & EMI:
- Typical India IVF range ₹1.5–3.
