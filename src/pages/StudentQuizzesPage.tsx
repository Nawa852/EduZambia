import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Sparkles, CheckCircle2, XCircle, RotateCcw, History } from 'lucide-react';

interface Q { question: string; options: string[]; correct_answer: string; explanation?: string; }

const StudentQuizzesPage = () => {
  const { user } = useAuth();
  const [subject, setSubject] = useState('Mathematics');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Q[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const loadHistory = async () => {
    if (!user) return;
    const { data } = await supabase.from('quiz_attempts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10);
    setHistory(data || []);
  };

  useEffect(() => { loadHistory(); }, [user]);

  const generate = async () => {
    if (!topic.trim()) { toast.error('Enter a topic'); return; }
    setLoading(true); setSubmitted(false); setAnswers({}); setQuestions([]);
    try {
      const { data, error } = await supabase.functions.invoke('ai-test-generator', {
        body: { subject, topic, grade: 'Grade 10', numQuestions: 5, questionType: 'multiple_choice' },
      });
      if (error) throw error;
      const qs = (data?.questions || data?.test?.questions || []).map((q: any) => ({
        question: q.question || q.text,
        options: q.options || q.choices || [],
        correct_answer: String(q.correct_answer ?? q.answer ?? ''),
        explanation: q.explanation,
      })).filter((q: Q) => q.question && q.options.length);
      if (!qs.length) throw new Error('No questions returned');
      setQuestions(qs);
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate quiz');
    } finally { setLoading(false); }
  };

  const submit = async () => {
    if (Object.keys(answers).length < questions.length) { toast.error('Answer all questions'); return; }
    let correct = 0;
    questions.forEach((q, i) => { if ((answers[i] || '').trim() === q.correct_answer.trim()) correct++; });
    setSubmitted(true);
    if (user) {
      await supabase.from('quiz_attempts').insert({
        user_id: user.id, subject, grade_level: 'Grade 10',
        total_questions: questions.length, correct_answers: correct,
      } as any);
      loadHistory();
    }
    toast.success(`Scored ${correct}/${questions.length}`);
  };

  const reset = () => { setQuestions([]); setAnswers({}); setSubmitted(false); };

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Sparkles className="h-7 w-7 text-primary" /> Quizzes</h1>
        <p className="text-muted-foreground">AI-generated practice with instant feedback. All attempts saved.</p>
      </div>

      {questions.length === 0 ? (
        <Card>
          <CardHeader><CardTitle>New Quiz</CardTitle><CardDescription>Pick a subject and topic</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label>Subject</Label><Input value={subject} onChange={e => setSubject(e.target.value)} /></div>
              <div><Label>Topic</Label><Input placeholder="e.g. Quadratic Equations" value={topic} onChange={e => setTopic(e.target.value)} /></div>
            </div>
            <Button onClick={generate} disabled={loading} className="w-full sm:w-auto">
              {loading ? 'Generating…' : 'Generate 5-Question Quiz'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div><CardTitle>{subject} — {topic}</CardTitle><CardDescription>{questions.length} questions</CardDescription></div>
            <Button variant="ghost" size="sm" onClick={reset}><RotateCcw className="h-4 w-4 mr-1" />New</Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {questions.map((q, i) => {
              const chosen = answers[i];
              const correct = q.correct_answer;
              return (
                <div key={i} className="space-y-2 pb-4 border-b last:border-0">
                  <p className="font-medium">{i + 1}. {q.question}</p>
                  <RadioGroup value={chosen} onValueChange={v => setAnswers(a => ({ ...a, [i]: v }))} disabled={submitted}>
                    {q.options.map((opt, oi) => {
                      const isCorrect = submitted && opt === correct;
                      const isWrong = submitted && chosen === opt && opt !== correct;
                      return (
                        <div key={oi} className={`flex items-center gap-2 rounded p-2 ${isCorrect ? 'bg-green-500/10' : isWrong ? 'bg-red-500/10' : ''}`}>
                          <RadioGroupItem value={opt} id={`q${i}o${oi}`} />
                          <Label htmlFor={`q${i}o${oi}`} className="cursor-pointer flex-1">{opt}</Label>
                          {isCorrect && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                          {isWrong && <XCircle className="h-4 w-4 text-red-600" />}
                        </div>
                      );
                    })}
                  </RadioGroup>
                  {submitted && q.explanation && (
                    <p className="text-sm text-muted-foreground bg-muted/50 rounded p-2">💡 {q.explanation}</p>
                  )}
                </div>
              );
            })}
            {!submitted && <Button onClick={submit} className="w-full">Submit & Get Feedback</Button>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Recent Attempts</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {history.length === 0 ? <p className="text-sm text-muted-foreground">No attempts yet.</p> :
            history.map(h => (
              <div key={h.id} className="flex items-center justify-between p-2 rounded border">
                <div>
                  <p className="font-medium text-sm">{h.subject || 'Quiz'}</p>
                  <p className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString()}</p>
                </div>
                <Badge variant={h.correct_answers / (h.total_questions || 1) >= 0.7 ? 'default' : 'secondary'}>
                  {h.correct_answers}/{h.total_questions}
                </Badge>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentQuizzesPage;
