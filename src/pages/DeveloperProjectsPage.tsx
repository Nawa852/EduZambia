import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Code, Plus, Trash2, ExternalLink, Pencil } from 'lucide-react';
import { useDeveloperProjects } from '@/hooks/useDeveloperProjects';

const languages = ['TypeScript', 'JavaScript', 'Python', 'React Native', 'Go', 'Rust', 'Java', 'C#', 'PHP', 'Ruby'];

export default function DeveloperProjectsPage() {
  const { projects, loading, addProject, updateProject, deleteProject } = useDeveloperProjects();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('');
  const [description, setDescription] = useState('');
  const [repoUrl, setRepoUrl] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) return;
    await addProject({ name, language, description, repo_url: repoUrl || undefined });
    setName(''); setLanguage(''); setDescription(''); setRepoUrl('');
    setOpen(false);
  };

  return (
    <div className="p-6 space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Code className="w-8 h-8 text-primary" /> My Projects</h1>
          <p className="text-muted-foreground">Manage your developer projects and track progress</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> New Project</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Project</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Project name" value={name} onChange={e => setName(e.target.value)} />
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger><SelectValue placeholder="Language / Framework" /></SelectTrigger>
                <SelectContent>{languages.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
              </Select>
              <Textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
              <Input placeholder="Repository URL (optional)" value={repoUrl} onChange={e => setRepoUrl(e.target.value)} />
              <Button onClick={handleCreate} className="w-full">Create Project</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading projects...</p>
      ) : projects.length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <Code className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
          <p className="text-muted-foreground mb-4">Create your first project to start tracking your work.</p>
          <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" /> Create Project</Button>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => (
            <Card key={p.id} className="hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{p.name}</CardTitle>
                  <Badge variant={p.status === 'active' ? 'default' : p.status === 'completed' ? 'secondary' : 'outline'}>{p.status}</Badge>
                </div>
                {p.language && <Badge variant="outline" className="w-fit font-mono text-xs">{p.language}</Badge>}
              </CardHeader>
              <CardContent className="space-y-3">
                {p.description && <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>}
                <div className="flex items-center gap-2">
                  <Progress value={p.progress} className="h-2 flex-1" />
                  <span className="text-sm font-bold">{p.progress}%</span>
                </div>
                <div className="flex items-center gap-2">
                  {p.repo_url && (
                    <Button variant="outline" size="sm" onClick={() => window.open(p.repo_url!, '_blank')}>
                      <ExternalLink className="w-3 h-3 mr-1" /> Repo
                    </Button>
                  )}
                  <Select value={p.status} onValueChange={v => updateProject(p.id, { status: v })}>
                    <SelectTrigger className="h-8 text-xs w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="completed">Done</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="ghost" size="sm" className="text-destructive ml-auto" onClick={() => deleteProject(p.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
