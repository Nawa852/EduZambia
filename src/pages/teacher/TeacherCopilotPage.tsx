import { useRef, useState } from "react";
import { TeacherShell } from "@/components/Teacher/TeacherShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Loader2, User as UserIcon, Bot, FileDown, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { exportMarkdownAsPDF, exportMarkdownAsDOCX } from "@/utils/exportDocument";

interface Msg { role: "user" | "assistant"; content: string }

export default function TeacherCopilotPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Muli bwanji! I'm your **Curriculum Co-Pilot**. Ask me to:\n\n- Plan an ECZ-aligned lesson\n- Build a quiz on any topic\n- Differentiate for struggling learners\n- Draft a parent message\n\nWhat would you like to do today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const send = async () => {
    if (!input.trim() || loading) return;
    const next = [...messages, { role: "user" as const, content: input }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-curriculum-copilot`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: next.map((m) => ({ role: m.role, content: m.content })), stream: true }),
      });
      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${resp.status}`);
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      setMessages([...next, { role: "assistant", content: "" }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content ?? "";
            if (delta) {
              acc += delta;
              setMessages((cur) => {
                const copy = [...cur];
                copy[copy.length - 1] = { role: "assistant", content: acc };
                return copy;
              });
            }
          } catch {}
        }
        endRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    } catch (e: any) {
      toast.error(e.message);
      setMessages((m) => [...m, { role: "assistant", content: `Sorry, I hit an error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Plan a Grade 10 lesson on quadratic equations",
    "Create a 10-question MCQ quiz on photosynthesis",
    "How do I support a struggling Grade 9 learner in algebra?",
    "Draft a parent update for an absent student",
  ];

  return (
    <TeacherShell>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 grid place-items-center text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Curriculum Co-Pilot</h1>
            <p className="text-sm text-muted-foreground">ECZ-aligned AI for lesson plans, quizzes, and classroom help.</p>
          </div>
        </div>

        <Card className="rounded-2xl">
          <CardContent className="p-0">
            <div className="max-h-[60vh] overflow-y-auto p-5 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                  {m.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-500 grid place-items-center text-white shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{m.content || (loading && i === messages.length - 1 ? "…" : "")}</ReactMarkdown>
                    </div>
                  </div>
                  {m.role === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-secondary grid place-items-center shrink-0">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={endRef} />
            </div>

            {messages.length <= 1 && (
              <div className="px-5 pb-2 flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button key={s} onClick={() => setInput(s)} className="text-xs px-3 py-1.5 rounded-full border hover:bg-accent">
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div className="border-t p-3 flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
                placeholder="Ask Co-Pilot anything…"
                disabled={loading}
              />
              <Button onClick={send} disabled={loading || !input.trim()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </TeacherShell>
  );
}
