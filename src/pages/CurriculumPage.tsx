import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  GraduationCap, BookOpen, ChevronRight, ChevronLeft, Search,
  Youtube, FileText, Sparkles, Clock, Target, ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

type Subject = {
  id: string; grade: string; code: string; name: string;
  description: string | null; color: string; icon: string; sort_order: number;
};
type Topic = {
  id: string; subject_id: string; title: string; description: string | null;
  objectives: string[]; difficulty: string; estimated_minutes: number; sort_order: number;
};
type Resource = {
  id: string; topic_id: string; kind: string; title: string;
  url: string | null; description: string | null; source: string | null;
  is_featured: boolean; sort_order: number;
};

const GRADES = ['7', '9', '12'];

const kindIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  youtube: Youtube,
  video: Youtube,
  past_paper: FileText,
  pdf: FileText,
  article: BookOpen,
  ai_prompt: Sparkles,
};

const kindColor: Record<string, string> = {
  youtube: 'text-red-500 bg-red-500/10',
  video: 'text-red-500 bg-red-500/10',
  past_paper: 'text-amber-500 bg-amber-500/10',
  pdf: 'text-amber-500 bg-amber-500/10',
  article: 'text-blue-500 bg-blue-500/10',
  ai_prompt: 'text-violet-500 bg-violet-500/10',
};

