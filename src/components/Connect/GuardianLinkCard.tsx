import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { Link2, Copy, Check, Users, Loader2 } from 'lucide-react';

interface LinkRow {
  id: string;
  status: string;
  guardian_name: string | null;
  relationship: string | null;
  created_at: string;
}

/**
 * Two-sided parent <-> student connection.
 * Students generate a 6-character code; guardians redeem it.
 */
export const GuardianLinkCard: React.FC = () => {
  const { profile } = useProfile();
  const role = (profile?.role || 'student') as string;
  const isGuardian = role === 'guardian';

  const [code, setCode] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [links, setLinks] = useState<LinkRow[]>([]);

  const loadLinks = React.useCallback(async () => {
    if (!profile?.id) return;
    const column = isGuardian ? 'guardian_id' : 'student_id';
    const { data } = await supabase
      .from('guardian_links')
      .select('id, status, guardian_name, relationship, created_at')
      .eq(column, profile.id)
      .order('created_at', { ascending: false })
      .limit(10);
    setLinks((data as LinkRow[]) || []);
  }, [profile?.id, isGuardian]);

  useEffect(() => { loadLinks(); }, [loadLinks]);

  const logActivity = React.useCallback(async (action: string, metadata: Record<string, unknown> = {}) => {
    if (!profile?.id) return;
    await supabase.from('community_activity').insert({
      user_id: profile.id,
      action,
      entity_type: 'guardian_link',
      metadata: metadata as never,
    });
  }, [profile?.id]);

  const generate = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc('create_guardian_link_code');
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setCode(data as string);
    logActivity('guardian_link_code_generated');
    loadLinks();
  };

  const redeem = async () => {
    if (input.trim().length < 4) { toast.error('Enter the 6-character code from your child'); return; }
    setBusy(true);
    const { error } = await supabase.rpc('redeem_guardian_link_code', { _code: input.trim() });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Connected — your child now appears in your dashboard');
    logActivity('guardian_link_redeemed');
    setInput('');
    loadLinks();
  };

  const inviteText = code
    ? `Hi! I'm using Synapse to study for my ECZ exams. Join as my parent/guardian so you can see my progress.\n\nMy invite code: ${code}\n\n1. Open ${window.location.origin}/auth\n2. Sign up as a Parent / Guardian\n3. Enter my code in Family Link.`
    : '';

  const shareWhatsApp = () => {
    if (!code) return;
    logActivity('guardian_invite_shared', { channel: 'whatsapp' });
    window.open(`https://wa.me/?text=${encodeURIComponent(inviteText)}`, '_blank', 'noopener,noreferrer');
  };

  const copy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    logActivity('guardian_invite_shared', { channel: 'copy' });
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Link2 className="w-4 h-4 text-primary" />
          {isGuardian ? 'Connect to your child' : 'Invite your parent or guardian'}
        </CardTitle>
        <CardDescription className="text-xs">
          {isGuardian
            ? 'Ask your child to generate a code in their Synapse profile, then enter it here.'
            : 'Generate a one-time code and share it with your parent. They enter it in their Synapse account.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isGuardian ? (
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              placeholder="e.g. 4KD91A"
              maxLength={6}
              className="font-mono tracking-[0.3em] uppercase"
              aria-label="Guardian link code"
            />
            <Button onClick={redeem} disabled={busy}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Connect'}
            </Button>
          </div>
        ) : code ? (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
            <span className="font-mono text-2xl font-bold tracking-[0.35em]">{code}</span>
            <Button size="sm" variant="outline" onClick={copy} className="ml-auto">
              {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        ) : (
          <Button onClick={generate} disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link2 className="w-4 h-4 mr-2" />}
            Generate invite code
          </Button>
        )}

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> {isGuardian ? 'Linked children' : 'Linked guardians'}
          </p>
          {links.length === 0 ? (
            <p className="text-xs text-muted-foreground">No connections yet.</p>
          ) : (
            links.map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
                <span className="text-sm">{l.guardian_name || 'Pending invite'}</span>
                <Badge variant={l.status === 'accepted' ? 'default' : 'secondary'} className="text-[10px]">
                  {l.status}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GuardianLinkCard;
