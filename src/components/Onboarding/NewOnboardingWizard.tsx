import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  GraduationCap, Building2, Users, ChevronRight, ChevronLeft, 
  Sparkles, Volume2, VolumeX, Check, Palette, Sun, Moon,
  Waves, Sunset, TreePine, MapPin, User, Phone, Mail, Globe
} from "lucide-react";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { toast } from "sonner";

export type UserType = 'student' | 'parent' | 'organisation';
export type OrganisationType = 'school' | 'college' | 'university' | 'training_center';
export type ThemeChoice = 'light' | 'dark' | 'zambian' | 'ocean' | 'sunset' | 'forest';

interface OnboardingData {
  userType: UserType | null;
  organisationType?: OrganisationType;
  fullName: string;
  email: string;
  phone: string;
  age: string;
  grade: string;
  organisationName: string;
  location: string;
  childrenCount: string;
  preferredLanguage: string;
  theme: ThemeChoice;
}

interface NewOnboardingWizardProps {
  onComplete: (data: OnboardingData) => void;
}

const themes: { id: ThemeChoice; name: string; icon: React.ElementType; gradient: string }[] = [
  { id: 'light', name: 'Light', icon: Sun, gradient: 'from-gray-100 to-white' },
  { id: 'dark', name: 'Dark Premium', icon: Moon, gradient: 'from-slate-800 to-slate-900' },
  { id: 'zambian', name: 'Zambian', icon: MapPin, gradient: 'from-orange-500 to-emerald-500' },
  { id: 'ocean', name: 'Ocean', icon: Waves, gradient: 'from-cyan-500 to-blue-500' },
  { id: 'sunset', name: 'Sunset', icon: Sunset, gradient: 'from-orange-500 to-pink-500' },
  { id: 'forest', name: 'Forest', icon: TreePine, gradient: 'from-green-500 to-emerald-600' },
];

const userTypes = [
  { id: 'student' as const, icon: GraduationCap, title: "I am a Student / Pupil", description: "Begin your learning journey with AI-powered education" },
  { id: 'parent' as const, icon: Users, title: "I am a Parent / Guardian", description: "Monitor and support your child's education" },
  { id: 'organisation' as const, icon: Building2, title: "I am an Organisation", description: "Schools, Colleges, Universities & Training Centers" },
];

const organisationTypes = [
  { id: 'school' as const, name: 'Primary/Secondary School', icon: '🏫' },
  { id: 'college' as const, name: 'College', icon: '🎓' },
  { id: 'university' as const, name: 'University', icon: '🏛️' },
  { id: 'training_center' as const, name: 'Training Center', icon: '📚' },
];

