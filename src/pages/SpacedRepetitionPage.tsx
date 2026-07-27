import { useState, useEffect } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Brain, Plus, RotateCcw, Check, X, Layers, Inbox } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

interface Deck { id: string; title: string; subject: string | null; created_at: string; card_count?: number; due_count?: number; }
interface FlashCard { id: string; front: string; back: string; ease_factor: number; interval_days: number; repetitions: number; next_review_date: string; }

function sm2(card: FlashCard, quality: number) {
  let { ease_factor, interval_days, repetitions } = card;
  if (quality >= 3) {
    if (repetitions === 0) interval_days = 1;
    else if (repetitions === 1) interval_days = 6;
    else interval_days = Math.round(interval_days * ease_factor);
    repetitions++;
  } else {
    repetitions = 0; interval_days = 1;
  }
  ease_factor = Math.max(1.3, ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  const next = new Date(); next.setDate(next.getDate() + interval_days);
  return { ease_factor, interval_days, repetitions, next_review_date: next.toISOString().split('T')[0] };
}

const SpacedRepetitionPage = () => {
  const { user } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDeck, setActiveDeck] = useState<string | null>(null);
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addCardOpen, setAddCardOpen] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadDecks();
  }, [user]);

  const loadDecks = async () => {
    const { data, error } = await (supabase as any).from('flashcard_decks').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
    if (error) { toast.error('Failed to load decks'); setLoading(false); return; }
    if (data) {
      const withCounts = await Promise.all(data.map(async (d: any) => {
        const { count } = await (supabase as any).from('flashcard_cards').select('*', { count: 'exact', head: true }).eq('deck_id', d.id);
        const { count: due } = await (supabase as any).from('flashcard_cards').select('*', { count: 'exact', head: true }).eq('deck_id', d.id).lte('next_review_date', new Date().toISOString().split('T')[0]);
        return { ...d, card_count: count || 0, due_count: due || 0 };
      }));
      setDecks(withCounts);
    }
    setLoading(false);
  };

  const createDeck = async () => {
    if (!newTitle.trim()) return;
    const { error } = await (supabase as any).from('flashcard_decks').insert({ user_id: user!.id, title: newTitle, subject: newSubject || null });
    if (error) { toast.error('Failed to create deck'); return; }
    setNewTitle(''); setNewSubject(''); setDialogOpen(false);
    toast.success('Deck created!'); loadDecks();
  };

  const startReview = async (deckId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await (supabase as any).from('flashcard_cards').select('*').eq('deck_id', deckId).lte('next_review_date', today).order('next_review_date');
    if (error) { toast.error('Failed to load cards'); return; }
    if (!data?.length) {
      toast.info('No cards due for review. Add some cards first!');
      setActiveDeck(deckId);
      setCards([]);
      setAddCardOpen(true);
      return;
    }
    setCards(data); setActiveDeck(deckId); setCurrentIdx(0); setFlipped(false);
  };

  const openAddCard = (deckId: string) => {
    setActiveDeck(deckId);
    setAddCardOpen(true);
  };

  const addCard = async () => {
    if (!newFront.trim() || !newBack.trim() || !activeDeck) return;
    const { error } = await (supabase as any).from('flashcard_cards').insert({ deck_id: activeDeck, front: newFront, back: newBack });
    if (error) { toast.error('Failed to add card'); return; }
    setNewFront(''); setNewBack(''); setAddCardOpen(false);
    toast.success('Card added!');
    // Reload due cards for this deck
    const today = new Date().toISOString().split('T')[0];
    const { data } = await (supabase as any).from('flashcard_cards').select('*').eq('deck_id', activeDeck).lte('next_review_date', today).order('next_review_date');
    if (data?.length) {
      setCards(data);
      setCurrentIdx(0);
      setFlipped(false);
    }
    loadDecks();
  };

  const rateCard = async (quality: number) => {
    const card = cards[currentIdx];
    const updates = sm2(card, quality);
    const { error } = await (supabase as any).from('flashcard_cards').update(updates).eq('id', card.id);
    if (error) { toast.error('Failed to save rating'); return; }
    setFlipped(false);
    if (currentIdx + 1 < cards.length) setCurrentIdx(currentIdx + 1);
    else { toast.success('Review complete! 🎉'); setActiveDeck(null); setCards([]); loadDecks(); }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-48" />
      {[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}
    </div>
  );

  if (activeDeck && cards.length > 0) {
    const card = cards[currentIdx];
    return (
      <div className="max-w-lg mx-auto py-6 px-4 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2"><Brain className="w-5 h-5 text-primary" /> Review</h1>
          <div className="flex gap-2">
            <Badge variant="outline">{currentIdx + 1}/{cards.length}</Badge>
            <Button variant="ghost" size="sm" onClick={() => { setActiveDeck(null); setCards([]); }}>Exit</Button>
            <Button variant="outline" size="sm" onClick={() => setAddCardOpen(true)}><Plus className="w-3 h-3 mr-1" />Add</Button>
          </div>
        </div>
        <motion.div key={card.id} initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <Card className="cursor-pointer min-h-[250px]" onClick={() => setFlipped(!flipped)}>
            <CardContent className="p-8 flex items-center justify-center min-h-[250px]">
              <AnimatePresence mode="wait">
                <motion.div key={flipped ? 'back' : 'front'} initial={{ rotateY: 90 }} animate={{ rotateY: 0 }} exit={{ rotateY: -90 }} transition={{ duration: 0.2 }}>
                  <p className="text-lg text-center">{flipped ? card.back : card.front}</p>
                  <p className="text-xs text-muted-foreground text-center mt-4">{flipped ? 'Answer' : 'Tap to reveal'}</p>
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
        {flipped && (
          <div className="flex justify-center gap-2">
            <Button variant="destructive" onClick={() => rateCard(1)}><X className="w-4 h-4 mr-1" />Again</Button>
            <Button variant="outline" onClick={() => rateCard(3)}><RotateCcw className="w-4 h-4 mr-1" />Hard</Button>
            <Button variant="default" onClick={() => rateCard(4)}><Check className="w-4 h-4 mr-1" />Good</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => rateCard(5)}>Easy</Button>
          </div>
        )}
        <Dialog open={addCardOpen} onOpenChange={setAddCardOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Card</DialogTitle></DialogHeader>
            <Textarea placeholder="Front (question)" value={newFront} onChange={e => setNewFront(e.target.value)} />
            <Textarea placeholder="Back (answer)" value={newBack} onChange={e => setNewBack(e.target.value)} />
            <Button onClick={addCard}>Add Card</Button>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Brain className="w-6 h-6 text-primary" /> Spaced Repetition</h1>
          <p className="text-sm text-muted-foreground">Master your knowledge with SM-2 algorithm</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />New Deck</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Deck</DialogTitle></DialogHeader>
            <Input placeholder="Deck title" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            <Input placeholder="Subject (optional)" value={newSubject} onChange={e => setNewSubject(e.target.value)} />
            <Button onClick={createDeck}>Create</Button>
          </DialogContent>
        </Dialog>
      </div>

      {decks.length === 0 ? (
        <Card><CardContent className="py-16 text-center">
          <Inbox className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="font-medium">No decks yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create your first flashcard deck to start learning.</p>
          <Button className="mt-4" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Create Deck</Button>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {decks.map(deck => (
            <Card key={deck.id} className="border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{deck.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {deck.subject && <Badge variant="secondary" className="text-xs">{deck.subject}</Badge>}
                    <span className="text-xs text-muted-foreground">{deck.card_count} cards</span>
                    {(deck.due_count || 0) > 0 && <Badge className="text-xs bg-primary">{deck.due_count} due</Badge>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openAddCard(deck.id)}><Plus className="w-3 h-3 mr-1" />Add</Button>
                  <Button size="sm" onClick={() => startReview(deck.id)} disabled={!deck.due_count && !deck.card_count}>
                    <Layers className="w-3 h-3 mr-1" />Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add card dialog accessible from deck list */}
      <Dialog open={addCardOpen} onOpenChange={(open) => { setAddCardOpen(open); if (!open && !cards.length) setActiveDeck(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Card</DialogTitle></DialogHeader>
          <Textarea placeholder="Front (question)" value={newFront} onChange={e => setNewFront(e.target.value)} />
          <Textarea placeholder="Back (answer)" value={newBack} onChange={e => setNewBack(e.target.value)} />
          <Button onClick={addCard}>Add Card</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SpacedRepetitionPage;
