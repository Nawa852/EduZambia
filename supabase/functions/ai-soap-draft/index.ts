import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { initials, age, sex, complaint, vitals, history } = await req.json();
    const KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!KEY) throw new Error("LOVABLE_API_KEY missing");

    const sys = `You are a Zambian clinician assistant. Given a brief patient encounter, draft a SOAP note aligned with common presentations in Zambian primary care. Return strict JSON: {"subjective":string,"objective":string,"assessment":string,"plan":string}. Keep each field to 2-4 concise sentences. Use locally available medications where possible.`;
    const user = `Patient: ${initials || "N/A"}, ${age ?? "?"}${sex ? " " + sex : ""}\nComplaint: ${complaint || ""}\nVitals: ${JSON.stringify(vitals || {})}\nHistory: ${history || "none"}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: sys }, { role: "user", content: user }],
        response_format: { type: "json_object" },
      }),
    });
    if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (resp.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!resp.ok) throw new Error(`AI gateway ${resp.status}`);
    const data = await resp.json();
    let parsed: any = {};
    try { parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}"); }
    catch { parsed = { subjective: "", objective: "", assessment: "", plan: "" }; }
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
