import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { Library, ExternalLink, FileText, GraduationCap, BookOpen, Lightbulb, Sparkles } from 'lucide-react';

interface SourceLink {
  name: string;
  url: string;
  description: string;
  tags: string[];
  icon: typeof Library;
  best_for: string;
}

const SOURCES: SourceLink[] = [
  {
    name: 'ZedPastPapers',
    url: 'https://zedpastpapers.com/',
    description: 'Zambian ECZ past papers from 2003-2024. Grade 7, 9 and 12 across all subjects.',
    tags: ['ECZ', 'Past Papers', 'Zambia'],
    icon: FileText,
    best_for: 'Exam preparation & revision',
  },
  {
    name: 'LessonPlans.com',
    url: 'https://www.lessonplans.com/c/lessons-by-grade-level/',
    description: 'Thousands of free lesson plans organized by grade level (K-12).',
    tags: ['Lesson Plans', 'K-12'],
    icon: BookOpen,
    best_for: 'Daily lesson preparation',
  },
  {
    name: 'Teacher Created Resources',
    url: 'https://www.teachercreated.com/lessons',
    description: 'Curriculum-aligned lessons, worksheets, and printable activities.',
    tags: ['Worksheets', 'Activities'],
    icon: GraduationCap,
    best_for: 'Printable classroom activities',
  },
  {
    name: 'Education.com',
    url: 'https://www.education.com/',
    description: 'Worksheets, games, lesson plans, and educational activities for PreK-8.',
    tags: ['Worksheets', 'Games', 'PreK-8'],
    icon: Lightbulb,
    best_for: 'Primary school engagement',
  },
  {
    name: 'Nexvecta Lesson Plans',
    url: 'https://lessonplan.nexvecta.com/',
    description: 'AI-generated lesson plans aligned to learning objectives.',
    tags: ['AI', 'Lesson Plans'],
    icon: Sparkles,
    best_for: 'Quick AI lesson drafting',
  },
  {
    name: 'EduGen AI Resources',
    url: 'https://edugenai.org/resources',
    description: 'AI-powered teaching resources, rubrics, and assessment tools.',
    tags: ['AI', 'Assessment'],
    icon: Sparkles,
    best_for: 'Rubrics & assessment design',
  },
  {
    name: 'Mind Treasures',
    url: 'https://mindtreasures.com/',
    description: 'Educational printables, study guides, and skill-building materials.',
    tags: ['Printables', 'Study Guides'],
    icon: BookOpen,
    best_for: 'Supplementary materials',
  },
];

const ResourceLibraryHubPage = () => (
  <div className="container max-w-7xl py-6 space-y-6">
    <PageHeader
      title="External Resource Library"
      subtitle="Curated trusted sources for ECZ past papers, lesson plans and teaching materials. Save links into your personal repo with the 'Add resource' button on the Notes Repo."
      icon={Library}
    />

    <Card className="bg-primary/5 border-primary/20">
      <CardContent className="pt-6 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold mb-1">How to use this hub</p>
          <p className="text-muted-foreground">
            We respect each site's terms of service, so we link out instead of mirroring content.
            Found something useful? Click <strong>"Add resource"</strong> in the Notes Repo, paste the URL, tag it by
            subject + grade, and it'll be saved to your personal library — and optionally shared with the community.
          </p>
        </div>
      </CardContent>
    </Card>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {SOURCES.map(s => (
        <Card key={s.url} className="hover:shadow-lg transition-shadow flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <s.icon className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-base">{s.name}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">{s.description}</p>
            <p className="text-xs"><span className="font-semibold">Best for:</span> {s.best_for}</p>
            <div className="flex flex-wrap gap-1">
              {s.tags.map(t => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
            </div>
            <Button asChild size="sm" className="mt-auto">
              <a href={s.url} target="_blank" rel="noreferrer noopener">
                Visit site <ExternalLink className="w-3.5 h-3.5 ml-2" />
              </a>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default ResourceLibraryHubPage;
