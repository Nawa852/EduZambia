import { useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, Loader2, Download, Printer, Wand2, BarChart3 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ChartSpec {
  kind: 'bar' | 'line' | 'pie';
  title: string;
  data: Array<Record<string, string | number>>;
  series: string[];
}
interface Question {
  id: string;
  type: 'mcq' | 'short' | 'long' | 'true_false';
  prompt: string;
  points: number;
  options?: string[];
  answer?: string;
  chart?: ChartSpec;
}
interface Test {
  title: string;
  subject: string;
  grade: string;
  durationMinutes: number;
  instructions: string;
  sections: Array<{ heading: string; questions: Question[] }>;
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

function ChartView({ spec }: { spec: ChartSpec }) {
  if (spec.kind === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={spec.data}>
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {spec.series.map((s, i) => (
            <Bar key={s} dataKey={s} fill={PIE_COLORS[i % PIE_COLORS.length]} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }
  if (spec.kind === 'line') {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={spec.data}>
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {spec.series.map((s, i) => (
            <Line key={s} type="monotone" dataKey={s} stroke={PIE_COLORS[i % PIE_COLORS.length]} strokeWidth={2} dot />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }
  // pie
  const k = spec.series[0];
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={spec.data} dataKey={k} nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
          {spec.data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export default function TeacherTestGeneratorPage() {
  const [subject, setSubject] = useState('Mathematics');
  const [grade, setGrade] = useState('9');
  const [topic, setTopic] = useState('Statistics and Data Handling');
  const [duration, setDuration] = useState(60);
  const [numQ, setNumQ] = useState(12);
  const [level, setLevel] = useState('standard');
  const [withCharts, setWithCharts] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [test, setTest] = useState<Test | null>(null);
  const paperRef = useRef<HTMLDivElement>(null);

  const generate = async () => {
    setLoading(true); setTest(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-test-generator', {
        body: { subject, grade, topic, durationMinutes: duration, numQuestions: numQ, level, includeCharts: withCharts },
      });
      if (error) throw error;
      if (!data?.test?.sections) throw new Error('Invalid response');
      setTest(data.test as Test);
      toast.success('Test generated');
    } catch (e: any) {
      toast.error(e.message || 'Generation failed');
    } finally { setLoading(false); }
  };

  const exportPDF = async () => {
    if (!paperRef.current || !test) return;
    toast.info('Rendering PDF…');
    try {
      const canvas = await html2canvas(paperRef.current, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const imgW = pageW - 40;
      const imgH = (canvas.height * imgW) / canvas.width;
      let heightLeft = imgH;
      let position = 20;
      pdf.addImage(img, 'PNG', 20, position, imgW, imgH);
      heightLeft -= (pageH - 40);
      while (heightLeft > 0) {
        position = heightLeft - imgH + 20;
        pdf.addPage();
        pdf.addImage(img, 'PNG', 20, position, imgW, imgH);
        heightLeft -= (pageH - 40);
      }
      pdf.save(`${test.title.replace(/\s+/g, '_')}.pdf`);
    } catch (e: any) {
      toast.error(e.message || 'PDF export failed');
    }
  };

  const printPaper = () => window.print();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold">AI Test Generator</h1>
          <p className="text-xs text-muted-foreground">ECZ-aligned tests with embedded charts, LaTeX math and instant PDF.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[340px_1fr] gap-4">
        {/* Controls */}
        <Card className="p-4 space-y-3 h-fit lg:sticky lg:top-4">
          <div>
            <Label className="text-xs">Subject</Label>
            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Mathematics" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Grade</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['7','8','9','10','11','12'].map(g => <SelectItem key={g} value={g}>Grade {g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Level</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Topic / focus</Label>
            <Textarea rows={2} value={topic} onChange={e => setTopic(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Duration (min)</Label>
              <Input type="number" value={duration} onChange={e => setDuration(Number(e.target.value) || 60)} />
            </div>
            <div>
              <Label className="text-xs">Questions</Label>
              <Input type="number" value={numQ} onChange={e => setNumQ(Number(e.target.value) || 10)} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Include charts</Label>
            <Switch checked={withCharts} onCheckedChange={setWithCharts} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Show answer key</Label>
            <Switch checked={showAnswers} onCheckedChange={setShowAnswers} />
          </div>
          <Button className="w-full gap-2" disabled={loading} onClick={generate}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {loading ? 'Generating…' : 'Generate test'}
          </Button>
          {test && (
            <div className="flex gap-2 pt-2 border-t border-border">
              <Button variant="outline" className="flex-1 gap-2" onClick={exportPDF}>
                <Download className="w-4 h-4" /> PDF
              </Button>
              <Button variant="outline" className="flex-1 gap-2" onClick={printPaper}>
                <Printer className="w-4 h-4" /> Print
              </Button>
            </div>
          )}
        </Card>

        {/* Paper */}
        <Card className="p-0 overflow-hidden">
          <Tabs defaultValue="paper">
            <div className="border-b border-border px-3 pt-3">
              <TabsList>
                <TabsTrigger value="paper" className="text-xs">Test paper</TabsTrigger>
                <TabsTrigger value="json" className="text-xs" disabled={!test}>JSON</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="paper" className="m-0">
              <div className="bg-muted/20 p-4">
                <div ref={paperRef} className="bg-white text-black mx-auto max-w-3xl rounded-lg shadow-sm p-8 print:shadow-none print:p-0" style={{ fontFamily: 'Georgia, serif' }}>
                  {!test ? (
                    <div className="text-center py-20 text-gray-400 text-sm">
                      Configure on the left and click <strong>Generate test</strong>.
                    </div>
                  ) : (
                    <>
                      <header className="text-center border-b border-gray-300 pb-4 mb-6">
                        <div className="text-xs uppercase tracking-widest text-gray-500">Edu Zambia · ECZ aligned</div>
                        <h1 className="text-2xl font-bold mt-1">{test.title}</h1>
                        <div className="text-xs text-gray-600 mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
                          <span>Subject: <strong>{test.subject}</strong></span>
                          <span>Grade: <strong>{test.grade}</strong></span>
                          <span>Duration: <strong>{test.durationMinutes} min</strong></span>
                        </div>
                        {test.instructions && (
                          <p className="text-xs text-gray-700 mt-3 italic max-w-xl mx-auto">{test.instructions}</p>
                        )}
                      </header>
                      {test.sections.map((sec, si) => (
                        <section key={si} className="mb-6">
                          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 border-b border-gray-200 pb-1 mb-3">
                            {sec.heading}
                          </h2>
                          <ol className="space-y-5">
                            {sec.questions.map((q, qi) => (
                              <li key={q.id || qi} className="text-sm leading-relaxed">
                                <div className="flex justify-between items-start gap-3">
                                  <div className="flex-1">
                                    <span className="font-semibold mr-1">{qi + 1}.</span>
                                    <span className="prose prose-sm max-w-none inline">
                                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                        {q.prompt}
                                      </ReactMarkdown>
                                    </span>
                                  </div>
                                  <Badge variant="outline" className="text-[10px] shrink-0">{q.points} pt</Badge>
                                </div>
                                {q.chart && (
                                  <div className="my-3 border border-gray-200 rounded-lg p-3">
                                    <div className="text-xs font-semibold text-gray-600 mb-1 text-center">{q.chart.title}</div>
                                    <ChartView spec={q.chart} />
                                  </div>
                                )}
                                {q.type === 'mcq' && q.options && (
                                  <ul className="mt-2 ml-6 space-y-1">
                                    {q.options.map((o, oi) => (
                                      <li key={oi} className="text-sm">
                                        <span className="font-medium mr-1">{String.fromCharCode(65 + oi)}.</span> {o}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                                {q.type === 'true_false' && (
                                  <div className="mt-2 ml-6 text-xs text-gray-500">True / False</div>
                                )}
                                {q.type === 'short' && <div className="mt-2 ml-6 border-b border-dashed border-gray-300 h-6" />}
                                {q.type === 'long' && (
                                  <div className="mt-2 ml-6 space-y-3">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                      <div key={i} className="border-b border-dashed border-gray-300 h-5" />
                                    ))}
                                  </div>
                                )}
                                {showAnswers && q.answer && (
                                  <div className="mt-2 ml-6 text-xs bg-emerald-50 border border-emerald-200 rounded px-2 py-1 text-emerald-900">
                                    <span className="font-semibold">Answer:</span>{' '}
                                    <span className="prose prose-xs max-w-none inline">
                                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                        {q.answer}
                                      </ReactMarkdown>
                                    </span>
                                  </div>
                                )}
                              </li>
                            ))}
                          </ol>
                        </section>
                      ))}
                      <footer className="text-center text-[10px] text-gray-400 mt-8 border-t border-gray-200 pt-3">
                        — End of paper — generated by Nexus Learning BrightSphere AI —
                      </footer>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="json" className="m-0 p-4 bg-muted/20">
              <pre className="text-[10px] overflow-auto max-h-[70vh] bg-card p-3 rounded-lg border border-border">
                {JSON.stringify(test, null, 2)}
              </pre>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