export const NewOnboardingWizard = ({ onComplete }: NewOnboardingWizardProps) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({
    userType: null, fullName: '', email: '', phone: '', age: '', grade: '',
    organisationName: '', location: '', childrenCount: '', preferredLanguage: 'English', theme: 'dark',
  });

  const { speak, speaking, supported, cancel } = useTextToSpeech({ rate: 0.9 });
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const totalSteps = data.userType === 'organisation' ? 4 : 3;

  const speakText = (text: string) => { if (voiceEnabled && supported) { cancel(); speak(text); } };

  const handleUserTypeSelect = (type: UserType) => {
    setData({ ...data, userType: type });
    speakText(`Great choice! You selected ${userTypes.find(u => u.id === type)?.title}. Let's set up your profile.`);
    setStep(1);
  };

  const handleNext = () => {
    if (step === 1) {
      if (data.userType === 'student' && (!data.fullName || !data.age)) { toast.error("Please fill in your name and age"); return; }
      if (data.userType === 'parent' && (!data.fullName || !data.phone)) { toast.error("Please fill in your name and phone number"); return; }
      if (data.userType === 'organisation' && (!data.organisationName || !data.organisationType)) { toast.error("Please fill in organisation details"); return; }
    }
    if (step < totalSteps) {
      setStep(step + 1);
      if (step + 1 === totalSteps) speakText("Almost done! Choose your preferred theme.");
    }
  };

  const handleBack = () => { if (step > 0) setStep(step - 1); };

  const handleComplete = () => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'theme-zambian', 'theme-ocean', 'theme-sunset', 'theme-forest');
    if (data.theme === 'dark') root.classList.add('dark');
    else if (data.theme !== 'light') root.classList.add(`theme-${data.theme}`);
    localStorage.setItem('edu-zambia-theme', data.theme);
    speakText("Welcome to Synapse! Your journey begins now.");
    toast.success("🎉 Welcome to Synapse!", { description: "Your account has been set up successfully." });
    onComplete(data);
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
            <div className="text-center space-y-4">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="inline-block">
                <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto">
                  <Sparkles className="w-10 h-10 text-primary-foreground" />
                </div>
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-bold">
                Welcome to <span className="text-primary font-semibold">Synapse</span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Powered by <span className="font-semibold text-primary">BrightSphere</span> AI
              </p>
              <p className="text-muted-foreground max-w-lg mx-auto">Tell us who you are so we can personalize your learning experience</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {userTypes.map((type, index) => (
                <motion.div key={type.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1 }} whileHover={{ scale: 1.03, y: -5 }} whileTap={{ scale: 0.98 }}>
                  <Card className="relative overflow-hidden cursor-pointer group h-full bg-card border border-border hover:shadow-card-hover transition-all duration-300 p-6" onClick={() => handleUserTypeSelect(type.id)}>
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative text-center space-y-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary">
                        <type.icon className="w-8 h-8 text-primary-foreground" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground">{type.title}</h3>
                      <p className="text-sm text-muted-foreground">{type.description}</p>
                      <Button variant="outline" className="w-full border-border hover:border-primary/50 transition-all">
                        Select <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case 1:
        return (
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="max-w-xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-primary">Tell us about yourself</h2>
              <p className="text-muted-foreground">
                {data.userType === 'student' && "Let's set up your student profile"}
                {data.userType === 'parent' && "Let's set up your guardian profile"}
                {data.userType === 'organisation' && "Tell us about your organisation"}
              </p>
            </div>

            <Card className="p-6 space-y-4 bg-card border border-border">
              {data.userType === 'student' && (
                <>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 font-semibold"><User className="w-4 h-4 text-primary" /> Full Name *</Label>
                    <Input placeholder="Enter your full name" value={data.fullName} onChange={(e) => setData({ ...data, fullName: e.target.value })} className="border-input focus:ring-ring transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-semibold">Age *</Label>
                      <Input type="number" placeholder="Your age" value={data.age} onChange={(e) => setData({ ...data, age: e.target.value })} className="border-input focus:ring-ring transition-all" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold">Grade / Class</Label>
                      <Select value={data.grade} onValueChange={(v) => setData({ ...data, grade: v })}>
                        <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                        <SelectContent>
                          {[...Array(12)].map((_, i) => (<SelectItem key={i} value={`Grade ${i + 1}`}>Grade {i + 1}</SelectItem>))}
                          <SelectItem value="College">College</SelectItem>
                          <SelectItem value="University">University</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 font-semibold"><Phone className="w-4 h-4 text-primary" /> Phone Number</Label>
                    <Input placeholder="+260..." value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} className="border-input focus:ring-ring transition-all" />
                  </div>
                </>
              )}

              {data.userType === 'parent' && (
                <>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 font-semibold"><User className="w-4 h-4 text-primary" /> Full Name *</Label>
                    <Input placeholder="Enter your full name" value={data.fullName} onChange={(e) => setData({ ...data, fullName: e.target.value })} className="border-input focus:ring-ring transition-all" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 font-semibold"><Phone className="w-4 h-4 text-primary" /> Phone Number *</Label>
                    <Input placeholder="+260..." value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} className="border-input focus:ring-ring transition-all" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 font-semibold"><Mail className="w-4 h-4 text-primary" /> Email</Label>
                    <Input type="email" placeholder="your@email.com" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} className="border-input focus:ring-ring transition-all" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">Number of Children</Label>
                    <Select value={data.childrenCount} onValueChange={(v) => setData({ ...data, childrenCount: v })}>
                      <SelectTrigger><SelectValue placeholder="How many children?" /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, '6+'].map((n) => (<SelectItem key={n} value={String(n)}>{n}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {data.userType === 'organisation' && (
                <>
                  <div className="space-y-2">
                    <Label className="font-semibold">Organisation Type *</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {organisationTypes.map((org) => (
                        <Card key={org.id}
                          className={`p-4 cursor-pointer transition-all bg-card ${
                            data.organisationType === org.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setData({ ...data, organisationType: org.id })}>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{org.icon}</span>
                            <span className="font-medium text-sm text-foreground">{org.name}</span>
                            {data.organisationType === org.id && <Check className="w-4 h-4 text-primary ml-auto" />}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 font-semibold"><Building2 className="w-4 h-4 text-primary" /> Organisation Name *</Label>
                    <Input placeholder="Enter organisation name" value={data.organisationName} onChange={(e) => setData({ ...data, organisationName: e.target.value })} className="border-input focus:ring-ring transition-all" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 font-semibold"><MapPin className="w-4 h-4 text-primary" /> Location</Label>
                    <Input placeholder="City, Province" value={data.location} onChange={(e) => setData({ ...data, location: e.target.value })} className="border-input focus:ring-ring transition-all" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 font-semibold"><User className="w-4 h-4 text-primary" /> Contact Person Name</Label>
                    <Input placeholder="Admin/Contact name" value={data.fullName} onChange={(e) => setData({ ...data, fullName: e.target.value })} className="border-input focus:ring-ring transition-all" />
                  </div>
                </>
              )}
            </Card>
          </motion.div>
        );

      case 2:
        return (
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="max-w-xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <Globe className="w-12 h-12 text-primary mx-auto" />
              <h2 className="text-3xl font-bold text-primary">Language Preference</h2>
              <p className="text-muted-foreground">Choose your preferred language for the platform</p>
            </div>

            <Card className="p-6 bg-card border border-border">
              <div className="grid grid-cols-2 gap-3">
                {['English', 'Bemba', 'Nyanja', 'Tonga', 'Lozi', 'Lunda', 'Kaonde'].map((lang) => (
                  <Card key={lang}
                    className={`p-4 cursor-pointer transition-all bg-card ${
                      data.preferredLanguage === lang ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setData({ ...data, preferredLanguage: lang })}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{lang}</span>
                      {data.preferredLanguage === lang && <Check className="w-4 h-4 text-primary" />}
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </motion.div>
        );

      case 3:
        return (
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <Palette className="w-12 h-12 text-primary mx-auto" />
              <h2 className="text-3xl font-bold text-primary">Choose Your Theme</h2>
              <p className="text-muted-foreground">Personalize your Synapse experience</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {themes.map((theme) => (
                <motion.div key={theme.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Card
                    className={`p-4 cursor-pointer transition-all bg-card ${
                      data.theme === theme.id ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setData({ ...data, theme: theme.id })}>
                    <div className="space-y-3">
                      <div className={`h-20 rounded-lg bg-gradient-to-br ${theme.gradient} flex items-center justify-center`}>
                        <theme.icon className={`w-8 h-8 ${theme.id === 'light' ? 'text-gray-700' : 'text-white'}`} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{theme.name}</span>
                        {data.theme === theme.id && <Check className="w-5 h-5 text-primary" />}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-card border-b border-border relative z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-foreground">Synapse</span>
        </div>
        {supported && (
          <Button variant="ghost" size="icon" className="border border-border hover:border-primary/50" onClick={() => { if (speaking) cancel(); setVoiceEnabled(!voiceEnabled); }}>
            {voiceEnabled ? <Volume2 className="w-5 h-5 text-primary" /> : <VolumeX className="w-5 h-5 text-muted-foreground" />}
          </Button>
        )}
      </div>

      {/* Progress */}
      {step > 0 && (
        <div className="px-4 pb-4 relative z-10">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-muted-foreground">Step {step} of {totalSteps}</span>
              <span className="text-primary font-semibold">{Math.round((step / totalSteps) * 100)}%</span>
            </div>
            <Progress value={(step / totalSteps) * 100} className="h-2" />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
      </div>

      {/* Footer Navigation */}
      {step > 0 && (
        <div className="p-4 bg-card border-t border-border relative z-20">
          <div className="max-w-xl mx-auto flex items-center justify-between">
            <Button variant="outline" onClick={handleBack}>
              <ChevronLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            {step < totalSteps ? (
              <Button onClick={handleNext} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all">
                Continue <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleComplete} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all">
                Complete Setup <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NewOnboardingWizard;
