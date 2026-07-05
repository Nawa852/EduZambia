import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "ask_ai_tutor",
  title: "Ask BrightSphere AI Tutor",
  description: "Ask the EduZambia AI tutor a question about the Zambian ECZ curriculum. Returns a plain-text tutor response.",
  inputSchema: {
    question: z.string().trim().min(1).describe("The student's question."),
    grade: z.string().optional().describe("Grade level (e.g. 'Grade 9', 'Grade 12')."),
    subject: z.string().optional().describe("Subject area, e.g. 'Mathematics', 'Biology'."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ question, grade, subject }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return { content: [{ type: "text", text: "AI gateway not configured" }], isError: true };
    }
    const system = `You are BrightSphere AI, a Zambian ECZ curriculum tutor. Be clear, encouraging, and step-by-step.${
      grade ? ` Target grade: ${grade}.` : ""
    }${subject ? ` Subject: ${subject}.` : ""}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: question },
        ],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      return { content: [{ type: "text", text: `AI error ${res.status}: ${t}` }], isError: true };
    }
    const data = await res.json();
    const answer = data?.choices?.[0]?.message?.content ?? "";
    return {
      content: [{ type: "text", text: answer }],
      structuredContent: { answer },
    };
  },
});
