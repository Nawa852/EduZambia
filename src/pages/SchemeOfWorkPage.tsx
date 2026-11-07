import React, { useState } from 'react';
import { Loader2, Download, Wand2, Printer, ListOrdered } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, TableLayoutType,
} from 'docx';
import { saveAs } from 'file-saver';
import { CurriculumPicker, type CurriculumSelection } from '@/components/Curriculum/CurriculumPicker';
import { gradeLabel } from '@/lib/curriculum';
import { SchoolBrandHeader } from '@/components/School/SchoolBrandHeader';
import { supabase } from '@/integrations/supabase/client';
import { parseSchemeDraft } from '@/lib/teacherDrafts';
import { useSchool } from '@/hooks/useSchool';
import { DocumentFlow } from '@/components/Teacher/DocumentFlow';
import { Label } from '@/components/ui/label';

interface Week {
  wk: number;
  topic: string;
  subTopic: string;
  specificOutcomes: string;
  content: string;
  skills: string;
  values: string;
  references: string;
}

interface SchemeOfWork {
  subject: string;
  term: string;
  year: string;
  tsNo: string;
  grade: string;
  department: string;
  weeks: Week[];
}

const COLS: { key: keyof Week; label: string; width: string }[] = [
  { key: 'wk', label: 'WK', width: 'w-[5%]' },
  { key: 'topic', label: 'TOPIC', width: 'w-[12%]' },
  { key: 'subTopic', label: 'SUB TOPIC', width: 'w-[12%]' },
  { key: 'specificOutcomes', label: 'SPECIFIC OUTCOMES', width: 'w-[20%]' },
  { key: 'content', label: 'CONTENT', width: 'w-[17%]' },
  { key: 'skills', label: 'SKILLS', width: 'w-[10%]' },
  { key: 'values', label: 'VALUES', width: 'w-[10%]' },
  { key: 'references', label: 'REFERENCES', width: 'w-[14%]' },
];

const empty = (): SchemeOfWork => ({
  subject: '', term: '1', year: String(new Date().getFullYear()),
  tsNo: '', grade: '10', department: 'SOCIAL SCIENCE',
  weeks: Array.from({ length: 13 }, (_, i) => ({
    wk: i + 1, topic: '', subTopic: '', specificOutcomes: '',
    content: '', skills: '', values: '', references: '',
  })),
});

const cellBorder = { style: BorderStyle.SINGLE, size: 6, color: '000000' };
const allBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

const tr = (t: string, opts: { bold?: boolean; size?: number } = {}) =>
  new TextRun({ text: t || ' ', font: 'Times New Roman', size: opts.size ?? 20, bold: opts.bold });

const inputCls = 'w-full bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-primary/40 px-1 py-0.5 text-xs resize-y';

