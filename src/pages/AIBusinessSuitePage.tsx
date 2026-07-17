import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Copy, Sparkles, Search, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Tool = { id: string; name: string; desc: string; fields: { key: string; label: string; type?: 'text' | 'textarea'; placeholder?: string }[] };

const CATEGORIES: { title: string; tools: Tool[] }[] = [
  {
    title: 'AI Business Creation',
    tools: [
      { id: 'business-idea', name: 'Business Idea Generator', desc: 'Fresh ideas for Zambia', fields: [{ key: 'interests', label: 'Your interests / skills', type: 'textarea' }, { key: 'budget', label: 'Starting budget (ZMW)' }] },
      { id: 'business-plan', name: 'Business Plan Generator', desc: 'Investor-ready plan', fields: [{ key: 'name', label: 'Business name' }, { key: 'sector', label: 'Sector' }, { key: 'description', label: 'Description', type: 'textarea' }] },
      { id: 'pitch-deck', name: 'Pitch Deck Generator', desc: '10-slide deck', fields: [{ key: 'name', label: 'Company' }, { key: 'stage', label: 'Stage' }, { key: 'ask', label: 'Funding ask (ZMW)' }] },
      { id: 'financial-projection', name: 'Financial Projection', desc: '3-year projection in ZMW', fields: [{ key: 'model', label: 'Revenue model' }, { key: 'assumptions', label: 'Key assumptions', type: 'textarea' }] },
      { id: 'company-registration', name: 'Company Registration Assistant', desc: 'PACRA + ZRA guide', fields: [{ key: 'type', label: 'Entity type (Ltd / Sole / Partnership)' }] },
      { id: 'brand-name', name: 'Brand Name Generator', desc: '15 name candidates', fields: [{ key: 'sector', label: 'Sector' }, { key: 'vibe', label: 'Vibe / feel' }] },
      { id: 'logo-brief', name: 'Logo Brief Generator', desc: 'Design direction', fields: [{ key: 'name', label: 'Brand' }, { key: 'style', label: 'Style keywords' }] },
      { id: 'brand-identity', name: 'Brand Identity Kit', desc: 'Voice, colors, type', fields: [{ key: 'name', label: 'Brand' }, { key: 'audience', label: 'Audience' }] },
      { id: 'website-copy', name: 'Website Copy Builder', desc: 'Full site copy', fields: [{ key: 'name', label: 'Business' }, { key: 'offer', label: 'Offer', type: 'textarea' }] },
      { id: 'landing-page', name: 'Landing Page Builder', desc: 'Conversion copy', fields: [{ key: 'product', label: 'Product' }, { key: 'audience', label: 'Audience' }] },
      { id: 'product-catalog', name: 'Product Catalog', desc: '10 SKUs', fields: [{ key: 'category', label: 'Category' }] },
      { id: 'pricing-strategy', name: 'Pricing Assistant', desc: 'Tiered pricing', fields: [{ key: 'product', label: 'Product / service' }, { key: 'costs', label: 'Unit cost (ZMW)' }] },
      { id: 'proposal', name: 'Proposal Generator', desc: 'Client proposal', fields: [{ key: 'client', label: 'Client' }, { key: 'scope', label: 'Scope', type: 'textarea' }, { key: 'budget', label: 'Budget (ZMW)' }] },
      { id: 'invoice', name: 'Invoice Generator', desc: 'Pro invoice', fields: [{ key: 'client', label: 'Client' }, { key: 'items', label: 'Line items', type: 'textarea' }] },
      { id: 'quotation', name: 'Quotation Generator', desc: 'Formal quote', fields: [{ key: 'client', label: 'Client' }, { key: 'items', label: 'Items', type: 'textarea' }] },
      { id: 'contract', name: 'Contract Generator', desc: 'Service contract', fields: [{ key: 'parties', label: 'Parties' }, { key: 'scope', label: 'Scope', type: 'textarea' }] },
      { id: 'receipt', name: 'Receipt Generator', desc: 'Payment receipt', fields: [{ key: 'payer', label: 'Payer' }, { key: 'amount', label: 'Amount ZMW' }] },
    ],
  },
  {
    title: 'Sales & Marketing',
    tools: [
      { id: 'marketing-plan', name: 'Marketing Plan (90-day)', desc: 'Channels + calendar', fields: [{ key: 'business', label: 'Business' }, { key: 'budget', label: 'Budget ZMW' }] },
      { id: 'ad-copy', name: 'Ad Generator', desc: 'Meta / Google ads', fields: [{ key: 'product', label: 'Product' }, { key: 'audience', label: 'Audience' }] },
      { id: 'social-post', name: 'Social Media Manager', desc: '7 platform posts', fields: [{ key: 'topic', label: 'Topic' }, { key: 'brand', label: 'Brand voice' }] },
      { id: 'content-plan', name: 'Content Plan (4 weeks)', desc: 'Editorial calendar', fields: [{ key: 'niche', label: 'Niche' }] },
      { id: 'graphic-brief', name: 'Graphic Design Brief', desc: 'Asset spec', fields: [{ key: 'asset', label: 'Asset type' }, { key: 'brand', label: 'Brand' }] },
      { id: 'video-script', name: 'Video Script (60s)', desc: 'Short-form script', fields: [{ key: 'topic', label: 'Topic' }] },
      { id: 'copywriting', name: 'Copywriter (AIDA)', desc: 'Rewrite persuasive', fields: [{ key: 'text', label: 'Original', type: 'textarea' }] },
      { id: 'email-campaign', name: 'Email Marketing', desc: '5-email nurture', fields: [{ key: 'offer', label: 'Offer' }] },
      { id: 'sms-campaign', name: 'SMS Campaigns', desc: '5 variants', fields: [{ key: 'offer', label: 'Offer' }] },
      { id: 'whatsapp-campaign', name: 'WhatsApp Campaigns', desc: 'Broadcast + follow-up', fields: [{ key: 'offer', label: 'Offer' }] },
      { id: 'lead-magnet', name: 'Lead Generation', desc: 'Lead magnet + opt-in', fields: [{ key: 'audience', label: 'Audience' }] },
      { id: 'crm-segments', name: 'CRM Segmentation', desc: '6 segments', fields: [{ key: 'business', label: 'Business' }] },
      { id: 'sales-pipeline', name: 'Sales Pipeline', desc: 'Stages + KPIs', fields: [{ key: 'model', label: 'Sales model' }] },
      { id: 'affiliate-plan', name: 'Affiliate Program', desc: 'Commission plan', fields: [{ key: 'product', label: 'Product' }] },
      { id: 'referral-plan', name: 'Referral System', desc: 'Viral loop', fields: [{ key: 'product', label: 'Product' }] },
      { id: 'customer-journey', name: 'Customer Journey Map', desc: 'Touchpoints', fields: [{ key: 'business', label: 'Business' }] },
      { id: 'seo-audit', name: 'SEO Action Plan', desc: 'Keywords + fixes', fields: [{ key: 'url', label: 'Website / niche' }] },
    ],
  },
  {
    title: 'Operations & Finance',
    tools: [
      { id: 'budget-plan', name: 'Budget Planner', desc: 'Monthly ZMW budget', fields: [{ key: 'income', label: 'Monthly income ZMW' }, { key: 'notes', label: 'Notes', type: 'textarea' }] },
      { id: 'cashflow', name: 'Cash Flow Forecasting', desc: '12-month forecast', fields: [{ key: 'business', label: 'Business' }, { key: 'assumptions', label: 'Assumptions', type: 'textarea' }] },
      { id: 'pnl', name: 'Profit & Loss Tracking', desc: 'P&L template', fields: [{ key: 'period', label: 'Period' }] },
      { id: 'tax-guide', name: 'Tax Management (Zambia)', desc: 'VAT / PAYE / WHT', fields: [{ key: 'type', label: 'Business type' }] },
      { id: 'loan-analysis', name: 'Loan Calculator', desc: 'Amortisation', fields: [{ key: 'amount', label: 'Amount ZMW' }, { key: 'rate', label: 'Rate %' }, { key: 'term', label: 'Term (months)' }] },
      { id: 'grant-finder', name: 'Grant Finder', desc: '10 relevant grants', fields: [{ key: 'sector', label: 'Sector' }] },
      { id: 'inventory-plan', name: 'Inventory Management', desc: 'ABC + reorder', fields: [{ key: 'products', label: 'Products', type: 'textarea' }] },
      { id: 'supplier-eval', name: 'Supplier Management', desc: 'Scoring matrix', fields: [{ key: 'suppliers', label: 'Suppliers', type: 'textarea' }] },
    ],
  },
];

