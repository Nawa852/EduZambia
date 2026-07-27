import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, Sparkles, MessageCircle, Camera, Mic, FileText,
  Lightbulb, BookOpen, HelpCircle, Send, History, Star,
  Zap, Volume2, Globe, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import EduZambiaLogo from "@/assets/brandLogo";

export const AILearningAssistant = () => {
  const [query, setQuery] = useState('');

  const quickPrompts = [
    { icon: HelpCircle, text: 'Explain quadratic equations simply', category: 'explain' },
    { icon: Lightbulb, text: 'Give me a mnemonic for photosynthesis', category: 'memory' },
    { icon: FileText, text: 'Generate 5 practice questions on ratios', category: 'practice' },
    { icon: BookOpen, text: 'Summarize Chapter 5 of my Science book', category: 'summary' },
  ];

  const recentQueries = [
    { question: 'How do I solve simultaneous equations?', subject: 'Mathematics', time: '2h ago' },
    { question: "What's the difference between mitosis and meiosis?", subject: 'Science', time: 'Yesterday' },
    { question: 'Help me understand the water cycle', subject: 'Geography', time: '2 days ago' },
  ];

  const aiCapabilities = [
    { 
      icon: Brain, 
      title: 'Concept Explainer', 
      description: 'Get simple explanations with local examples',
      link: '/multi-ai-tutor',
      gradient: 'from-blue-500 to-indigo-600'
    },
    { 
      icon: Camera, 
      title: 'Photo Solver', 
      description: 'Snap a photo of any problem',
      link: '/comprehensive-ai-study',
      gradient: 'from-pink-500 to-rose-600'
    },
    { 
      icon: FileText, 
      title: 'Quiz Generator', 
      description: 'Create practice questions instantly',
      link: '/ai-quiz-creator',
      gradient: 'from-purple-500 to-violet-600'
    },
    { 
      icon: Lightbulb, 
      title: 'Flashcard Maker', 
      description: 'Generate study flashcards',
      link: '/ai-flashcards',
      gradient: 'from-amber-500 to-orange-600'
    },
    { 
      icon: BookOpen, 
      title: 'Note Summarizer', 
      description: 'Condense long chapters',
      link: '/real-time-summarizer',
      gradient: 'from-emerald-500 to-teal-600'
    },
    { 
      icon: Globe, 
      title: 'Language Helper', 
      description: 'Learn in Bemba, Nyanja, Tonga & more',
      link: '/multilingual-translator',
      gradient: 'from-cyan-500 to-blue-600'
    },
  ];

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <img src={EduZambiaLogo} alt="" className="w-6 h-6" />
          AI Learning Assistant
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="w-3 h-3" />
            BrightSphere
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Ask Bar */}
        <div className="relative">
          <Input
            placeholder="Ask me anything about your studies..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pr-24"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7">
              <Camera className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7">
              <Mic className="w-4 h-4" />
            </Button>
            <Button size="icon" className="h-7 w-7">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quick Prompts */}
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt, index) => (
            <Button 
              key={index} 
              variant="outline" 
              size="sm" 
              className="gap-2 text-xs hover:border-primary/50"
            >
              <prompt.icon className="w-3 h-3" />
              {prompt.text}
            </Button>
          ))}
        </div>

        <Tabs defaultValue="tools" className="mt-4">
          <TabsList className="grid grid-cols-2 w-full max-w-xs">
            <TabsTrigger value="tools">AI Tools</TabsTrigger>
            <TabsTrigger value="history">Recent</TabsTrigger>
          </TabsList>

          <TabsContent value="tools" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {aiCapabilities.map((cap, index) => (
                <Link key={index} to={cap.link}>
                  <Card className="h-full cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group">
                    <CardContent className="p-4">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cap.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg`}>
                        <cap.icon className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="font-semibold text-sm mb-1">{cap.title}</h4>
                      <p className="text-xs text-muted-foreground">{cap.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-4 space-y-2">
            {recentQueries.map((item, index) => (
              <div 
                key={index}
                className="p-3 rounded-lg border border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <History className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{item.question}</p>
                      <p className="text-xs text-muted-foreground">{item.subject} • {item.time}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </TabsContent>
        </Tabs>

        {/* Safety Note */}
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
          <p className="text-xs text-blue-600 flex items-start gap-2">
            <Zap className="w-4 h-4 flex-shrink-0" />
            <span>
              AI helps you understand concepts better - it won't give you direct exam answers. 
              Your teacher can see what topics you're exploring to help you more effectively.
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
