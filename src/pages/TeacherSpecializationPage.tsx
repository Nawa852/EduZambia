import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/ui/page-header';
import { useTeacherSpecializations } from '@/hooks/useTeachingResources';
import { GraduationCap, Plus, Trash2 } from 'lucide-react';

const SUBJECTS = ['Mathematics','English','Science','Biology','Chemistry','Physics','Civic Education','Geography','History','Religious Education','Business Studies','ICT','Agriculture','Bemba','Nyanja','Tonga','Lozi','Special Education'];
const GRADES = ['Grade 1-3','Grade 4-6','Grade 7','Grade 8-9','Grade 10-12'];

const TeacherSpecializationPage = () => {
  const { items, loading, add, remove } = useTeacherSpecializations();
  const [subject, setSubject] = useState('');
  const [grades, setGrades] = useState<string[]>([]);
  const [years, setYears] = useState(0);
  const [quals, setQuals] = useState('');
  const [bio, setBio] = useState('');

  const toggleGrade = (g: string) => setGrades(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  const submit = async () => {
    if (!subject) return;
    await add({ subject, grade_levels: grades, years_experience: years, qualifications: quals || null, bio: bio || null });
    setSubject(''); setGrades([]); setYears(0); setQuals(''); setBio('');
  };

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <PageHeader
        title="My Teaching Specializations"
        subtitle="Tell the platform what subjects and grades you teach. We use this to recommend lessons, peer matches, and class assignments."
        icon={GraduationCap}
      />

      <Card>
        <CardHeader><CardTitle className="text-base">Add a specialization</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger><SelectValue placeholder="Subject *" /></SelectTrigger>
              <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="number" min={0} max={60} placeholder="Years of experience" value={years || ''} onChange={e => setYears(parseInt(e.target.value) || 0)} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Grade bands you teach:</p>
            <div className="flex flex-wrap gap-2">
              {GRADES.map(g => (
                <Badge key={g} variant={grades.includes(g) ? 'default' : 'outline'} className="cursor-pointer" onClick={() => toggleGrade(g)}>
                  {g}
                </Badge>
              ))}
            </div>
          </div>
          <Input placeholder="Qualifications (e.g. Diploma in Secondary Ed, UNZA)" value={quals} onChange={e => setQuals(e.target.value)} />
          <Textarea placeholder="Short bio about your teaching style…" value={bio} onChange={e => setBio(e.target.value)} rows={3} />
          <Button onClick={submit} disabled={!subject}><Plus className="w-4 h-4 mr-2" /> Save specialization</Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Your specializations</h2>
        {loading ? <p className="text-sm text-muted-foreground">Loading…</p> :
          items.length === 0 ? <p className="text-sm text-muted-foreground">No specializations yet. Add your first above.</p> :
            items.map(s => (
              <Card key={s.id}>
                <CardContent className="pt-6 flex items-start justify-between gap-4">
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{s.subject}</h3>
                      {s.years_experience > 0 && <Badge variant="secondary">{s.years_experience} yrs</Badge>}
                    </div>
                    {s.grade_levels?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {s.grade_levels.map(g => <Badge key={g} variant="outline" className="text-[10px]">{g}</Badge>)}
                      </div>
                    )}
                    {s.qualifications && <p className="text-xs text-muted-foreground">🎓 {s.qualifications}</p>}
                    {s.bio && <p className="text-sm">{s.bio}</p>}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </CardContent>
              </Card>
            ))
        }
      </div>
    </div>
  );
};

export default TeacherSpecializationPage;
