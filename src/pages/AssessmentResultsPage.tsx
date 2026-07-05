import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { LogoLoader } from '@/components/UI/LogoLoader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import {
  Trophy, Target, ArrowLeft, CheckCircle, XCircle,
  Clock, BarChart3, BookOpen, Award, Home, RotateCcw
} from 'lucide-react';

const AssessmentResultsPage = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState<any>(null);
  const [assessment, setAssessment] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [courseName, setCourse] = useState('');

  useEffect(() => {
    if (!attemptId || !user) return;
    const fetch = async () => {
      const { data: att } = await supabase
        .from('assessment_attempts')
        .select('*')
        .eq('id', attemptId)
        .eq('user_id', user.id)
        .single();
      if (!att) { setLoading(false); return; }
      setAttempt(att);

      const [{ data: asmt }, { data: qs }] = await Promise.all([
        supabase.from('course_assessments').select('*').eq('id', att.assessment_id).single(),
        (supabase.rpc as any)('get_assessment_review', { _attempt_id: attemptId }),
      ]);
      if (asmt) {
        setAssessment(asmt);
        const { data: c } = await supabase.from('courses').select('title').eq('id', asmt.course_id).single();
        setCourse(c?.title || '');
      }
      // Map RPC result to shape expected by the rest of the component
      setQuestions((qs || []).map((r: any) => ({
        id: r.question_id,
        question_text: r.question_text,
        options: r.options,
        correct_answer: r.correct_answer,
        explanation: r.explanation,
        points: r.points,
        order_index: r.order_index,
        difficulty_level: 'medium',
      })));
      setLoading(false);
    };
    fetch();
  }, [attemptId, user]);

  if (loading) return <div className="max-w-3xl mx-auto py-12 px-4"><LogoLoader text="Loading results..." /></div>;
  if (!attempt || !assessment) return (
    <div className="max-w-3xl mx-auto py-12 px-4 text-center">
      <p className="text-muted-foreground">Results not found.</p>
      <Button className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
    </div>
  );

  const answers = (attempt.answers || {}) as Record<string, string>;
  const correctCount = questions.filter(q => answers[q.id] === q.correct_answer).length;
  const wrongCount = questions.length - correctCount;
  const difficultyBreakdown = questions.reduce((acc: Record<string, { total: number; correct: number }>, q) => {
    const d = q.difficulty_level || 'medium';
    if (!acc[d]) acc[d] = { total: 0, correct: 0 };
    acc[d].total++;
    if (answers[q.id] === q.correct_answer) acc[d].correct++;
    return acc;
  }, {});

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Assessment Results</h1>
          <p className="text-sm text-muted-foreground">{assessment.title} • {courseName}</p>
        </div>
      </div>

      {/* Score Hero */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className={`border-2 ${attempt.passed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-orange-500/30 bg-orange-500/5'}`}>
          <CardContent className="p-6 text-center space-y-4">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${attempt.passed ? 'bg-emerald-500/20' : 'bg-orange-500/20'}`}>
              {attempt.passed ? <Trophy className="w-10 h-10 text-emerald-500" /> : <Target className="w-10 h-10 text-orange-500" />}
            </div>
            <div>
              <p className={`text-5xl font-bold ${attempt.passed ? 'text-emerald-500' : 'text-orange-500'}`}>{attempt.score}%</p>
              <p className="text-muted-foreground mt-1">{attempt.passed ? 'You passed! 🎉' : `Need ${assessment.pass_threshold}% to pass`}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: CheckCircle, label: 'Correct', value: correctCount, color: 'text-emerald-500' },
          { icon: XCircle, label: 'Wrong', value: wrongCount, color: 'text-destructive' },
          { icon: BarChart3, label: 'Points', value: `${attempt.earned_points}/${attempt.total_points}`, color: 'text-primary' },
          { icon: Clock, label: 'Time', value: attempt.time_spent_minutes ? `${attempt.time_spent_minutes}m` : 'N/A', color: 'text-muted-foreground' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <s.icon className={`w-5 h-5 mx-auto mb-1 ${s.color}`} />
              <p className="text-lg font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Difficulty Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Performance by Difficulty</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(difficultyBreakdown).map(([level, data]) => {
            const d = data as { total: number; correct: number };
            const pct = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0;
            return (
              <div key={level} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="capitalize text-foreground">{level}</span>
                  <span className="text-muted-foreground">{d.correct}/{d.total} ({pct}%)</span>
                </div>
                <Progress value={pct} className="h-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Question Review */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Question Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {questions.map((q, i) => {
            const userAnswer = answers[q.id];
            const isCorrect = userAnswer === q.correct_answer;
            const opts = (q.options || {}) as Record<string, string>;
            return (
              <div key={q.id} className={`p-3 rounded-lg border ${isCorrect ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-destructive/20 bg-destructive/5'}`}>
                <div className="flex items-start gap-2">
                  {isCorrect ? <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />}
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-foreground">Q{i + 1}: {q.question_text}</p>
                    <p className="text-xs text-muted-foreground">
                      Your answer: <span className={isCorrect ? 'text-emerald-500' : 'text-destructive'}>
                        {userAnswer ? `${userAnswer}: ${opts[userAnswer] || ''}` : 'Not answered'}
                      </span>
                    </p>
                    {!isCorrect && (
                      <p className="text-xs text-emerald-600">Correct: {q.correct_answer}: {opts[q.correct_answer] || ''}</p>
                    )}
                    {q.explanation && <p className="text-xs text-muted-foreground italic">{q.explanation}</p>}
                  </div>
                  <Badge variant="outline" className="text-[10px] capitalize">{q.difficulty_level}</Badge>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button variant="outline" className="flex-1" onClick={() => navigate(`/assessment/${assessment.id}`)}>
          <RotateCcw className="w-4 h-4 mr-2" /> Retake Assessment
        </Button>
        <Button className="flex-1" onClick={() => navigate(`/course/${assessment.course_id}`)}>
          <Home className="w-4 h-4 mr-2" /> Back to Course
        </Button>
      </div>
    </div>
  );
};

export default AssessmentResultsPage;
