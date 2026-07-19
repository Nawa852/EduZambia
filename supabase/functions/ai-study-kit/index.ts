import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are Synapse Study Kit, an AI that turns any student material into a complete study pack for Zambian ECZ learners.
You will be given source material (text and/or a file). Return STRICT JSON in this exact shape — no markdown, no prose outside JSON:

{
  "title": "short descriptive title (max 8 words)",
  "subject": "best-guess subject",
  "level": "e.g. Grade 10 / University / General",
  "summary": "3-5 paragraph plain-English overview a student can read in 2 minutes",
  "keyPoints": ["8-14 concise bullet takeaways"],
  "outline": [
    { "chapter": "Chapter title", "lessons": ["Lesson 1 title", "Lesson 2 title", "Lesson 3 title"] }
  ],
  "flashcards": [
    { "q": "question", "a": "answer" }
  ],
  "quiz": [
    { "question": "...", "options": ["A","B","C","D"], "correct": 0, "explanation": "why" }
  ],
  "studyPlan": [
    { "day": 1, "focus": "topic", "tasks": ["task 1","task 2"] }
  ]
}

Rules:
- 12-16 flashcards, 10 quiz questions (mix easy/medium/hard), 5-7 day study plan.
- Use examples relevant to Zambia when natural (kwacha, local context) but stay accurate.
- Keep language clear, encouraging, exam-focused.
- If the material is too short or unclear, still produce a useful pack based on the topic implied.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { text, file, filename, mimeType, topic } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const userContent: any[] = [];
    if (topic) userContent.push({ type: "text", text: `Topic focus: ${topic}` });
    if (text) userContent.push({ type: "text", text: `Source material:\n\n${text.slice(0, 60000)}` });
    if (file && mimeType) {
      userContent.push({
        type: "file",
        file: { filename: filename || "material", file_data: `data:${mimeType};base64,${file}` },
      });
    }
    if (userContent.length === 0) {
      userContent.push({ type: "text", text: `Create a general study pack on: ${topic || "study skills"}` });
    }

    const res = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`AI error ${res.status}: ${err}`);
    }
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    let pack: any;
    try { pack = JSON.parse(raw); } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      pack = m ? JSON.parse(m[0]) : { error: "Failed to parse" };
    }

    return new Response(JSON.stringify(pack), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
