// Speech-to-text. Accepts multipart with 'file' or JSON {audioBase64, mime}.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) throw new Error("LOVABLE_API_KEY missing");

    let file: Blob | null = null;
    let filename = "recording.webm";
    const ct = req.headers.get("content-type") || "";

    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      const f = form.get("file");
      if (f instanceof File) { file = f; filename = f.name || filename; }
    } else {
      const { audioBase64, mime = "audio/webm", name = "recording.webm" } = await req.json();
      if (!audioBase64) throw new Error("audioBase64 required");
      const bin = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
      file = new Blob([bin], { type: mime });
      filename = name;
    }
    if (!file) throw new Error("no audio");

    const ext = filename.split(".").pop() || "webm";
    const form = new FormData();
    form.append("file", file, `recording.${ext}`);
    form.append("model", "openai/gpt-4o-mini-transcribe");

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });
    const text = await upstream.text();
    if (!upstream.ok) {
      console.error("stt error", upstream.status, text);
      return new Response(JSON.stringify({ error: "STT failed", detail: text }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    let parsed: any = {};
    try { parsed = JSON.parse(text); } catch { parsed = { text }; }
    return new Response(JSON.stringify({ text: parsed.text || "" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
