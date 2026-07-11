import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { 
  Mail, Lock, User, Eye, EyeOff, Sparkles, ArrowRight, CheckCircle2
} from 'lucide-react';
import { z } from 'zod';
import { lovable } from '@/integrations/lovable';
import eduLogo from '@/assets/edu-zambia-logo-new.png';
import eduIcon from '@/assets/edu-zambia-icon.png';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState(searchParams.get('mode') === 'signup' ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if user has a role set
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (!profile?.role || profile.role === 'student') {
          // Check if they came from signup (no role chosen yet)
          const needsRole = localStorage.getItem('edu-zambia-needs-role');
          if (needsRole === 'true') {
            navigate('/choose-role', { replace: true });
            return;
          }
        }
        navigate('/dashboard', { replace: true });
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === 'SIGNED_IN') {
        const needsRole = localStorage.getItem('edu-zambia-needs-role');
        if (needsRole === 'true') {
          navigate('/choose-role', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try { emailSchema.parse(email); } catch {
      toast({ title: 'Invalid email', variant: 'destructive' }); return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      localStorage.removeItem('edu-zambia-needs-role');
      toast({ title: 'Welcome back!' });
    } catch (error: any) {
      toast({ title: 'Sign in failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try { emailSchema.parse(email); } catch {
      toast({ title: 'Invalid email', variant: 'destructive' }); return;
    }
    try { passwordSchema.parse(password); } catch {
      toast({ title: 'Weak password', description: 'At least 8 characters', variant: 'destructive' }); return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: 'destructive' }); return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/choose-role`,
          data: { full_name: fullName, user_type: 'student' }
        }
      });
      if (error) throw error;
      localStorage.setItem('edu-zambia-needs-role', 'true');
      toast({ title: 'Account created!', description: 'Please check your email to verify, then choose your role.' });
    } catch (error: any) {
      toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({ title: 'Enter your email first', variant: 'destructive' }); return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/password-reset`,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Reset email sent!', description: 'Check your inbox.' });
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      localStorage.setItem('edu-zambia-needs-role', 'true');
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      if ((result as any)?.error) {
        toast({ title: 'Google sign-in failed', description: (result as any).error.message, variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: 'Google sign-in failed', description: e?.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 p-12 text-primary-foreground">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}} />
        <div className="relative z-10 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm overflow-hidden">
                <img src={eduIcon} alt="Nexus Learning" className="w-9 h-9" />
              </div>
              <span className="text-2xl font-bold">Edu Zambia</span>
            </div>
            <h1 className="text-4xl font-bold mb-4">AI-Powered Learning</h1>
            <p className="text-lg opacity-90">Smart education for students, teachers, parents, and institutions across Zambia.</p>
          </div>
          <div className="space-y-3">
            {['Create your account in seconds', 'Choose your role & get a personalized dashboard', 'AI tutors, quizzes & ECZ resources', 'Connect with teachers, parents & peers'].map((f, i) => (
              <motion.div key={f} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-300 shrink-0" />
                <span className="text-sm">{f}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Card className="border-0 shadow-2xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4 w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg lg:hidden overflow-hidden">
                <img src={eduIcon} alt="Nexus Learning" className="w-10 h-10" />
              </div>
              <CardTitle className="text-2xl font-bold">
                {activeTab === 'login' ? 'Welcome Back' : 'Create Your Account'}
              </CardTitle>
              <CardDescription>
                {activeTab === 'login' ? 'Sign in to continue' : 'Sign up first, then choose your role'}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogle}
                  disabled={loading}
                  className="w-full h-11 mb-4 gap-3 font-medium border-border/70 hover:bg-secondary/60"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/>
                  </svg>
                  Continue with Google
                </Button>

                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center"><span className="bg-card px-2 text-xs text-muted-foreground">or with email</span></div>
                </div>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="login-email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-10" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Password</Label>
                        <button type="button" onClick={handleForgotPassword} className="text-xs text-primary hover:underline">Forgot password?</button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="login-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="pl-10 pr-10" required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Signing in...' : 'Sign In'} <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="fullName" type="text" placeholder="Your full name" value={fullName} onChange={e => setFullName(e.target.value)} className="pl-10" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="signup-email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-10" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="signup-password" type={showPassword ? 'text' : 'password'} placeholder="Min 8 characters" value={password} onChange={e => setPassword(e.target.value)} className="pl-10 pr-10" required />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="pl-10" required />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Creating...' : 'Create Account'} <Sparkles className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
