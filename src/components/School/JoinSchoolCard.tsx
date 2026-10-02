import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { School as SchoolIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSchool } from '@/hooks/useSchool';
import { toast } from 'sonner';

/** Teachers enter the staff code, learners the school code. Hidden once joined. */
export const JoinSchoolCard: React.FC = () => {
  const { school, loading, refresh } = useSchool();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  if (loading || school) return null;

  const join = async () => {
    if (!code.trim()) return;
    setBusy(true);
    const { error } = await (supabase as any).rpc('join_school_with_code', { _code: code });
    setBusy(false);
    if (error) { toast.error(error.message.includes('invalid') ? 'That code was not recognised' : error.message); return; }
    toast.success('You joined your school');
    setCode('');
    refresh();
  };

  return (
    <Card className="flex flex-wrap items-center gap-3 rounded-2xl border-border/50 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><SchoolIcon className="h-5 w-5" /></div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">Join your school</div>
        <div className="text-xs text-muted-foreground">Enter the code your school gave you.</div>
      </div>
      <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="CODE" className="h-9 w-32 rounded-full font-mono" />
      <Button size="sm" className="rounded-full" onClick={join} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Join'}</Button>
    </Card>
  );
};

export default JoinSchoolCard;