function buildDocx(s: SchemeOfWork, schoolName: string): Document {
  const headerLines = [
    new Paragraph({ alignment: AlignmentType.CENTER, children: [tr('MINISTRY OF EDUCATION', { bold: true, size: 24 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [tr(schoolName, { bold: true, size: 24 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [tr(`${s.department.toUpperCase()} DEPARTMENT`, { bold: true, size: 24 })] }),
    new Paragraph({ children: [
      tr('SUBJECT: ', { bold: true }), tr(s.subject + '   '),
      tr('TERM: ', { bold: true }), tr(s.term + '   '),
      tr('YEAR: ', { bold: true }), tr(s.year + '   '),
      tr('TS NO: ', { bold: true }), tr(s.tsNo + '   '),
      tr('GRADE: ', { bold: true }), tr(s.grade),
    ] }),
  ];

  const headerRow = new TableRow({
    tableHeader: true,
    children: COLS.map((c) => new TableCell({
      borders: allBorders,
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [tr(c.label, { bold: true })] })],
    })),
  });

  const dataRows = s.weeks.map((w) => new TableRow({
    children: COLS.map((c) => new TableCell({
      borders: allBorders,
      children: [new Paragraph({ children: [tr(String(w[c.key] ?? ''))] })],
    })),
  }));

  const table = new Table({
    width: { size: 14000, type: WidthType.DXA },
    columnWidths: [700, 1680, 1680, 2800, 2380, 1400, 1400, 1960],
    layout: TableLayoutType.FIXED,
    rows: [headerRow, ...dataRows],
  });

  return new Document({
    styles: { default: { document: { run: { font: 'Times New Roman', size: 22 } } } },
    sections: [{
      properties: { page: { size: { width: 15840, height: 12240, orientation: undefined as any }, margin: { top: 720, bottom: 720, left: 720, right: 720 } } },
      children: [...headerLines, new Paragraph(''), table],
    }],
  });
}

const SchemeOfWorkPage: React.FC = () => {
  const { school } = useSchool();
  const [s, setS] = useState<SchemeOfWork>(empty());
  const [loading, setLoading] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const setField = <K extends keyof SchemeOfWork>(k: K, v: SchemeOfWork[K]) => setS((p) => ({ ...p, [k]: v }));
  const setWeek = (i: number, field: keyof Week, v: string | number) =>
    setS((p) => ({ ...p, weeks: p.weeks.map((w, idx) => (idx === i ? { ...w, [field]: v } : w)) }));

  const [syl, setSyl] = useState<CurriculumSelection | null>(null);
  const [startTopic, setStartTopic] = useState(0);

  /** Fill Week 1 → continue in syllabus order. Week 7 is Revision, week 13 is a Test. */
  const fillFromSyllabus = () => {
    if (!syl?.subject || !syl.topics.length) { toast.error('Pick grade and subject first'); return; }
    const subject = syl.subject;
    const selectedTopic = syl.topic;
    const first = selectedTopic ? Math.max(0, syl.topics.findIndex((t) => t.id === selectedTopic.id)) : startTopic;
    const queue = syl.topics.slice(first).flatMap((t) => {
      const comps = syl.competences.filter((c) => c.topic_id === t.id);
      return comps.length ? comps.map((c) => ({ t, c })) : [{ t, c: null as null | typeof comps[number] }];
    });
    let qi = 0;
    setS((p) => ({
      ...p,
      subject: subject.name,
      grade: gradeLabel(syl.grade).replace(/^Grade /, ''),
      weeks: p.weeks.map((w, i) => {
        const wk = i + 1;
        if (wk === 7) return { ...w, wk, topic: 'REVISION', subTopic: 'Revision of weeks 1–6', specificOutcomes: 'Consolidate competences covered so far', content: '', skills: '', values: '', references: '' };
        if (wk === 13) return { ...w, wk, topic: 'END OF TERM TEST', subTopic: 'Assessment', specificOutcomes: 'Assess competences covered this term', content: '', skills: '', values: '', references: '' };
        const item = queue[qi++];
        if (!item) return { ...w, wk };
        return {
          ...w, wk,
          topic: `${item.t.code ?? ''} ${item.t.title}`.trim(),
          subTopic: item.c ? `${item.c.code}` : '',
          specificOutcomes: item.c ? item.c.title : (item.t.objectives ?? []).join('; '),
          references: [subject.framework, subject.source_title, subject.syllabus_url, subject.verification_status === 'syllabus_verified' ? 'Verified syllabus' : 'Draft — verify against CDC syllabus'].filter(Boolean).join('; '),
        };
      }),
    }));
    setStartTopic(0);
    setReviewing(true);
    toast.success('Term filled in syllabus order — edit any week');
  };

  const aiFill = async () => {
    if (!syl?.subject || !syl.topics.length) { toast.error('Choose a curriculum subject with topics first'); return; }
    setLoading(true);
    try {
      const sys = `Create a Zambian teacher's scheme of work. Return ONLY a JSON object {"weeks":[{"wk":1,"topic":"","subTopic":"","specificOutcomes":"","content":"","skills":"","values":"","references":""}]} with exactly 13 ordered weeks. Use only the supplied curriculum topics and outcomes; never invent official codes or references. Preserve draft status when unverified. Week 7 is revision and week 13 is a test. Expand teaching content, skills and values with realistic low-resource activities. Curriculum context: ${JSON.stringify(syl)}`;
      const { data, error } = await supabase.functions.invoke('ai-lesson-generator', { body: {
        subject: syl.subject.name, grade: gradeLabel(syl.grade), topic: `Term ${s.term} scheme of work`, duration: '13 weeks', systemOverride: sys, jsonOnly: true,
      }});
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const sourceReference = [syl.subject.framework, syl.subject.source_title, syl.subject.syllabus_url, syl.subject.verification_status === 'syllabus_verified' ? 'Verified syllabus' : 'Draft — verify against CDC syllabus'].filter(Boolean).join('; ');
      const arr = parseSchemeDraft(data?.lessonPlan ?? '').map((week) => ({ ...week, references: sourceReference }));
      setS((p) => ({
        ...p,
        subject: syl.subject?.name ?? p.subject,
        grade: gradeLabel(syl.grade),
        weeks: p.weeks.map((w, i) => ({ ...w, ...(arr[i] || {}), wk: i + 1 })),
      }));
      toast.success('Scheme generated');
      setReviewing(true);
    } catch (e: any) {
      if (e.name !== 'AbortError') toast.error(e.message || 'Generation failed');
    }
    setLoading(false);
  };

  const exportDocx = async () => {
    try {
      const doc = buildDocx(s, school?.name ?? 'School name not configured');
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `SchemeOfWork_${s.subject || 'Subject'}_Grade${s.grade}_Term${s.term}.docx`);
      toast.success('Downloaded .docx');
    } catch { toast.error('Export failed'); }
  };

  return (
    <div className="space-y-4">
      <div className={`print:hidden space-y-4 ${reviewing ? 'hidden' : ''}`}>
        <h2 className="text-lg font-semibold">Plan your term</h2>
        <CurriculumPicker depth="topic" onChange={setSyl} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5"><Label htmlFor="scheme-term">Term</Label><select id="scheme-term" value={s.term} onChange={e => setField('term', e.target.value)} className="h-10 w-full rounded-md border bg-background px-3"><option value="1">Term 1</option><option value="2">Term 2</option><option value="3">Term 3</option></select></div>
          <div className="space-y-1.5"><Label htmlFor="scheme-year">Year</Label><Input id="scheme-year" type="number" value={s.year} onChange={e => setField('year', e.target.value)} /></div>
          <div className="col-span-2 space-y-1.5 sm:col-span-1"><Label htmlFor="scheme-department">Department</Label><Input id="scheme-department" value={s.department} onChange={e => setField('department', e.target.value)} /></div>
        </div>
        <Button variant="outline" onClick={fillFromSyllabus} disabled={loading || !syl?.topics.length} className="gap-2"><ListOrdered className="h-4 w-4" />Use syllabus outline</Button>
      </div>
      <DocumentFlow reviewing={reviewing} loading={loading} ready={!!syl?.subject && !!syl.topics.length} onGenerate={aiFill} onReview={() => setReviewing(true)} onSetup={() => setReviewing(false)} />
      {reviewing && <div className="print:hidden flex flex-wrap items-center gap-2">
        <span className="mr-auto text-sm font-medium">Draft · {s.subject || 'Scheme of work'} · 13 weeks</span>
          <Button variant="outline" onClick={() => window.print()} className="gap-2"><Printer className="h-4 w-4" />Print / PDF</Button>
          <Button onClick={exportDocx} className="gap-2"><Download className="h-4 w-4" />Export .docx</Button>
      </div>}

      <div className={`${reviewing ? '' : 'hidden print:block'} max-w-full overflow-x-auto print:overflow-visible`}>
      <Card className="min-w-[960px] rounded-lg border-foreground/20">
        <CardContent className="p-6 font-serif text-sm bg-background print:p-0">
          <SchoolBrandHeader />
          {/* Header */}
          <div className="text-center font-bold text-base uppercase tracking-wide">MINISTRY OF EDUCATION</div>
          {!school && <div className="text-center text-sm text-muted-foreground print:hidden">School name not configured</div>}
          <div className="text-center font-bold text-base uppercase tracking-wide">
            <input
              className="bg-transparent text-center font-bold uppercase border-b border-dotted border-foreground/40 focus:outline-none focus:border-primary"
              value={s.department}
              onChange={(e) => setField('department', e.target.value)}
              size={Math.max(10, s.department.length + 2)}
            /> DEPARTMENT
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm">
            <label className="flex items-center gap-1"><span className="font-bold">SUBJECT:</span><Input value={s.subject} onChange={(e) => setField('subject', e.target.value)} className="h-7 w-40" /></label>
            <label className="flex items-center gap-1"><span className="font-bold">TERM:</span><Input value={s.term} onChange={(e) => setField('term', e.target.value)} className="h-7 w-16" /></label>
            <label className="flex items-center gap-1"><span className="font-bold">YEAR:</span><Input value={s.year} onChange={(e) => setField('year', e.target.value)} className="h-7 w-24" /></label>
            <label className="flex items-center gap-1"><span className="font-bold">TS NO:</span><Input value={s.tsNo} onChange={(e) => setField('tsNo', e.target.value)} className="h-7 w-32" /></label>
            <label className="flex items-center gap-1"><span className="font-bold">GRADE:</span><Input value={s.grade} onChange={(e) => setField('grade', e.target.value)} className="h-7 w-16" /></label>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse border border-foreground text-xs">
              <thead>
                <tr className="bg-muted/30">
                  {COLS.map((c) => (
                    <th key={c.key} className={`border border-foreground p-1.5 ${c.width} text-center`}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {s.weeks.map((w, i) => (
                  <tr key={i}>
                    {COLS.map((c) => (
                      <td key={c.key} className="border border-foreground p-1 align-top">
                        {c.key === 'wk' ? (
                          <div className="text-center font-bold">{w.wk}</div>
                        ) : (
                          <textarea
                            className={inputCls}
                            rows={2}
                            value={String(w[c.key] ?? '')}
                            onChange={(e) => setWeek(i, c.key, e.target.value)}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default SchemeOfWorkPage;
