import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import {
  Play, Search, Bookmark, BookmarkCheck, NotebookPen, MessageSquare,
  ListVideo, ThumbsUp, Share2, Sparkles, Loader2, CheckCircle2, ArrowRight, Circle,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useCourseProgress, findCourseByVideoId, computePercent } from '@/hooks/useCourseProgress';
import { Link } from 'react-router-dom';

interface Video {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  description?: string;
}

const FALLBACK_VIDEOS: Video[] = [
  { id: 'kn-SHddyiUE', title: 'ECZ Mathematics — Grade 12 Revision', channel: 'ECZ Tutor', thumbnail: 'https://i.ytimg.com/vi/kn-SHddyiUE/hqdefault.jpg' },
  { id: 'WUvTyaaNkzM', title: 'Photosynthesis Explained Simply', channel: 'Amoeba Sisters', thumbnail: 'https://i.ytimg.com/vi/WUvTyaaNkzM/hqdefault.jpg' },
  { id: '8mAITcNt710', title: 'Physics — Newton\'s Laws of Motion', channel: 'CrashCourse', thumbnail: 'https://i.ytimg.com/vi/8mAITcNt710/hqdefault.jpg' },
];

const NOTES_KEY = (id: string) => `video_notes_${id}`;
const BOOKMARK_KEY = 'video_bookmarks_v1';

