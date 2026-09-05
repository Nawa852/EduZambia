import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, Heart, BarChart3, ShieldCheck, Loader2 } from 'lucide-react';
import eduIcon from '@/assets/brandLogo';

export const PARENT_INVITE_KEY = 'synapse.parent.invite';

/**
 * A parent's own front door. Separate from the learner sign-in so a
 * mum or dad never has to borrow their child's account.
 */
const ParentAuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'signup'>(params.get('mode') === 'signup' ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [busy, setBusy] = useState(false);

  const invite = params.get('invite') || localStorage.getItem(PARENT_INVITE_KEY) || '';

  useEffect(() => {
    if (params.get('invite')) localStorage.setItem(PARENT_INVITE_KEY, params.get('invite')!);
  }, [params]);

  /** After a parent is authenticated: make them a guardian, redeem any invite, go home. */
  const finish = async (userId: string, name?: string) => {
    await supabase.from('profiles').upsert(
      { id: userId, role: 'guardian', ...(name ? { full_name: name } : {}) },
      { onConflict: 'id' },
    );
    const code = localStorage.getItem(PARENT_INVITE_KEY);
    if (code) {
      const { error } = await supabase.rpc('redeem_guardian_link_code', { _code: code });
      localStorage.removeItem(PARENT_INVITE_KEY);
      if (error) toast.error(`Invite link: ${error.message}`);
      else toast.success('Your child is now connected to your account.');
    }
    localStorage.removeItem('edu-zambia-needs-role');
    localStorage.removeItem('edu-zambia-profile-cache');
    window.location.replace('/family');
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) finish(data.session.user.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'signup') {
        if (password.length < 8) throw new Error('Password must be at least 8 characters.');
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/parents`,
            data: { full_name: fullName, user_type: 'guardian' },
          },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success('Account created — check your email to confirm, then sign in here.');
          setMode('login');
          return;
        }
        await finish(data.session.user.id, fullName);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await finish(data.user.id);
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Story side */}
      <div className="lg:w-1/2 px-6 py-10 lg:p-14 flex flex-col justify-center bg-primary/5">
        <img src={eduIcon} alt="Synapse" className="w-11 h-11 rounded-xl" />
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] mt-6 max-w-md">
          Synapse for Parents
        </h1>
        <p className="text-muted-foreground mt-3 max-w-md text-[15px]">
          Your own account. See how your child is really doing — study time, quiz scores, homework
          and messages from their teacher — without logging in as them.
        </p>
        <div className="mt-8 space-y-4 max-w-md">
          {[
            { icon: BarChart3, t: 'Honest progress', d: 'Real grades and study time, never made-up numbers.' },
            { icon: Heart, t: 'One account, every child', d: 'Link each child once and switch between them.' },
            { icon: ShieldCheck, t: 'Private and secure', d: 'Only children who accept your link are shared with you.' },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{t}</p>
                <p className="text-[13px] text-muted-foreground">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form side */}
      <div className="lg:w-1/2 flex items-center justify-center px-6 py-12">
        <Card className="w-full max-w-sm rounded-[22px] border-border/60">
          <CardContent className="p-6 sm:p-7">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-primary uppercase tracking-wide">Parent portal</span>
            </div>
            <h2 className="text-xl font-semibold tracking-[-0.02em]">
              {mode === 'login' ? 'Sign in' : 'Create your parent account'}
            </h2>
            {invite && (
              <p className="text-[13px] text-primary mt-2">
                Invite code {invite} will be applied once you sign in.
              </p>
            )}

            <form onSubmit={submit} className="space-y-3 mt-5">
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <Label htmlFor="pname">Your name</Label>
                  <Input id="pname" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="rounded-xl" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="pemail">Email</Label>
                <Input id="pemail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ppass">Password</Label>
                <Input id="ppass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="rounded-xl" />
              </div>
              <Button type="submit" disabled={busy} className="w-full rounded-xl">
                {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {mode === 'login' ? 'Sign in' : 'Create account'}
              </Button>
            </form>

            <button
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-[13px] text-muted-foreground hover:text-foreground mt-4 w-full text-center"
            >
              {mode === 'login' ? "New here? Create a parent account" : 'Already have an account? Sign in'}
            </button>
            <p className="text-[12px] text-muted-foreground text-center mt-4">
              Are you a learner or teacher? <Link to="/auth" className="text-primary">Sign in here</Link>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ParentAuthPage;
