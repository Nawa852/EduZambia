import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Smile, Meh, Frown, Heart, Sparkles, Sun, Moon, Cloud,
  Brain, Zap, Target, Clock, BookOpen, TrendingUp
} from 'lucide-react';
import EduZambiaLogo from "@/assets/edu-zambia-icon.png";

interface SmartWelcomePanelProps {
  userName: string;
  onMoodSelect?: (mood: string) => void;
}

export const SmartWelcomePanel = ({ userName, onMoodSelect }: SmartWelcomePanelProps) => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [showMoodCheck, setShowMoodCheck] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getTimeIcon = () => {
    const hour = new Date().getHours();
    if (hour < 6 || hour > 18) return Moon;
    if (hour < 12) return Sun;
    return Cloud;
  };

  const getContextMessage = () => {
    const messages = [
      "Your ECZ exam is in 45 days. Let's stay focused!",
      "You're on a 5-day learning streak. Keep it up!",
      "You've mastered 3 new topics this week!",
      "Your performance is improving. Great progress!",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  const moods = [
    { id: 'great', icon: Heart, label: 'Excited to learn!', color: 'text-pink-500 bg-pink-100' },
    { id: 'good', icon: Smile, label: 'Feeling good', color: 'text-green-500 bg-green-100' },
    { id: 'okay', icon: Meh, label: "It's okay", color: 'text-yellow-500 bg-yellow-100' },
    { id: 'struggling', icon: Frown, label: 'Need support', color: 'text-blue-500 bg-blue-100' },
  ];

  const handleMoodSelect = (moodId: string) => {
    setSelectedMood(moodId);
    setShowMoodCheck(false);
    onMoodSelect?.(moodId);
  };

  const TimeIcon = getTimeIcon();

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 p-6 md:p-8 border border-primary/20">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-accent/20 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      <div className="absolute top-4 right-4 opacity-10">
        <img src={EduZambiaLogo} alt="" className="w-24 h-24" />
      </div>
      
      <div className="relative z-10">
        {/* Greeting Header */}
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <TimeIcon className="w-5 h-5 text-primary" />
          </div>
          <img src={EduZambiaLogo} alt="Nexus Learning" className="w-6 h-6" />
          <span className="text-sm font-medium text-muted-foreground">BrightSphere AI</span>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          {getGreeting()}, <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">{userName}</span>! ✨
        </h1>
        
        <p className="text-muted-foreground max-w-lg mb-4">
          {getContextMessage()}
        </p>

        {/* Mood Check-in */}
        {showMoodCheck && (
          <Card className="bg-background/60 backdrop-blur-sm border-primary/10 mt-4">
            <CardContent className="p-4">
              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                How are you feeling about school today?
              </p>
              <div className="flex flex-wrap gap-2">
                {moods.map((mood) => (
                  <Button
                    key={mood.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleMoodSelect(mood.id)}
                    className={`gap-2 transition-all hover:scale-105 ${
                      selectedMood === mood.id ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <mood.icon className={`w-4 h-4 ${mood.color.split(' ')[0]}`} />
                    {mood.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedMood && (
          <div className="mt-4 p-3 rounded-lg bg-background/60 backdrop-blur-sm border border-primary/10">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              {selectedMood === 'struggling' 
                ? "I'll adjust today's lessons to be more supportive. You've got this! 💪"
                : selectedMood === 'great'
                ? "Awesome! Let's tackle some challenging material today! 🚀"
                : "Great! I've prepared personalized content just for you."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
