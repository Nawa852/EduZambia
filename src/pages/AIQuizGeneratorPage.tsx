import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  Youtube, 
  Globe,
  Settings,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Share2,
  Download,
  Clock,
  Target,
  Brain,
  Lightbulb
} from 'lucide-react';

interface Question {
  id: number;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'fill_blank';
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const AIQuizGeneratorPage = () => {
  const [prompt, setPrompt] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState('10');
  const [questionType, setQuestionType] = useState('multiple_choice');
  const [grade, setGrade] = useState('any');
  const [webSearch, setWebSearch] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number | string>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const examplePrompts = [
    'Write questions on the 4Ps, segmentation, and product positioning',
    "Make questions on Newton's Laws and force diagrams",
    'Generate questions on Python functions, loops, and list comprehensions',
    'Generate questions on NPV, IRR, and Payback Period',
    'Create a quiz on ECZ Grade 12 Mathematics',
    'Generate Biology questions on cell structure and function'
  ];

  const mockQuestions: Question[] = [
    {
      id: 1,
      type: 'multiple_choice',
      question: 'What is the primary purpose of market segmentation?',
      options: [
        'To reduce production costs',
        'To identify and target specific customer groups',
        'To increase product variety',
        'To expand into new markets'
      ],
      correctAnswer: 1,
      explanation: 'Market segmentation helps businesses identify and target specific customer groups with tailored marketing strategies.',
      difficulty: 'medium'
    },
    {
      id: 2,
      type: 'multiple_choice',
      question: 'Which of the 4Ps refers to how a product is made available to customers?',
      options: ['Product', 'Price', 'Place', 'Promotion'],
      correctAnswer: 2,
      explanation: 'Place (Distribution) refers to how products are made available to customers through various channels.',
      difficulty: 'easy'
    },
    {
      id: 3,
      type: 'true_false',
      question: 'Product positioning is about the physical location of products in stores.',
      options: ['True', 'False'],
      correctAnswer: 1,
      explanation: 'Product positioning is about how a product is perceived in the minds of consumers relative to competitors.',
      difficulty: 'medium'
    },
    {
      id: 4,
      type: 'multiple_choice',
      question: 'What is demographic segmentation based on?',
      options: [
        'Customer behavior and purchasing patterns',
        'Age, gender, income, and education',
        'Geographic location',
        'Lifestyle and personality'
      ],
      correctAnswer: 1,
      explanation: 'Demographic segmentation divides markets based on measurable statistics like age, gender, income, and education.',
      difficulty: 'easy'
    },
    {
      id: 5,
      type: 'multiple_choice',
      question: 'Which pricing strategy involves setting a high initial price then lowering it over time?',
      options: [
        'Penetration pricing',
        'Price skimming',
        'Competitive pricing',
        'Cost-plus pricing'
      ],
      correctAnswer: 1,
      explanation: 'Price skimming involves setting a high price initially to maximize profits from early adopters, then lowering it.',
      difficulty: 'hard'
    }
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setGenerating(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 300);

    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      setQuestions(mockQuestions);
      setGenerating(false);
      setQuizStarted(true);
    }, 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPrompt(`Generate quiz from: ${file.name}`);
    }
  };

  const handleAnswerSelect = (questionId: number, answerIndex: number | string) => {
    setSelectedAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    return { correct, total: questions.length, percentage: Math.round((correct / questions.length) * 100) };
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setShowResults(false);
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setQuestions([]);
    setPrompt('');
  };

  if (quizStarted && !showResults) {
    const q = questions[currentQuestion];
    const isAnswered = selectedAnswers[q.id] !== undefined;

    return (
      <div className="space-y-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="ghost" onClick={resetQuiz}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Exit Quiz
            </Button>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="gap-2">
                <Clock className="w-3 h-3" />
                15:00
              </Badge>
              <Badge variant="secondary">
                {currentQuestion + 1} / {questions.length}
              </Badge>
            </div>
          </div>

          {/* Progress */}
          <Progress value={((currentQuestion + 1) / questions.length) * 100} className="mb-8 h-2" />

          {/* Question Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
            >
              <Card className="mb-6 border-0 shadow-xl">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={q.difficulty === 'easy' ? 'secondary' : q.difficulty === 'medium' ? 'outline' : 'destructive'}>
                      {q.difficulty}
                    </Badge>
                    <Badge variant="outline">{q.type.replace('_', ' ')}</Badge>
                  </div>
                  <CardTitle className="text-xl">{q.question}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {q.options?.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswerSelect(q.id, idx)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        selectedAnswers[q.id] === idx
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }`}
                    >
                      <span className="font-medium mr-3">{String.fromCharCode(65 + idx)}.</span>
                      {option}
                    </button>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            
            {currentQuestion === questions.length - 1 ? (
              <Button
                onClick={() => setShowResults(true)}
                disabled={Object.keys(selectedAnswers).length !== questions.length}
              >
                Submit Quiz
                <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}
                disabled={!isAnswered}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Question Navigator */}
          <Card className="mt-8 border-0 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                {questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentQuestion(idx)}
                    className={`w-10 h-10 rounded-lg font-medium transition-all ${
                      idx === currentQuestion
                        ? 'bg-primary text-primary-foreground'
                        : selectedAnswers[questions[idx].id] !== undefined
                        ? 'bg-green-500/20 text-green-700 border border-green-500'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showResults) {
    const score = calculateScore();
    
    return (
      <div className="space-y-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="text-center mb-8 border-0 shadow-xl overflow-hidden">
              <div className={`py-12 ${score.percentage >= 70 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : score.percentage >= 50 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-red-500 to-pink-500'} text-white`}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="text-6xl font-bold mb-2"
                >
                  {score.percentage}%
                </motion.div>
                <p className="text-xl opacity-90">
                  {score.correct} out of {score.total} correct
                </p>
              </div>
              <CardContent className="py-8">
                <div className="flex justify-center gap-4 mb-6">
                  <Button onClick={resetQuiz}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <Button variant="outline">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Results
                  </Button>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>

            <h3 className="text-xl font-semibold mb-4">Review Answers</h3>
            <div className="space-y-4">
              {questions.map((q, idx) => {
                const isCorrect = selectedAnswers[q.id] === q.correctAnswer;
                return (
                  <Card key={q.id} className={`border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        {isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 mt-1" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium mb-2">{idx + 1}. {q.question}</p>
                          <p className="text-sm text-muted-foreground mb-2">
                            Your answer: <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                              {q.options?.[selectedAnswers[q.id] as number] || 'Not answered'}
                            </span>
                          </p>
                          {!isCorrect && (
                            <p className="text-sm text-green-600">
                              Correct answer: {q.options?.[q.correctAnswer as number]}
                            </p>
                          )}
                          {q.explanation && (
                            <div className="mt-3 p-3 bg-muted rounded-lg">
                              <p className="text-sm flex items-start gap-2">
                                <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5" />
                                {q.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"
          >
            AI Quiz Generator
          </motion.h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Create custom quizzes on any topic using AI. Upload PDFs, paste text, or describe what you want to learn.
          </p>
        </div>

        {/* Upload Area */}
        <Card className="mb-6 border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="py-12 text-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-primary/60" />
            <p className="font-medium mb-1">Upload Image or PDF to create quiz</p>
            <p className="text-sm text-muted-foreground">
              Supports PDF, Word, PowerPoint, TXT, and Images
            </p>
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,image/*"
              onChange={handleFileUpload}
            />
          </CardContent>
        </Card>

        {/* Prompt Input */}
        <Card className="mb-6 shadow-lg border-0">
          <CardContent className="pt-6">
            <Textarea
              placeholder="Type to quiz anything.... e.g., 'Generate questions on photosynthesis for Grade 10'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px] resize-none border-0 text-lg focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            
            {/* Settings Row */}
            <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Difficulty:</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Questions:</Label>
                <Select value={numQuestions} onValueChange={setNumQuestions}>
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 15, 20, 25, 30].map(n => (
                      <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Type:</Label>
                <Select value={questionType} onValueChange={setQuestionType}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                    <SelectItem value="true_false">True/False</SelectItem>
                    <SelectItem value="short_answer">Short Answer</SelectItem>
                    <SelectItem value="fill_blank">Fill-in-Blank</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Grade:</Label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Grade</SelectItem>
                    <SelectItem value="primary">Primary</SelectItem>
                    <SelectItem value="junior">Junior Secondary</SelectItem>
                    <SelectItem value="senior">Senior Secondary</SelectItem>
                    <SelectItem value="college">College</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <Label className="text-sm">Web Search</Label>
                <Switch checked={webSearch} onCheckedChange={setWebSearch} />
              </div>
            </div>

            {/* Generate Button */}
            <div className="flex justify-end mt-4">
              <Button 
                size="lg" 
                onClick={handleGenerate} 
                disabled={!prompt.trim() || generating}
                className="gap-2"
              >
                {generating ? (
                  <>Generating...</>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Quiz
                  </>
                )}
              </Button>
            </div>

            {generating && (
              <div className="mt-4">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2 text-center">
                  AI is analyzing your content and generating questions...
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Example Prompts */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Example prompts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {examplePrompts.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(example)}
                  className="p-3 text-left text-sm rounded-lg border hover:border-primary hover:bg-primary/5 transition-all"
                >
                  {example}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Access Tools */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {[
            { icon: FileText, label: 'PDF Quiz', color: 'text-red-500' },
            { icon: Youtube, label: 'YouTube Quiz', color: 'text-red-600' },
            { icon: ImageIcon, label: 'Image Quiz', color: 'text-blue-500' },
            { icon: Brain, label: 'Math Quiz', color: 'text-purple-500' },
          ].map((tool, idx) => (
            <Card key={idx} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardContent className="py-6 text-center">
                <tool.icon className={`w-8 h-8 mx-auto mb-2 ${tool.color} group-hover:scale-110 transition-transform`} />
                <p className="font-medium text-sm">{tool.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIQuizGeneratorPage;