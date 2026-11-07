import { useEffect, useState } from 'react';
import { BookOpen, ExternalLink, Download, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { canReadImportedMaterial, listOpenMaterials, type OpenMaterial } from '@/lib/openMaterials';

export function SiloziLibrary() {
  const [items, setItems] = useState<OpenMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<OpenMaterial | null>(null);
  const load = async () => {
    setLoading(true);
    setError(false);
    try { setItems(await listOpenMaterials()); } catch { setError(true); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const visible = items.filter(item => `${item.title} ${item.provider}`.toLowerCase().includes(query.toLowerCase()));
  const download = (item: OpenMaterial) => {
    if (!canReadImportedMaterial(item)) return;
    const text = `${item.title}\n\n${item.content}\n\n${item.attribution}\nSource: ${item.source_url}\nLicence: ${item.license_url}\nText extracted from the source; illustrations and page layout omitted.\nNot verified as an official curriculum syllabus.`;
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${item.title.replace(/[^\p{L}\p{N} -]/gu, '')}.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <section className="space-y-4 border-t border-border pt-6">
    <div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /><h2 className="text-xl font-semibold">Silozi books & stories</h2></div>
    <p className="text-sm text-muted-foreground">{items.filter(canReadImportedMaterial).length} imported stories · {items.filter(i => !canReadImportedMaterial(i)).length} source links · Curriculum alignment not verified</p>
    <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search Silozi materials" placeholder="Search Silozi titles or sources" value={query} onChange={e => setQuery(e.target.value)} className="pl-9" /></div>
    {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading Silozi books" /> : error ? <div role="alert" className="flex items-center gap-3 text-sm">Could not load Silozi books.<Button variant="outline" onClick={load}>Retry</Button></div> : !visible.length ? <p className="text-sm text-muted-foreground">No matching Silozi materials.</p> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {visible.map(item => <article key={item.id} className="flex min-w-0 flex-col gap-3 rounded-lg border border-border p-4">
        <h3 className="break-words font-medium">{item.title}</h3>
        <p className="text-xs text-muted-foreground">{item.provider}{item.level ? ` · Reading level ${item.level}` : ''}</p>
        <p className="text-xs text-muted-foreground">{canReadImportedMaterial(item) ? item.license_name : 'Source only · Reuse permission unverified'}</p>
        <div className="mt-auto flex flex-wrap gap-2">{canReadImportedMaterial(item) && <Button size="sm" onClick={() => setSelected(item)}><BookOpen className="mr-2 h-4 w-4" />Read</Button>}
          <Button size="sm" variant="outline" asChild><a href={item.source_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Source</a></Button>
        </div>
      </article>)}
    </div>}
    <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}>
      <DialogContent className="flex max-h-[85vh] max-w-3xl flex-col">
        <DialogHeader><DialogTitle className="break-words pr-5">{selected?.title}</DialogTitle><DialogDescription>{selected?.provider} · Silozi and parallel translations · Text-only edition</DialogDescription></DialogHeader>
        <div className="min-h-0 overflow-y-auto space-y-5">
          <div className="whitespace-pre-wrap text-base leading-relaxed">{selected?.content}</div>
          <footer className="space-y-2 border-t border-border pt-4 text-xs text-muted-foreground"><p className="whitespace-pre-wrap">{selected?.attribution}</p><p>Text extracted from the source; illustrations and page layout omitted.</p>{selected?.license_url && <a className="underline" href={selected.license_url} target="_blank" rel="noopener noreferrer">{selected.license_name}</a>}</footer>
        </div>
        {selected && <div className="flex flex-wrap gap-2 border-t border-border pt-3"><Button variant="outline" onClick={() => download(selected)}><Download className="mr-2 h-4 w-4" />Save text</Button><Button variant="outline" asChild><a href={selected.source_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Original book</a></Button></div>}
      </DialogContent>
    </Dialog>
  </section>;
}