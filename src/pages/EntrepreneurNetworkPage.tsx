import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useState } from 'react';
import {
  Users, UserPlus, Search, MessageSquare, Briefcase, MapPin, Star,
  Filter, Sparkles, Award,
} from 'lucide-react';

interface Person {
  id: string;
  name: string;
  role: string;
  company: string;
  location: string;
  initials: string;
  match: number;
  tags: string[];
  mutual: number;
  status?: 'connected' | 'pending' | 'suggested';
}

const people: Person[] = [
  { id: '1', name: 'Chanda Phiri', role: 'Investor', company: 'Zambezi Capital', location: 'Lusaka', initials: 'CP', match: 94, tags: ['AgriTech', 'Seed'], mutual: 12, status: 'suggested' },
  { id: '2', name: 'Brian Mwansa', role: 'Full-Stack Dev', company: 'Co-founder match', location: 'Lusaka', initials: 'BM', match: 91, tags: ['Tech', 'Mobile'], mutual: 7, status: 'pending' },
  { id: '3', name: 'Esther Banda', role: 'Marketing Strategist', company: 'GrowthLab Africa', location: 'Kitwe', initials: 'EB', match: 87, tags: ['Marketing', 'Growth'], mutual: 9, status: 'connected' },
  { id: '4', name: 'Dr. James Mukuka', role: 'Mentor', company: 'BongoHive', location: 'Lusaka', initials: 'JM', match: 89, tags: ['Mentor', 'Tech'], mutual: 22, status: 'connected' },
  { id: '5', name: 'Mwila Sakala', role: 'Product Designer', company: 'Freelance', location: 'Ndola', initials: 'MS', match: 82, tags: ['Design', 'UX'], mutual: 4, status: 'suggested' },
  { id: '6', name: 'Patricia Tembo', role: 'Legal Advisor', company: 'Tembo & Co', location: 'Lusaka', initials: 'PT', match: 76, tags: ['Legal', 'Startups'], mutual: 5, status: 'suggested' },
];

export default function EntrepreneurNetworkPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'investors' | 'cofounders' | 'mentors'>('all');

  const filterFn = (p: Person) => {
    if (filter === 'investors') return /invest/i.test(p.role);
    if (filter === 'cofounders') return /dev|design|cofound|engineer/i.test(p.role);
    if (filter === 'mentors') return /mentor|advisor|coach/i.test(p.role);
    return true;
  };

  const list = people.filter(p => filterFn(p) && (p.name + p.role + p.company).toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-5 pb-20 lg:pb-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">My Network</h1>
          <p className="text-sm text-muted-foreground mt-1">Connect with investors, co-founders, and mentors across Zambia.</p>
        </div>
        <Button onClick={() => navigate('/connect')} className="rounded-full gap-2">
          <Sparkles className="w-4 h-4" /> Find Matches with AI
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Users, label: 'Network', value: 156, sub: '+12 this month', tint: 'bg-blue-500/10 text-blue-600' },
          { icon: Briefcase, label: 'Investors', value: 24, sub: 'Active conversations', tint: 'bg-emerald-500/10 text-emerald-600' },
          { icon: UserPlus, label: 'Pending', value: 8, sub: 'Connection requests', tint: 'bg-amber-500/10 text-amber-600' },
          { icon: Award, label: 'Mentors', value: 5, sub: 'Currently advising', tint: 'bg-purple-500/10 text-purple-600' },
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
          <Input placeholder="Search people, roles, companies…" className="pl-9 rounded-full" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {([
            { id: 'all', label: 'All' },
            { id: 'investors', label: 'Investors' },
            { id: 'cofounders', label: 'Co-founders' },
            { id: 'mentors', label: 'Mentors' },
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map(p => (
          <Card key={p.id} className="p-4 rounded-2xl border-border/40 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start gap-3">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold">{p.initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{p.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{p.role}</p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${p.match >= 85 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
                    {p.match}%
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                  <Briefcase className="w-3 h-3" /> {p.company}
                </p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {p.location} • {p.mutual} mutual
                </p>
                <div className="mt-2 flex gap-1 flex-wrap">
                  {p.tags.map(t => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 flex gap-2 pt-3 border-t border-border/40">
              {p.status === 'connected' ? (
                <Button size="sm" variant="outline" className="flex-1 rounded-full text-xs h-8 gap-1.5">
                  <MessageSquare className="w-3 h-3" /> Message
                </Button>
              ) : p.status === 'pending' ? (
                <Button size="sm" variant="outline" disabled className="flex-1 rounded-full text-xs h-8">Pending</Button>
              ) : (
                <Button size="sm" className="flex-1 rounded-full text-xs h-8 gap-1.5">
                  <UserPlus className="w-3 h-3" /> Connect
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
