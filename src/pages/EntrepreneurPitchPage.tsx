import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Presentation, Sparkles, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function EntrepreneurPitchPage() {
  const qc = useQueryClient();
  const [input, setInput] = useState({ ventureName: '', problem: '', solution: '', market: '', model: '' });
  const [deck, setDeck] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const { data: saved = [] } = useQuery({
    queryKey: ['pitch-decks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pitch_decks').select('*').order('created_at', { ascending: false }).limit(10);
      if (error) throw error;
      return data;
    },
  });

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('pitch-deck-generator', { body: input });
      if (error) throw error;
      setDeck(data);
      toast.success('Pitch deck generated');
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const save = async () => {
    if (!deck) return;
    const { data: user } = await supabase.auth.getUser();
    const { error } = await supabase.from('pitch_decks').insert({
      user_id: user.user!.id, title: input.ventureName || 'Pitch Deck', slides: deck,
    } as any);
    if (error) toast.error(error.message);
    else { toast.success('Deck saved'); qc.invalidateQueries({ queryKey: ['pitch-decks'] }); }
  };

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Presentation className="w-5 h-5" /></div>
        <div><h1 className="text-2xl font-bold">AI Pitch Deck Builder</h1><p className="text-sm text-muted-foreground">Generate investor-ready decks in minutes</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card><CardHeader><CardTitle>Venture details</CardTitle></CardHeader><CardContent className="space-y-3">
          <div><Label>Venture name</Label><Input value={input.ventureName} onChange={(e) => setInput({ ...input, ventureName: e.target.value })} /></div>
          <div><Label>Problem</Label><Textarea rows={2} value={input.problem} onChange={(e) => setInput({ ...input, problem: e.target.value })} /></div>
          <div><Label>Solution</Label><Textarea rows={2} value={input.solution} onChange={(e) => setInput({ ...input, solution: e.target.value })} /></div>
          <div><Label>Market</Label><Textarea rows={2} value={input.market} onChange={(e) => setInput({ ...input, market: e.target.value })} /></div>
          <div><Label>Business model</Label><Textarea rows={2} value={input.model} onChange={(e) => setInput({ ...input, model: e.target.value })} /></div>
          <Button className="w-full" onClick={generate} disabled={loading || !input.ventureName}>
            <Sparkles className="w-4 h-4 mr-2" />{loading ? 'Generating…' : 'Generate deck'}
          </Button>
        </CardContent></Card>

        <Card><CardHeader className="flex-row items-center justify-between"><CardTitle>Preview</CardTitle>
          {deck && <Button size="sm" variant="outline" onClick={save}><Save className="w-4 h-4 mr-1" />Save</Button>}
        </CardHeader><CardContent>
          {!deck ? <p className="text-sm text-muted-foreground text-center py-12">Deck preview will appear here</p> : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              <pre className="text-xs bg-muted p-3 rounded whitespace-pre-wrap">{typeof deck === 'string' ? deck : JSON.stringify(deck, null, 2)}</pre>
            </div>
          )}
        </CardContent></Card>
      </div>

      {saved.length > 0 && (
        <Card><CardHeader><CardTitle>Recent decks</CardTitle></CardHeader><CardContent>
          <div className="space-y-2">
            {saved.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div><div className="font-medium">{d.title}</div><div className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</div></div>
              </div>
            ))}
          </div>
        </CardContent></Card>
      )}
    </div>
  );
}
