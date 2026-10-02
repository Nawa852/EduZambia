import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LogoLoader } from '@/components/UI/LogoLoader';
import { Building2, Copy, Loader2, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useSchool } from '@/hooks/useSchool';
import { SchoolBrandHeader } from '@/components/School/SchoolBrandHeader';
import { toast } from 'sonner';

/** Shrinks a logo to a 256px PNG data URL so it prints on every document without extra storage. */
async function logoToDataUrl(file: File): Promise<string> {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, 256 / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/png');
}

const copy = (t: string, what: string) => navigator.clipboard.writeText(t).then(() => toast.success(`${what} copied`));

const SchoolSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { school, loading, isOwner, refresh } = useSchool();
  const [form, setForm] = useState({ name: '', emis_number: '', motto: '', address: '', primary_color: '#0A84FF', secondary_color: '#30D158', logo_url: '' });
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (school) setForm({
      name: school.name, emis_number: school.emis_number ?? '', motto: school.motto ?? '', address: school.address ?? '',
      primary_color: school.primary_color, secondary_color: school.secondary_color, logo_url: school.logo_url ?? '',
    });
  }, [school]);

  if (loading) return <div className="flex min-h-[40vh] items-center justify-center"><LogoLoader text="Loading your school..." /></div>;

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim()) { toast.error('Add your school name'); return; }
    setSaving(true);
    const payload = { ...form, emis_number: form.emis_number || null, motto: form.motto || null, address: form.address || null, logo_url: form.logo_url || null };
    const db = supabase as any;
    const { error } = school
      ? await db.from('schools').update(payload).eq('id', school.id)
      : await db.from('schools').insert({ ...payload, owner_id: user!.id });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(school ? 'Branding saved' : 'School created');
    refresh();
  };

  const readOnly = !!school && !isOwner;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Card className="rounded-3xl border-border/50 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15"><Building2 className="h-5 w-5 text-primary" /></div>
          <div>
            <h1 className="text-xl font-bold">School branding</h1>
            <p className="text-sm text-muted-foreground">Set it once — your logo and name appear on lesson plans, schemes, tests and reports.</p>
          </div>
        </div>
      </Card>

      {school && (
        <Card className="rounded-2xl border-border/50 p-4">
          <h2 className="mb-3 text-sm font-semibold">Join codes</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[{ label: 'Staff code (teachers)', v: school.staff_code }, { label: 'School code (learners)', v: school.school_code }].map((c) => (
              <div key={c.label} className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2">
                <div><div className="text-xs text-muted-foreground">{c.label}</div><div className="font-mono text-lg font-bold">{c.v}</div></div>
                <Button size="icon" variant="ghost" aria-label={`Copy ${c.label}`} onClick={() => copy(c.v, c.label)}><Copy className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Teachers then create classes (class codes), and each learner shares their own code with a parent.</p>
        </Card>
      )}

      <Card className="space-y-4 rounded-2xl border-border/50 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>School name</Label><Input disabled={readOnly} value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
          <div><Label>EMIS number</Label><Input disabled={readOnly} value={form.emis_number} onChange={(e) => set('emis_number', e.target.value)} /></div>
          <div><Label>Motto</Label><Input disabled={readOnly} value={form.motto} onChange={(e) => set('motto', e.target.value)} /></div>
          <div><Label>Address</Label><Input disabled={readOnly} value={form.address} onChange={(e) => set('address', e.target.value)} /></div>
          <div className="flex items-end gap-3">
            <div><Label>Main colour</Label><Input disabled={readOnly} type="color" className="h-10 w-20 p-1" value={form.primary_color} onChange={(e) => set('primary_color', e.target.value)} /></div>
            <div><Label>Accent</Label><Input disabled={readOnly} type="color" className="h-10 w-20 p-1" value={form.secondary_color} onChange={(e) => set('secondary_color', e.target.value)} /></div>
          </div>
          <div className="flex items-end gap-3">
            {form.logo_url && <img src={form.logo_url} alt="School logo" className="h-12 w-12 rounded object-contain" />}
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={async (e) => {
              const f = e.target.files?.[0]; if (!f) return;
              try { set('logo_url', await logoToDataUrl(f)); } catch { toast.error('Could not read that image'); }
            }} />
            <Button variant="outline" className="rounded-full" disabled={readOnly} onClick={() => fileRef.current?.click()}><Upload className="mr-1.5 h-4 w-4" />Logo</Button>
          </div>
        </div>
        {!readOnly && (
          <Button className="rounded-full" onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}{school ? 'Save branding' : 'Create school'}
          </Button>
        )}
      </Card>

      {school && (
        <Card className="rounded-2xl border-border/50 bg-background p-4">
          <div className="mb-2 text-xs text-muted-foreground">How your documents will look</div>
          <SchoolBrandHeader title="Lesson plan" />
        </Card>
      )}
    </div>
  );
};

export default SchoolSettingsPage;
