import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Briefcase, Plus, Award, Target } from 'lucide-react';
import { toast } from 'sonner';

export default function SkillsPortfolioPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [assess, setAssess] = useState({ skill: '', score: '', evidence: '' });

  const { data: profile } = useQuery({
    queryKey: ['skills-profile'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;
      const { data } = await supabase.from('skills_profile').select('*').eq('user_id', user.user.id).maybeSingle();
      return data;
    },
  });

  const { data: assessments = [] } = useQuery({
    queryKey: ['skill-assessments'],
    queryFn: async () => {
      const { data } = await supabase.from('skill_assessments').select('*').order('assessed_at', { ascending: false });
      return data || [];
    },
  });

  const { data: certs = [] } = useQuery({
    queryKey: ['certificates'],
    queryFn: async () => {
      const { data } = await supabase.from('certificates').select('*').limit(20);
      return data || [];
    },
  });

  const addAssess = async () => {
    const { data: user } = await supabase.auth.getUser();
    const { error } = await supabase.from('skill_assessments').insert({
      user_id: user.user!.id, skill: assess.skill, score: parseInt(assess.score) || 0, evidence: assess.evidence,
    });
    if (error) toast.error(error.message);
    else { toast.success('Assessment logged'); setOpen(false); setAssess({ skill: '', score: '', evidence: '' }); qc.invalidateQueries({ queryKey: ['skill-assessments'] }); }
  };

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Briefcase className="w-5 h-5" /></div>
          <div><h1 className="text-2xl font-bold">Skills Portfolio</h1><p className="text-sm text-muted-foreground">Your verified skills, projects, and credentials</p></div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Log skill</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Log skill assessment</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Skill</Label><Input value={assess.skill} onChange={(e) => setAssess({ ...assess, skill: e.target.value })} placeholder="e.g. React" /></div>
              <div><Label>Score (0-100)</Label><Input type="number" value={assess.score} onChange={(e) => setAssess({ ...assess, score: e.target.value })} /></div>
              <div><Label>Evidence / project link</Label><Textarea value={assess.evidence} onChange={(e) => setAssess({ ...assess, evidence: e.target.value })} /></div>
              <Button className="w-full" onClick={addAssess} disabled={!assess.skill}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {profile && (
        <Card><CardContent className="p-4 flex items-center gap-3">
          <Target className="w-8 h-8 text-primary" />
          <div><div className="text-sm text-muted-foreground">Target role</div><div className="font-bold">{profile.target_role || 'Not set'}</div></div>
        </CardContent></Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle>Skill assessments</CardTitle></CardHeader><CardContent>
          {assessments.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No assessments yet</p> : (
            <div className="space-y-3">
              {assessments.map((a: any) => (
                <div key={a.id}>
                  <div className="flex items-center justify-between text-sm mb-1"><span className="font-medium">{a.skill}</span><span>{a.score}%</span></div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: `${a.score}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </CardContent></Card>

        <Card><CardHeader><CardTitle>Certificates</CardTitle></CardHeader><CardContent>
          {certs.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No certificates yet — complete courses to earn them</p> : (
            <div className="space-y-2">
              {certs.map((c: any) => (
                <div key={c.id} className="flex items-center gap-3 p-2 rounded border">
                  <Award className="w-6 h-6 text-amber-500" />
                  <div className="text-sm"><div className="font-medium">Certificate</div><div className="text-xs text-muted-foreground">{new Date(c.issued_at || c.created_at).toLocaleDateString()}</div></div>
                </div>
              ))}
            </div>
          )}
        </CardContent></Card>
      </div>
    </div>
  );
}