const VideoWatchPage: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { profile } = useProfile();

  const [query, setQuery] = useState(search.get('q') || '');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Video[]>(FALLBACK_VIDEOS);
  const [notes, setNotes] = useState('');
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  const activeId = videoId || results[0]?.id || FALLBACK_VIDEOS[0].id;
  const activeVideo = useMemo(
    () => results.find(v => v.id === activeId) ?? FALLBACK_VIDEOS.find(v => v.id === activeId) ?? FALLBACK_VIDEOS[0],
    [results, activeId]
  );

  // Course-progress context: detect via ?course= or by looking up the videoId
  const courseIdParam = search.get('course') || undefined;
  const parentCourse = useMemo(
    () => (courseIdParam ? findCourseByVideoId(activeId) || undefined : findCourseByVideoId(activeId)),
    [activeId, courseIdParam]
  );
  const { progress: courseProgress, markStarted, markComplete } = useCourseProgress(parentCourse?.id);
  const lessonIndex = parentCourse?.lessons.findIndex(l => l.videoId === activeId) ?? -1;
  const nextLesson = parentCourse && lessonIndex >= 0 ? parentCourse.lessons[lessonIndex + 1] : undefined;
  const lessonDone = parentCourse ? !!courseProgress.lessons[activeId]?.completed : false;
  const coursePercent = parentCourse ? computePercent(parentCourse, courseProgress) : 0;

  useEffect(() => {
    setNotes(localStorage.getItem(NOTES_KEY(activeId)) || '');
    try { setBookmarks(JSON.parse(localStorage.getItem(BOOKMARK_KEY) || '[]')); } catch { /* noop */ }
    if (parentCourse) markStarted(activeId);
  }, [activeId, parentCourse, markStarted]);

  const saveNotes = (val: string) => {
    setNotes(val);
    localStorage.setItem(NOTES_KEY(activeId), val);
  };

  const toggleBookmark = () => {
    const next = bookmarks.includes(activeId)
      ? bookmarks.filter(b => b !== activeId)
      : [...bookmarks, activeId];
    setBookmarks(next);
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next));
    toast.success(next.includes(activeId) ? 'Bookmarked' : 'Removed from bookmarks');
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('youtube-search', {
        body: { query: `${query} ${profile?.role === 'student' ? 'ECZ Zambia' : ''}` },
      });
      if (error) throw error;
      const items: Video[] = (data?.items || []).map((it: any) => ({
        id: it.id?.videoId || it.id,
        title: it.snippet?.title || it.title,
        channel: it.snippet?.channelTitle || 'YouTube',
        thumbnail: it.snippet?.thumbnails?.high?.url || it.snippet?.thumbnails?.medium?.url || '',
      })).filter((v: Video) => v.id);
      setResults(items.length ? items : FALLBACK_VIDEOS);
    } catch (err: any) {
      console.error(err);
      toast.error('Search failed — showing suggested videos');
      setResults(FALLBACK_VIDEOS);
    } finally {
      setSearching(false);
    }
  };

  const generateAINotes = async () => {
    toast.info('Generating AI notes…');
    try {
      const { data, error } = await supabase.functions.invoke('generate-pdf-notes', {
        body: { topic: activeVideo.title, context: `Generate concise study notes for: ${activeVideo.title}` },
      });
      if (error) throw error;
      const text = data?.notes || data?.content || '';
      if (text) {
        saveNotes(notes ? `${notes}\n\n---\n${text}` : text);
        toast.success('AI notes added');
      }
    } catch {
      toast.error('AI note generation failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lessons, topics, ECZ subjects…"
            className="pl-9"
          />
        </div>
        <Button type="submit" disabled={searching}>
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
        </Button>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Player + tabs */}
        <div className="lg:col-span-2 space-y-4 min-w-0">
          <div className="aspect-video w-full rounded-xl overflow-hidden bg-black shadow-lg">
            <iframe
              key={activeId}
              src={`https://www.youtube.com/embed/${activeId}?rel=0&modestbranding=1`}
              title={activeVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>

          <div className="space-y-2">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold leading-tight">{activeVideo.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">{activeVideo.channel}</Badge>
              <Button size="sm" variant="ghost" onClick={toggleBookmark} className="h-7 gap-1">
                {bookmarks.includes(activeId) ? <BookmarkCheck className="w-4 h-4 text-primary" /> : <Bookmark className="w-4 h-4" />}
                <span className="hidden sm:inline">{bookmarks.includes(activeId) ? 'Saved' : 'Save'}</span>
              </Button>
              <Button size="sm" variant="ghost" className="h-7 gap-1"
                onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/watch/${activeId}`); toast.success('Link copied'); }}>
                <Share2 className="w-4 h-4" /><span className="hidden sm:inline">Share</span>
              </Button>
              <Button size="sm" variant="ghost" className="h-7 gap-1">
                <ThumbsUp className="w-4 h-4" /><span className="hidden sm:inline">Like</span>
              </Button>
            </div>
          </div>

          <Tabs defaultValue="notes" className="w-full">
            <TabsList className="grid grid-cols-3 w-full sm:w-auto">
              <TabsTrigger value="notes" className="gap-1.5"><NotebookPen className="w-4 h-4" />Notes</TabsTrigger>
              <TabsTrigger value="transcript" className="gap-1.5"><MessageSquare className="w-4 h-4" />Transcript</TabsTrigger>
              <TabsTrigger value="about" className="gap-1.5"><Sparkles className="w-4 h-4" />About</TabsTrigger>
            </TabsList>
            <TabsContent value="notes" className="space-y-2 mt-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Your notes are saved locally as you type.</p>
                <Button size="sm" variant="outline" onClick={generateAINotes} className="gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />AI notes
                </Button>
              </div>
              <Textarea
                value={notes}
                onChange={(e) => saveNotes(e.target.value)}
                placeholder="Write notes while you watch…"
                className="min-h-[180px] resize-y"
              />
            </TabsContent>
            <TabsContent value="transcript" className="mt-3">
              <Card><CardContent className="p-4 text-sm text-muted-foreground">
                Live transcript coming soon. Open the video on YouTube to enable captions.
              </CardContent></Card>
            </TabsContent>
            <TabsContent value="about" className="mt-3">
              <Card><CardContent className="p-4 space-y-2 text-sm">
                <p><strong>Channel:</strong> {activeVideo.channel}</p>
                <p className="text-muted-foreground">{activeVideo.description || 'No description available.'}</p>
              </CardContent></Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related list */}
        <aside className="space-y-3 min-w-0">
          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm flex items-center gap-2">
              <ListVideo className="w-4 h-4" />Up next
            </CardTitle></CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[420px] lg:h-[560px]">
                <div className="divide-y divide-border/40">
                  {results.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => navigate(`/watch/${v.id}`)}
                      className={`w-full text-left p-2.5 flex gap-2.5 hover:bg-muted/40 transition-colors ${v.id === activeId ? 'bg-primary/5' : ''}`}
                    >
                      <div className="relative w-28 sm:w-32 aspect-video rounded overflow-hidden bg-muted flex-shrink-0">
                        {v.thumbnail ? (
                          <img src={v.thumbnail} alt={v.title} loading="lazy" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Play className="w-5 h-5 text-muted-foreground" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium line-clamp-2 leading-snug">{v.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-1 truncate">{v.channel}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
};

export default VideoWatchPage;
