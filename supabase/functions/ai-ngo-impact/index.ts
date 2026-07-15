import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { programName, period, metrics, beneficiaries, notes } = await req.json();
    const KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!KEY) throw new Error("LOVABLE_API_KEY missing");

    const sys = `You are an M&E specialist writing NGO impact reports for Zambian communities. Given a program's metrics and beneficiary data, produce a concise donor-ready impact report. Return strict JSON: {"headline":string,"kpis":[{"label":string,"value":string,"trend":"up"|"down"|"flat"}],"narrative":string,"recommendations":string[]}. Narrative should be 3-5 paragraphs, plain English, cite Zambian context where relevant.`;
    const user = `Program: ${programName}\nPeriod: ${period}\nMetrics: ${JSON.stringify(metrics || {})}\nBeneficiaries reached: ${beneficiaries || 0}\nNotes: ${notes || ""}`;

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
    catch { parsed = { headline: programName, kpis: [], narrative: "", recommendations: [] }; }
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
