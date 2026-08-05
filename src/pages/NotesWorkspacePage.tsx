import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Plus, Search, Star, Trash2, Folder, FolderPlus, FileText, Archive, MoreHorizontal,
  Eye, PenLine, Sparkles, Loader2, Image as ImageIcon, Hash, PanelLeft, Check,
  ChevronRight, Copy, Printer, Inbox, Type,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  COVER_PRESETS, FOLDER_COLORS, NOTE_ICONS, NoteFolder, WorkspaceNote, buildFolderContext,
  countWords, coverClass, createFolder, createNote, deleteFolder, deleteNote, listFolders,
  listNotes, notePreview, renameFolder, updateNote,
} from '@/lib/notesWorkspace';

/* ------------------------------------------------------------------ helpers */

interface SlashCommand {
  id: string;
  label: string;
  hint: string;
  insert: string;
  caretBack?: number;
}

const SLASH_COMMANDS: SlashCommand[] = [
  { id: 'h1', label: 'Heading 1', hint: 'Big section title', insert: '# ' },
  { id: 'h2', label: 'Heading 2', hint: 'Medium heading', insert: '## ' },
  { id: 'h3', label: 'Heading 3', hint: 'Small heading', insert: '### ' },
  { id: 'bullet', label: 'Bulleted list', hint: 'Simple list', insert: '- ' },
  { id: 'number', label: 'Numbered list', hint: 'Ordered steps', insert: '1. ' },
  { id: 'todo', label: 'To-do', hint: 'Checkbox item', insert: '- [ ] ' },
  { id: 'quote', label: 'Quote', hint: 'Callout / quotation', insert: '> ' },
  { id: 'code', label: 'Code block', hint: 'Monospaced block', insert: '```\n\n```', caretBack: 4 },
  { id: 'divider', label: 'Divider', hint: 'Horizontal line', insert: '\n---\n' },
  { id: 'table', label: 'Table', hint: '3-column table', insert: '| Term | Meaning | Example |\n| --- | --- | --- |\n|  |  |  |\n' },
  { id: 'callout', label: 'Callout', hint: 'Highlighted tip', insert: '> 💡 ' },
  { id: 'formula', label: 'Formula', hint: 'Inline maths', insert: '$$  $$', caretBack: 3 },
];

const AI_ACTIONS = [
  { id: 'summarise', label: 'Summarise this note', prompt: 'Summarise the note below into a tight study summary with 5-8 bullet key points.' },
  { id: 'explain', label: 'Explain it simply', prompt: 'Explain the note below in simple language a Grade 9 learner would understand, with one local Zambian example.' },
  { id: 'expand', label: 'Add more detail', prompt: 'Expand the note below with more depth, definitions and worked examples. Keep the existing structure.' },
  { id: 'questions', label: 'Write exam questions', prompt: 'Write 8 ECZ-style exam questions with answers based on the note below.' },
  { id: 'improve', label: 'Clean up my writing', prompt: 'Rewrite the note below with clear headings, bullets and correct spelling. Keep all the facts.' },
];

/* ------------------------------------------------------------------ sidebar */

