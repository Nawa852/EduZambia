import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Smartphone, Bell, Moon, Clock, Shield, CheckCircle2,
  ChevronRight, Download, AlertTriangle, Wifi
} from 'lucide-react';

interface DeviceSetupWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

const steps = [
  { id: 'install', icon: Download, title: 'Install the App', color: 'text-primary' },
  { id: 'notifications', icon: Bell, title: 'Enable Notifications', color: 'text-yellow-500' },
  { id: 'dnd', icon: Moon, title: 'Do Not Disturb', color: 'text-purple-500' },
  { id: 'social', icon: Shield, title: 'Block Distractions', color: 'text-red-500' },
];

export const DeviceSetupWizard = ({ onComplete, onSkip }: DeviceSetupWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  const markDone = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleNotificationPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      if (result === 'granted') markDone();
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Install
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Smartphone className="w-16 h-16 text-primary mx-auto" />
              <h2 className="text-2xl font-bold">Install Synapse</h2>
              <p className="text-muted-foreground">Install the app on your home screen for the best experience</p>
            </div>

            <Card className="bg-muted/30">
              <CardContent className="p-6 space-y-4">
                {isIOS ? (
                  <>
                    <h3 className="font-semibold">iPhone / iPad Instructions:</h3>
                    <ol className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex gap-3"><Badge variant="secondary" className="shrink-0">1</Badge>Tap the <strong>Share</strong> button (square with arrow) at the bottom of Safari</li>
                      <li className="flex gap-3"><Badge variant="secondary" className="shrink-0">2</Badge>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                      <li className="flex gap-3"><Badge variant="secondary" className="shrink-0">3</Badge>Tap <strong>"Add"</strong> to install</li>
                    </ol>
                  </>
                ) : isAndroid ? (
                  <>
                    <h3 className="font-semibold">Android Instructions:</h3>
                    <ol className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex gap-3"><Badge variant="secondary" className="shrink-0">1</Badge>Tap the <strong>three dots menu</strong> (⋮) in your browser</li>
                      <li className="flex gap-3"><Badge variant="secondary" className="shrink-0">2</Badge>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></li>
                      <li className="flex gap-3"><Badge variant="secondary" className="shrink-0">3</Badge>Tap <strong>"Install"</strong> to confirm</li>
                    </ol>
                  </>
                ) : (
                  <>
                    <h3 className="font-semibold">Desktop Instructions:</h3>
                    <p className="text-sm text-muted-foreground">Look for the install icon in your browser's address bar, or use the browser menu to install this app.</p>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3 justify-center">
              <Button onClick={markDone} size="lg">
                <CheckCircle2 className="w-5 h-5 mr-2" />Done, Next Step
              </Button>
            </div>
          </div>
        );

      case 1: // Notifications
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Bell className="w-16 h-16 text-yellow-500 mx-auto" />
              <h2 className="text-2xl font-bold">Enable Notifications</h2>
              <p className="text-muted-foreground">Get study reminders and session alerts so you never miss study time</p>
            </div>

            <Card className="bg-muted/30">
              <CardContent className="p-6 space-y-4">
                <p className="text-sm text-muted-foreground">Notifications help you:</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" />Get reminded when your scheduled study time starts</li>
                  <li className="flex items-center gap-2"><Bell className="w-4 h-4 text-primary" />Hear alarms when focus sessions end</li>
                  <li className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-primary" />Receive alerts about new assignments</li>
                </ul>
              </CardContent>
            </Card>

            <div className="flex gap-3 justify-center">
              {'Notification' in window && Notification.permission !== 'granted' ? (
                <Button onClick={handleNotificationPermission} size="lg">
                  <Bell className="w-5 h-5 mr-2" />Allow Notifications
                </Button>
              ) : (
                <Button onClick={markDone} size="lg">
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  {Notification.permission === 'granted' ? 'Already Enabled! Next' : 'Done, Next Step'}
                </Button>
              )}
            </div>
          </div>
        );

      case 2: // DND
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Moon className="w-16 h-16 text-purple-500 mx-auto" />
              <h2 className="text-2xl font-bold">Set Up Do Not Disturb</h2>
              <p className="text-muted-foreground">Silence other apps during study time to stay focused</p>
            </div>

            <Card className="bg-muted/30">
              <CardContent className="p-6 space-y-4">
                {isIOS ? (
                  <>
                    <h3 className="font-semibold">iPhone / iPad:</h3>
                    <ol className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex gap-3"><Badge variant="secondary" className="shrink-0">1</Badge>Open <strong>Settings → Focus</strong></li>
                      <li className="flex gap-3"><Badge variant="secondary" className="shrink-0">2</Badge>Create a new Focus called <strong>"Study"</strong></li>
                      <li className="flex gap-3"><Badge variant="secondary" className="shrink-0">3</Badge>Allow only <strong>Synapse</strong> notifications</li>
                      <li className="flex gap-3"><Badge variant="secondary" className="shrink-0">4</Badge>Set a <strong>schedule</strong> matching your study hours</li>
                    </ol>
                  </>
                ) : (
                  <>
                    <h3 className="font-semibold">Android:</h3>
                    <ol className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex gap-3"><Badge variant="secondary" className="shrink-0">1</Badge>Open <strong>Settings → Sound → Do Not Disturb</strong></li>
                      <li className="flex gap-3"><Badge variant="secondary" className="shrink-0">2</Badge>Create a <strong>schedule</strong> for your study hours</li>
                      <li className="flex gap-3"><Badge variant="secondary" className="shrink-0">3</Badge>Under exceptions, allow only <strong>Synapse</strong></li>
                    </ol>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3 justify-center">
              <Button onClick={markDone} size="lg">
                <CheckCircle2 className="w-5 h-5 mr-2" />Done, Next Step
              </Button>
            </div>
          </div>
        );

      case 3: // Social media blocking
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Shield className="w-16 h-16 text-red-500 mx-auto" />
              <h2 className="text-2xl font-bold">Block Distracting Apps</h2>
              <p className="text-muted-foreground">Limit social media during study hours for maximum focus</p>
            </div>

            <Card className="bg-muted/30">
              <CardContent className="p-6 space-y-4">
                {isIOS ? (
                  <>
                    <h3 className="font-semibold">iPhone / iPad — Screen Time:</h3>
                    <ol className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex gap-3"><Badge variant="secondary" className="shrink-0">1</Badge>Go to <strong>Settings → Screen Time → App Limits</strong></li>
                      <li className="flex gap-3"><Badge variant="secondary" className="shrink-0">2</Badge>Tap <strong>"Add Limit"</strong> → select <strong>Social</strong> category</li>
                      <li className="flex gap-3"><Badge variant="secondary" className="shrink-0">3</Badge>Set limit to <strong>15 minutes</strong> during study days</li>
                      <li className="flex gap-3"><Badge variant="secondary" className="shrink-0">4</Badge>Enable <strong>"Block at End of Limit"</strong></li>
                    </ol>
                    <p className="text-xs text-muted-foreground mt-2">💡 Ask a parent/guardian to set the Screen Time passcode so you can't override it!</p>
                  </>
                ) : (
                  <>
                    <h3 className="font-semibold">Android — Digital Wellbeing:</h3>
                    <ol className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex gap-3"><Badge variant="secondary" className="shrink-0">1</Badge>Go to <strong>Settings → Digital Wellbeing</strong></li>
                      <li className="flex gap-3"><Badge variant="secondary" className="shrink-0">2</Badge>Tap on <strong>WhatsApp, TikTok, Instagram</strong> etc.</li>
                      <li className="flex gap-3"><Badge variant="secondary" className="shrink-0">3</Badge>Set <strong>App timers</strong> to 15 minutes per day</li>
                      <li className="flex gap-3"><Badge variant="secondary" className="shrink-0">4</Badge>Enable <strong>Focus Mode</strong> and add study apps only</li>
                    </ol>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4 flex items-start gap-3">
                <Wifi className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Pro Tip: Offline Mode</p>
                  <p className="text-xs text-muted-foreground">Turn off Wi-Fi/data during study sessions. The app works offline and syncs when you reconnect!</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3 justify-center">
              <Button onClick={markDone} size="lg" className="bg-gradient-to-r from-primary to-accent">
                <CheckCircle2 className="w-5 h-5 mr-2" />Complete Setup 🎉
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2 mb-4">
        <h1 className="text-3xl font-bold">📱 Device Setup</h1>
        <p className="text-muted-foreground">Prepare your device for distraction-free studying</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {steps.map((step, i) => (
          <div key={step.id} className="flex-1 flex items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              completedSteps.has(i) ? 'bg-primary text-primary-foreground' :
              i === currentStep ? 'bg-primary/20 text-primary border-2 border-primary' :
              'bg-muted text-muted-foreground'
            }`}>
              {completedSteps.has(i) ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 ${completedSteps.has(i) ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>

      <div className="text-center">
        <Button variant="ghost" size="sm" onClick={onSkip} className="text-muted-foreground">
          Skip device setup (not recommended)
        </Button>
      </div>
    </div>
  );
};
