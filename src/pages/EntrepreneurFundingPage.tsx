import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DollarSign, Calendar, TrendingUp, Target, Award, Search, Filter,
  ArrowRight, Briefcase, Sparkles, Building2, Rocket,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface Opportunity {
  id: string;
  name: string;
  type: 'Grant' | 'Equity' | 'Program' | 'Debt';
  amount: string;
  deadline: string;
  org: string;
  match: number;
  tags: string[];
}

const opps: Opportunity[] = [
  { id: '1', name: 'Zambia Innovation Fund', type: 'Grant', amount: 'Up to ZMW 100,000', deadline: 'May 31, 2025', org: 'GRZ Ministry of Tech', match: 92, tags: ['AgriTech', 'Early Stage'] },
  { id: '2', name: 'SAVANNAH Fund', type: 'Equity', amount: 'Up to ZMW 500,000', deadline: 'Jun 15, 2025', org: 'Pan-African VC', match: 84, tags: ['Tech', 'Seed'] },
  { id: '3', name: 'AfriLabs Accelerator', type: 'Program', amount: 'Mentorship + Funding', deadline: 'Jun 30, 2025', org: 'AfriLabs', match: 78, tags: ['Accelerator', '12 weeks'] },
  { id: '4', name: 'GIZ MSME Grant', type: 'Grant', amount: 'EUR 25,000', deadline: 'Jul 10, 2025', org: 'GIZ Zambia', match: 71, tags: ['MSME', 'Women-led'] },
  { id: '5', name: 'BongoHive Catalyst', type: 'Program', amount: 'Seed + Coaching', deadline: 'Aug 1, 2025', org: 'BongoHive', match: 88, tags: ['Tech', 'Pre-seed'] },
];

const typeColors: Record<string, string> = {
  Grant: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  Equity: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  Program: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  Debt: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
};

export default function EntrepreneurFundingPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>('All');
  const filtered = opps.filter(o =>
    (filter === 'All' || o.type === filter) &&
    o.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-5 pb-20 lg:pb-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            Funding Opportunities <Sparkles className="w-5 h-5 text-amber-500" />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Grants, equity, and accelerator programs matched to your venture.</p>
        </div>
        <Button onClick={() => navigate('/entrepreneur')} className="rounded-full gap-2">
          <Target className="w-4 h-4" /> Improve Match Score
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: DollarSign, label: 'Total Available', value: 'ZMW 2.4M+', sub: 'Active opportunities', tint: 'bg-emerald-500/10 text-emerald-600' },
          { icon: Award, label: 'Best Match', value: '92%', sub: 'Zambia Innovation Fund', tint: 'bg-blue-500/10 text-blue-600' },
          { icon: Calendar, label: 'Closing Soon', value: 3, sub: 'Within 30 days', tint: 'bg-amber-500/10 text-amber-600' },
          { icon: TrendingUp, label: 'Applications', value: 4, sub: 'In progress', tint: 'bg-purple-500/10 text-purple-600' },
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

      {/* Search + filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search opportunities…" className="pl-9 rounded-full" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {['All', 'Grant', 'Equity', 'Program', 'Debt'].map(t => (
            <button key={t} onClick={() => setFilter(t)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${
                      filter === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground/70 hover:bg-muted/70'
                    }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Opportunity list */}
      <div className="space-y-3">
        {filtered.map(o => (
          <Card key={o.id} className="p-4 lg:p-5 rounded-2xl border-border/40 shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center shrink-0">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base">{o.name}</h3>
                      <Badge variant="outline" className={`text-[10px] ${typeColors[o.type]}`}>{o.type}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      <Building2 className="w-3 h-3" /> {o.org}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Match</div>
                    <div className={`text-lg font-extrabold ${o.match >= 85 ? 'text-emerald-600' : o.match >= 70 ? 'text-amber-600' : 'text-muted-foreground'}`}>{o.match}%</div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <DollarSign className="w-3 h-3" /> <span className="font-medium text-foreground">{o.amount}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="w-3 h-3" /> Deadline <span className="font-medium text-foreground">{o.deadline}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2 pt-3 border-t border-border/40">
                  <div className="flex gap-1.5 flex-wrap">
                    {o.tags.map(t => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t}</span>
                    ))}
                  </div>
                  <Button size="sm" className="rounded-full text-xs h-8">
                    Apply Now <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Bottom CTA */}
      <Card className="p-5 rounded-2xl border-border/40 shadow-sm bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Rocket className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold">Need help with your pitch?</h3>
            <p className="text-xs text-muted-foreground">Use AI Pitch Coach to refine your deck and increase match rates.</p>
          </div>
          <Button onClick={() => navigate('/entrepreneur')} className="rounded-full">Open Pitch Coach</Button>
        </div>
      </Card>
    </div>
  );
}
