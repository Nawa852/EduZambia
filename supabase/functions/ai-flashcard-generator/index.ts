import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const topic = String(body.topic ?? "").slice(0, 300).trim();
    const subject = String(body.subject ?? "General").slice(0, 120);
    const difficulty = ["easy", "medium", "hard"].includes(body.difficulty) ? body.difficulty : "medium";
    const count = Math.min(Math.max(Number(body.count) || 10, 3), 30);
    const notes = String(body.notes ?? "").slice(0, 6000);

    if (!topic && !notes) {
      return new Response(JSON.stringify({ error: "Provide a topic or some notes" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("AI gateway not configured");

    const prompt = `Create exactly ${count} study flashcards at ${difficulty} difficulty.
Subject: ${subject}
Topic: ${topic || "(derive from the notes)"}
${notes ? `Source notes:\n"""${notes}"""` : ""}

Rules:
- Front = a short precise question or term (max 120 chars).
- Back = a clear, complete answer (max 320 chars).
- Align with the Zambian ECZ curriculum and use local examples where natural.
- No duplicates, no numbering in the text.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an expert Zambian curriculum teacher who writes excellent flashcards." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "emit_flashcards",
            description: "Return the generated flashcards",
            parameters: {
              type: "object",
              properties: {
                cards: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { front: { type: "string" }, back: { type: "string" } },
                    required: ["front", "back"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["cards"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "emit_flashcards" } },
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit reached, please try again shortly." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up to continue." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiRes.ok) {
      const text = await aiRes.text();
      console.error("gateway error", aiRes.status, text);
      throw new Error("AI generation failed");
    }

    const data = await aiRes.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    let cards: Array<{ front: string; back: string }> = [];
    try {
      cards = JSON.parse(call?.function?.arguments ?? "{}").cards ?? [];
    } catch { cards = []; }

    cards = cards
      .filter((c) => c?.front && c?.back)
      .slice(0, count)
      .map((c) => ({ front: String(c.front).slice(0, 300), back: String(c.back).slice(0, 800) }));

    if (!cards.length) throw new Error("No flashcards were generated");

    // Persist into a deck owned by the caller
    const { data: deck, error: deckError } = await supabase
      .from("flashcard_decks")
      .insert({ user_id: user.id, title: topic || `${subject} deck`, subject })
      .select("id, title, subject, created_at")
      .single();
    if (deckError) throw deckError;

    const { error: cardsError } = await supabase.from("flashcard_cards").insert(
      cards.map((c) => ({ deck_id: deck.id, front: c.front, back: c.back })),
    );
    if (cardsError) throw cardsError;

    return new Response(JSON.stringify({ deck, cards, count: cards.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("ai-flashcard-generator", err);
    return new Response(JSON.stringify({ error: (err as Error).message ?? "Unexpected error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
