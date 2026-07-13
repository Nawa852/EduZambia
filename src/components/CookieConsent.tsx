import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';

const COOKIE_KEY = 'edu-zambia-cookies-accepted';

export const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(COOKIE_KEY);
    if (!accepted) {
      // Auto-accept after showing brief notice
      setVisible(true);
      const timer = setTimeout(() => {
        localStorage.setItem(COOKIE_KEY, new Date().toISOString());
        setVisible(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(COOKIE_KEY, new Date().toISOString());
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.4 }}
            className="fixed bottom-20 left-4 right-4 z-30 md:bottom-4 md:left-auto md:right-6 md:max-w-sm"
        >
          <div className="glass-card border border-border/30 rounded-2xl p-4 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
                <Cookie className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground mb-1">Cookies & Privacy</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We use cookies to enhance your Synapse experience and keep learning tools working smoothly.
                </p>
              </div>
              <button onClick={dismiss} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Auto-accept progress bar */}
            <div className="mt-3 h-0.5 bg-secondary/40 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 4, ease: 'linear' }}
                className="h-full bg-primary/60 rounded-full"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
