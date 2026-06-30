import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, BookOpen, Users, School, Building2,
  Stethoscope, Rocket, Code, Wrench, Shield, CheckCircle2, ArrowRight, ArrowLeft, Sparkles
} from 'lucide-react';
import synapseLogo from '@/assets/synapse-logo.png';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

const roles: { value: AppRole; label: string; icon: React.ElementType; description: string; color: string; home: string; goals: string[] }[] = [
  { value: 'student', label: 'Student', icon: GraduationCap, description: 'Learn with AI tutors & ECZ resources', color: 'from-blue-500 to-indigo-600', home: '/dashboard', goals: ['Pass ECZ exams', 'Daily AI tutoring', 'Catch up on subjects', 'Just exploring'] },
  { value: 'teacher', label: 'Teacher', icon: BookOpen, description: 'Create courses & manage students', color: 'from-emerald-500 to-teal-600', home: '/teacher', goals: ['Plan ECZ lessons with AI', 'Grade faster', 'Track my classes', 'Engage parents'] },
  { value: 'guardian', label: 'Parent / Guardian', icon: Users, description: "Track your child's progress", color: 'from-orange-500 to-amber-600', home: '/family', goals: ["Monitor my child's progress", 'Talk to teachers', 'Limit screen time', 'Help with homework'] },
  { value: 'doctor', label: 'Medical Student', icon: Stethoscope, description: 'Clinical cases & rotations', color: 'from-rose-500 to-pink-600', home: '/medical', goals: ['Clinical case practice', 'Drug reference', 'Track rotations', 'Exam prep'] },
  { value: 'entrepreneur', label: 'Entrepreneur', icon: Rocket, description: 'Business tools & venture tracking', color: 'from-purple-500 to-violet-600', home: '/entrepreneur', goals: ['Build a business plan', 'Find funding', 'Market research', 'Pitch deck'] },
  { value: 'developer', label: 'Developer', icon: Code, description: 'Code challenges & project builder', color: 'from-cyan-500 to-blue-600', home: '/developer', goals: ['Practice coding', 'AI code review', 'Build a portfolio', 'Hackathons'] },
  { value: 'skills', label: 'Skills Training', icon: Wrench, description: 'Vocational & trade skills', color: 'from-yellow-500 to-orange-600', home: '/dashboard', goals: ['Learn a trade', 'Get certified', 'Find work', 'Upskill'] },
  { value: 'cybersecurity', label: 'Cybersecurity', icon: Shield, description: 'Ethical hacking & CTF labs', color: 'from-red-500 to-rose-600', home: '/cybersecurity', goals: ['CTF challenges', 'SOC simulator', 'Skill tree', 'Career prep'] },
  { value: 'institution', label: 'School Admin', icon: School, description: 'Manage your institution', color: 'from-slate-500 to-gray-600', home: '/admin', goals: ['Manage students', 'Track teachers', 'School analytics', 'Communications'] },
  { value: 'ministry', label: 'Ministry / NGO', icon: Building2, description: 'Oversee education programs', color: 'from-green-500 to-emerald-600', home: '/ministry', goals: ['Policy tracking', 'School registry', 'Interventions', 'Donor impact'] },
];

const ChooseRolePage = () => {
  const [selected, setSelected] = useState<AppRole>('student');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) navigate('/auth', { replace: true });
  }, [user, navigate]);

  const handleContinue = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: selected, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      
      if (error) throw error;
      
      localStorage.setItem('edu-zambia-user-type', selected);
      localStorage.removeItem('edu-zambia-needs-role');
      localStorage.setItem('edu-zambia-show-tour', 'true');
      toast({ title: 'Role set!', description: `Welcome as ${roles.find(r => r.value === selected)?.label}` });
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">How will you use Edu Zambia?</CardTitle>
            <CardDescription>Choose your role to get a personalized experience. You can change this later in settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {roles.map((role, i) => (
                <motion.button
                  key={role.value}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  type="button"
                  onClick={() => setSelected(role.value)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    selected === role.value
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/40 hover:bg-accent/30'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${role.color} flex items-center justify-center shrink-0`}>
                    <role.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{role.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{role.description}</p>
                  </div>
                  {selected === role.value && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                </motion.button>
              ))}
            </div>
            <Button onClick={handleContinue} className="w-full" size="lg" disabled={loading}>
              {loading ? 'Setting up...' : 'Continue to Dashboard'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ChooseRolePage;
