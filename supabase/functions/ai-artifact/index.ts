// Artifact engine: the model writes real, self-contained HTML/JS that renders
// 3D scenes (Three.js), mind maps, charts, diagrams and printable documents.
// Returns JSON: { title, kind, code, explanation, steps[] }
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Kind = "3d" | "mindmap" | "chart" | "diagram" | "document" | "simulation" | "auto";

const KIND_HINTS: Record<Exclude<Kind, "auto">, string> = {
  "3d":
    "Build an interactive 3D scene with Three.js loaded from https://unpkg.com/three@0.160.0/build/three.module.js using an importmap plus OrbitControls from https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js. Include lighting, animation loop, resize handling and on-canvas labels.",
  mindmap:
    "Build a mind map. Prefer hand-rolled SVG with curved connectors and rounded nodes so it stays crisp and animated; fall back to Mermaid from https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs only for dense trees.",
  chart:
    "Build charts with Chart.js from https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js. Label axes, add a legend and a short caption under each chart.",
  diagram:
    "Build a labelled scientific/technical diagram in pure inline SVG with annotations and a legend. No external libraries.",
  document:
    "Build a print-ready A4 document (exam paper, worksheet, lesson plan, report). Use @page { size: A4; margin: 18mm } and .page { page-break-after: always }. Embed any figures as inline SVG or a Chart.js canvas so they print. Include a header, marks allocation and an answer key section where relevant.",
  simulation:
    "Build an interactive simulation on <canvas> with sliders/buttons that change parameters in real time. Show live readouts of the values.",
};


/**
 * Auth guard. Every caller must present a real end-user JWT; anonymous
 * requests are rejected so nobody can burn platform AI credits for free.
 */
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
  // An anon/publishable key is also a JWT but carries no `sub`, so it fails here.
  if (error || !sub) return unauthorized();
  return { id: sub as string };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });


  const authResult = await requireUser(req);
  if (authResult instanceof Response) return authResult;
  const authedUserId = authResult.id;
  try {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("LOVABLE_API_KEY missing");

    const body = await req.json().catch(() => ({}));
    const prompt = String(body.prompt ?? "").trim();
    const kind = (String(body.kind ?? "auto") as Kind);
    const role = String(body.role ?? "student");
    const context = String(body.context ?? "").slice(0, 6000);

    if (!prompt || prompt.length > 4000) {
      return new Response(JSON.stringify({ error: "prompt must be 1-4000 characters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hint = kind !== "auto" ? KIND_HINTS[kind] : Object.values(KIND_HINTS).join("\n");

    const system = `You are the Synapse Artifact Engine. You do not describe things — you WRITE WORKING CODE that renders them.

Reply in EXACTLY this plain-text format, nothing before or after:

TITLE: <short title>
KIND: <3d|mindmap|chart|diagram|document|simulation>
STEPS: <3-6 short present-tense build steps separated by " | ", e.g. Writing Three.js scene graph | Adding orbit controls>
EXPLANATION: <= 80 words, one paragraph, explaining the artifact and how to use it>
CODE:
<!doctype html>
...one complete, self-contained HTML document...
</html>

Never wrap the code in markdown fences. Never add commentary after </html>.

Rules for the code:
- A full document starting with <!doctype html>. No build step, no bundler, no local files.
- All libraries via CDN <script src> or ESM importmap. Never import bare package names.
- Must run offline-safe: if a CDN fails, show a readable fallback message instead of a blank page.
- Responsive, dark-text-on-light, system font stack, generous whitespace, rounded cards. No external CSS frameworks.
- Never use localStorage, cookies, fetch to third-party APIs, or alert().
- Everything visible must be labelled and factually correct. Prefer real data over placeholders.
${hint}

Audience: ${role}. Content should use Zambian / ECZ curriculum context where subject matter allows.`;

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: context ? `${prompt}\n\n--- Source material ---\n${context}` : prompt,
          },
        ],
      }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      const status = upstream.status === 429 || upstream.status === 402 ? upstream.status : 500;
      return new Response(
        JSON.stringify({
          error:
            status === 429
              ? "The AI is busy right now. Please try again in a moment."
              : status === 402
              ? "AI credits are exhausted. Add credits to keep generating."
              : `Artifact generation failed: ${text.slice(0, 200)}`,
        }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await upstream.json();
    const rawContent = data?.choices?.[0]?.message?.content ?? "";
    // Some models return content as an array of parts rather than a string.
    const raw: string = Array.isArray(rawContent)
      ? rawContent.map((p: { text?: string }) => p?.text ?? "").join("")
      : String(rawContent);

    const field = (name: string) =>
      raw.match(new RegExp(`^\\s*${name}:\\s*(.+)$`, "im"))?.[1]?.trim() ?? "";

    const title = field("TITLE") || "Artifact";
    const kindOut = field("KIND").toLowerCase() || (kind === "auto" ? "diagram" : kind);
    const steps = field("STEPS")
      .split(/\s*\|\s*/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 6);
    const explanation = field("EXPLANATION");

    // The HTML document is emitted verbatim after CODE: — take it directly.
    let code = raw.match(/<!doctype html[\s\S]*<\/html>/i)?.[0] ?? "";
    if (!code.trim()) {
      code = raw.split(/^\s*CODE:\s*$/im)[1]?.trim() ?? "";
      code = code.replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/i, "").trim();
    }

    if (!code.trim() || !/</.test(code)) {
      console.error("ai-artifact: no renderable code | head:", raw.slice(0, 200));
      return new Response(
        JSON.stringify({ error: "The model did not return a renderable artifact. Try rephrasing." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ title, kind: kindOut, steps, explanation, code }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
