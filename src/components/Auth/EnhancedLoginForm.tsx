import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Eye, EyeOff, Sparkles, Lock, Mail, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface EnhancedLoginFormProps {
  onSuccess?: () => void;
}

const EnhancedLoginForm = ({ onSuccess }: EnhancedLoginFormProps) => {
  const navigate = useNavigate();
  const { signInWithEmail, resendVerification } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    setIsLoading(true);
    setNeedsVerification(false);
    try {
      await signInWithEmail(email, password);
      navigate('/dashboard');
      onSuccess?.();
    } catch (error: any) {
      const msg = (error?.message || '').toLowerCase();
      if (msg.includes('not confirmed') || msg.includes('confirm')) {
        setNeedsVerification(true);
      }
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) { toast.error('Enter your email first'); return; }
    await resendVerification(email);
  };

  const handleQuickLogin = () => {
    const demoUser = {
      id: 'demo_user',
      email: 'demo@eduzambia.com',
      full_name: 'Demo Student',
      user_type: 'student',
    };
    localStorage.setItem('edu-zambia-current-user', JSON.stringify(demoUser));
    toast.success("Welcome to Synapse!");
    navigate('/dashboard');
  };


  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Button 
          type="button"
          onClick={handleQuickLogin}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-card transition-all"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Quick Demo Login
        </Button>
      </motion.div>

      <motion.div className="relative" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground font-medium">Or sign in with credentials</span>
        </div>
      </motion.div>

      <form onSubmit={onSubmit} className="space-y-4">
        <motion.div className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <Label htmlFor="email" className="flex items-center gap-2 font-semibold">
            <Mail className="w-4 h-4 text-primary" />
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="border-input focus:ring-ring transition-all"
          />
        </motion.div>
        
        <motion.div className="space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.3 }}>
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="flex items-center gap-2 font-semibold">
              <Lock className="w-4 h-4 text-primary" />
              Password
            </Label>
            <a 
              href="/password-reset"
              className="text-xs text-primary hover:text-primary/80 font-medium underline transition-colors flex items-center gap-1"
            >
              <HelpCircle className="w-3 h-3" />
              Forgot?
            </a>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="border-input focus:ring-ring transition-all pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground hover:text-primary"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </motion.div>
        
        {needsVerification && (
          <div className="rounded-md border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm space-y-2">
            <p className="font-medium text-foreground">Your email isn't verified yet.</p>
            <p className="text-xs text-muted-foreground">Click the link in your inbox, or resend it below.</p>
            <Button type="button" size="sm" variant="outline" onClick={handleResend} className="w-full">
              Resend verification email
            </Button>
          </div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.4 }}>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-card transition-all" disabled={isLoading}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>
        </motion.div>
      </form>

    </div>
  );
};

export default EnhancedLoginForm;
