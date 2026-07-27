import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Layers, Sparkles, Plus, Trash2, ChevronLeft, ChevronRight, RotateCcw,
  Check, X, ArrowLeft, Loader2, BookOpen, Search, Tag, BarChart3,
} from 'lucide-react';
import SpacedRepetitionAnalytics from '@/components/Analytics/SpacedRepetitionAnalytics';

interface Deck {
  id: string;
  title: string;
  subject: string | null;
  tags?: string[] | null;
  created_at: string;
  card_count?: number;
  due_count?: number;
}


interface CardRow {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  ease_factor: number | null;
  interval_days: number | null;
  repetitions: number | null;
  next_review_date: string | null;
}

const SUBJECTS = ['General', 'Mathematics', 'Science', 'English', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'ICT'];

/** SM-2 scheduling — quality 0 (again), 3 (hard), 4 (good), 5 (easy) */
function schedule(card: CardRow, quality: number) {
  let ease = card.ease_factor ?? 2.5;
  let reps = card.repetitions ?? 0;
  let interval = card.interval_days ?? 0;

  if (quality < 3) {
    reps = 0;
    interval = 1;
  } else {
    reps += 1;
    if (reps === 1) interval = 1;
    else if (reps === 2) interval = 6;
    else interval = Math.round(interval * ease);
  }
  ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  const next = new Date();
  next.setDate(next.getDate() + Math.max(1, interval));
  return {
    ease_factor: Number(ease.toFixed(2)),
    repetitions: reps,
    interval_days: interval,
    next_review_date: next.toISOString().slice(0, 10),
  };
}

