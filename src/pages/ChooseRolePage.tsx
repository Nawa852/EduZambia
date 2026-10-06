import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { 
  GraduationCap, BookOpen, Users, School, Building2,
  Stethoscope, Rocket, Code, Wrench, Shield, CheckCircle2, ArrowRight, ArrowLeft, Sparkles
} from 'lucide-react';
import synapseLogo from '@/assets/synapse-logo.png';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

const roles: { value: AppRole; label: string; icon: React.ElementType; description: string; color: string; home: string; goals: string[]; comingSoon?: boolean }[] = [
  { value: 'student', label: 'Student', icon: GraduationCap, description: 'Learn with AI tutors & ECZ resources', color: 'from-blue-500 to-indigo-600', home: '/dashboard', goals: ['Pass ECZ exams', 'Daily AI tutoring', 'Catch up on subjects', 'Just exploring'] },
  { value: 'teacher', label: 'Teacher', icon: BookOpen, description: 'Create courses & manage students', color: 'from-emerald-500 to-teal-600', home: '/teacher', goals: ['Plan ECZ lessons with AI', 'Grade faster', 'Track my classes', 'Engage parents'] },
  { value: 'guardian', label: 'Parent / Guardian', icon: Users, description: "Track your child's progress", color: 'from-orange-500 to-amber-600', home: '/family', goals: ["Monitor my child's progress", 'Talk to teachers', 'Limit screen time', 'Help with homework'] },
  { value: 'institution', label: 'School Admin', icon: School, description: 'Manage your institution', color: 'from-slate-500 to-gray-600', home: '/admin', goals: ['Manage students', 'Track teachers', 'School analytics', 'Communications'] },
  { value: 'ministry', label: 'Ministry / NGO', icon: Building2, description: 'Oversee education programs', color: 'from-green-500 to-emerald-600', home: '/ministry', goals: ['Policy tracking', 'School registry', 'Interventions', 'Donor impact'], comingSoon: true },
];

const ChooseRolePage = () => {
  const [selected, setSelected] = useState<AppRole>('student');
  const [goal, setGoal] = useState<string>('');
  const [displayName, setDisplayName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) navigate('/auth', { replace: true });
    else if (user.user_metadata?.full_name) setDisplayName(user.user_metadata.full_name);
  }, [user, navigate]);

  const activeRole = roles.find(r => r.value === selected) ?? roles[0];

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: selected,
          full_name: displayName || user.user_metadata?.full_name || null,
          study_goals: goal || null,
          preferred_language: localStorage.getItem('synapse-lang') || 'English',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      if (error) throw error;

      // CRITICAL: bust the profile cache so RoleGuard / PostLoginGate
      // don't read a stale 'student' role on the destination route.
      try { localStorage.removeItem('edu-zambia-profile-cache'); } catch {}
      localStorage.setItem('edu-zambia-user-type', selected);
      if (goal) localStorage.setItem('synapse-primary-goal', goal);
      localStorage.removeItem('edu-zambia-needs-role');
      localStorage.removeItem('edu-zambia-show-tour');

      toast({ title: `Welcome to Synapse${displayName ? `, ${displayName.split(' ')[0]}` : ''}!`, description: `Heading to your ${activeRole.label} workspace.` });

      // Hard reload so every hook (useProfile, RoleGuard, sidebar) picks up
      // the new role from the DB instead of the stale in-memory cache.
      window.location.replace(activeRole.home);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center px-5 py-12">
      <form className="w-full max-w-lg space-y-8" onSubmit={event => { event.preventDefault(); void handleFinish(); }}>
        <header className="space-y-3">
          <img src={synapseLogo} alt="Synapse" className="w-12 h-12 rounded-lg" />
          <h1 className="text-3xl font-semibold">Your Synapse workspace</h1>
        </header>
        <div className="space-y-2">
          <Label htmlFor="displayName">Name</Label>
          <Input required id="displayName" autoComplete="name" placeholder="Your name" value={displayName} onChange={event => setDisplayName(event.target.value)} className="h-12 bg-card" />
        </div>
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium mb-3">Account type</legend>
          <div className="grid grid-cols-2 gap-3">
            {roles.filter(role => !role.comingSoon).map(role => (
              <Button key={role.value} type="button" variant="outline" aria-pressed={selected === role.value} onClick={() => setSelected(role.value)} className={`h-20 flex-col whitespace-normal text-center ${selected === role.value ? 'border-primary bg-accent text-primary' : 'bg-card text-foreground'}`}>
                <role.icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                <span>{role.label}</span>
              </Button>
            ))}
          </div>
        </fieldset>
        <Button type="submit" size="lg" className="w-full rounded-full" disabled={loading || !displayName.trim()}>
          {loading ? 'Opening…' : 'Open workspace'} <ArrowRight aria-hidden="true" />
        </Button>
      </form>
    </div>
  );
};

export default ChooseRolePage;
