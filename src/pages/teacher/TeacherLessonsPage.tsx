import { useRef, useState } from "react";
import { TeacherShell } from "@/components/Teacher/TeacherShell";
import { useAuth } from "@/components/Auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Save, Printer } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

export default function TeacherLessonsPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ subject: "Mathematics", grade: "Grade 10", topic: "", duration: "40 minutes" });
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const generate = async () => {
    if (!form.topic) return toast.error("Enter a topic");
    setLoading(true);
    setContent("");
    try {
      const { data, error } = await supabase.functions.invoke("ai-lesson-generator", { body: form });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const text = data?.lessonPlan || data?.content || "";
      if (!text) throw new Error("No lesson plan returned. Please try again.");
      setContent(text);
    } catch (e: any) {
      toast.error(e.message || "Failed to generate lesson plan");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!user || !content) return;
    const { error } = await supabase.from("lesson_plans").insert({
      teacher_id: user.id,
      title: `${form.subject} — ${form.topic}`,
      topic: form.topic,
      grade: form.grade,
      subject: form.subject,
      content: { markdown: content },
      ai_generated: true,
    });
    if (error) toast.error(error.message); else toast.success("Lesson plan saved");
  };

  const print = () => {
    if (!printRef.current) return;
    const w = window.open("", "_blank", "width=900,height=1000");
    if (!w) return toast.error("Please allow pop-ups to print");
    w.document.write(`<!doctype html><html><head><title>${form.subject} — ${form.topic}</title>
      <style>
        body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:800px;margin:2rem auto;padding:0 1rem;color:#111;line-height:1.55;}
        h1,h2,h3{color:#0b3d91;margin-top:1.4em;}
        h1{font-size:22px;} h2{font-size:18px;} h3{font-size:16px;}
        code,pre{background:#f4f4f5;padding:2px 6px;border-radius:4px;}
        pre{padding:12px;overflow:auto;}
        ul,ol{padding-left:1.4em;} table{border-collapse:collapse;width:100%;}
        th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;}
        header{border-bottom:2px solid #0b3d91;padding-bottom:8px;margin-bottom:16px;}
        @media print { body{margin:0;} }
      </style></head><body>
      <header><h1 style="margin:0">${form.subject} — ${form.topic}</h1>
      <div style="font-size:12px;color:#555">${form.grade} · ${form.duration}</div></header>
      ${printRef.current.innerHTML}
      <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),300);}<\/script>
      </body></html>`);
    w.document.close();
  };

  return (
    <TeacherShell title="Lesson Plans">
      <div className="grid lg:grid-cols-[360px_1fr] gap-6">
        <Card className="rounded-2xl h-fit">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /><span className="font-semibold">AI Lesson Generator</span></div>
            <div><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
            <div><Label>Grade</Label><Input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} /></div>
            <div><Label>Topic</Label><Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} placeholder="Quadratic equations" /></div>
            <div><Label>Duration</Label><Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></div>
            <Button className="w-full" onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate with AI
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-6">
            {!content && !loading && <p className="text-sm text-muted-foreground">Your AI-generated, ECZ-aligned lesson plan will appear here.</p>}
            {loading && <div className="py-10 text-center"><Loader2 className="w-6 h-6 mx-auto animate-spin" /></div>}
            {content && (
              <>
                <div className="flex justify-end mb-3 gap-2">
                  <Button onClick={print} variant="outline" size="sm"><Printer className="w-4 h-4 mr-1.5" />Print</Button>
                  <Button onClick={save} variant="outline" size="sm"><Save className="w-4 h-4 mr-1.5" />Save</Button>
                </div>
                <div ref={printRef} className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{content}</ReactMarkdown>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </TeacherShell>
  );
}
