import React, { useState } from 'react';
import { PenLine, X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export const QuickNoteButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Please log in'); return; }

      const { error } = await supabase.from('student_notes').insert({
        user_id: user.id,
        title: title.trim() || 'Quick Note',
        content: content.trim(),
      });

      if (error) throw error;
      toast.success('Note saved!');
      setTitle('');
      setContent('');
      setOpen(false);
    } catch {
      toast.error('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-30',
          'w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg',
          'flex items-center justify-center hover:scale-105 transition-transform',
          open && 'bg-muted text-muted-foreground'
        )}
      >
        {open ? <X className="w-5 h-5" /> : <PenLine className="w-5 h-5" />}
      </button>

      {/* Note panel */}
      {open && (
        <div className="fixed bottom-40 right-4 lg:bottom-20 lg:right-6 z-30 w-72 max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-xl p-4 space-y-3">
          <Input
            placeholder="Title (optional)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="h-8 text-sm"
          />
          <Textarea
            placeholder="Quick note..."
            value={content}
            onChange={e => setContent(e.target.value)}
            className="min-h-[80px] text-sm resize-none"
            autoFocus
          />
          <Button
            size="sm"
            className="w-full"
            onClick={handleSave}
            disabled={saving || !content.trim()}
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {saving ? 'Saving...' : 'Save Note'}
          </Button>
        </div>
      )}
    </>
  );
};
