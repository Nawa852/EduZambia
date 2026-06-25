import React, { useState, useRef } from 'react';
import { Loader2, Download, Wand2, Printer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, TableLayoutType,
} from 'docx';
import { saveAs } from 'file-saver';

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

function buildDocx(s: SchemeOfWork): Document {
  const headerLines = [
    new Paragraph({ alignment: AlignmentType.CENTER, children: [tr('MINISTRY OF EDUCATION', { bold: true, size: 24 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [tr('NALIONWA SECONDARY SCHOOL', { bold: true, size: 24 })] }),
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
  const [s, setS] = useState<SchemeOfWork>(empty());
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const setField = <K extends keyof SchemeOfWork>(k: K, v: SchemeOfWork[K]) => setS((p) => ({ ...p, [k]: v }));
  const setWeek = (i: number, field: keyof Week, v: string | number) =>
    setS((p) => ({ ...p, weeks: p.weeks.map((w, idx) => (idx === i ? { ...w, [field]: v } : w)) }));

  const aiFill = async () => {
    if (!s.subject || !s.grade) { toast.error('Enter subject and grade first'); return; }
    setLoading(true);
    abortRef.current = new AbortController();
    try {
      const sys = `You are an expert Zambian secondary school curriculum planner aligned to the ECZ. Return ONLY a JSON array of 13 items (no markdown), one per week, schema:
[{"wk":1,"topic":"","subTopic":"","specificOutcomes":"","content":"","skills":"","values":"","references":""}]`;
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-lesson-generator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ subject: s.subject, grade: `Grade ${s.grade}`, topic: `Term ${s.term} scheme of work — 13 weeks`, duration: '13 weeks', systemOverride: sys, jsonOnly: true }),
        signal: abortRef.current.signal,
      });
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
      const m = text.match(/\[[\s\S]*\]/);
      if (!m) throw new Error('No JSON');
      const arr: Week[] = JSON.parse(m[0]);
      setS((p) => ({
        ...p,
        weeks: p.weeks.map((w, i) => ({ ...w, ...(arr[i] || {}), wk: i + 1 })),
      }));
      toast.success('Scheme generated');
    } catch (e: any) {
      if (e.name !== 'AbortError') toast.error('Generation failed');
    }
    setLoading(false);
  };

  const exportDocx = async () => {
    try {
      const doc = buildDocx(s);
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `SchemeOfWork_${s.subject || 'Subject'}_Grade${s.grade}_Term${s.term}.docx`);
      toast.success('Downloaded .docx');
    } catch { toast.error('Export failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="print:hidden flex flex-wrap items-center gap-2 p-3 bg-card rounded-xl border">
        <Button onClick={aiFill} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          AI Fill 13 Weeks
        </Button>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={() => window.print()} className="gap-2"><Printer className="h-4 w-4" />Print / PDF</Button>
          <Button onClick={exportDocx} className="gap-2"><Download className="h-4 w-4" />Export .docx</Button>
        </div>
      </div>

      <Card className="border-2 border-foreground/20">
        <CardContent className="p-6 font-serif text-sm bg-background print:p-0">
          {/* Header */}
          <div className="text-center font-bold text-base uppercase tracking-wide">MINISTRY OF EDUCATION</div>
          <div className="text-center font-bold text-base uppercase tracking-wide">NALIONWA SECONDARY SCHOOL</div>
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
  );
};

export default SchemeOfWorkPage;
