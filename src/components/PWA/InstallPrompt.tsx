import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import loadingLogo from "@/assets/loading-logo.svg";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const dismissedAt = localStorage.getItem("pwa-install-dismissed");
    if (dismissedAt) {
      const hours = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60);
      if (hours < 24) {
        setDismissed(true);
      } else {
        localStorage.removeItem("pwa-install-dismissed");
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!dismissed) setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // For iOS — show custom prompt after short delay
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS && !dismissed) {
      setTimeout(() => setShowPrompt(true), 3000);
    }

    const installedHandler = () => setIsInstalled(true);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, [dismissed]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (isInstalled || !showPrompt) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.9 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-4 left-4 right-4 z-[9999] md:left-auto md:right-6 md:max-w-sm"
      >
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-2xl">
          {/* Gradient top bar */}
          <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary" />

          <div className="p-5">
            {/* Close */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-4">
              {/* Logo */}
              <motion.div
                className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/10 flex items-center justify-center"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <img src={loadingLogo} alt="Nexus Learning" className="w-10 h-10" />
              </motion.div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-base">
                  Install Edu Zambia
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Get the full app experience — faster access, offline learning & instant notifications.
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              {isIOS ? (
                <div className="w-full text-center">
                  <p className="text-xs text-muted-foreground mb-2">
                    Tap <span className="inline-flex items-center gap-1 text-primary font-medium">
                      <Smartphone className="h-3 w-3" /> Share
                    </span> then <span className="font-medium text-primary">"Add to Home Screen"</span>
                  </p>
                  <Button variant="outline" size="sm" onClick={handleDismiss} className="w-full">
                    Got it
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    onClick={handleInstall}
                    className="flex-1 bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold gap-2 shadow-lg"
                  >
                    <Download className="h-4 w-4" />
                    Install App
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDismiss} className="text-muted-foreground">
                    Later
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
