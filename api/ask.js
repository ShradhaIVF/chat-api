export default async function handler(req, res) {
  // ✅ Allow browser calls (CORS)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { message } = req.body;

    // ✅ Shradha IVF Clinic Knowledge Base
    const CLINIC_FACTS = `
Shradha IVF & Maternity — Patna
Lead Consultant: Dr. Shradha Chakhaiyar (MRCOG London)
OPD: 9 AM – 9 PM (daily), Emergency: 24×7
Phone/WhatsApp: 9162562266
Services: IVF, ICSI, IUI, Male & Female infertility evaluation, Fertility preservation, Laparoscopy/Hysteroscopy, Counselling & Support
Costs: Avg ₹1.35–1.80L per IVF cycle; India range ₹1.5–3.0L. EMI available.
IVF Journey: Consultation → Tests → Stimulation → Egg retrieval → Fertilization → Embryo transfer → Pregnancy test after 9–10 days.
Success Rates: <35 yrs ~46.7%; 35–37 yrs ~34.2%; 38–40 yrs ~21.6%; 41–42 yrs ~10.6%; 43+ yrs ~3.2%
FAQ Examples:
• IVF = Lab fertilization of eggs & sperm; embryo placed in uterus
• IUI = Processed sperm placed in uterus during ovulation
• IVF vs IUI = IUI simpler/cheaper; IVF advanced, needed for complex cases
• Risks = OHSS (rare), multiple pregnancy, miscarriage, stress
• Prep = Healthy weight, no smoking/alcohol, sleep, stress management
Reminder: This information is educational. Always consult our doctors for personalised guidance.
    `;

    // ✅ System prompt for chatbot
    const SYS_PROMPT = `
You are “Shradha IVF Assistant”.
Always:
1. Use CLINIC_FACTS for clinic-related info (services, timings, costs, contacts).
2. For fertility/IVF questions, give clear, short layperson answers (Hindi if user writes in Hindi, English if user writes in English).
3. Add disclaimer: "यह जानकारी शिक्षण हेतु है—व्यक्तिगत सलाह के लिए डॉक्टर से मिलें।"
4. End with clinic contact: Call/WhatsApp 9162562266, shradhaivf.com
Here are your knowledge facts:
${CLINIC_FACTS}
    `;

    // ✅ Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // ✅ use stable model
        messages: [
          { role: "system", content: SYS_PROMPT },
          { role: "user", content: message },
        ],
        temperature: 0.5,
        max_tokens: 500,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("OpenAI error:", data.error);
      return res.status(500).json({ error: "OpenAI error", detail: data.error });
    }

    const answer = data.choices[0]?.message?.content || "क्षमा करें, अभी उत्तर उपलब्ध नहीं।";
    res.status(200).json({ reply: answer });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
}
