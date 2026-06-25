import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, School, Heart, Volume2, VolumeX, GraduationCap, ChevronRight } from "lucide-react";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import EduZambiaLogo from "@/assets/edu-zambia-logo.svg";

interface WelcomeScreenProps {
  onRoleSelect: (role: 'student' | 'teacher' | 'institution' | 'guardian') => void;
}

export const WelcomeScreen = ({ onRoleSelect }: WelcomeScreenProps) => {
  const [showContent, setShowContent] = useState(false);
  const { speak, speaking, supported, cancel } = useTextToSpeech({ rate: 0.9, pitch: 1, volume: 0.8 });
  const [autoSpeak, setAutoSpeak] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setShowContent(true);
      if (supported && autoSpeak) {
        speak("Welcome, Dreamer. You've entered Edu Zambia — a living learning system powered by BrightSphere.");
      }
    }, 1000);
  }, [supported, autoSpeak, speak]);

  const toggleSpeech = () => {
    if (speaking) cancel();
    else speak("Welcome, Dreamer. You've entered Edu Zambia — a living learning system powered by BrightSphere.");
  };

  const roles = [
    { id: 'student' as const, icon: GraduationCap, label: "I am a Student", description: "Begin your learning journey" },
    { id: 'teacher' as const, icon: Users, label: "I am a Teacher", description: "Shape the future minds" },
    { id: 'institution' as const, icon: School, label: "I am an Institution", description: "Transform education at scale" },
    { id: 'guardian' as const, icon: Heart, label: "I am a Guardian", description: "Guide and support learning" },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-background flex items-center justify-center p-4">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

      <AnimatePresence>
        {showContent && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 max-w-6xl w-full">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-center mb-12 relative">
              {supported && (
                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} onClick={toggleSpeech}
                  className="absolute top-0 right-4 p-3 rounded-full bg-card border border-border hover:shadow-card-hover transition-all"
                  title={speaking ? "Stop voice" : "Play voice"}>
                  {speaking ? <VolumeX className="w-6 h-6 text-primary" /> : <Volume2 className="w-6 h-6 text-primary" />}
                </motion.button>
              )}

              <motion.div className="inline-block mb-6 relative" initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.3 }}>
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                  <motion.img src={EduZambiaLogo} alt="Nexus Learning" className="w-28 h-28 mx-auto rounded-2xl" whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }} transition={{ duration: 0.4 }} />
                </motion.div>
              </motion.div>
              
              <h1 className="text-5xl md:text-7xl font-bold mb-4 text-primary">Welcome, Dreamer.</h1>
              
              <motion.p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                You've entered <span className="text-primary font-semibold">Edu Zambia</span> — a living learning system
              </motion.p>
              
              <motion.p className="text-lg text-muted-foreground" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                Powered by <span className="font-semibold text-primary">BrightSphere</span>
              </motion.p>
              
              <motion.p className="text-base text-muted-foreground/80 mt-4 italic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
                Here, knowledge is not consumed — it evolves with you.
              </motion.p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {roles.map((role, index) => (
                <motion.div key={role.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.2 + index * 0.1 }} whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.95 }}>
                  <Card className="relative overflow-hidden cursor-pointer group h-full bg-card border border-border hover:shadow-card-hover transition-all duration-300" onClick={() => onRoleSelect(role.id)}>
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative p-8 text-center space-y-4">
                      <motion.div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary shadow-card" whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                        <role.icon className="w-10 h-10 text-primary-foreground" />
                      </motion.div>
                      <h3 className="text-xl font-bold text-foreground">{role.label}</h3>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                      <Button variant="outline" className="w-full border-border hover:border-primary/50 transition-all">
                        Select <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            <motion.p className="text-center text-sm text-muted-foreground mt-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6 }}>
              Powered by <span className="text-primary font-semibold">BrightSphere</span> Intelligence
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
