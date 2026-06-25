import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText, Loader2, Copy, Save, Trash2, Sparkles, Plus, X, Clock, FilePlus, Pill, Activity,
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const STREAM_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/medical-notes-generator`;
const DRAFT_KEY = 'medical_clinical_drafts_v1';

const BODY_SYSTEMS = [
  'Infectious', 'Cardiac', 'Respiratory', 'Endocrine', 'Neurological',
  'Gastrointestinal', 'Renal', 'Musculoskeletal', 'Hematological', 'Dermatological',
];

const COMMON_SYMPTOMS = [
  'Fever', 'Cough', 'Chest pain', 'Shortness of breath', 'Headache',
  'Abdominal pain', 'Nausea', 'Vomiting', 'Diarrhea', 'Fatigue',
  'Dizziness', 'Rash', 'Joint pain', 'Weight loss', 'Night sweats',
];

const COMMON_CONDITIONS = [
  'Malaria', 'Tuberculosis', 'Hypertension', 'Type 2 Diabetes', 'Pneumonia',
  'UTI', 'Gastroenteritis', 'HIV/AIDS', 'Asthma', 'Anemia',
];

type Draft = {
  id: string;
  title: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  condition: string;
  bodySystem: string;
  symptoms: string[];
  result: string;
  updatedAt: number;
};

type TemplateId = 'blank' | 'admission' | 'followup' | 'malaria' | 'antenatal' | 'discharge';

const TEMPLATES: Record<TemplateId, { label: string; icon: any; soap: Pick<Draft, 'subjective' | 'objective' | 'assessment' | 'plan'> }> = {
  blank: { label: 'Blank note', icon: FilePlus, soap: { subjective: '', objective: '', assessment: '', plan: '' } },
  admission: {
    label: 'Admission note', icon: FileText,
    soap: {
      subjective: 'Chief complaint:\nHistory of presenting illness:\nPast medical history:\nMedications:\nAllergies:\nSocial history:',
      objective: 'Vitals: BP __ / HR __ / RR __ / Temp __ / SpO2 __\nGeneral: \nHEENT: \nCardio: \nResp: \nAbdomen: \nNeuro: ',
      assessment: 'Primary diagnosis:\nDifferential:\n  1.\n  2.\n  3.',
      plan: 'Investigations:\nMedications:\nMonitoring:\nDisposition:',
    },
  },
  followup: {
    label: 'Follow-up visit', icon: Activity,
    soap: {
      subjective: 'Interval history since last visit:\nSymptom progression:\nAdherence to medication:',
      objective: 'Vitals: BP __ / HR __ / RR __ / Temp __\nFocused exam:',
      assessment: 'Disease control: (stable / improving / worsening)\nComplications:',
      plan: 'Continue / adjust medications:\nLabs:\nNext review:',
    },
  },
  malaria: {
    label: 'Malaria case', icon: Sparkles,
    soap: {
      subjective: 'Fever onset:\nChills/rigors:\nHeadache:\nTravel history (endemic zone):\nMosquito exposure:',
      objective: 'Temp __ °C, HR __, BP __\nPallor: \nSplenomegaly: \nRDT result: \nThick smear:',
      assessment: 'Uncomplicated vs severe malaria\nSeverity signs: impaired consciousness, hypoglycaemia, jaundice, anaemia',
      plan: 'Artemether-Lumefantrine (AL) per weight\nParacetamol for fever\nFluids\nReview in 48–72h or sooner if worsening',
    },
  },
  antenatal: {
    label: 'Antenatal visit', icon: Pill,
    soap: {
      subjective: 'GA (weeks):\nLMP:\nFetal movements:\nDanger signs (bleeding, headache, blurred vision, swelling):',
      objective: 'BP __ / Pulse __ / Weight __\nFundal height:\nFetal heart rate:\nUrinalysis:',
      assessment: 'Gravida __ Para __ at __ weeks, low / high risk\nComorbidities:',
      plan: 'Routine bloods if first visit\nIPTp-SP dose # __\nIron + folic acid\nNext ANC in __ weeks',
    },
  },
  discharge: {
    label: 'Discharge summary', icon: FileText,
    soap: {
      subjective: 'Reason for admission:\nKey events during stay:',
      objective: 'Discharge vitals:\nFinal exam findings:\nKey investigations:',
      assessment: 'Final diagnosis:\nComplications:\nCondition at discharge:',
      plan: 'Discharge medications:\nLifestyle advice:\nFollow-up appointment:\nRed-flag symptoms to return for:',
    },
  },
};

const emptyDraft = (): Draft => ({
  id: crypto.randomUUID(),
  title: 'Untitled note',
  subjective: '', objective: '', assessment: '', plan: '',
  condition: '', bodySystem: '', symptoms: [], result: '',
  updatedAt: Date.now(),
});

function loadDrafts(): Draft[] {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || '[]'); } catch { return []; }
}
function saveDrafts(drafts: Draft[]) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts.slice(0, 50)));
}

const MedicalClinicalNotesPage = () => {
  const [drafts, setDrafts] = useState<Draft[]>(() => loadDrafts());
  const [current, setCurrent] = useState<Draft>(() => loadDrafts()[0] || emptyDraft());
  const [loading, setLoading] = useState(false);
  const [symptomInput, setSymptomInput] = useState('');

  // Autosave with debounce
  useEffect(() => {
    const t = setTimeout(() => {
      const updated = { ...current, updatedAt: Date.now() };
      setDrafts((prev) => {
        const exists = prev.some(d => d.id === updated.id);
        const next = exists ? prev.map(d => d.id === updated.id ? updated : d) : [updated, ...prev];
        saveDrafts(next);
        return next;
      });
    }, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.subjective, current.objective, current.assessment, current.plan, current.title, current.condition, current.bodySystem, current.symptoms, current.result]);

  const update = (patch: Partial<Draft>) => setCurrent((c) => ({ ...c, ...patch }));

  const applyTemplate = (id: TemplateId) => {
    const t = TEMPLATES[id];
    update({ ...t.soap, title: id === 'blank' ? 'Untitled note' : t.label });
    toast({ title: `${t.label} loaded` });
  };

  const newNote = () => setCurrent(emptyDraft());

  const openDraft = (d: Draft) => setCurrent(d);

  const deleteDraft = (id: string) => {
    setDrafts((prev) => {
      const next = prev.filter(d => d.id !== id);
      saveDrafts(next);
      return next;
    });
    if (current.id === id) setCurrent(emptyDraft());
    toast({ title: 'Draft deleted' });
  };

  const toggleSymptom = (s: string) => {
    update({ symptoms: current.symptoms.includes(s) ? current.symptoms.filter(x => x !== s) : [...current.symptoms, s] });
  };

  const addSymptom = () => {
    const v = symptomInput.trim();
    if (!v) return;
    if (!current.symptoms.includes(v)) update({ symptoms: [...current.symptoms, v] });
    setSymptomInput('');
  };

  const generate = async () => {
    if (!current.subjective && !current.objective && !current.assessment && !current.plan) {
      toast({ title: 'Add at least one SOAP field or pick a template', variant: 'destructive' }); return;
    }
    setLoading(true); update({ result: '' });
    try {
      const tagContext = [
        current.condition && `Condition: ${current.condition}`,
        current.bodySystem && `Body system: ${current.bodySystem}`,
        current.symptoms.length && `Symptoms: ${current.symptoms.join(', ')}`,
      ].filter(Boolean).join('\n');
      const resp = await fetch(STREAM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          subjective: tagContext ? `${tagContext}\n\n${current.subjective}` : current.subjective,
          objective: current.objective,
          assessment: current.assessment,
          plan: current.plan,
        }),
      });
      if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error || 'Error'); }
      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let acc = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf('\n')) !== -1) {
          let line = buf.slice(0, idx); buf = buf.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const json = line.slice(6).trim();
          if (json === '[DONE]') break;
          try {
            const p = JSON.parse(json);
            const c = p.choices?.[0]?.delta?.content;
            if (c) { acc += c; update({ result: acc }); }
          } catch {}
        }
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const copyResult = () => {
    navigator.clipboard.writeText(current.result);
    toast({ title: 'Copied to clipboard' });
  };

  const sortedDrafts = useMemo(() => [...drafts].sort((a, b) => b.updatedAt - a.updatedAt), [drafts]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <FileText className="w-7 h-7 text-primary" /> Clinical Notes
          </h1>
          <p className="text-sm text-muted-foreground">Templates, autosave drafts and AI-assisted SOAP documentation.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={newNote}><Plus className="w-4 h-4 mr-1" /> New note</Button>
          <Button size="sm" onClick={generate} disabled={loading}>
            {loading ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Generating</> : <><Sparkles className="w-4 h-4 mr-1" /> Generate SOAP</>}
          </Button>
        </div>
      </div>

      {/* Templates */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Templates</p>
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(TEMPLATES) as TemplateId[]).map((id) => {
            const T = TEMPLATES[id]; const Icon = T.icon;
            return (
              <Button key={id} variant="outline" size="sm" onClick={() => applyTemplate(id)} className="gap-1.5">
                <Icon className="w-3.5 h-3.5" /> {T.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6">
        {/* Drafts sidebar */}
        <Card className="h-fit">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" /> Saved drafts <Badge variant="secondary" className="ml-auto">{drafts.length}</Badge></CardTitle>
          </CardHeader>
          <CardContent className="p-2 space-y-1 max-h-[420px] overflow-auto">
            {sortedDrafts.length === 0 && (
              <p className="text-xs text-muted-foreground p-3">No drafts yet. Edits autosave here.</p>
            )}
            {sortedDrafts.map((d) => (
              <div key={d.id} className={`group flex items-center gap-2 p-2 rounded-md text-sm cursor-pointer hover:bg-muted ${d.id === current.id ? 'bg-muted' : ''}`} onClick={() => openDraft(d)}>
                <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium text-foreground">{d.title || 'Untitled'}</div>
                  <div className="text-[10px] text-muted-foreground">{new Date(d.updatedAt).toLocaleString()}</div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); deleteDraft(d.id); }}>
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Editor */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <Input
                placeholder="Note title (e.g. Mwansa — fever ?malaria)"
                value={current.title}
                onChange={(e) => update({ title: e.target.value })}
                className="font-semibold text-base border-0 px-0 focus-visible:ring-0 shadow-none"
              />

              {/* Quick tags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Condition</p>
                  <div className="flex gap-2">
                    <Input
                      list="conditions"
                      value={current.condition}
                      onChange={(e) => update({ condition: e.target.value })}
                      placeholder="e.g. Malaria"
                    />
                    <datalist id="conditions">
                      {COMMON_CONDITIONS.map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {COMMON_CONDITIONS.slice(0, 6).map(c => (
                      <Badge key={c} variant={current.condition === c ? 'default' : 'outline'} className="cursor-pointer text-[10px]" onClick={() => update({ condition: c })}>{c}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Body system</p>
                  <Select value={current.bodySystem} onValueChange={(v) => update({ bodySystem: v })}>
                    <SelectTrigger><SelectValue placeholder="Select system" /></SelectTrigger>
                    <SelectContent>
                      {BODY_SYSTEMS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Symptoms</p>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add symptom and press Enter"
                    value={symptomInput}
                    onChange={(e) => setSymptomInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSymptom(); } }}
                  />
                  <Button variant="outline" onClick={addSymptom}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {current.symptoms.map(s => (
                    <Badge key={s} variant="default" className="gap-1 cursor-pointer" onClick={() => toggleSymptom(s)}>
                      {s} <X className="w-3 h-3" />
                    </Badge>
                  ))}
                  {COMMON_SYMPTOMS.filter(s => !current.symptoms.includes(s)).map(s => (
                    <Badge key={s} variant="outline" className="cursor-pointer text-[10px]" onClick={() => toggleSymptom(s)}>+ {s}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {([
              ['subjective', 'Subjective', "Patient's complaints, history…"],
              ['objective', 'Objective', 'Vitals, exam findings…'],
              ['assessment', 'Assessment', 'Diagnosis, differential…'],
              ['plan', 'Plan', 'Treatment plan, follow-up…'],
            ] as const).map(([key, label, placeholder]) => (
              <Card key={key}>
                <CardHeader className="pb-2"><CardTitle className="text-sm">{label}</CardTitle></CardHeader>
                <CardContent>
                  <Textarea
                    placeholder={placeholder}
                    value={(current as any)[key]}
                    onChange={(e) => update({ [key]: e.target.value } as any)}
                    rows={5}
                    className="font-mono text-xs"
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          {current.result && (
            <Card className="border-primary/30">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> Generated SOAP note</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyResult}><Copy className="w-3.5 h-3.5 mr-1" /> Copy</Button>
                    <Button variant="outline" size="sm" onClick={() => update({ result: '' })}><Trash2 className="w-3.5 h-3.5 mr-1" /> Clear</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground text-sm">{current.result}</div>
              </CardContent>
            </Card>
          )}

          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Save className="w-3 h-3" /> Drafts autosave to this device. Last update {new Date(current.updatedAt).toLocaleTimeString()}.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MedicalClinicalNotesPage;