export default function CurriculumPage() {
  const [grade, setGrade] = useState<string>(() => localStorage.getItem('curriculum:grade') || '12');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Load subjects when grade changes
  useEffect(() => {
    localStorage.setItem('curriculum:grade', grade);
    setLoading(true);
    setSelectedSubject(null);
    setSelectedTopic(null);
    supabase
      .from('curriculum_subjects')
      .select('*')
      .eq('grade', grade)
      .order('sort_order')
      .then(({ data }) => {
        setSubjects((data as Subject[]) || []);
        setLoading(false);
      });
  }, [grade]);

  // Load topics for selected subject
  useEffect(() => {
    if (!selectedSubject) { setTopics([]); return; }
    supabase
      .from('curriculum_topics')
      .select('*')
      .eq('subject_id', selectedSubject.id)
      .order('sort_order')
      .then(({ data }) => setTopics((data as Topic[]) || []));
  }, [selectedSubject]);

  // Load resources for selected topic
  useEffect(() => {
    if (!selectedTopic) { setResources([]); return; }
    supabase
      .from('curriculum_resources')
      .select('*')
      .eq('topic_id', selectedTopic.id)
      .order('sort_order')
      .then(({ data }) => setResources((data as Resource[]) || []));
  }, [selectedTopic]);

  const filteredTopics = useMemo(() => {
    if (!search.trim()) return topics;
    const q = search.toLowerCase();
    return topics.filter(t => t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q));
  }, [topics, search]);

  const youtubeFallbackUrl = (q: string) =>
    `https://www.youtube.com/results?search_query=${encodeURIComponent(q + ' ECZ Zambia Grade ' + grade)}`;

  return (
    <div className="space-y-5">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-violet-500/10 to-blue-500/10 border border-border/40 p-5 sm:p-6">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/15 backdrop-blur flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">ECZ Curriculum</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Subjects, topics and curated resources for every grade — with a built-in AI tutor.
            </p>
          </div>
        </div>

        {/* Grade pills */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
          {GRADES.map(g => (
            <button
              key={g}
              onClick={() => setGrade(g)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
                grade === g
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'bg-background/60 backdrop-blur border border-border/40 text-foreground hover:border-primary/40'
              }`}
            >
              Grade {g}
            </button>
          ))}
        </div>
      </div>

      {/* Layout: subject grid → topic list → resources */}
      {!selectedSubject ? (
        // SUBJECT GRID
        loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {subjects.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSubject(s)}
                className="group relative overflow-hidden text-left p-4 rounded-2xl border border-border/40 bg-card hover:border-primary/50 hover:shadow-lg transition-all"
                style={{ background: `linear-gradient(135deg, ${s.color}15, transparent)` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow"
                    style={{ background: s.color }}
                  >
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <Badge variant="secondary" className="text-[10px]">Grade {s.grade}</Badge>
                </div>
                <div className="text-sm font-semibold text-foreground leading-tight">{s.name}</div>
                {s.description && (
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                )}
                <ChevronRight className="absolute bottom-3 right-3 w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
            {subjects.length === 0 && (
              <Card className="col-span-full p-6 text-center text-sm text-muted-foreground">
                No subjects yet for Grade {grade}. Try another grade.
              </Card>
            )}
          </div>
        )
      ) : !selectedTopic ? (
        // TOPIC LIST
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedSubject(null)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Subjects
            </Button>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-muted-foreground">Grade {selectedSubject.grade}</div>
              <h2 className="text-lg font-bold text-foreground truncate">{selectedSubject.name}</h2>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search topics..."
              className="pl-9"
            />
          </div>

          <div className="space-y-2">
            {filteredTopics.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTopic(t)}
                className="w-full text-left p-4 rounded-xl border border-border/40 bg-card hover:border-primary/40 hover:shadow transition-all flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Target className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground">{t.title}</div>
                  {t.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{t.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="text-[10px] capitalize">{t.difficulty}</Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {t.estimated_minutes} min
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))}
            {filteredTopics.length === 0 && (
              <Card className="p-6 text-center text-sm text-muted-foreground">
                No topics match your search.
              </Card>
            )}
          </div>
        </div>
      ) : (
        // RESOURCE VIEW
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedTopic(null)}>
              <ChevronLeft className="w-4 h-4 mr-1" /> {selectedSubject.name}
            </Button>
          </div>

          <Card className="p-5 bg-gradient-to-br from-primary/10 via-transparent to-violet-500/5 border-primary/20">
            <div className="text-xs text-muted-foreground">{selectedSubject.name} · Grade {selectedSubject.grade}</div>
            <h2 className="text-xl font-bold text-foreground mt-1">{selectedTopic.title}</h2>
            {selectedTopic.description && (
              <p className="text-sm text-muted-foreground mt-1">{selectedTopic.description}</p>
            )}
            {selectedTopic.objectives?.length > 0 && (
              <div className="mt-3">
                <div className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground mb-1.5">Learning objectives</div>
                <ul className="space-y-1">
                  {selectedTopic.objectives.map((o, i) => (
                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              <Button asChild size="sm">
                <Link to={`/ai?tab=tutor&prompt=${encodeURIComponent('Teach me ' + selectedTopic.title + ' for ECZ Grade ' + selectedSubject.grade)}`}>
                  <Sparkles className="w-4 h-4 mr-1.5" /> AI Tutor
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to={`/ai?tab=quiz&topic=${encodeURIComponent(selectedTopic.title)}`}>
                  <Target className="w-4 h-4 mr-1.5" /> Practice Quiz
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to={`/ecz?tab=papers&subject=${encodeURIComponent(selectedSubject.name)}`}>
                  <FileText className="w-4 h-4 mr-1.5" /> Past Papers
                </Link>
              </Button>
            </div>
          </Card>

          {/* Curated resources */}
          <div>
            <div className="text-sm font-semibold text-foreground mb-2">Curated resources</div>
            {resources.length === 0 ? (
              <Card className="p-4 text-sm text-muted-foreground">
                No curated picks yet — see the YouTube fallback below.
              </Card>
            ) : (
              <div className="space-y-2">
                {resources.map(r => {
                  const Icon = kindIcon[r.kind] || BookOpen;
                  const color = kindColor[r.kind] || 'text-primary bg-primary/10';
                  const isInternal = r.url?.startsWith('/');
                  const Wrapper: any = isInternal ? Link : 'a';
                  const linkProps: any = isInternal
                    ? { to: r.url }
                    : { href: r.url || '#', target: '_blank', rel: 'noopener noreferrer' };
                  return (
                    <Wrapper
                      key={r.id}
                      {...linkProps}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card hover:border-primary/40 hover:shadow transition-all"
                    >
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">{r.title}</div>
                        {r.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{r.description}</p>
                        )}
                        {r.source && <div className="text-[10px] text-muted-foreground mt-0.5">{r.source}</div>}
                      </div>
                      {r.is_featured && <Badge variant="secondary" className="text-[10px]">Featured</Badge>}
                      <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
                    </Wrapper>
                  );
                })}
              </div>
            )}
          </div>

          {/* YouTube fallback */}
          <div>
            <div className="text-sm font-semibold text-foreground mb-2">More on YouTube</div>
            <a
              href={youtubeFallbackUrl(selectedTopic.title + ' ' + selectedSubject.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card hover:border-red-500/40 hover:shadow transition-all"
            >
              <div className="w-9 h-9 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
                <Youtube className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground">Search YouTube for "{selectedTopic.title}"</div>
                <p className="text-xs text-muted-foreground">Live results filtered to ECZ Grade {grade}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
