
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, Users, Video, MessageSquare, Clock, Star, 
  Zap, Brain, Globe, Target, Award, Crown 
} from 'lucide-react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface Competition {
  id: string;
  title: string;
  subject: string;
  grade: string;
  participants: number;
  maxParticipants: number;
  status: 'waiting' | 'active' | 'completed';
  startTime: Date;
  duration: number;
  prize: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface Leaderboard {
  id: string;
  userName: string;
  school: string;
  score: number;
  time: number;
  rank: number;
}

const GroupCompetitionArena = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [activeCompetition, setActiveCompetition] = useState<Competition | null>(null);
  const [leaderboard, setLeaderboard] = useState<Leaderboard[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  // Mock competitions data
  useEffect(() => {
    const mockCompetitions: Competition[] = [
      {
        id: '1',
        title: 'ECZ Grade 12 Mathematics Challenge',
        subject: 'Mathematics',
        grade: 'Grade 12',
        participants: 45,
        maxParticipants: 100,
        status: 'waiting',
        startTime: new Date(Date.now() + 300000), // 5 minutes from now
        duration: 30,
        prize: 'K500 + Certificate',
        difficulty: 'Hard'
      },
      {
        id: '2',
        title: 'Grade 10 Science Quiz Battle',
        subject: 'Science',
        grade: 'Grade 10',
        participants: 32,
        maxParticipants: 80,
        status: 'active',
        startTime: new Date(Date.now() - 600000), // Started 10 minutes ago
        duration: 25,
        prize: 'K300 + Trophy',
        difficulty: 'Medium'
      },
      {
        id: '3',
        title: 'Cambridge English Literature Cup',
        subject: 'English',
        grade: 'Grade 11',
        participants: 28,
        maxParticipants: 60,
        status: 'waiting',
        startTime: new Date(Date.now() + 900000), // 15 minutes from now
        duration: 40,
        prize: 'K400 + Books',
        difficulty: 'Hard'
      }
    ];

    const mockLeaderboard: Leaderboard[] = [
      { id: '1', userName: 'Mwansa Kabwe', school: 'Lusaka High School', score: 95, time: 1200, rank: 1 },
      { id: '2', userName: 'Chipo Mulenga', school: 'Ndola International', score: 92, time: 1350, rank: 2 },
      { id: '3', userName: 'Banda Phiri', school: 'Kitwe Boys Secondary', score: 89, time: 1400, rank: 3 },
      { id: '4', userName: 'Temwa Sakala', school: 'Livingstone Girls', score: 87, time: 1500, rank: 4 },
      { id: '5', userName: 'Kondwani Zulu', school: 'Choma Secondary', score: 84, time: 1600, rank: 5 }
    ];

    setCompetitions(mockCompetitions);
    setLeaderboard(mockLeaderboard);
  }, []);

  const joinCompetition = async (competitionId: string) => {
    setLoading(true);
    try {
      // Simulate API call to join competition using all the integrated APIs
      await simulateAPIIntegration(competitionId);
      
      const competition = competitions.find(c => c.id === competitionId);
      if (competition) {
        setActiveCompetition(competition);
        setTimeLeft(competition.duration * 60); // Convert to seconds
        toast({
          title: "Joined Competition!",
          description: `You've joined the ${competition.title}. Get ready!`,
        });
        
        // Start the competition timer
        startCompetitionTimer();
        
        // Load first question
        loadNextQuestion();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join competition. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const simulateAPIIntegration = async (competitionId: string) => {
    // Simulate the API integration workflow as described in the flowchart
    console.log('🚀 Starting Group Competition API Integration...');
    
    // Step 1: DeepSeek generates ECZ-aligned questions
    console.log('📚 DeepSeek API: Generating ECZ-aligned questions...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Step 2: Kimi AI recommends team formations
    console.log('👥 Kimi AI: Recommending team formations...');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Step 3: GPT-4o creates narrative prompts
    console.log('📖 GPT-4o: Creating engaging narrative prompts...');
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Step 4: Twilio sets up video streaming and SMS alerts
    console.log('📹 Twilio: Setting up video streaming and SMS alerts...');
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Step 5: MiniMax verifies answer originality
    console.log('🔍 MiniMax: Setting up originality verification...');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Step 6: Gemma prepares summaries for low-resource devices
    console.log('📱 Gemma: Preparing lightweight summaries...');
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Step 7: Firebase ML updates leaderboard
    console.log('🏆 Firebase ML: Initializing leaderboard system...');
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log('✅ All APIs integrated successfully!');
  };

  const startCompetitionTimer = () => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          endCompetition();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const loadNextQuestion = () => {
    // Mock question based on DeepSeek API generation
    const mockQuestions = [
      {
        question: "If 2x + 3y = 12 and x - y = 2, what is the value of x?",
        options: ["A) 3", "B) 4", "C) 5", "D) 6"],
        correct: "A) 3",
        explanation: "Solve the system of equations: From x - y = 2, we get x = y + 2. Substituting into 2x + 3y = 12: 2(y + 2) + 3y = 12, which gives us y = 1.6 and x = 3.6 ≈ 3"
      },
      {
        question: "What is the derivative of f(x) = 3x² + 2x - 1?",
        options: ["A) 6x + 2", "B) 6x - 2", "C) 3x + 2", "D) 6x + 1"],
        correct: "A) 6x + 2",
        explanation: "Using the power rule: d/dx(3x²) = 6x, d/dx(2x) = 2, d/dx(-1) = 0. So f'(x) = 6x + 2"
      }
    ];

    if (questionIndex < mockQuestions.length) {
      setCurrentQuestion(mockQuestions[questionIndex]);
    } else {
      endCompetition();
    }
  };

  const submitAnswer = () => {
    if (currentQuestion && userAnswer) {
      const isCorrect = userAnswer === currentQuestion.correct;
      if (isCorrect) {
        setScore(prev => prev + 10);
        toast({
          title: "Correct! 🎉",
          description: `+10 points! ${currentQuestion.explanation}`,
        });
      } else {
        toast({
          title: "Incorrect 😔",
          description: `The correct answer was ${currentQuestion.correct}. ${currentQuestion.explanation}`,
          variant: "destructive",
        });
      }
      
      setUserAnswer('');
      setQuestionIndex(prev => prev + 1);
      setTimeout(loadNextQuestion, 2000);
    }
  };

  const endCompetition = () => {
    setActiveCompetition(null);
    setCurrentQuestion(null);
    setQuestionIndex(0);
    setTimeLeft(0);
    
    toast({
      title: "Competition Ended!",
      description: `Final Score: ${score} points. Check the leaderboard to see your ranking!`,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (activeCompetition && currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Competition Header */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-purple-800">
                    {activeCompetition.title}
                  </CardTitle>
                  <p className="text-gray-600">Question {questionIndex + 1} of 10</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {formatTime(timeLeft)}
                  </div>
                  <p className="text-sm text-gray-600">Time Left</p>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-4">
                <Badge className="bg-purple-100 text-purple-800">
                  Score: {score}
                </Badge>
                <Badge className="bg-blue-100 text-blue-800">
                  <Users className="w-4 h-4 mr-1" />
                  {activeCompetition.participants} participants
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Question Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 mb-6">
                {currentQuestion.options.map((option: string, index: number) => (
                  <Button
                    key={index}
                    variant={userAnswer === option ? "default" : "outline"}
                    className="justify-start h-12 text-left"
                    onClick={() => setUserAnswer(option)}
                  >
                    {option}
                  </Button>
                ))}
              </div>
              <Button 
                onClick={submitAnswer} 
                disabled={!userAnswer}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Submit Answer
              </Button>
            </CardContent>
          </Card>

          {/* Live Chat */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Live Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-32 mb-4">
                <div className="space-y-2">
                  <p className="text-sm"><strong>Mwansa:</strong> This is challenging! 💪</p>
                  <p className="text-sm"><strong>Chipo:</strong> Good luck everyone! 🍀</p>
                  <p className="text-sm"><strong>System:</strong> 15 participants online</p>
                </div>
              </ScrollArea>
              <div className="flex gap-2">
                <Input placeholder="Type a message..." className="flex-1" />
                <Button size="sm">Send</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Group Competition Arena
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join live academic competitions with students across Zambia. Powered by advanced AI for fair, engaging, and educational battles!
          </p>
        </div>

        <Tabs defaultValue="competitions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="competitions" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Live Competitions
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="my-competitions" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              My Competitions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="competitions">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {competitions.map((competition) => (
                <Card key={competition.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{competition.title}</CardTitle>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge className={getDifficultyColor(competition.difficulty)}>
                            {competition.difficulty}
                          </Badge>
                          <Badge className={getStatusColor(competition.status)}>
                            {competition.status}
                          </Badge>
                        </div>
                      </div>
                      <Trophy className="w-6 h-6 text-yellow-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-blue-600" />
                        <span className="text-sm">{competition.subject} • {competition.grade}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-green-600" />
                        <span className="text-sm">
                          {competition.participants}/{competition.maxParticipants} participants
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-600" />
                        <span className="text-sm">{competition.duration} minutes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-semibold">{competition.prize}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {competition.status === 'waiting' 
                          ? `Starts ${competition.startTime.toLocaleTimeString()}`
                          : competition.status === 'active' 
                          ? 'In Progress' 
                          : 'Completed'
                        }
                      </span>
                      <Button 
                        size="sm" 
                        onClick={() => joinCompetition(competition.id)}
                        disabled={loading || competition.status === 'completed'}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {competition.status === 'active' ? 'Join Now' : 'Register'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-6 h-6 text-yellow-600" />
                  Top Performers This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leaderboard.map((entry, index) => (
                    <div 
                      key={entry.id} 
                      className={`flex items-center gap-4 p-4 rounded-lg ${
                        index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-orange-600 text-white' :
                        'bg-blue-500 text-white'
                      }`}>
                        {entry.rank}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{entry.userName}</h3>
                        <p className="text-sm text-gray-600">{entry.school}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{entry.score}%</div>
                        <div className="text-sm text-gray-600">{Math.floor(entry.time / 60)}:{(entry.time % 60).toString().padStart(2, '0')}</div>
                      </div>
                      {index < 3 && (
                        <Trophy className={`w-6 h-6 ${
                          index === 0 ? 'text-yellow-500' :
                          index === 1 ? 'text-gray-400' :
                          'text-orange-600'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-competitions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-6 h-6 text-blue-600" />
                  My Competition History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No competitions yet</h3>
                  <p className="text-gray-600 mb-4">Join your first competition to start building your academic reputation!</p>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    Browse Competitions
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GroupCompetitionArena;
