import { useState } from "react";
import { TeacherShell } from "@/components/Teacher/TeacherShell";
import { useAuth } from "@/components/Auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Save } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

export default function TeacherLessonsPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ subject: "Mathematics", grade: "Grade 10", topic: "", duration: "40 minutes" });
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!form.topic) return toast.error("Enter a topic");
    setLoading(true);
    setContent("");
    try {
      const { data, error } = await supabase.functions.invoke("ai-lesson-generator", { body: form });
      if (error) throw error;
      setContent(data.lessonPlan || data.content || JSON.stringify(data, null, 2));
    } catch (e: any) {
      toast.error(e.message);
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
                <div className="flex justify-end mb-3"><Button onClick={save} variant="outline" size="sm"><Save className="w-4 h-4 mr-1.5" />Save</Button></div>
                <div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown>{content}</ReactMarkdown></div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </TeacherShell>
  );
}
