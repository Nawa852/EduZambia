import React, { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/components/Auth/AuthProvider';
import ForgotPasswordForm from '@/components/Auth/ForgotPasswordForm';
import ResetPasswordForm from '@/components/Auth/ResetPasswordForm';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { BookOpenCheck, Sparkles, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { LogoLoader } from '@/components/UI/LogoLoader';

const PasswordResetPage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background">
        <LogoLoader size="lg" text="Loading..." />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // If we have a reset token, show the reset form
  const hasResetToken = searchParams.has('token') || searchParams.has('email');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background glow elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />

      {/* Theme Switcher */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeSwitcher />
      </div>

      <div className="w-full max-w-2xl mx-auto relative z-10">
        <Card className="overflow-hidden shadow-2xl glow-border rounded-2xl bg-gradient-card backdrop-blur-xl border border-primary/20">
          {/* Main Content */}
          <motion.div
            className="p-8 lg:p-12 bg-gradient-card/50 glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header */}
            <motion.div
              className="text-center mb-8 space-y-3"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center glow-primary">
                  <BookOpenCheck size={24} className="text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Synapse</h1>
                </div>
              </div>
            </motion.div>

            {/* Form Content */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {hasResetToken ? (
                <ResetPasswordForm
                  onBack={() => {
                    setShowForgotPassword(false);
                    navigate('/auth');
                  }}
                />
              ) : showForgotPassword ? (
                <ForgotPasswordForm
                  onBack={() => setShowForgotPassword(false)}
                  onSuccess={() => {
                    setTimeout(() => {
                      navigate('/auth');
                    }, 3000);
                  }}
                />
              ) : (
                <motion.div
                  className="space-y-6 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="space-y-2">
                    <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      Password Recovery
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      Forgot your password? We'll help you get back into your account.
                    </p>
                  </div>

                  <motion.button
                    onClick={() => setShowForgotPassword(true)}
                    className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold py-3 rounded-lg shadow-lg glow-primary hover:opacity-90 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Zap className="w-4 h-4 mr-2 inline" />
                    Send Password Reset Link
                  </motion.button>

                  <motion.button
                    onClick={() => navigate('/auth')}
                    className="w-full border border-primary/30 text-foreground font-semibold py-3 rounded-lg glass-card hover:glow-border hover:border-primary/60 transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Back to Sign In
                  </motion.button>

                  <motion.div
                    className="pt-4 border-t border-primary/20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                  >
                    <p className="text-xs text-muted-foreground">
                      <Sparkles className="w-3 h-3 mr-1 inline text-primary" />
                      We'll send you a secure link to reset your password in minutes.
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </motion.div>

            {/* Footer */}
            <motion.div
              className="text-xs text-muted-foreground text-center pt-8 border-t border-primary/20 mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              © 2025 Synapse. Empowering Zambian students with AI-driven education.
            </motion.div>
          </motion.div>
        </Card>
      </div>
    </div>
  );
};

export default PasswordResetPage;