const FlashcardStudio: React.FC = () => {
  const { user } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDeck, setActiveDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<CardRow[]>([]);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({});
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState(false);

  // search / tagging / analytics
  const [query, setQuery] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [cardShownAt, setCardShownAt] = useState<number>(Date.now());

  // create form
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('General');
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [manualFront, setManualFront] = useState('');
  const [manualBack, setManualBack] = useState('');


  const loadDecks = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('flashcard_decks')
      .select('id, title, subject, tags, created_at, flashcard_cards(id, next_review_date)')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Could not load your decks');
      setLoading(false);
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    setDecks((data ?? []).map((d: any) => ({
      id: d.id,
      title: d.title,
      subject: d.subject,
      tags: d.tags ?? [],
      created_at: d.created_at,

      card_count: d.flashcard_cards?.length ?? 0,
      due_count: (d.flashcard_cards ?? []).filter((c: any) => !c.next_review_date || c.next_review_date <= today).length,
    })));
    setLoading(false);
  }, [user]);

  useEffect(() => { loadDecks(); }, [loadDecks]);

  const openDeck = useCallback(async (deck: Deck) => {
    setActiveDeck(deck);
    setCardsLoading(true);
    setIndex(0); setFlipped(false); setReviewed({});
    const { data, error } = await supabase
      .from('flashcard_cards')
      .select('*')
      .eq('deck_id', deck.id)
      .order('created_at', { ascending: true });
    if (error) toast.error('Could not load cards');
    setCards((data ?? []) as CardRow[]);
    setCardsLoading(false);
  }, []);

  const generate = async () => {
    if (!topic.trim() && !notes.trim()) {
      toast.error('Add a topic or paste some notes first');
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-flashcard-generator', {
        body: { topic: topic.trim(), subject, notes: notes.trim(), count: 12, difficulty: 'medium' },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(`Created ${(data as any).count} cards`);
      setTopic(''); setNotes(''); setCreating(false);
      await loadDecks();
    } catch (e: any) {
      toast.error(e.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const addManualCard = async () => {
    if (!activeDeck || !manualFront.trim() || !manualBack.trim()) return;
    const { data, error } = await supabase
      .from('flashcard_cards')
      .insert({ deck_id: activeDeck.id, front: manualFront.trim(), back: manualBack.trim() })
      .select('*')
      .single();
    if (error) { toast.error('Could not add card'); return; }
    setCards(prev => [...prev, data as CardRow]);
    setManualFront(''); setManualBack('');
    toast.success('Card added');
  };

  const deleteDeck = async (id: string) => {
    const { error } = await supabase.from('flashcard_decks').delete().eq('id', id);
    if (error) { toast.error('Could not delete deck'); return; }
    setDecks(prev => prev.filter(d => d.id !== id));
    if (activeDeck?.id === id) setActiveDeck(null);
    toast.success('Deck deleted');
  };

  const deleteCard = async (id: string) => {
    const { error } = await supabase.from('flashcard_cards').delete().eq('id', id);
    if (error) { toast.error('Could not delete card'); return; }
    setCards(prev => prev.filter(c => c.id !== id));
    setIndex(i => Math.max(0, Math.min(i, cards.length - 2)));
  };

  const grade = async (quality: number) => {
    const card = cards[index];
    if (!card) return;
    const patch = schedule(card, quality);
    const seconds = Math.min(600, Math.round((Date.now() - cardShownAt) / 1000));
    setCards(prev => prev.map(c => (c.id === card.id ? { ...c, ...patch } : c)));
    setReviewed(prev => ({ ...prev, [card.id]: true }));
    setFlipped(false);
    setIndex(i => (i + 1 < cards.length ? i + 1 : i));
    setCardShownAt(Date.now());
    const { error } = await supabase.from('flashcard_cards').update(patch).eq('id', card.id);
    if (error) toast.error('Progress not saved');
    if (user) {
      await supabase.from('flashcard_reviews').insert({
        user_id: user.id,
        deck_id: card.deck_id,
        card_id: card.id,
        quality,
        seconds_spent: seconds,
        ease_after: patch.ease_factor,
        interval_after: patch.interval_days,
      });
    }
  };

  const saveTags = async (deck: Deck, tags: string[]) => {
    const clean = Array.from(new Set(tags.map(t => t.trim().toLowerCase()).filter(Boolean))).slice(0, 12);
    const { error } = await supabase.from('flashcard_decks').update({ tags: clean }).eq('id', deck.id);
    if (error) { toast.error('Could not save tags'); return; }
    setDecks(prev => prev.map(d => (d.id === deck.id ? { ...d, tags: clean } : d)));
    setActiveDeck(prev => (prev && prev.id === deck.id ? { ...prev, tags: clean } : prev));
  };

  const reviewedCount = Object.keys(reviewed).length;
  const current = cards[index];
  const progress = cards.length ? (reviewedCount / cards.length) * 100 : 0;
  const dueToday = useMemo(() => decks.reduce((n, d) => n + (d.due_count ?? 0), 0), [decks]);

  const allTags = useMemo(
    () => Array.from(new Set(decks.flatMap(d => d.tags ?? []))).sort(),
    [decks],
  );

  const visibleDecks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return decks.filter(d => {
      const matchesQuery = !q
        || d.title.toLowerCase().includes(q)
        || (d.subject ?? '').toLowerCase().includes(q)
        || (d.tags ?? []).some(t => t.includes(q));
      const matchesTag = !tagFilter || (d.tags ?? []).includes(tagFilter);
      return matchesQuery && matchesTag;
    });
  }, [decks, query, tagFilter]);


  if (!user) {
    return (
      <div className="text-center py-16 space-y-3">
        <Layers className="w-10 h-10 mx-auto text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">Sign in to build and review your flashcard decks.</p>
      </div>
    );
  }

  /* ---------------- Deck study view ---------------- */
  if (activeDeck) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="rounded-full -ml-2" onClick={() => setActiveDeck(null)}>
            <ArrowLeft className="w-4 h-4 mr-1.5" />Decks
          </Button>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold truncate text-foreground">{activeDeck.title}</h2>
            <p className="text-xs text-muted-foreground">{activeDeck.subject || 'General'} · {cards.length} cards</p>
          </div>
        </div>

        {cardsLoading ? (
          <Skeleton className="h-64 w-full rounded-3xl" />
        ) : cards.length === 0 ? (
          <Card className="rounded-3xl border-dashed">
            <CardContent className="py-12 text-center space-y-2">
              <BookOpen className="w-8 h-8 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">This deck is empty. Add your first card below.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Progress value={progress} className="h-1.5" />

            <div className="relative" style={{ perspective: 1400 }}>
              <motion.button
                type="button"
                onClick={() => setFlipped(f => !f)}
                className="w-full text-left"
                aria-label="Flip card"
              >
                <motion.div
                  animate={{ rotateY: flipped ? 180 : 0 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 24 }}
                  style={{ transformStyle: 'preserve-3d' }}
                  className="relative h-72 sm:h-80 w-full"
                >
                  <div
                    className="absolute inset-0 rounded-3xl border border-border/50 bg-card p-6 flex flex-col items-center justify-center text-center shadow-sm"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Question</span>
                    <p className="text-lg sm:text-xl font-medium leading-snug text-foreground">{current?.front}</p>
                    <span className="mt-6 text-xs text-muted-foreground">Tap to reveal</span>
                  </div>
                  <div
                    className="absolute inset-0 rounded-3xl border border-primary/20 bg-primary/5 p-6 flex flex-col items-center justify-center text-center shadow-sm"
                    style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                  >
                    <span className="text-[10px] uppercase tracking-widest text-primary/70 mb-3">Answer</span>
                    <p className="text-base sm:text-lg leading-relaxed text-foreground">{current?.back}</p>
                  </div>
                </motion.div>
              </motion.button>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <button onClick={() => { setIndex(i => Math.max(0, i - 1)); setFlipped(false); }}
                disabled={index === 0} className="p-1.5 disabled:opacity-30" aria-label="Previous card">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>Card {index + 1} of {cards.length}</span>
              <button onClick={() => { setIndex(i => Math.min(cards.length - 1, i + 1)); setFlipped(false); }}
                disabled={index >= cards.length - 1} className="p-1.5 disabled:opacity-30" aria-label="Next card">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {([
                { label: 'Again', q: 0, cls: 'text-destructive border-destructive/30', icon: X },
                { label: 'Hard', q: 3, cls: 'text-amber-600 border-amber-500/30', icon: RotateCcw },
                { label: 'Good', q: 4, cls: 'text-emerald-600 border-emerald-500/30', icon: Check },
                { label: 'Easy', q: 5, cls: 'text-primary border-primary/30', icon: Sparkles },
              ]).map(b => (
                <Button key={b.label} variant="outline" onClick={() => grade(b.q)}
                  className={`rounded-xl h-11 text-xs ${b.cls}`}>
                  <b.icon className="w-3.5 h-3.5 mr-1" />{b.label}
                </Button>
              ))}
            </div>
          </>
        )}

        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Add a card</p>
            <Input placeholder="Front (question)" value={manualFront} onChange={e => setManualFront(e.target.value)} className="rounded-xl" />
            <Textarea placeholder="Back (answer)" value={manualBack} onChange={e => setManualBack(e.target.value)} rows={2} className="rounded-xl" />
            <Button size="sm" className="rounded-xl w-full" onClick={addManualCard}
              disabled={!manualFront.trim() || !manualBack.trim()}>
              <Plus className="w-4 h-4 mr-1.5" />Add card
            </Button>
          </CardContent>
        </Card>

        {cards.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">All cards</p>
            {cards.map((c, i) => (
              <div key={c.id}
                className={`flex items-center gap-3 rounded-xl border border-border/50 px-3 py-2.5 text-sm ${i === index ? 'bg-muted/50' : 'bg-card'}`}>
                <button className="flex-1 min-w-0 text-left" onClick={() => { setIndex(i); setFlipped(false); }}>
                  <span className="block truncate text-foreground">{c.front}</span>
                  <span className="block truncate text-xs text-muted-foreground">{c.back}</span>
                </button>
                <button onClick={() => deleteCard(c.id)} className="text-muted-foreground hover:text-destructive p-1" aria-label="Delete card">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ---------------- Deck list ---------------- */
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border/40 bg-gradient-to-br from-violet-500/10 via-primary/5 to-transparent p-5">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-violet-500/15 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-violet-500" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground">Flashcards</h2>
            <p className="text-sm text-muted-foreground">
              {decks.length === 0
                ? 'Generate a deck from any topic or your own notes.'
                : `${decks.length} deck${decks.length === 1 ? '' : 's'} · ${dueToday} card${dueToday === 1 ? '' : 's'} due today`}
            </p>
          </div>
        </div>
        <Button className="mt-4 w-full rounded-xl" onClick={() => setCreating(c => !c)}>
          <Sparkles className="w-4 h-4 mr-2" />{creating ? 'Close' : 'New deck with AI'}
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {creating && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Card className="rounded-2xl border-border/50">
              <CardContent className="p-4 space-y-3">
                <Input placeholder="Topic, e.g. Photosynthesis (Grade 9)" value={topic}
                  onChange={e => setTopic(e.target.value)} className="rounded-xl" />
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
                <Textarea placeholder="Optional: paste notes to turn into cards" rows={4}
                  value={notes} onChange={e => setNotes(e.target.value)} className="rounded-xl" />
                <Button className="w-full rounded-xl" onClick={generate} disabled={generating}>
                  {generating
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating…</>
                    : <><Sparkles className="w-4 h-4 mr-2" />Generate 12 cards</>}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="space-y-2">{[0, 1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}</div>
      ) : decks.length === 0 ? (
        <Card className="rounded-3xl border-dashed">
          <CardContent className="py-14 text-center space-y-2">
            <Layers className="w-9 h-9 mx-auto text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">No decks yet</p>
            <p className="text-xs text-muted-foreground">Create your first deck to start spaced repetition.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {decks.map(deck => (
            <Card key={deck.id} className="rounded-2xl border-border/50 hover:border-primary/40 transition-colors">
              <CardContent className="p-4 flex items-center gap-3">
                <button className="flex-1 min-w-0 text-left" onClick={() => openDeck(deck)}>
                  <p className="font-medium text-sm truncate text-foreground">{deck.title}</p>
                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <Badge variant="secondary" className="rounded-full text-[10px]">{deck.subject || 'General'}</Badge>
                    <span className="text-[11px] text-muted-foreground">{deck.card_count} cards</span>
                    {!!deck.due_count && (
                      <Badge className="rounded-full text-[10px] bg-primary/15 text-primary hover:bg-primary/15">
                        {deck.due_count} due
                      </Badge>
                    )}
                  </div>
                </button>
                <button onClick={() => deleteDeck(deck.id)} className="text-muted-foreground hover:text-destructive p-1.5" aria-label="Delete deck">
                  <Trash2 className="w-4 h-4" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FlashcardStudio;
