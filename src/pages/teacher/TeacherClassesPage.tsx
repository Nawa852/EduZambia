import { useEffect, useState } from "react";
import { useAuth } from "@/components/Auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { TeacherShell } from "@/components/Teacher/TeacherShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Users, Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";

const COLORS = ["from-blue-500 to-blue-600", "from-emerald-500 to-emerald-600", "from-violet-500 to-violet-600", "from-amber-500 to-amber-600", "from-rose-500 to-rose-600"];

export default function TeacherClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", grade: "", subject: "", room: "" });

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("classes").select("*, class_enrollments(count)").eq("teacher_id", user.id).order("created_at", { ascending: false });
    setClasses(data ?? []);
  };
  useEffect(() => { load(); }, [user]);

  const create = async () => {
    if (!user || !form.name) return;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const { error } = await supabase.from("classes").insert({ ...form, teacher_id: user.id, color });
    if (error) toast.error(error.message); else { toast.success("Class created"); setForm({ name: "", grade: "", subject: "", room: "" }); setOpen(false); load(); }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("classes").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };

  return (
    <TeacherShell title="My Classes">
      <div className="flex justify-end mb-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />New Class</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Class</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Mathematics — Grade 11A" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Grade</Label><Input value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} placeholder="Grade 11" /></div>
                <div><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Mathematics" /></div>
              </div>
              <div><Label>Room</Label><Input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} placeholder="Room 12" /></div>
              <Button className="w-full" onClick={create}>Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.length === 0 && (
          <Card className="col-span-full rounded-2xl">
            <CardContent className="py-12 text-center text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-50" />
              No classes yet. Click "New Class" to create your first one.
            </CardContent>
          </Card>
        )}
        {classes.map((c, i) => (
          <Card key={c.id} className="rounded-2xl overflow-hidden">
            <div className={`h-20 bg-gradient-to-br ${c.color || COLORS[i % COLORS.length]}`} />
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.grade} • {c.subject}</div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
              <div className="flex items-center gap-2 mt-3 text-xs">
                <Users className="w-3.5 h-3.5" />
                {c.class_enrollments?.[0]?.count ?? 0} students • {c.room}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </TeacherShell>
  );
}
