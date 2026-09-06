import { useEffect, useState } from "react";
import { useAuth } from "@/components/Auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { TeacherShell } from "@/components/Teacher/TeacherShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sparkles, Send, Loader2, Link2, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function TeacherStudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [active, setActive] = useState<any>(null);
  const [draft, setDraft] = useState<{ subject: string; body: string }>({ subject: "", body: "" });
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Creates (or reuses) a one-time parent invite code for a student this
  // teacher actually teaches, and puts the join link on the clipboard.
  const copyInvite = async (student: any) => {
    setInviting(student.id);
    try {
      const { data, error } = await supabase.rpc("create_parent_invite_for_student", {
        _student_id: student.id,
      });
      if (error) throw error;
      const code = typeof data === "string" ? data : (data as any)?.link_code;
      if (!code) throw new Error("No invite code returned");
      const url = `${window.location.origin}/parents/join/${code}`;
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Invite link copied — share it with the parent");
      } catch {
        toast.success(`Invite link: ${url}`);
      }
      setCopied(student.id);
      window.setTimeout(() => setCopied(null), 2500);
    } catch (e: any) {
      toast.error(e.message || "Could not create an invite link");
    } finally {
      setInviting(null);
    }
  };

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: classes } = await supabase.from("classes").select("id").eq("teacher_id", user.id);
      const ids = (classes ?? []).map((c) => c.id);
      if (ids.length === 0) { setStudents([]); return; }
      const { data: enrolls } = await supabase
        .from("class_enrollments")
        .select("student_id, classes(name)")
        .in("class_id", ids);
      const studentIds = [...new Set((enrolls ?? []).map((e: any) => e.student_id))];
      if (studentIds.length === 0) { setStudents([]); return; }
      const { data: profs } = await supabase.from("profiles").select("id, full_name, avatar_url, role, grade").in("id", studentIds);
      setStudents(profs ?? []);
    })();
  }, [user]);

  const generate = async (student: any) => {
    setActive(student);
    setGenerating(true);
    setDraft({ subject: "", body: "" });
    try {
      const { data, error } = await supabase.functions.invoke("ai-parent-update", {
        body: {
          studentName: student.full_name,
          className: student.grade || "Class",
          attendance: { present: 18, absent: 2, late: 1 },
          grades: [{ subject: "Mathematics", score: 82 }],
          tone: "warm",
          language: "English",
        },
      });
      if (error) throw error;
      setDraft({ subject: data.subject || `Update on ${student.full_name}`, body: data.body || "" });
    } catch (e: any) {
      toast.error(e.message || "AI generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const send = async () => {
    if (!user || !active) return;
    setSending(true);

    // Fan the update out to every approved guardian linked to this student,
    // so it actually lands in the parent's inbox.
    const { data: links } = await supabase
      .from("guardian_links")
      .select("guardian_id, status")
      .eq("student_id", active.id);
    const parentIds = [
      ...new Set(
        (links ?? [])
          .filter((l) => l.guardian_id && l.status !== "revoked" && l.status !== "pending")
          .map((l) => l.guardian_id as string),
      ),
    ];

    const base = {
      teacher_id: user.id,
      student_id: active.id,
      subject: draft.subject,
      body: draft.body,
      ai_generated: true,
      sent_at: new Date().toISOString(),
    };
    const rows = parentIds.length
      ? parentIds.map((parent_id) => ({ ...base, parent_id }))
      : [base];

    const { error } = await supabase.from("parent_updates").insert(rows);
    setSending(false);
    if (error) { toast.error(error.message); return; }
    toast.success(
      parentIds.length
        ? `Sent to ${parentIds.length} linked guardian${parentIds.length > 1 ? "s" : ""}`
        : "Saved — no guardian is linked to this student yet",
    );
    setActive(null);
  };

  return (
    <TeacherShell title="Students">
      <Card className="rounded-2xl">
        <CardContent className="p-0 divide-y">
          {students.length === 0 && (
            <div className="p-12 text-center text-muted-foreground text-sm">
              No students enrolled yet. Add students from a class roster to start sending parent updates.
            </div>
          )}
          {students.map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-4">
              <Avatar><AvatarFallback>{s.full_name?.[0] ?? "S"}</AvatarFallback></Avatar>
              <div className="flex-1">
                <div className="font-medium">{s.full_name || "Student"}</div>
                <div className="text-xs text-muted-foreground">{s.grade || "—"}</div>
              </div>
              <Dialog open={active?.id === s.id} onOpenChange={(o) => !o && setActive(null)}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" onClick={() => generate(s)}>
                    <Sparkles className="w-4 h-4 mr-1.5 text-primary" />Draft parent update
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl">
                  <DialogHeader><DialogTitle>Parent update — {s.full_name}</DialogTitle></DialogHeader>
                  {generating ? (
                    <div className="py-10 text-center"><Loader2 className="w-6 h-6 mx-auto animate-spin" /><div className="text-xs text-muted-foreground mt-2">AI drafting…</div></div>
                  ) : (
                    <div className="space-y-3">
                      <Input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} placeholder="Subject" />
                      <Textarea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} rows={10} />
                      <div className="flex justify-between">
                        <Button variant="ghost" onClick={() => generate(s)}><Sparkles className="w-4 h-4 mr-1.5" />Regenerate</Button>
                        <Button onClick={send} disabled={sending}><Send className="w-4 h-4 mr-1.5" />Send to parent</Button>
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          ))}
        </CardContent>
      </Card>
    </TeacherShell>
  );
}
