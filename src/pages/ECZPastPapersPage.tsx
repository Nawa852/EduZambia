import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, FileText, BookOpen, GraduationCap, Calendar, CheckCircle, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LogoLoader } from '@/components/UI/LogoLoader';

interface PastPaper {
  id: string;
  title: string;
  year: string;
  grade: string;
  subject: string;
  paper: string;
  has_marking_scheme: boolean;
  file_url: string | null;
  external_url: string | null;
  source: string | null;
}

const ECZPastPapersPage = () => {
  const [papers, setPapers] = useState<PastPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    const { data, error } = await supabase
      .from('past_papers' as any)
      .select('*')
      .order('year', { ascending: false });

    if (!error && data) setPapers(data as unknown as PastPaper[]);
    setLoading(false);
  };

  const subjects = [...new Set(papers.map(p => p.subject))];
  const grades = [...new Set(papers.map(p => p.grade))].sort();
  const years = [...new Set(papers.map(p => p.year))].sort((a, b) => b.localeCompare(a));

  const filtered = papers.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchGrade = selectedGrade === 'all' || p.grade === selectedGrade;
    const matchSubject = selectedSubject === 'all' || p.subject === selectedSubject;
    const matchYear = selectedYear === 'all' || p.year === selectedYear;
    return matchSearch && matchGrade && matchSubject && matchYear;
  });

  const groupedByGrade: Record<string, PastPaper[]> = {};
  grades.forEach(g => { groupedByGrade[g] = filtered.filter(p => p.grade === g); });

  const handleDownload = (paper: PastPaper) => {
    if (paper.file_url) { window.open(paper.file_url, '_blank'); return; }
    // External URLs in the DB are generic landing pages; build a precise Google search instead
    const q = encodeURIComponent(
      `ECZ Grade ${paper.grade} ${paper.subject} ${paper.year} ${paper.paper} past paper${paper.has_marking_scheme ? ' marking scheme' : ''} filetype:pdf`,
    );
    window.open(`https://www.google.com/search?q=${q}`, '_blank');
  };

  if (loading) return <div className="py-20"><LogoLoader size="lg" text="Loading past papers..." /></div>;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8" />
              <div>
                <CardTitle className="text-2xl md:text-3xl font-bold">ECZ Past Examination Papers</CardTitle>
                <CardDescription className="text-primary-foreground/80 text-lg">Grade 7, 9 & 12 Past Papers with Marking Schemes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Search papers..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-12 bg-background text-foreground" />
              </div>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger className="bg-background text-foreground"><SelectValue placeholder="Grade" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {grades.map(g => <SelectItem key={g} value={g}>Grade {g}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="bg-background text-foreground"><SelectValue placeholder="Subject" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="bg-background text-foreground"><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Papers', value: papers.length, icon: FileText },
            { label: 'With Marking Schemes', value: papers.filter(p => p.has_marking_scheme).length, icon: CheckCircle },
            { label: 'Subjects', value: subjects.length, icon: BookOpen },
            { label: 'Years Available', value: years.length, icon: Calendar },
          ].map((stat, idx) => (
            <Card key={idx}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Star className="h-6 w-6 text-yellow-500" />
                <div>
                  <h3 className="font-semibold text-foreground">Official ECZ Past Papers</h3>
                  <p className="text-sm text-muted-foreground">Access the complete collection from ZedPastPapers</p>
                </div>
              </div>
              <div className="flex gap-2">
                {['7', '9', '12'].map(g => (
                  <Button key={g} size="sm" variant="outline" onClick={() => window.open(`https://zedpastpapers.com/grade-${g}-past-papers/`, '_blank')}>
                    Grade {g}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue={grades[grades.length - 1] || '12'} className="w-full">
          <TabsList className={`grid w-full grid-cols-${grades.length || 3}`}>
            {(grades.length > 0 ? grades : ['7', '9', '12']).map(g => (
              <TabsTrigger key={g} value={g} className="gap-2">
                <GraduationCap className="h-4 w-4" /> Grade {g} ({groupedByGrade[g]?.length || 0})
              </TabsTrigger>
            ))}
          </TabsList>

          {(grades.length > 0 ? grades : ['7', '9', '12']).map(grade => (
            <TabsContent key={grade} value={grade} className="mt-6">
              {(!groupedByGrade[grade] || groupedByGrade[grade].length === 0) ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">No papers found</h3>
                    <p className="text-muted-foreground">Try adjusting your filters</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedByGrade[grade].map(paper => (
                    <Card key={paper.id} className="hover:shadow-lg transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            <Badge variant="outline">{paper.year}</Badge>
                          </div>
                          {paper.has_marking_scheme && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" /> MS
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-semibold text-foreground mb-2">{paper.title}</h4>
                        <div className="flex flex-wrap gap-1 mb-3">
                          <Badge variant="secondary">{paper.subject}</Badge>
                          <Badge variant="outline">{paper.paper}</Badge>
                        </div>
                        {paper.source && <p className="text-xs text-muted-foreground mb-3">Source: {paper.source}</p>}
                        <Button className="w-full gap-2" onClick={() => handleDownload(paper)}>
                          <Download className="h-4 w-4" /> Download Paper
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default ECZPastPapersPage;
