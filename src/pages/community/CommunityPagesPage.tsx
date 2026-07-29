import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BadgeCheck, Building2, GraduationCap, Loader2, Plus, Search, Users, Youtube } from 'lucide-react';
import { toast } from 'sonner';
import { CommunityPage, createPage, listPages, myPages, SUBJECTS } from '@/lib/community';
import { EmptyState } from '@/components/UI/EmptyState';

const PAGE_TYPES = [
  { value: 'teacher', label: 'Teacher' },
  { value: 'school', label: 'School' },
  { value: 'creator', label: 'Creator / YouTube educator' },
  { value: 'organisation', label: 'Organisation' },
];

const typeIcon = (t: string) => (t === 'school' ? Building2 : t === 'creator' ? Youtube : GraduationCap);

const CommunityPagesPage: React.FC = () => {
  const [pages, setPages] = useState<CommunityPage[]>([]);
  const [mine, setMine] = useState<CommunityPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', handle: '', page_type: 'teacher', bio: '', location: '', website_url: '', youtube_url: '', subject: 'Mathematics' });

  const load = async () => {
    setLoading(true);
    try {
      const [all, own] = await Promise.all([listPages(search, type), myPages()]);
      setPages(all);
      setMine(own);
    } catch (e: any) {
      toast.error(e.message ?? 'Could not load pages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); /* eslint-disable-next-line */ }, [search, type]);

  const submit = async () => {
    if (!form.name.trim() || !form.handle.trim()) { toast.error('Name and handle are required'); return; }
    setSaving(true);
    try {
      const page = await createPage({ ...form, subjects: [form.subject] });
      toast.success('Page created');
      setOpen(false);
      setForm({ name: '', handle: '', page_type: 'teacher', bio: '', location: '', website_url: '', youtube_url: '', subject: 'Mathematics' });
      window.location.assign(`/page/${page.handle}`);
    } catch (e: any) {
      toast.error(e.message ?? 'Could not create page');
    } finally {
      setSaving(false);
    }
  };

  const PageCard = ({ p }: { p: CommunityPage }) => {
    const Icon = typeIcon(p.page_type);
    return (
      <Link to={`/page/${p.handle}`}>
        <Card className="hover:shadow-md transition h-full">
          <CardContent className="p-4 flex gap-3 items-start">
            <Avatar className="h-11 w-11">
              <AvatarImage src={p.avatar_url ?? undefined} alt={p.name} />
              <AvatarFallback><Icon className="h-5 w-5" /></AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <h3 className="font-semibold text-sm truncate">{p.name}</h3>
                {p.is_verified && <BadgeCheck className="h-4 w-4 text-primary shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground">@{p.handle}</p>
              {p.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.bio}</p>}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant="secondary" className="text-[10px]">{p.page_type}</Badge>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" />{p.follower_count}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">Pages</h2>
          <p className="text-sm text-muted-foreground">Teachers, schools and creators publishing on Synapse.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Create page</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create your page</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value, handle: form.handle || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} placeholder="Mrs Mulenga Maths" /></div>
                <div><Label>Handle *</Label><Input value={form.handle} onChange={e => setForm({ ...form, handle: e.target.value })} placeholder="mulenga-maths" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Page type</Label>
                  <Select value={form.page_type} onValueChange={v => setForm({ ...form, page_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PAGE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Main subject</Label>
                  <Select value={form.subject} onValueChange={v => setForm({ ...form, subject: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Bio</Label><Textarea rows={3} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="What do you teach or offer?" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Lusaka" /></div>
                <div><Label>Website</Label><Input value={form.website_url} onChange={e => setForm({ ...form, website_url: e.target.value })} placeholder="https://" /></div>
              </div>
              <div><Label>YouTube</Label><Input value={form.youtube_url} onChange={e => setForm({ ...form, youtube_url: e.target.value })} placeholder="https://youtube.com/@channel" /></div>
              <Button className="w-full" onClick={submit} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Create page</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {mine.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Your pages</p>
          <div className="grid gap-3 md:grid-cols-2">{mine.map(p => <PageCard key={p.id} p={p} />)}</div>
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search pages..." />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {PAGE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : pages.length === 0 ? (
        <EmptyState title="No pages yet" description="Create the first teacher or school page for your community." icon={GraduationCap} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">{pages.map(p => <PageCard key={p.id} p={p} />)}</div>
      )}
    </div>
  );
};

export default CommunityPagesPage;
