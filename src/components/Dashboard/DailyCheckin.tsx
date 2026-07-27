import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const MOODS = [
  { emoji: '😊', label: 'Great', value: 'great' },
  { emoji: '🙂', label: 'Good', value: 'good' },
  { emoji: '😐', label: 'Okay', value: 'okay' },
  { emoji: '😔', label: 'Low', value: 'low' },
  { emoji: '😰', label: 'Stressed', value: 'stressed' },
];

export const DailyCheckin = () => {
  const { user } = useAuth();
  const [checkedIn, setCheckedIn] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const checkToday = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('daily_checkins')
        .select('id')
        .eq('user_id', user.id)
        .eq('checkin_date', today)
        .maybeSingle();
      if (data) setCheckedIn(true);
      setLoading(false);
    };
    checkToday();
  }, [user]);

  const handleSubmit = async () => {
    if (!user || !selectedMood) return;
    const today = new Date().toISOString().split('T')[0];
    const { error } = await supabase.from('daily_checkins').insert({
      user_id: user.id,
      mood: selectedMood,
      note: note || null,
      checkin_date: today,
    });
    if (error) {
      toast.error('Could not save check-in');
      return;
    }
    setCheckedIn(true);
    toast.success('Check-in saved! Keep it up 💪');
  };

  if (loading || checkedIn) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-foreground mb-3">How are you feeling today?</p>
            <div className="flex gap-2 mb-3">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setSelectedMood(m.value)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                    selectedMood === m.value
                      ? 'bg-primary/20 ring-2 ring-primary scale-110'
                      : 'hover:bg-muted'
                  }`}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-[10px] text-muted-foreground">{m.label}</span>
                </button>
              ))}
            </div>
            {selectedMood && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                <Input
                  placeholder="Quick note (optional)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="text-sm h-9"
                />
                <Button size="sm" onClick={handleSubmit}>
                  Save
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};
