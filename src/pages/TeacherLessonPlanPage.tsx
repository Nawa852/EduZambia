import React, { useState, useRef } from 'react';
import { Sparkles, Loader2, Download, Wand2, Printer, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from '@/components/Auth/AuthProvider';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, HeightRule, VerticalAlign, TableLayoutType,
} from 'docx';
import { saveAs } from 'file-saver';

interface Activity {
  phase: string;
  durationLabel: string;
  teacherActivity: string;
  pupilsActivity: string;
}

interface LessonPlan {
  teacherName: string;
  noOnRoll: string;
  boys: string;
  girls: string;
  durationMinutes: string;
  className: string;
  noPresent: string;
  tsNo: string;
  subject: string;
  sexMixed: string;
  date: string;
  topic: string;
  subTopic: string;
  specificOutcomes: string[];
  rationale: string;
  prerequisiteKnowledge: string;
  teachingAids: string;
  activities: Activity[];
  conclusion: string;
  evaluation: string;
  hodName: string;
  hodSignature: string;
  hodDate: string;
  deputyName: string;
  deputySignature: string;
  deputyDate: string;
  remarks: string;
}

const PHASES: { phase: Activity['phase']; durationLabel: string }[] = [
  { phase: 'INTRODUCTION', durationLabel: '0–10 MIN' },
  { phase: 'LESSON DEVELOPMENT', durationLabel: '10–35 MIN' },
  { phase: 'GUIDED PRACTICE', durationLabel: '35–55 MIN' },
  { phase: 'WRITTEN ACTIVITY', durationLabel: '55–68 MIN' },
  { phase: 'SUMMARY & HOMEWORK', durationLabel: '68–80 MIN' },
];

const empty = (): LessonPlan => ({
  teacherName: '', noOnRoll: '', boys: '', girls: '', durationMinutes: '80',
  className: '', noPresent: '', tsNo: '', subject: '', sexMixed: '', date: '',
  topic: '', subTopic: '', specificOutcomes: ['', '', '', ''],
  rationale: '', prerequisiteKnowledge: '', teachingAids: '',
  activities: PHASES.map((p) => ({ ...p, teacherActivity: '', pupilsActivity: '' })),
  conclusion: '', evaluation: '',
  hodName: '', hodSignature: '', hodDate: '',
  deputyName: '', deputySignature: '', deputyDate: '',
  remarks: '',
});

const cellBorder = { style: BorderStyle.SINGLE, size: 6, color: '000000' };
const allBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

const labelRun = (t: string) => new TextRun({ text: t, bold: true, font: 'Times New Roman', size: 22 });
const valueRun = (t: string) => new TextRun({ text: t || ' ', font: 'Times New Roman', size: 22 });
const para = (children: TextRun[], align: AlignmentType = AlignmentType.LEFT) =>
  new Paragraph({ children, alignment: align });
const labelPara = (label: string, value: string) =>
  new Paragraph({ children: [labelRun(`${label} `), valueRun(value)] });

