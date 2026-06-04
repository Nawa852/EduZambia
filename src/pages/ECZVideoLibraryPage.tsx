import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/ui/page-header';
import { Play, Video, Calendar, Globe, Lightbulb } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const tiles = [
  { title: 'AI-Powered Video Curator', desc: 'Curates ECZ videos with YouTube API', icon: Video, href: '/watch?q=ECZ%20curriculum' },
  { title: 'Dynamic Video Playlist',    desc: 'Organised by subject & grade',       icon: Play,  href: '/free-courses' },
  { title: 'Offline Video Cache',       desc: 'Save lessons to watch offline',      icon: Calendar, href: '/watch' },
  { title: 'Multilingual Narrator',     desc: 'Narrates in 7 local languages',      icon: Globe, href: '/watch' },
  { title: 'AI Video Recommender',      desc: 'Suggests based on your learning',    icon: Lightbulb, href: '/watch' },
];

const ECZVideoLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          icon={Video}
          title="ECZ Video Library"
          subtitle="AI-curated, ECZ-aligned video content — Grade 7, 9 and 12."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiles.map(({ title, desc, icon: Icon, href }) => (
            <Card key={title} className="border-border/40 hover:border-primary/40 hover:shadow-md transition-all">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <span className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </span>
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{desc}</p>
                <Button className="w-full" onClick={() => navigate(href)}>Open</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ECZVideoLibraryPage;
