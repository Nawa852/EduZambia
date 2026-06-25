import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';
import {
  Users, UserPlus, Search, Mail, Award, GraduationCap,
  TrendingUp, ShieldCheck, MoreVertical, Phone,
} from 'lucide-react';

interface Teacher {
  id: string;
  name: string;
  subject: string;
  classes: number;
  performance: number;
  email: string;
  status: 'active' | 'on-leave';
  initials: string;
  experience: string;
  verified: boolean;
}

const teachers: Teacher[] = [
  { id: '1', name: 'Mrs. Mulenga', subject: 'Mathematics', classes: 5, performance: 92, email: 'mulenga@lusakasec.zm', status: 'active', initials: 'MM', experience: '12 yrs', verified: true },
  { id: '2', name: 'Mr. Banda', subject: 'Physics', classes: 4, performance: 88, email: 'banda@lusakasec.zm', status: 'active', initials: 'MB', experience: '8 yrs', verified: true },
  { id: '3', name: 'Ms. Phiri', subject: 'English', classes: 6, performance: 85, email: 'phiri@lusakasec.zm', status: 'active', initials: 'MP', experience: '6 yrs', verified: true },
  { id: '4', name: 'Mr. Tembo', subject: 'Biology', classes: 4, performance: 79, email: 'tembo@lusakasec.zm', status: 'on-leave', initials: 'MT', experience: '10 yrs', verified: true },
  { id: '5', name: 'Mrs. Sakala', subject: 'Chemistry', classes: 5, performance: 90, email: 'sakala@lusakasec.zm', status: 'active', initials: 'MS', experience: '15 yrs', verified: true },
  { id: '6', name: 'Mr. Chanda', subject: 'History', classes: 3, performance: 82, email: 'chanda@lusakasec.zm', status: 'active', initials: 'MC', experience: '4 yrs', verified: false },
];

export default function SchoolAdminTeachersPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'on-leave' | 'pending'>('all');

  const filterFn = (t: Teacher) => {
    if (filter === 'active') return t.status === 'active';
    if (filter === 'on-leave') return t.status === 'on-leave';
    if (filter === 'pending') return !t.verified;
    return true;
  };

  const list = teachers.filter(t => filterFn(t) && (t.name + t.subject).toLowerCase().includes(query.toLowerCase()));
  const avgPerf = Math.round(teachers.reduce((a, t) => a + t.performance, 0) / teachers.length);

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-5 pb-20 lg:pb-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">Teacher Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage staff, performance, and verifications at Lusaka Secondary.</p>
        </div>
        <Button onClick={() => navigate('/admin?tab=users')} className="rounded-full gap-2">
          <UserPlus className="w-4 h-4" /> Invite Teacher
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Users, label: 'Total Teachers', value: teachers.length, sub: '+4 this term', tint: 'bg-blue-500/10 text-blue-600' },
          { icon: GraduationCap, label: 'Active', value: teachers.filter(t => t.status === 'active').length, sub: 'Currently teaching', tint: 'bg-emerald-500/10 text-emerald-600' },
          { icon: TrendingUp, label: 'Avg. Performance', value: `${avgPerf}%`, sub: 'Term average', tint: 'bg-purple-500/10 text-purple-600' },
          { icon: ShieldCheck, label: 'Unverified', value: teachers.filter(t => !t.verified).length, sub: 'Pending review', tint: 'bg-amber-500/10 text-amber-600' },
        ].map(s => (
          <Card key={s.label} className="p-4 rounded-2xl border-border/40 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg ${s.tint} flex items-center justify-center`}>
                <s.icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
            </div>
            <div className="text-2xl font-extrabold">{s.value}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{s.sub}</div>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name or subject…" className="pl-9 rounded-full" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {([
            { id: 'all', label: 'All' },
            { id: 'active', label: 'Active' },
            { id: 'on-leave', label: 'On Leave' },
            { id: 'pending', label: 'Unverified' },
          ] as const).map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
                      filter === f.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground/70 hover:bg-muted/70'
                    }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="rounded-2xl border-border/40 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 text-xs text-muted-foreground">
              <tr>
                <th className="text-left p-3 font-medium">Teacher</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Subject</th>
                <th className="text-left p-3 font-medium hidden lg:table-cell">Classes</th>
                <th className="text-left p-3 font-medium">Performance</th>
                <th className="text-left p-3 font-medium hidden md:table-cell">Status</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map(t => (
                <tr key={t.id} className="border-t border-border/40 hover:bg-muted/20 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold text-xs">{t.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold flex items-center gap-1.5">
                          {t.name}
                          {t.verified && <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{t.experience} experience</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 hidden md:table-cell"><Badge variant="outline" className="text-xs">{t.subject}</Badge></td>
                  <td className="p-3 hidden lg:table-cell text-sm">{t.classes}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <Progress value={t.performance} className="h-1.5 flex-1 max-w-[100px]" />
                      <span className="text-xs font-semibold">{t.performance}%</span>
                    </div>
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    <Badge variant="outline" className={t.status === 'active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}>
                      {t.status === 'active' ? 'Active' : 'On Leave'}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-muted" title="Email">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-muted" title="More">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
