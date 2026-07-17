import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Universal AI tool router. `tool` selects the system prompt template,
// `inputs` is a free-form object of user-supplied fields.
const PROMPTS: Record<string, string> = {
  // Business creation
  "business-idea": "Generate 5 distinctive, viable business ideas tailored to the Zambian market. For each: name, one-line pitch, target customer, revenue model, startup cost in ZMW, first 3 steps.",
  "business-plan": "Produce an investor-ready business plan with: Executive Summary, Market Analysis (Zambia), Product, Go-to-Market, Team, Financials (ZMW, 3-yr projection), SWOT, Ask.",
  "pitch-deck": "Draft a 10-slide pitch deck (Problem, Solution, Market, Product, Business Model, Traction, Competition, Team, Financials, Ask). Bullet-point each slide.",
  "financial-projection": "Build a 3-year financial projection in ZMW: revenue, COGS, gross margin, opex, EBITDA, cash. Include assumptions and a monthly Y1 breakdown.",
  "company-registration": "Give a step-by-step Zambian company registration guide (PACRA): entity type comparison, documents, fees in ZMW, timelines, ZRA + NAPSA + Workers' Comp registration, and common mistakes.",
  "brand-name": "Generate 15 brand name candidates. For each: name, tagline, meaning, domain availability guess, memorability score /10.",
  "logo-brief": "Create a detailed logo design brief: brand values, mood, color palette (with hex), typography pairings, iconography direction, and 3 concept descriptions.",
  "brand-identity": "Design a complete brand identity: voice, tone, color system (hex), typography, imagery style, do/don't, and 3 sample marketing captions.",
  "website-copy": "Write full website copy: hero (headline+sub+CTA), 3 feature blocks, social proof section, pricing, FAQ, footer CTA.",
  "landing-page": "Design a high-conversion landing page: above-fold, benefit stack, objection-handling FAQ, testimonial slots, urgency block, final CTA. Provide copy for each.",
  "product-catalog": "Produce a product catalog: 10 SKUs with name, description, features, price ZMW, target segment.",
  "pricing-strategy": "Recommend a pricing strategy: model (freemium/tiered/usage), 3 tiers with features and ZMW prices, psychological anchors, discount policy.",
  "proposal": "Draft a client proposal: cover, understanding, approach, deliverables, timeline, pricing (ZMW), terms, acceptance.",
  "invoice": "Generate a professional invoice template (markdown table) with line items, VAT (16%), totals in ZMW, payment terms, and bank details placeholders.",
  "quotation": "Generate a formal quotation with itemised pricing (ZMW), validity, T&Cs, and next steps.",
  "contract": "Draft a service contract with parties, scope, deliverables, payment (ZMW), IP, confidentiality, termination, governing law (Zambia).",
  "receipt": "Generate a payment receipt template with reference, payer, amount ZMW, VAT, method, date, signature.",

  // Marketing
  "marketing-plan": "Create a 90-day marketing plan: goals, channels, weekly calendar, budget ZMW, KPIs.",
  "ad-copy": "Write 5 ad variants for Meta/Google: headline, primary text, description, CTA, targeting notes.",
  "social-post": "Write 7 social posts (LinkedIn, X, Facebook, Instagram, TikTok script, WhatsApp status, thread).",
  "content-plan": "Build a 4-week content calendar: topic, format, channel, hook, CTA per post.",
  "graphic-brief": "Describe a graphic design brief for a marketing asset: dimensions, layout, palette, imagery, copy blocks.",
  "video-script": "Write a 60-second video script: hook, problem, solution, proof, CTA, on-screen text cues.",
  "copywriting": "Rewrite the provided text using AIDA. Preserve facts; sharpen persuasion.",
  "email-campaign": "Write a 5-email nurture sequence with subject, preview, body, CTA.",
  "sms-campaign": "Write 5 SMS variants under 160 chars each with clear CTA.",
  "whatsapp-campaign": "Write a WhatsApp broadcast template + 3 follow-up messages.",
  "lead-magnet": "Design a lead magnet: title, outline, 3 hook variants, opt-in copy.",
  "crm-segments": "Suggest 6 customer segments with criteria, messaging, and channel per segment.",
  "sales-pipeline": "Define a sales pipeline: stages, entry criteria, exit criteria, avg duration, conversion targets.",
  "affiliate-plan": "Design an affiliate program: commission model, tiers, tracking, T&Cs.",
  "referral-plan": "Design a referral program: reward, mechanic, virality loop, tracking.",
  "customer-journey": "Map a customer journey with touchpoints, emotions, and improvement actions.",
  "seo-audit": "Give an SEO action plan: keyword clusters, on-page fixes, content briefs, backlink ideas.",

  // Ops / Finance / Ent
  "budget-plan": "Build a monthly business budget in ZMW: income, fixed costs, variable, savings, cash buffer.",
  "cashflow": "Produce a 12-month cash flow forecast (ZMW) with assumptions and risks.",
  "pnl": "Produce a P&L statement template with sample figures in ZMW.",
  "tax-guide": "Explain applicable Zambian taxes (VAT, PAYE, WHT, Turnover, Corporate) with rates and filing calendar.",
  "loan-analysis": "Analyse a loan: monthly payment, total interest, amortisation summary, affordability check.",
  "grant-finder": "List 10 grants/funders relevant to Zambian SMEs with eligibility, ticket size, and how to apply.",
  "inventory-plan": "Design an inventory plan: reorder points, safety stock, ABC analysis, KPIs.",
  "supplier-eval": "Score suppliers on quality, price, lead time, reliability with a weighted matrix.",

  // Generic fallback
  "custom": "You are a senior business advisor for Zambian entrepreneurs. Answer the user's request with structured, practical, actionable output. Use ZMW where relevant.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tool, inputs } = await req.json();
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("LOVABLE_API_KEY missing");

    const system = PROMPTS[tool] || PROMPTS["custom"];
    const userMsg = `Tool: ${tool}\nInputs:\n${Object.entries(inputs || {}).map(([k, v]) => `- ${k}: ${v}`).join("\n") || "(none)"}\n\nRespond in clean markdown.`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: system }, { role: "user", content: userMsg }],
        stream: true,
      }),
    });

    if (!r.ok) {
      if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (r.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await r.text();
      return new Response(JSON.stringify({ error: t }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(r.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
