import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users, TrendingUp, BookOpen, Target, Plus, UserPlus,
  Trash2, Phone, Mail, Shield, CheckCircle2, Info,
} from 'lucide-react';
import { useGuardianData } from '@/hooks/useGuardianData';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface ChildLink {
  id: string;
  guardian_name: string;
  relationship: string;
  phone: string;
  email: string | null;
  status: string;
  student_id: string;
}

const ParentChildrenPage = () => {
  const { students, loading, refetch } = useGuardianData();
  const { user } = useSecureAuth();
  const [selectedChild, setSelectedChild] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [links, setLinks] = useState<ChildLink[]>([]);
  const [linksLoading, setLinksLoading] = useState(true);

  // Form
  const [childName, setChildName] = useState('');
  const [childPhone, setChildPhone] = useState('');
  const [childEmail, setChildEmail] = useState('');
  const [relationship, setRelationship] = useState('parent');
  const [submitting, setSubmitting] = useState(false);

  const fetchLinks = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('guardian_links')
      .select('id, student_id, guardian_id, guardian_name, relationship, mode, status, created_at')
      .eq('guardian_id', user.id)
      .order('created_at', { ascending: false });
    setLinks((data as any) || []);
    setLinksLoading(false);
  };

  useEffect(() => {
    fetchLinks();
  }, [user]);

  const handleAddChild = async () => {
    if (!childName.trim() || !childPhone.trim()) {
      toast.error('Please add child name and phone');
      return;
    }
    if (!user) return;
    setSubmitting(true);
    // Try to find a student account by phone or email
    let studentId: string | null = null;
    const { data: matches } = await supabase
      .from('profiles')
      .select('id')
      .or(`phone.eq.${childPhone}${childEmail ? `,email.eq.${childEmail}` : ''}`)
      .limit(1);
    if (matches && matches[0]) studentId = matches[0].id;

    if (!studentId) {
      // Create a pending invitation row using guardian as both linked parties (status pending)
      // We need student_id NOT NULL — so we store guardian's own id as placeholder and pending status
      studentId = user.id;
    }

    const { error } = await supabase.from('guardian_links').insert({
      guardian_id: user.id,
      student_id: studentId,
      guardian_name: childName,
      relationship,
      phone: childPhone,
      email: childEmail || null,
      mode: 'monitor',
      status: studentId === user.id ? 'pending' : 'active',
    } as any);

    setSubmitting(false);
    if (error) return toast.error('Could not add child link');
    toast.success(studentId === user.id ? 'Invite saved — child can accept after signing up' : 'Child linked!');
    setChildName(''); setChildPhone(''); setChildEmail('');
    setShowAdd(false);
    fetchLinks();
    refetch?.();
  };

  const handleRemove = async (id: string) => {
    await supabase.from('guardian_links').delete().eq('id', id);
    toast.success('Link removed');
    fetchLinks();
    refetch?.();
  };

  if (loading || linksLoading) {
    return <div className="space-y-6"><Skeleton className="h-32" /><Skeleton className="h-64" /></div>;
  }

  const child = students[selectedChild];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3"><Users className="w-8 h-8 text-primary" />My Children</h1>
          <p className="text-muted-foreground mt-1">Manage children, monitor learning, and stay connected with their teachers.</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)} className="gap-2">
          <UserPlus className="w-4 h-4" /> {showAdd ? 'Cancel' : 'Add a child'}
        </Button>
      </div>

      {/* Add Child Wizard */}
      {showAdd && (
        <Card className="border-primary/30 bg-primary/[0.03]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Plus className="w-4 h-4 text-primary" /> Link a child</CardTitle>
            <CardDescription>Enter your child's contact info. We'll match an existing account or save an invite.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Child's full name *</Label>
                <Input value={childName} onChange={(e) => setChildName(e.target.value)} placeholder="Mwila Banda" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Relationship *</Label>
                <Select value={relationship} onValueChange={setRelationship}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['parent', 'legal guardian', 'relative', 'mentor'].map((r) => (
                      <SelectItem key={r} value={r}>{r[0].toUpperCase() + r.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Phone (WhatsApp) *</Label>
                <Input type="tel" value={childPhone} onChange={(e) => setChildPhone(e.target.value)} placeholder="+260..." />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email (optional)</Label>
                <Input type="email" value={childEmail} onChange={(e) => setChildEmail(e.target.value)} placeholder="child@example.com" />
              </div>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <p>If your child already has an account, we'll link instantly. Otherwise we'll save the invite so they can accept on signup.</p>
            </div>
            <Button onClick={handleAddChild} disabled={submitting} className="w-full gap-2">
              <CheckCircle2 className="w-4 h-4" /> {submitting ? 'Linking…' : 'Link child'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pending invitations */}
      {links.filter((l) => l.status === 'pending').length > 0 && (
        <Card className="border-warning/30 bg-warning/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Shield className="w-4 h-4" /> Pending invitations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {links.filter((l) => l.status === 'pending').map((l) => (
              <div key={l.id} className="flex items-center justify-between p-2 rounded-lg border border-border/40">
                <div>
                  <p className="text-sm font-medium">{l.guardian_name}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                    <Phone className="w-3 h-3" /> {l.phone}
                    {l.email && <><Mail className="w-3 h-3 ml-1" /> {l.email}</>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Pending</Badge>
                  <Button size="icon" variant="ghost" onClick={() => handleRemove(l.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {students.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground mb-4">No active child links yet.</p>
            <Button onClick={() => setShowAdd(true)} className="gap-2"><UserPlus className="w-4 h-4" /> Link your first child</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Child Selector */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {students.map((c, i) => (
              <Card
                key={c.id}
                className={`cursor-pointer transition-all hover:shadow-lg shrink-0 min-w-[260px] ${selectedChild === i ? 'ring-2 ring-primary shadow-lg' : 'opacity-70'}`}
                onClick={() => setSelectedChild(i)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold">
                      {c.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold truncate text-sm">{c.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{c.grade || 'No grade set'}</p>
                    <Badge variant="secondary" className="text-[10px] mt-1">{c.relationship}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">{c.quizStats.avgScore > 0 ? `${c.quizStats.avgScore}%` : '--'}</p>
                    <p className="text-[10px] text-muted-foreground">Quiz</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="courses" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="grades">Grades</TabsTrigger>
            </TabsList>

            <TabsContent value="courses" className="space-y-4">
              {child.enrollments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {child.enrollments.map((e) => (
                    <Card key={e.courseId}>
                      <CardContent className="p-5">
                        <h4 className="font-bold mb-3">{e.courseTitle}</h4>
                        <Progress value={e.progress} className="h-2.5 mb-2" />
                        <span className="text-sm font-medium">{e.progress}% complete</span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card><CardContent className="p-8 text-center text-muted-foreground">No enrollments yet.</CardContent></Card>
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-3">
              {child.recentActivity.length > 0 ? child.recentActivity.map((a, i) => (
                <Card key={i}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {a.type === 'quiz' ? <Target className="w-5 h-5 text-primary" /> : <BookOpen className="w-5 h-5 text-primary" />}
                      </div>
                      <div>
                        <p className="font-medium">{a.title}</p>
                        <p className="text-xs text-muted-foreground">{a.time}</p>
                      </div>
                    </div>
                    {a.score && <Badge variant="default">{a.score}</Badge>}
                  </CardContent>
                </Card>
              )) : (
                <Card><CardContent className="p-8 text-center text-muted-foreground">No recent activity.</CardContent></Card>
              )}
            </TabsContent>

            <TabsContent value="grades" className="space-y-4">
              {child.subjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {child.subjects.map((s, i) => (
                    <Card key={i}>
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-bold">{s.courseTitle}</h4>
                            <p className="text-xs text-muted-foreground">{s.term || 'No term'}</p>
                          </div>
                          {s.gradeLetter && <Badge variant="default">{s.gradeLetter}</Badge>}
                        </div>
                        {s.score !== null && (
                          <>
                            <Progress value={s.score} className="h-2.5 mb-1" />
                            <p className="text-sm font-medium text-right">{s.score}%</p>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card><CardContent className="p-8 text-center text-muted-foreground">No grades recorded yet.</CardContent></Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default ParentChildrenPage;
