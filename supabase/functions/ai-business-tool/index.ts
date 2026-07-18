import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Universal AI tool router. Every stakeholder suite calls this endpoint.
const PROMPTS: Record<string, string> = {
  // ===== Business creation =====
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

  // ===== Marketing =====
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

  // ===== Ops / Finance =====
  "budget-plan": "Build a monthly business budget in ZMW: income, fixed costs, variable, savings, cash buffer.",
  "cashflow": "Produce a 12-month cash flow forecast (ZMW) with assumptions and risks.",
  "pnl": "Produce a P&L statement template with sample figures in ZMW.",
  "tax-guide": "Explain applicable Zambian taxes (VAT, PAYE, WHT, Turnover, Corporate) with rates and filing calendar.",
  "loan-analysis": "Analyse a loan: monthly payment, total interest, amortisation summary, affordability check.",
  "grant-finder": "List 10 grants/funders relevant to Zambian SMEs with eligibility, ticket size, and how to apply.",
  "inventory-plan": "Design an inventory plan: reorder points, safety stock, ABC analysis, KPIs.",
  "supplier-eval": "Score suppliers on quality, price, lead time, reliability with a weighted matrix.",

  // ===== Medical =====
  "med-differential": "You are a senior clinician in Zambia. Given a chief complaint and findings, produce a ranked differential diagnosis with reasoning, red flags, and next investigations available in Zambian district hospitals.",
  "med-soap": "Generate a clean SOAP note from the provided encounter details. Use standard clinical language.",
  "med-drug-info": "Give concise drug info for the named medication using the Zambia Essential Medicines List where possible: class, dose (adult/paed), indications, contraindications, side effects, interactions, cost tier.",
  "med-patient-education": "Write patient education handout in simple English + Nyanja summary, covering the condition, treatment, warning signs, and follow-up.",
  "med-clinical-guideline": "Summarise the Zambian/WHO clinical guideline for the named condition: diagnosis criteria, first-line and alternative treatment, monitoring, referral criteria.",
  "med-case-sim": "Create an interactive clinical case: presentation, vitals, exam findings, 3 investigation options, and branching decisions with feedback.",
  "med-referral-letter": "Draft a professional referral letter to a specialist with history, findings, provisional diagnosis, and reason for referral.",
  "med-discharge-summary": "Generate a discharge summary: admission diagnosis, course, procedures, meds on discharge, follow-up plan.",
  "med-cpd-reflection": "Write a CPD reflection in the Kolb cycle: description, feelings, evaluation, analysis, conclusion, action plan.",
  "med-research-brief": "Summarise recent evidence on the topic for a Zambian healthcare worker in 500 words with 5 practice implications.",
  "med-triage": "Given presenting symptoms, apply the WHO/IMCI triage: RED/YELLOW/GREEN, actions, timing.",
  "med-imci": "Apply the IMCI algorithm to the described child under 5: classify, treat, counsel caregiver.",

  // ===== Developer =====
  "dev-code-review": "Perform a senior-level code review. Flag bugs, security issues, performance, readability, and give a rewritten snippet.",
  "dev-refactor": "Refactor the provided code for clarity, performance, and modern idioms. Explain each change.",
  "dev-debug": "Debug the described error. Give hypotheses ranked by likelihood, diagnostic steps, and the most likely fix.",
  "dev-architecture": "Design a system architecture: components, data flow, tech choices, scaling, cost. Include a text diagram.",
  "dev-api-design": "Design a REST/GraphQL API: endpoints, payloads, auth, error format, versioning, examples.",
  "dev-db-schema": "Design a database schema: tables, columns, types, indexes, relationships, migrations SQL.",
  "dev-tests": "Write unit + integration tests for the described function/module. Cover happy path, edge cases, failures.",
  "dev-regex": "Produce a regex for the described pattern with explanation and 5 test cases.",
  "dev-sql": "Write an optimised SQL query for the described requirement with an explanation and index recommendations.",
  "dev-devops": "Produce CI/CD pipeline config (GitHub Actions), Dockerfile, and deployment plan for the described stack.",
  "dev-security-audit": "Perform a security audit checklist: OWASP top 10, secrets, auth, RLS, input validation. Rate risks.",
  "dev-readme": "Write a professional README.md with badges, install, usage, API, contributing, license.",
  "dev-changelog": "Generate a semantic versioning changelog from the described changes.",
  "dev-commit-msg": "Produce a conventional-commits message with body and footer.",
  "dev-interview-prep": "Give an interview prep pack for the role: 15 questions, model answers, system design task, coding drill.",
  "dev-project-idea": "Suggest 5 portfolio projects for a Zambian developer targeting the described career track. Include stack, features, learning outcomes.",

  // ===== NGO =====
  "ngo-theory-of-change": "Draft a Theory of Change: inputs, activities, outputs, outcomes, impact, assumptions, indicators.",
  "ngo-logframe": "Produce a logical framework matrix (goal, purpose, outputs, activities) with SMART indicators, means of verification, assumptions.",
  "ngo-grant-proposal": "Write a full grant proposal: exec summary, problem, project, activities, budget (ZMW), M&E, org capacity, sustainability.",
  "ngo-donor-report": "Produce a donor report: narrative, results vs targets, spend vs budget, challenges, learning, next quarter plan.",
  "ngo-mne-plan": "Design an M&E plan: indicators, baselines, targets, data sources, frequency, tools, responsibility.",
  "ngo-impact-report": "Write an annual impact report: reach numbers, beneficiary stories, cost per outcome, lessons, priorities.",
  "ngo-community-survey": "Design a community needs assessment survey: 20 questions across demographics, needs, priorities. KoboToolbox-ready.",
  "ngo-training-curriculum": "Design a training curriculum for community facilitators: modules, learning objectives, activities, assessments, timing.",
  "ngo-safeguarding": "Draft a safeguarding policy for beneficiaries (child protection, PSEA) with reporting flow and code of conduct.",
  "ngo-partnership-mou": "Draft an MOU between an NGO and partner school/clinic: scope, roles, resources, duration, governance.",
  "ngo-fundraising-strategy": "Design a 12-month fundraising strategy: donor mix, targets, activities, calendar, KPIs.",
  "ngo-comms-plan": "Design an external comms plan: audiences, key messages, channels (radio, WhatsApp, X), calendar.",
  "ngo-volunteer-jd": "Write a volunteer job description with role, tasks, competencies, safeguarding, application steps.",
  "ngo-risk-register": "Produce a project risk register: risk, likelihood, impact, mitigation, owner, review date.",

  // ===== Skills / Career =====
  "skill-learning-path": "Design a 12-week learning path for the described skill: weekly modules, resources, projects, assessments, portfolio outcomes.",
  "skill-portfolio-brief": "Recommend 3 portfolio projects for the described skill with scope, deliverables, tools, and evaluation rubric.",
  "skill-cv": "Rewrite a Zambian-context CV: contact, summary, skills, experience, education, projects. ATS-friendly, 1 page.",
  "skill-cover-letter": "Write a tailored cover letter for the described role in Zambia.",
  "skill-interview-prep": "Simulate 10 interview questions for the role with STAR-formatted model answers.",
  "skill-career-plan": "Draft a 3-year career plan: milestones, skills, certifications, employers, networking targets.",
  "skill-gap-analysis": "Compare current skills vs role requirements. Produce a gap report with learning actions.",
  "skill-freelance-profile": "Write an Upwork/Fiverr profile: headline, overview, skills, packages, pricing (USD + ZMW).",
  "skill-networking-outreach": "Draft 5 outreach messages (LinkedIn/email) for informational interviews with senior professionals.",
  "skill-mentor-request": "Draft a warm mentorship request message with clarity, respect, and a specific ask.",
  "skill-apprenticeship-pitch": "Write a compelling apprenticeship application: motivation, relevant experience, learning goals, contribution.",

  // ===== Teacher =====
  "teach-lesson-plan": "Produce an ECZ-aligned lesson plan: topic, objectives (Bloom), materials, starter, main activity, plenary, assessment, differentiation, homework.",
  "teach-scheme-of-work": "Produce a term-long scheme of work for the subject/grade: week, topic, objectives, activities, assessment.",
  "teach-worksheet": "Design a student worksheet with 15 questions of mixed difficulty and an answer key.",
  "teach-quiz": "Generate a 10-question quiz with MCQ + short answer + answer key + marking scheme.",
  "teach-exam-paper": "Design an exam paper in ECZ style: Section A (MCQ), B (structured), C (essay). Include mark allocations and marking scheme.",
  "teach-rubric": "Design an assessment rubric with 4 performance levels and criteria for the described task.",
  "teach-parent-letter": "Write a parent update letter (English + optional Bemba/Nyanja summary) covering progress, behaviour, next steps.",
  "teach-remedial-plan": "Design a remedial plan for a struggling learner: diagnosis, targets, activities, monitoring.",
  "teach-differentiation": "Suggest 5 differentiation strategies for the described lesson: for advanced, on-track, and struggling learners.",
  "teach-classroom-mgmt": "Give a classroom management plan for the described challenge with strategies, scripts, and follow-up.",

  // Fallback
  "custom": "You are a senior expert advisor for the described context in Zambia. Answer with structured, practical, actionable output using ZMW where relevant.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tool, inputs } = await req.json();
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("LOVABLE_API_KEY missing");

    const system = PROMPTS[tool] || PROMPTS["custom"];
    const userMsg = `Tool: ${tool}\nInputs:\n${Object.entries(inputs || {}).map(([k, v]) => `- ${k}: ${v}`).join("\n") || "(none)"}\n\nRespond in clean, well-structured markdown.`;

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