function buildDocx(plan: LessonPlan): Document {
  // Header table (4 rows)
  const headerTable = new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [1872, 1872, 1872, 1872, 1872],
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: allBorders,
            columnSpan: 5,
            children: [para([new TextRun({ text: 'LESSON PLAN', bold: true, font: 'Times New Roman', size: 28 })], AlignmentType.CENTER)],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ borders: allBorders, children: [labelPara('NAME OF TEACHER:', plan.teacherName)] }),
          new TableCell({ borders: allBorders, children: [labelPara('NO. ON ROLL:', plan.noOnRoll)] }),
          new TableCell({ borders: allBorders, children: [labelPara('BOYS:', plan.boys)] }),
          new TableCell({ borders: allBorders, children: [labelPara('GIRLS:', plan.girls)] }),
          new TableCell({ borders: allBorders, children: [labelPara('DURATION:', `${plan.durationMinutes} minutes`)] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ borders: allBorders, children: [labelPara('CLASS:', plan.className)] }),
          new TableCell({ borders: allBorders, children: [labelPara('NO. PRESENT:', plan.noPresent)] }),
          new TableCell({ borders: allBorders, children: [para([valueRun('')])] }),
          new TableCell({ borders: allBorders, children: [labelPara('TS. NO:', plan.tsNo)] }),
          new TableCell({ borders: allBorders, children: [para([valueRun('')])] }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({ borders: allBorders, children: [labelPara('SUBJECT:', plan.subject)] }),
          new TableCell({ borders: allBorders, children: [labelPara('SEX MIXED:', plan.sexMixed)] }),
          new TableCell({ borders: allBorders, children: [para([valueRun('')])] }),
          new TableCell({ borders: allBorders, children: [labelPara('DATE:', plan.date)] }),
          new TableCell({ borders: allBorders, children: [para([valueRun('')])] }),
        ],
      }),
    ],
  });

  const metaRow = (label: string, value: string) =>
    new TableRow({
      children: [
        new TableCell({
          borders: allBorders,
          children: [new Paragraph({ children: [labelRun(`${label} `), valueRun(value)] })],
        }),
      ],
    });

  const outcomesValue = plan.specificOutcomes
    .map((o, i) => `${i + 1}. ${o}`)
    .join('   ');

  const metaTable = new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    layout: TableLayoutType.FIXED,
    rows: [
      metaRow('TOPIC:', plan.topic),
      metaRow('SUB TOPIC:', plan.subTopic),
      new TableRow({
        children: [new TableCell({
          borders: allBorders,
          children: [new Paragraph({ children: [labelRun('SPECIFIC OUTCOMES: '), valueRun('By the end of the lesson, pupils should be able to: ' + outcomesValue)] })],
        })],
      }),
      metaRow('RATIONALE:', plan.rationale),
      metaRow('PRE-REQUISITE KNOWLEDGE:', plan.prerequisiteKnowledge),
      metaRow('LEARNING/TEACHING AIDS:', plan.teachingAids),
    ],
  });

  const activityRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: ['DURATION (MINS)', 'CONTENT / INTRODUCTION', 'TEACHER ACTIVITY', 'PUPILS ACTIVITY'].map(
        (h) => new TableCell({
          borders: allBorders,
          children: [para([labelRun(h)], AlignmentType.CENTER)],
        }),
      ),
    }),
    ...plan.activities.map((a) => new TableRow({
      children: [
        new TableCell({ borders: allBorders, children: [para([labelRun(a.durationLabel)], AlignmentType.CENTER)] }),
        new TableCell({ borders: allBorders, children: [para([labelRun(a.phase)])] }),
        new TableCell({ borders: allBorders, children: [para([valueRun(a.teacherActivity)])] }),
        new TableCell({ borders: allBorders, children: [para([valueRun(a.pupilsActivity)])] }),
      ],
    })),
    new TableRow({
      children: [
        new TableCell({ borders: allBorders, columnSpan: 2, children: [new Paragraph({ children: [labelRun('CONCLUSION: '), valueRun(plan.conclusion)] })] }),
        new TableCell({ borders: allBorders, columnSpan: 2, children: [new Paragraph({ children: [labelRun('EVALUATION: '), valueRun(plan.evaluation)] })] }),
      ],
    }),
  ];

  const activityTable = new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [1500, 2620, 2620, 2620],
    layout: TableLayoutType.FIXED,
    rows: activityRows,
  });

  const signOff = new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [4680, 4680],
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        children: [
          new TableCell({ borders: allBorders, children: [
            new Paragraph({ children: [labelRun('HEAD OF DEPARTMENT')] }),
            labelPara('Name:', plan.hodName),
            labelPara('Signature:', plan.hodSignature),
            labelPara('Date:', plan.hodDate),
          ]}),
          new TableCell({ borders: allBorders, children: [
            new Paragraph({ children: [labelRun('DEPUTY HEAD TEACHER')] }),
            labelPara('Name:', plan.deputyName),
            labelPara('Signature:', plan.deputySignature),
            labelPara('Date:', plan.deputyDate),
          ]}),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            borders: allBorders,
            columnSpan: 2,
            children: [new Paragraph({ children: [labelRun('GENERAL REMARKS / OBSERVATIONS: '), valueRun(plan.remarks)] })],
          }),
        ],
      }),
    ],
  });

  return new Document({
    styles: { default: { document: { run: { font: 'Times New Roman', size: 22 } } } },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 720, bottom: 720, left: 900, right: 900 } } },
      children: [headerTable, new Paragraph(''), metaTable, new Paragraph(''), activityTable, new Paragraph(''), signOff],
    }],
  });
}

const inputCls = 'w-full bg-transparent border-0 border-b border-dotted border-foreground/40 focus:outline-none focus:border-primary px-1 py-0.5 text-sm';