const Sidebar: React.FC<{
  folders: NoteFolder[];
  notes: WorkspaceNote[];
  activeId: string | null;
  activeFolder: string | null;
  showArchived: boolean;
  onSelectNote: (id: string) => void;
  onSelectFolder: (id: string | null) => void;
  onNewNote: (folderId?: string | null) => void;
  onNewFolder: () => void;
  onRenameFolder: (f: NoteFolder) => void;
  onDeleteFolder: (f: NoteFolder) => void;
  onToggleArchived: () => void;
}> = ({
  folders, notes, activeId, activeFolder, showArchived, onSelectNote, onSelectFolder,
  onNewNote, onNewFolder, onRenameFolder, onDeleteFolder, onToggleArchived,
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) => (n.title || '').toLowerCase().includes(q) || n.content.toLowerCase().includes(q),
    );
  }, [notes, query]);

  const favourites = filtered.filter((n) => n.is_favorite);
  const loose = filtered.filter((n) => !n.folder_id);

  const NoteRow: React.FC<{ note: WorkspaceNote }> = ({ note }) => (
    <button
      onClick={() => onSelectNote(note.id)}
      className={cn(
        'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-sm transition-colors',
        note.id === activeId
          ? 'bg-primary/10 text-foreground font-medium'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
      )}
    >
      <span className="text-base leading-none shrink-0">{note.icon}</span>
      <span className="truncate flex-1">{note.title || 'Untitled'}</span>
      {note.is_favorite && <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />}
    </button>
  );

  return (
    <div className="h-full flex flex-col bg-muted/30">
      <div className="p-3 space-y-2 border-b border-border/50">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes"
            className="pl-8 h-9 rounded-xl bg-background/70"
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" className="flex-1 rounded-xl gap-1.5" onClick={() => onNewNote(activeFolder)}>
            <Plus className="w-4 h-4" /> New page
          </Button>
          <Button size="sm" variant="outline" className="rounded-xl" onClick={onNewFolder} aria-label="New folder">
            <FolderPlus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {favourites.length > 0 && (
            <div>
              <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Favourites
              </p>
              <div className="space-y-0.5">
                {favourites.map((n) => <NoteRow key={`fav-${n.id}`} note={n} />)}
              </div>
            </div>
          )}

          <div>
            <div className="px-2.5 pb-1 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Folders</p>
              <button onClick={onNewFolder} className="text-muted-foreground hover:text-foreground">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-0.5">
              {folders.map((f) => {
                const kids = filtered.filter((n) => n.folder_id === f.id);
                const isOpen = open[f.id] ?? (activeFolder === f.id || !!query);
                const dot = FOLDER_COLORS.find((c) => c.value === f.color)?.dot ?? 'bg-primary';
                return (
                  <div key={f.id}>
                    <div
                      className={cn(
                        'group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm cursor-pointer transition-colors',
                        activeFolder === f.id ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/60',
                      )}
                      onClick={() => {
                        setOpen((p) => ({ ...p, [f.id]: !isOpen }));
                        onSelectFolder(f.id);
                      }}
                    >
                      <ChevronRight className={cn('w-3.5 h-3.5 transition-transform', isOpen && 'rotate-90')} />
                      <span className={cn('w-2 h-2 rounded-full', dot)} />
                      <span className="truncate flex-1">{f.name}</span>
                      <span className="text-[10px] tabular-nums opacity-60">{kids.length}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Folder options">
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onNewNote(f.id)}>
                            <Plus className="w-4 h-4 mr-2" /> New page here
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onRenameFolder(f)}>
                            <PenLine className="w-4 h-4 mr-2" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => onDeleteFolder(f)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Delete folder
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {isOpen && (
                      <div className="ml-4 pl-2 border-l border-border/60 space-y-0.5 mt-0.5">
                        {kids.length === 0 ? (
                          <p className="px-2 py-1 text-xs text-muted-foreground/70">Empty</p>
                        ) : (
                          kids.map((n) => <NoteRow key={n.id} note={n} />)
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {folders.length === 0 && (
                <p className="px-2.5 text-xs text-muted-foreground/70">No folders yet.</p>
              )}
            </div>
          </div>

          <div>
            <p className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Pages
            </p>
            <div className="space-y-0.5">
              {loose.length === 0 ? (
                <p className="px-2.5 text-xs text-muted-foreground/70">Nothing loose.</p>
              ) : (
                loose.map((n) => <NoteRow key={n.id} note={n} />)
              )}
            </div>
          </div>
        </div>
      </ScrollArea>

      <div className="p-2 border-t border-border/50">
        <button
          onClick={onToggleArchived}
          className={cn(
            'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm transition-colors',
            showArchived ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted/60',
          )}
        >
          <Archive className="w-4 h-4" /> {showArchived ? 'Hide archive' : 'Show archive'}
        </button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------- editor */

const NotesWorkspacePage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<NoteFolder[]>([]);
  const [notes, setNotes] = useState<WorkspaceNote[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [aiBusy, setAiBusy] = useState(false);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const [tagDraft, setTagDraft] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = notes.find((n) => n.id === activeId) ?? null;

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const [f, n] = await Promise.all([listFolders(), listNotes(showArchived)]);
      setFolders(f);
      setNotes(n);
      setActiveId((prev) => (prev && n.some((x) => x.id === prev) ? prev : n[0]?.id ?? null));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load your notes');
    } finally {
      setLoading(false);
    }
  }, [user, showArchived]);

  useEffect(() => { load(); }, [load]);

  /** Optimistic local patch + debounced persist. */
  const patchActive = (patch: Partial<WorkspaceNote>, immediate = false) => {
    if (!active) return;
    const id = active.id;
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaving('saving');
    const run = async () => {
      try {
        await updateNote(id, patch);
        setSaving('saved');
        setTimeout(() => setSaving('idle'), 1200);
      } catch (e) {
        setSaving('idle');
        toast.error(e instanceof Error ? e.message : 'Could not save');
      }
    };
    if (immediate) void run();
    else saveTimer.current = setTimeout(run, 700);
  };

  const handleNewNote = async (folderId?: string | null) => {
    try {
      const note = await createNote({ folder_id: folderId ?? null });
      setNotes((p) => [note, ...p]);
      setActiveId(note.id);
      setPreview(false);
      setMobileNav(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create the page');
    }
  };

  const handleNewFolder = async () => {
    const name = window.prompt('Folder name');
    if (!name) return;
    try {
      const f = await createFolder(name);
      setFolders((p) => [...p, f]);
      setActiveFolder(f.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create the folder');
    }
  };

  const handleRenameFolder = async (folder: NoteFolder) => {
    const name = window.prompt('Rename folder', folder.name);
    if (!name || name === folder.name) return;
    await renameFolder(folder.id, name);
    setFolders((p) => p.map((f) => (f.id === folder.id ? { ...f, name } : f)));
  };

  const handleDeleteFolder = async (folder: NoteFolder) => {
    if (!window.confirm(`Delete "${folder.name}"? The pages inside stay in Pages.`)) return;
    await deleteFolder(folder.id);
    setFolders((p) => p.filter((f) => f.id !== folder.id));
    setNotes((p) => p.map((n) => (n.folder_id === folder.id ? { ...n, folder_id: null } : n)));
    if (activeFolder === folder.id) setActiveFolder(null);
  };

  const handleDeleteNote = async () => {
    if (!active || !window.confirm('Delete this page for good?')) return;
    await deleteNote(active.id);
    const rest = notes.filter((n) => n.id !== active.id);
    setNotes(rest);
    setActiveId(rest[0]?.id ?? null);
    toast.success('Page deleted');
  };

  /* ---------------------------------------------------------- slash command */

  const insertAtCaret = (text: string, caretBack = 0) => {
    const el = textareaRef.current;
    if (!el || !active) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const value = active.content;
    const next = value.slice(0, start) + text + value.slice(end);
    patchActive({ content: next });
    requestAnimationFrame(() => {
      const pos = start + text.length - caretBack;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  const runSlash = (cmd: SlashCommand) => {
    const el = textareaRef.current;
    if (!el || !active) return;
    // remove the "/query" that triggered the menu
    const caret = el.selectionStart;
    const before = active.content.slice(0, caret);
    const slashAt = before.lastIndexOf('/');
    const cleaned = slashAt >= 0 ? active.content.slice(0, slashAt) + active.content.slice(caret) : active.content;
    const insertPos = slashAt >= 0 ? slashAt : caret;
    const next = cleaned.slice(0, insertPos) + cmd.insert + cleaned.slice(insertPos);
    patchActive({ content: next });
    setSlashOpen(false);
    setSlashQuery('');
    requestAnimationFrame(() => {
      const pos = insertPos + cmd.insert.length - (cmd.caretBack ?? 0);
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  const onContentChange = (value: string) => {
    patchActive({ content: value });
    const el = textareaRef.current;
    if (!el) return;
    const before = value.slice(0, el.selectionStart);
    const match = /(?:^|\n)\/(\w*)$/.exec(before);
    if (match) {
      setSlashOpen(true);
      setSlashQuery(match[1]);
    } else {
      setSlashOpen(false);
    }
  };

  const slashResults = SLASH_COMMANDS.filter((c) =>
    c.label.toLowerCase().includes(slashQuery.toLowerCase()) || c.id.includes(slashQuery.toLowerCase()),
  );

  /* ------------------------------------------------------------- ai actions */

  const runAI = async (action: typeof AI_ACTIONS[number]) => {
    if (!active) return;
    if (!active.content.trim()) return toast.error('Write something first');
    setAiBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-study-tutor', {
        body: {
          message: `${action.prompt}\n\n"""${active.content.slice(0, 8000)}"""`,
          subject: active.title || 'Notes',
        },
      });
      if (error) throw error;
      const reply: string = data?.reply ?? data?.text ?? data?.content ?? '';
      if (!reply) throw new Error('The AI did not return anything');
      patchActive({ content: `${active.content}\n\n---\n\n### ${action.label}\n\n${reply}\n` }, true);
      toast.success('Added to your page');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'AI request failed');
    } finally {
      setAiBusy(false);
    }
  };

  const sendFolderToChat = () => {
    const folderNotes = active?.folder_id
      ? notes.filter((n) => n.folder_id === active.folder_id)
      : active ? [active] : [];
    const context = buildFolderContext(folderNotes, 6000);
    sessionStorage.setItem('synapse_note_context', context);
    window.location.href = '/synapse?tab=chat';
  };

  /* ----------------------------------------------------------------- render */

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] gap-4 p-4">
        <Skeleton className="hidden lg:block w-72 h-full rounded-2xl" />
        <Skeleton className="flex-1 h-full rounded-2xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-3">
        <Inbox className="w-10 h-10 mx-auto text-muted-foreground" />
        <h2 className="text-lg font-semibold">Sign in to open your notes</h2>
        <p className="text-sm text-muted-foreground">Your pages, folders and AI tools live in your account.</p>
      </div>
    );
  }

  const sidebar = (
    <Sidebar
      folders={folders}
      notes={notes}
      activeId={activeId}
      activeFolder={activeFolder}
      showArchived={showArchived}
      onSelectNote={(id) => { setActiveId(id); setPreview(false); setMobileNav(false); }}
      onSelectFolder={setActiveFolder}
      onNewNote={handleNewNote}
      onNewFolder={handleNewFolder}
      onRenameFolder={handleRenameFolder}
      onDeleteFolder={handleDeleteFolder}
      onToggleArchived={() => setShowArchived((v) => !v)}
    />
  );

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-2xl overflow-hidden border border-border/60 bg-background">
      <aside className="hidden lg:block w-72 xl:w-80 shrink-0 border-r border-border/60">{sidebar}</aside>

      <main className="flex-1 min-w-0 flex flex-col">
        {!active ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
            <FileText className="w-10 h-10 text-muted-foreground" />
            <h2 className="text-lg font-semibold">No page open</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Create a page, group pages into folders, and let Synapse turn them into flashcards and quizzes.
            </p>
            <Button className="rounded-xl gap-2" onClick={() => handleNewNote(activeFolder)}>
              <Plus className="w-4 h-4" /> New page
            </Button>
          </div>
        ) : (
          <>
            {/* toolbar */}
            <div className="flex items-center gap-2 px-3 sm:px-4 h-12 border-b border-border/60 bg-background/80 backdrop-blur-md">
              <Sheet open={mobileNav} onOpenChange={setMobileNav}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open notes list">
                    <PanelLeft className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-80">{sidebar}</SheetContent>
              </Sheet>

              <span className="text-sm text-muted-foreground truncate hidden sm:block">
                {folders.find((f) => f.id === active.folder_id)?.name ?? 'Pages'} ·{' '}
                <span className="tabular-nums">{countWords(active.content)} words</span>
              </span>

              <div className="ml-auto flex items-center gap-1">
                <span className="text-xs text-muted-foreground mr-1 min-w-[3.5rem] text-right">
                  {saving === 'saving' ? 'Saving…' : saving === 'saved' ? 'Saved' : ''}
                </span>

                <Button
                  variant="ghost" size="icon"
                  onClick={() => patchActive({ is_favorite: !active.is_favorite }, true)}
                  aria-label="Favourite"
                >
                  <Star className={cn('w-4 h-4', active.is_favorite && 'fill-amber-400 text-amber-400')} />
                </Button>

                <Button variant="ghost" size="icon" onClick={() => setPreview((v) => !v)} aria-label="Toggle preview">
                  {preview ? <PenLine className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-xl gap-1.5" disabled={aiBusy}>
                      {aiBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      <span className="hidden sm:inline">AI</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60">
                    {AI_ACTIONS.map((a) => (
                      <DropdownMenuItem key={a.id} onClick={() => runAI(a)}>{a.label}</DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={sendFolderToChat}>
                      Use this folder in Synapse AI
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Page options">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(active.content); toast.success('Copied'); }}>
                      <Copy className="w-4 h-4 mr-2" /> Copy as markdown
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.print()}>
                      <Printer className="w-4 h-4 mr-2" /> Print
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <p className="px-2 py-1.5 text-xs text-muted-foreground">Move to folder</p>
                    <DropdownMenuItem onClick={() => patchActive({ folder_id: null }, true)}>
                      <FileText className="w-4 h-4 mr-2" /> No folder
                      {!active.folder_id && <Check className="w-3.5 h-3.5 ml-auto" />}
                    </DropdownMenuItem>
                    {folders.map((f) => (
                      <DropdownMenuItem key={f.id} onClick={() => patchActive({ folder_id: f.id }, true)}>
                        <Folder className="w-4 h-4 mr-2" /> {f.name}
                        {active.folder_id === f.id && <Check className="w-3.5 h-3.5 ml-auto" />}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => patchActive({ is_archived: !active.is_archived }, true)}>
                      <Archive className="w-4 h-4 mr-2" /> {active.is_archived ? 'Restore' : 'Archive'}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={handleDeleteNote}>
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* page body */}
            <ScrollArea className="flex-1">
              {active.cover && active.cover !== 'none' && (
                <div className={cn('h-28 sm:h-40 w-full', coverClass(active.cover))} />
              )}

              <div className="max-w-3xl xl:max-w-4xl mx-auto px-5 sm:px-10 py-8 space-y-4">
                <div className="flex items-center gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="text-4xl sm:text-5xl leading-none hover:bg-muted/60 rounded-xl p-1 transition-colors">
                        {active.icon}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <div className="grid grid-cols-6 gap-1">
                        {NOTE_ICONS.map((i) => (
                          <button
                            key={i}
                            className="text-2xl p-1 rounded-lg hover:bg-muted"
                            onClick={() => patchActive({ icon: i }, true)}
                          >{i}</button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                        <ImageIcon className="w-4 h-4" /> Cover
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 space-y-1">
                      {COVER_PRESETS.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => patchActive({ cover: c.id }, true)}
                          className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted text-sm"
                        >
                          <span className={cn('w-10 h-5 rounded-md border border-border/60', c.className)} />
                          {c.label}
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                </div>

                <input
                  value={active.title ?? ''}
                  onChange={(e) => patchActive({ title: e.target.value })}
                  placeholder="Untitled"
                  className="w-full bg-transparent text-3xl sm:text-4xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/40"
                />

                <div className="flex flex-wrap items-center gap-1.5">
                  {active.tags.map((t) => (
                    <Badge
                      key={t}
                      variant="secondary"
                      className="rounded-full gap-1 cursor-pointer"
                      onClick={() => patchActive({ tags: active.tags.filter((x) => x !== t) }, true)}
                    >
                      <Hash className="w-3 h-3" />{t} ×
                    </Badge>
                  ))}
                  <input
                    value={tagDraft}
                    onChange={(e) => setTagDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tagDraft.trim()) {
                        patchActive({ tags: [...new Set([...active.tags, tagDraft.trim()])] }, true);
                        setTagDraft('');
                      }
                    }}
                    placeholder="Add tag"
                    className="bg-transparent text-xs outline-none placeholder:text-muted-foreground/60 w-20"
                  />
                </div>

                {preview ? (
                  <article className="prose prose-sm sm:prose-base dark:prose-invert max-w-none pt-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {active.content || '_Nothing written yet._'}
                    </ReactMarkdown>
                  </article>
                ) : (
                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      value={active.content}
                      onChange={(e) => onContentChange(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Escape') setSlashOpen(false); }}
                      placeholder="Start writing, or type / for blocks…"
                      className="w-full min-h-[55vh] bg-transparent outline-none resize-none text-[15px] leading-7 font-normal placeholder:text-muted-foreground/50"
                      spellCheck
                    />
                    <AnimatePresence>
                      {slashOpen && slashResults.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          className="absolute left-0 top-8 z-20 w-64 rounded-xl border border-border bg-popover shadow-lg p-1"
                        >
                          <p className="px-2 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">Blocks</p>
                          {slashResults.slice(0, 7).map((c) => (
                            <button
                              key={c.id}
                              onClick={() => runSlash(c)}
                              className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-muted flex items-center gap-2"
                            >
                              <Type className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-sm">{c.label}</span>
                              <span className="ml-auto text-[10px] text-muted-foreground">{c.hint}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* quick block bar */}
                {!preview && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/50">
                    {SLASH_COMMANDS.slice(0, 8).map((c) => (
                      <Button
                        key={c.id}
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-muted-foreground rounded-lg"
                        onClick={() => insertAtCaret(c.insert, c.caretBack)}
                      >
                        {c.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        )}
      </main>
    </div>
  );
};

export default NotesWorkspacePage;
