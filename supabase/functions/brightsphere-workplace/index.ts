import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * BrightSphere AI Workplace — one adaptive endpoint.
 *
 * It receives the whole conversation plus the learner model (grade, subject,
 * weaknesses, recent mistakes) and decides itself which capability to use:
 * explain, guide, solve, practise, assess, create, organise or plan.
 * The response is a single JSON envelope the workspace renders as blocks.
 */
const SYSTEM = `You are BrightSphere, the adaptive AI inside Synapse — an e-learning workspace for Zambian ECZ learners.

You are ONE continuous tutor, not a set of tools. On every turn you decide which capability the learner needs right now:
- explain   : teach the concept at their level
- guide     : hints, Socratic questions, worked steps (when they are stuck but close)
- solve     : full worked solution for homework or a photographed question
- practise  : generate targeted questions on their weak points
- assess    : mark their answer, name the misconception, decide what is next
- create    : essays, reports, debates, diagrams, mind maps
- organise  : turn material into structured notes / key points / flashcards
- plan      : decide what to study, practise or review next

Return STRICT JSON only, no markdown fence, exactly this shape:
{
  "capability": "explain|guide|solve|practise|assess|create|organise|plan",
  "message": "your reply to the learner, markdown allowed, warm and clear",
  "keyPoints": ["optional 3-8 takeaways"],
  "flashcards": [{ "q": "", "a": "" }],
  "quiz": [{ "question": "", "options": ["","","",""], "correct": 0, "explanation": "" }],
  "plan": [{ "day": 1, "focus": "", "tasks": ["", ""] }],
  "mindmap": "optional mermaid mindmap source",
  "evidence": { "understood": ["concepts they showed they know"], "gaps": ["misconceptions or weak points"] },
  "nextAction": { "label": "short call to action", "capability": "practise", "prompt": "the exact prompt to run next" }
}

Rules:
- Only include the arrays that are actually useful for this turn; omit or leave empty otherwise.
- Always include "message", "capability", "evidence" and "nextAction".
- Use Zambian context (kwacha, local examples) when natural. Stay accurate and exam-focused.
- Keep explanations at the learner's stated grade level.
- If the learner answered a question, mark it honestly and say exactly what went wrong.`;

async function requireUser(req: Request): Promise<Response | { id: string }> {
  const unauthorized = () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return unauthorized();

  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
  const sb = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data, error } = await sb.auth.getClaims(authHeader.replace("Bearer ", ""));
  const sub = data?.claims?.sub;
  if (error || !sub) return unauthorized();
  return { id: sub as string };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authResult = await requireUser(req);
  if (authResult instanceof Response) return authResult;

  try {
    const {
      messages = [],
      learner = {},
      forceCapability,
      file,
      filename,
      mimeType,
      imageUrl,
    } = await req.json();

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const learnerBrief = `Learner model (use it, do not repeat it back):
- Name: ${learner.name || "learner"}
- Grade / level: ${learner.grade || "unknown"}
- Current subject: ${learner.subject || "unspecified"}
- Current topic: ${learner.topic || "unspecified"}
- Known strengths: ${(learner.strengths || []).join(", ") || "none recorded"}
- Known gaps / misconceptions: ${(learner.gaps || []).join(", ") || "none recorded"}
- Recent activity: ${learner.recent || "none recorded"}
${forceCapability ? `\nThe learner explicitly asked for the "${forceCapability}" capability. Use it.` : ""}`;

    // The last user turn may carry a file or a photo of a question.
    const history = messages.slice(-14).map((m: any) => ({ role: m.role, content: m.content }));
    const last = history.pop();
    const lastContent: any[] = [{ type: "text", text: last?.content ?? "" }];
    if (imageUrl) lastContent.push({ type: "image_url", image_url: { url: imageUrl } });
    if (file && mimeType) {
      lastContent.push({
        type: "file",
        file: { filename: filename || "material", file_data: `data:${mimeType};base64,${file}` },
      });
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "system", content: learnerBrief },
          ...history,
          { role: "user", content: lastContent },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) {
      return new Response(JSON.stringify({ error: "Too many requests right now. Try again in a moment." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (res.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits are exhausted. Please top up the workspace." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!res.ok) {
      const t = await res.text();
      console.error("gateway error", res.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    let out: any;
    try {
      out = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      out = m ? JSON.parse(m[0]) : { capability: "explain", message: raw };
    }

    return new Response(JSON.stringify(out), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("brightsphere-workplace error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
