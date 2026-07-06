import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { LogoLoader } from '@/components/UI/LogoLoader';
import {
  ArrowLeft, ArrowRight, Clock, CheckCircle, XCircle,
  Trophy, Target, AlertCircle, RotateCcw, Home
} from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  options: Record<string, string>;
  correct_answer?: string;
  explanation?: string | null;
  difficulty_level: string;
  points: number;
  order_index: number;
}

interface Assessment {
  id: string;
  title: string;
  time_limit_minutes: number | null;
  pass_threshold: number;
  instructions: string | null;
  course_id: string;
}

const AssessmentTakingPage = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    passed: boolean;
    earnedPoints: number;
    totalPoints: number;
  } | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);

  // Fetch assessment data
  useEffect(() => {
    if (!assessmentId || !user) return;

    const fetchData = async () => {
      const [{ data: assessmentData }, { data: questionsData }] = await Promise.all([
        supabase.from('course_assessments').select('*').eq('id', assessmentId).single(),
        supabase.from('assessment_questions').select('id, assessment_id, question_text, question_type, options, difficulty_level, points, order_index').eq('assessment_id', assessmentId).order('order_index'),
      ]);

      if (assessmentData) {
        setAssessment(assessmentData as Assessment);
        if (assessmentData.time_limit_minutes) {
          setTimeLeft(assessmentData.time_limit_minutes * 60);
        }
      }
      if (questionsData) {
        setQuestions(questionsData as Question[]);
      }
      setLoading(false);
    };
    fetchData();
  }, [assessmentId, user]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || isComplete) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = useCallback(async () => {
    if (!user || !assessmentId || submitting) return;
    setSubmitting(true);

    const timeSpent = assessment?.time_limit_minutes
      ? Math.round(assessment.time_limit_minutes - (timeLeft || 0) / 60)
      : null;

    const { data: graded, error } = await (supabase.rpc as any)('grade_assessment_attempt', {
      _assessment_id: assessmentId,
      _answers: answers,
      _time_spent_minutes: timeSpent,
    });

    if (error || !graded || !graded[0]) {
      toast.error('Failed to submit assessment');
      setSubmitting(false);
      return;
    }

    const row = graded[0];
    setAttemptId(row.attempt_id);
    setResults({
      score: row.score,
      passed: row.passed,
      earnedPoints: row.earned_points,
      totalPoints: row.total_points,
    });
    setIsComplete(true);
    toast.success(row.passed ? '🎉 Assessment passed!' : 'Assessment complete');
    setSubmitting(false);

    if (row.attempt_id) {
      navigate(`/assessment-results/${row.attempt_id}`);
    }
  }, [user, assessmentId, answers, assessment, timeLeft, submitting, navigate]);

  const currentQuestion = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;
  const answeredCount = Object.keys(answers).length;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <LogoLoader text="Loading assessment..." />
      </div>
    );
  }

  if (!assessment || questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <AlertCircle className="w-14 h-14 mx-auto mb-4 text-muted-foreground/30" />
        <h2 className="text-xl font-semibold mb-2">Assessment not found</h2>
        <p className="text-muted-foreground mb-4">This assessment may not exist or has no questions.</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  // Results screen
  if (isComplete && results) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className={`border-2 ${results.passed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-orange-500/30 bg-orange-500/5'}`}>
            <CardHeader className="text-center pb-2">
              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${results.passed ? 'bg-emerald-500/20' : 'bg-orange-500/20'}`}>
                {results.passed ? (
                  <Trophy className="w-10 h-10 text-emerald-500" />
                ) : (
                  <Target className="w-10 h-10 text-orange-500" />
                )}
              </div>
              <CardTitle className="text-2xl">
                {results.passed ? '🎉 Congratulations!' : 'Keep Practicing!'}
              </CardTitle>
              <p className="text-muted-foreground">
                {results.passed 
                  ? 'You passed this assessment!' 
                  : `You need ${assessment.pass_threshold}% to pass. Try again!`}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-lg bg-background">
                  <p className={`text-3xl font-bold ${results.passed ? 'text-emerald-500' : 'text-orange-500'}`}>
                    {results.score}%
                  </p>
                  <p className="text-xs text-muted-foreground">Score</p>
                </div>
                <div className="p-4 rounded-lg bg-background">
                  <p className="text-3xl font-bold text-foreground">{results.earnedPoints}/{results.totalPoints}</p>
                  <p className="text-xs text-muted-foreground">Points</p>
                </div>
                <div className="p-4 rounded-lg bg-background">
                  <p className="text-3xl font-bold text-foreground">{answeredCount}/{questions.length}</p>
                  <p className="text-xs text-muted-foreground">Answered</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowReview(true)}
                  className="w-full"
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Review Answers
                </Button>
                <Button 
                  onClick={() => navigate(`/course/${assessment.course_id}`)}
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" /> Back to Course
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Review Modal */}
        <AnimatePresence>
          {showReview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 overflow-y-auto py-8 px-4"
            >
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground">Answer Review</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowReview(false)}>Close</Button>
                </div>
                {questions.map((q, i) => {
                  const userAnswer = answers[q.id];
                  const isCorrect = userAnswer === q.correct_answer;
                  return (
                    <Card key={q.id} className={isCorrect ? 'border-emerald-500/30' : 'border-destructive/30'}>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start gap-2">
                          {isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-foreground">Q{i + 1}: {q.question_text}</p>
                          </div>
                        </div>
                        <div className="pl-7 space-y-1 text-sm">
                          <p className="text-muted-foreground">
                            Your answer: <span className={isCorrect ? 'text-emerald-500' : 'text-destructive'}>
                              {userAnswer ? `${userAnswer}: ${q.options[userAnswer]}` : 'Not answered'}
                            </span>
                          </p>
                          {!isCorrect && (
                            <p className="text-emerald-600">
                              Correct: {q.correct_answer}: {q.options[q.correct_answer]}
                            </p>
                          )}
                          {q.explanation && (
                            <p className="text-muted-foreground italic mt-2">{q.explanation}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Quiz interface
  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground">{assessment.title}</h1>
            <p className="text-xs text-muted-foreground">Question {currentIndex + 1} of {questions.length}</p>
          </div>
        </div>
        {timeLeft !== null && (
          <Badge variant={timeLeft < 60 ? 'destructive' : 'outline'} className="text-sm">
            <Clock className="w-3.5 h-3.5 mr-1" />
            {formatTime(timeLeft)}
          </Badge>
        )}
      </div>

      {/* Progress */}
      <Progress value={progress} className="h-2" />

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="capitalize">{currentQuestion.difficulty_level}</Badge>
                <span className="text-xs text-muted-foreground">{currentQuestion.points} pt{currentQuestion.points !== 1 ? 's' : ''}</span>
              </div>
              <CardTitle className="text-lg leading-relaxed mt-2">{currentQuestion.question_text}</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={answers[currentQuestion.id] || ''}
                onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
                className="space-y-3"
              >
                {Object.entries(currentQuestion.options).map(([key, value]) => (
                  <div key={key} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value={key} id={`option-${key}`} />
                    <Label 
                      htmlFor={`option-${key}`} 
                      className="flex-1 cursor-pointer text-sm"
                    >
                      <span className="font-semibold mr-2">{key}.</span> {value}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Previous
        </Button>

        <div className="flex items-center gap-1">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                i === currentIndex 
                  ? 'bg-primary text-primary-foreground' 
                  : answers[q.id] 
                    ? 'bg-emerald-500/20 text-emerald-600' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {currentIndex < questions.length - 1 ? (
          <Button onClick={() => setCurrentIndex(i => i + 1)}>
            Next <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        )}
      </div>

      {/* Answer Summary */}
      <p className="text-center text-xs text-muted-foreground">
        {answeredCount} of {questions.length} questions answered
      </p>
    </div>
  );
};

export default AssessmentTakingPage;