const TeacherLessonPlanPage: React.FC = () => {
  const { user } = useAuth();
  const [plan, setPlan] = useState<LessonPlan>(empty());
  const [loading, setLoading] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiSubject, setAiSubject] = useState('Mathematics');
  const [aiGrade, setAiGrade] = useState('Grade 10');
  const abortRef = useRef<AbortController | null>(null);

  const set = <K extends keyof LessonPlan>(k: K, v: LessonPlan[K]) => setPlan((p) => ({ ...p, [k]: v }));
  const setOutcome = (i: number, v: string) =>
    setPlan((p) => ({ ...p, specificOutcomes: p.specificOutcomes.map((o, idx) => (idx === i ? v : o)) }));
  const setActivity = (i: number, field: 'teacherActivity' | 'pupilsActivity', v: string) =>
    setPlan((p) => ({ ...p, activities: p.activities.map((a, idx) => (idx === i ? { ...a, [field]: v } : a)) }));

  const aiFill = async () => {
    if (!aiTopic.trim()) { toast.error('Enter a topic to generate'); return; }
    setLoading(true);
    abortRef.current = new AbortController();
    try {
      const sys = `You are an expert Zambian secondary school teacher writing lesson plans aligned to the ECZ (Examinations Council of Zambia) curriculum. Return ONLY valid JSON matching this schema (no markdown):
{"topic":"","subTopic":"","specificOutcomes":["","","",""],"rationale":"","prerequisiteKnowledge":"","teachingAids":"","activities":[{"phase":"INTRODUCTION","teacherActivity":"","pupilsActivity":""},{"phase":"LESSON DEVELOPMENT","teacherActivity":"","pupilsActivity":""},{"phase":"GUIDED PRACTICE","teacherActivity":"","pupilsActivity":""},{"phase":"WRITTEN ACTIVITY","teacherActivity":"","pupilsActivity":""},{"phase":"SUMMARY & HOMEWORK","teacherActivity":"","pupilsActivity":""}],"conclusion":"","evaluation":""}
Always produce exactly 4 specific outcomes and exactly 5 activity phases in the order above.`;
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-lesson-generator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ subject: aiSubject, grade: aiGrade, topic: aiTopic, duration: '80 minutes', systemOverride: sys, jsonOnly: true }),
        signal: abortRef.current.signal,
      });
      if (resp.status === 429) { toast.error('Rate limit. Try again.'); setLoading(false); return; }
      if (resp.status === 402) { toast.error('AI credits exhausted.'); setLoading(false); return; }
      if (!resp.ok || !resp.body) throw new Error('Failed');
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = ''; let text = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf('\n')) !== -1) {
          let line = buf.slice(0, idx); buf = buf.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try { const p = JSON.parse(json); const c = p.choices?.[0]?.delta?.content; if (c) text += c; } catch {}
        }
      }
      const m = text.match(/\{[\s\S]*\}/);
      if (!m) throw new Error('No JSON');
      const data = JSON.parse(m[0]);
      setPlan((p) => ({
        ...p,
        subject: aiSubject,
        className: aiGrade,
        topic: data.topic ?? aiTopic,
        subTopic: data.subTopic ?? '',
        specificOutcomes: Array.isArray(data.specificOutcomes) ? [...data.specificOutcomes, '', '', '', ''].slice(0, 4) : p.specificOutcomes,
        rationale: data.rationale ?? '',
        prerequisiteKnowledge: data.prerequisiteKnowledge ?? '',
        teachingAids: data.teachingAids ?? '',
        activities: PHASES.map((ph, i) => ({
          ...ph,
          teacherActivity: data.activities?.[i]?.teacherActivity ?? '',
          pupilsActivity: data.activities?.[i]?.pupilsActivity ?? '',
        })),
        conclusion: data.conclusion ?? '',
        evaluation: data.evaluation ?? '',
      }));
      toast.success('Lesson plan generated');
    } catch (e: any) {
      if (e.name !== 'AbortError') toast.error('Generation failed');
    }
    setLoading(false);
  };

  const exportDocx = async () => {
    try {
      const doc = buildDocx(plan);
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `LessonPlan_${plan.subject || 'Lesson'}_${plan.date || 'draft'}.docx`);
      toast.success('Downloaded .docx');
    } catch { toast.error('Export failed'); }
  };

  const onPrint = () => window.print();

  return (
    <div className="space-y-4">
      {/* Toolbar (hidden on print) */}
      <div className="print:hidden flex flex-wrap items-center gap-2 p-3 bg-card rounded-xl border">
        <Input placeholder="Topic for AI (e.g. Quadratic Equations)" value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} className="w-64" />
        <Input placeholder="Subject" value={aiSubject} onChange={(e) => setAiSubject(e.target.value)} className="w-40" />
        <Input placeholder="Grade" value={aiGrade} onChange={(e) => setAiGrade(e.target.value)} className="w-32" />
        <Button onClick={aiFill} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          AI Fill
        </Button>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={onPrint} className="gap-2"><Printer className="h-4 w-4" />Print / PDF</Button>
          <Button onClick={exportDocx} className="gap-2"><Download className="h-4 w-4" />Export .docx</Button>
        </div>
      </div>

      {/* Document preview — Nalionwa format */}
      <Card className="border-2 border-foreground/20">
        <CardContent className="p-6 font-serif text-sm bg-background print:p-0">
          {/* Header table */}
          <table className="w-full border-collapse border border-foreground text-sm">
            <tbody>
              <tr>
                <td colSpan={5} className="border border-foreground p-2 text-center font-bold uppercase text-base tracking-wide">
                  Lesson Plan
                </td>
              </tr>
              <tr>
                <td className="border border-foreground p-2 w-1/5"><span className="font-bold">NAME OF TEACHER: </span><input className={inputCls} value={plan.teacherName} onChange={(e) => set('teacherName', e.target.value)} /></td>
                <td className="border border-foreground p-2 w-1/5"><span className="font-bold">NO. ON ROLL: </span><input className={inputCls} value={plan.noOnRoll} onChange={(e) => set('noOnRoll', e.target.value)} /></td>
                <td className="border border-foreground p-2 w-1/5"><span className="font-bold">BOYS: </span><input className={inputCls} value={plan.boys} onChange={(e) => set('boys', e.target.value)} /></td>
                <td className="border border-foreground p-2 w-1/5"><span className="font-bold">GIRLS: </span><input className={inputCls} value={plan.girls} onChange={(e) => set('girls', e.target.value)} /></td>
                <td className="border border-foreground p-2 w-1/5"><span className="font-bold">DURATION: </span><input className={inputCls} value={plan.durationMinutes} onChange={(e) => set('durationMinutes', e.target.value)} /> <span className="text-xs">minutes</span></td>
              </tr>
              <tr>
                <td className="border border-foreground p-2"><span className="font-bold">CLASS: </span><input className={inputCls} value={plan.className} onChange={(e) => set('className', e.target.value)} /></td>
                <td className="border border-foreground p-2"><span className="font-bold">NO. PRESENT: </span><input className={inputCls} value={plan.noPresent} onChange={(e) => set('noPresent', e.target.value)} /></td>
                <td className="border border-foreground p-2"></td>
                <td className="border border-foreground p-2"><span className="font-bold">TS. NO: </span><input className={inputCls} value={plan.tsNo} onChange={(e) => set('tsNo', e.target.value)} placeholder="e.g. 3 of 12" /></td>
                <td className="border border-foreground p-2"></td>
              </tr>
              <tr>
                <td className="border border-foreground p-2"><span className="font-bold">SUBJECT: </span><input className={inputCls} value={plan.subject} onChange={(e) => set('subject', e.target.value)} /></td>
                <td className="border border-foreground p-2"><span className="font-bold">SEX MIXED: </span><input className={inputCls} value={plan.sexMixed} onChange={(e) => set('sexMixed', e.target.value)} /></td>
                <td className="border border-foreground p-2"></td>
                <td className="border border-foreground p-2"><span className="font-bold">DATE: </span><input className={inputCls} value={plan.date} onChange={(e) => set('date', e.target.value)} /></td>
                <td className="border border-foreground p-2"></td>
              </tr>
            </tbody>
          </table>

          {/* Meta table */}
          <table className="w-full border-collapse border border-foreground text-sm mt-3">
            <tbody>
              <tr><td className="border border-foreground p-2"><span className="font-bold">TOPIC: </span><input className={inputCls} value={plan.topic} onChange={(e) => set('topic', e.target.value)} /></td></tr>
              <tr><td className="border border-foreground p-2"><span className="font-bold">SUB TOPIC: </span><input className={inputCls} value={plan.subTopic} onChange={(e) => set('subTopic', e.target.value)} /></td></tr>
              <tr>
                <td className="border border-foreground p-2 align-top">
                  <span className="font-bold">SPECIFIC OUTCOMES: </span>
                  <span>By the end of the lesson, pupils should be able to:</span>
                  <ol className="list-decimal pl-6 mt-1 space-y-1">
                    {plan.specificOutcomes.map((o, i) => (
                      <li key={i}><input className={inputCls} value={o} onChange={(e) => setOutcome(i, e.target.value)} /></li>
                    ))}
                  </ol>
                </td>
              </tr>
              <tr><td className="border border-foreground p-2"><span className="font-bold">RATIONALE: </span><textarea className={`${inputCls} resize-y min-h-[40px]`} value={plan.rationale} onChange={(e) => set('rationale', e.target.value)} /></td></tr>
              <tr><td className="border border-foreground p-2"><span className="font-bold">PRE-REQUISITE KNOWLEDGE: </span><textarea className={`${inputCls} resize-y min-h-[40px]`} value={plan.prerequisiteKnowledge} onChange={(e) => set('prerequisiteKnowledge', e.target.value)} /></td></tr>
              <tr><td className="border border-foreground p-2"><span className="font-bold">LEARNING/TEACHING AIDS: </span><textarea className={`${inputCls} resize-y min-h-[40px]`} value={plan.teachingAids} onChange={(e) => set('teachingAids', e.target.value)} /></td></tr>
            </tbody>
          </table>

          {/* Activity table */}
          <table className="w-full border-collapse border border-foreground text-sm mt-3">
            <thead>
              <tr>
                <th className="border border-foreground p-2 w-[14%]">DURATION (MINS)</th>
                <th className="border border-foreground p-2 w-[22%]">CONTENT / INTRODUCTION</th>
                <th className="border border-foreground p-2">TEACHER ACTIVITY</th>
                <th className="border border-foreground p-2">PUPILS ACTIVITY</th>
              </tr>
            </thead>
            <tbody>
              {plan.activities.map((a, i) => (
                <tr key={i}>
                  <td className="border border-foreground p-2 text-center font-bold align-top">{a.durationLabel}</td>
                  <td className="border border-foreground p-2 font-bold align-top">{a.phase}</td>
                  <td className="border border-foreground p-2 align-top"><textarea className={`${inputCls} resize-y min-h-[56px]`} value={a.teacherActivity} onChange={(e) => setActivity(i, 'teacherActivity', e.target.value)} /></td>
                  <td className="border border-foreground p-2 align-top"><textarea className={`${inputCls} resize-y min-h-[56px]`} value={a.pupilsActivity} onChange={(e) => setActivity(i, 'pupilsActivity', e.target.value)} /></td>
                </tr>
              ))}
              <tr>
                <td colSpan={2} className="border border-foreground p-2 align-top"><span className="font-bold">CONCLUSION: </span><textarea className={`${inputCls} resize-y min-h-[56px]`} value={plan.conclusion} onChange={(e) => set('conclusion', e.target.value)} /></td>
                <td colSpan={2} className="border border-foreground p-2 align-top"><span className="font-bold">EVALUATION: </span><textarea className={`${inputCls} resize-y min-h-[56px]`} value={plan.evaluation} onChange={(e) => set('evaluation', e.target.value)} /></td>
              </tr>
            </tbody>
          </table>

          {/* Sign-off */}
          <table className="w-full border-collapse border border-foreground text-sm mt-3">
            <tbody>
              <tr>
                <td className="border border-foreground p-2 w-1/2 align-top">
                  <div className="font-bold">HEAD OF DEPARTMENT</div>
                  <div className="mt-1"><span className="font-bold">Name: </span><input className={inputCls} value={plan.hodName} onChange={(e) => set('hodName', e.target.value)} /></div>
                  <div className="mt-1"><span className="font-bold">Signature: </span><input className={inputCls} value={plan.hodSignature} onChange={(e) => set('hodSignature', e.target.value)} /></div>
                  <div className="mt-1"><span className="font-bold">Date: </span><input className={inputCls} value={plan.hodDate} onChange={(e) => set('hodDate', e.target.value)} /></div>
                </td>
                <td className="border border-foreground p-2 w-1/2 align-top">
                  <div className="font-bold">DEPUTY HEAD TEACHER</div>
                  <div className="mt-1"><span className="font-bold">Name: </span><input className={inputCls} value={plan.deputyName} onChange={(e) => set('deputyName', e.target.value)} /></div>
                  <div className="mt-1"><span className="font-bold">Signature: </span><input className={inputCls} value={plan.deputySignature} onChange={(e) => set('deputySignature', e.target.value)} /></div>
                  <div className="mt-1"><span className="font-bold">Date: </span><input className={inputCls} value={plan.deputyDate} onChange={(e) => set('deputyDate', e.target.value)} /></div>
                </td>
              </tr>
              <tr>
                <td colSpan={2} className="border border-foreground p-2"><span className="font-bold">GENERAL REMARKS / OBSERVATIONS: </span><textarea className={`${inputCls} resize-y min-h-[60px]`} value={plan.remarks} onChange={(e) => set('remarks', e.target.value)} /></td>
              </tr>
            </tbody>
          </table>

          {!user && (
            <p className="text-xs text-muted-foreground mt-3 print:hidden flex items-center gap-1">
              <FileText className="h-3 w-3" /> Sign in to save plans to your library.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherLessonPlanPage;