const ALL_TOOLS = CATEGORIES.flatMap(c => c.tools);

export default function AIBusinessSuitePage() {
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [active, setActive] = useState<Tool | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    if (!q.trim()) return CATEGORIES;
    const s = q.toLowerCase();
    return CATEGORIES.map(c => ({ ...c, tools: c.tools.filter(t => t.name.toLowerCase().includes(s) || t.desc.toLowerCase().includes(s)) })).filter(c => c.tools.length);
  }, [q]);

  const open = (t: Tool) => { setActive(t); setValues({}); setResult(''); };

  const run = async () => {
    if (!active) return;
    setLoading(true); setResult('');
    try {
      const r = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-business-tool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ tool: active.id, inputs: values }),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({ error: 'Error' }));
        toast({ title: 'Error', description: e.error || 'Failed', variant: 'destructive' });
        setLoading(false); return;
      }
      const reader = r.body?.getReader();
      const decoder = new TextDecoder();
      let buf = '', out = '';
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf('\n')) !== -1) {
          let line = buf.slice(0, idx); buf = buf.slice(idx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const j = line.slice(6).trim();
          if (j === '[DONE]') break;
          try {
            const p = JSON.parse(j);
            const d = p.choices?.[0]?.delta?.content;
            if (d) { out += d; setResult(out); }
          } catch {}
        }
      }
    } catch {
      toast({ title: 'Network error', variant: 'destructive' });
    }
    setLoading(false);
  };

  const download = () => {
    const blob = new Blob([result], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${active?.id || 'output'}.md`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border p-6">
        <div className="flex items-center gap-3 mb-2"><Sparkles className="w-7 h-7 text-primary" /><h1 className="text-3xl font-bold">AI Business Suite</h1></div>
        <p className="text-muted-foreground">{ALL_TOOLS.length}+ AI tools to start, run, and grow your Zambian business.</p>
        <div className="mt-4 relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search tools..." className="pl-9" />
        </div>
      </div>

      {filtered.map(cat => (
        <div key={cat.title}>
          <h2 className="text-xl font-semibold mb-3">{cat.title} <Badge variant="secondary" className="ml-2">{cat.tools.length}</Badge></h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {cat.tools.map(t => (
              <Card key={t.id} className="cursor-pointer hover:border-primary/50 hover:shadow-md transition" onClick={() => open(t)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Sparkles className="w-5 h-5 text-primary" /></div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm">{t.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.desc}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" />{active?.name}</DialogTitle></DialogHeader>
          {active && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{active.desc}</p>
              <div className="space-y-3">
                {active.fields.map(f => f.type === 'textarea' ? (
                  <div key={f.key}><label className="text-sm font-medium">{f.label}</label><Textarea value={values[f.key] || ''} onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))} placeholder={f.placeholder} /></div>
                ) : (
                  <div key={f.key}><label className="text-sm font-medium">{f.label}</label><Input value={values[f.key] || ''} onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))} placeholder={f.placeholder} /></div>
                ))}
              </div>
              <Button onClick={run} disabled={loading} className="w-full">
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4 mr-2" />Generate</>}
              </Button>
              {result && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center justify-between">Output
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(result); toast({ title: 'Copied' }); }}><Copy className="w-3 h-3 mr-1" />Copy</Button>
                      <Button size="sm" variant="outline" onClick={download}><Download className="w-3 h-3 mr-1" />Download</Button>
                    </div>
                  </CardTitle></CardHeader>
                  <CardContent><div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{result}</div></CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
