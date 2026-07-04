import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Radio, Video, MapPin, Clock, ExternalLink, Plus, CalendarPlus, Link as LinkIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { toast } from 'sonner';

type Klass = {
  id: string;
  title: string;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  room_code: string;
  provider: string;
  scope: string;
};

export default function UpcomingClassesCard() {
  const navigate = useNavigate();
  const { user, isDemo } = useAuth();
  const [rooms, setRooms] = useState<Klass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const nowIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('video_rooms')
        .select('id,title,scheduled_at,started_at,ended_at,room_code,provider,scope')
        .or(`scheduled_at.gte.${nowIso},started_at.not.is.null`)
        .is('ended_at', null)
        .order('scheduled_at', { ascending: true, nullsFirst: false })
        .limit(6);
      setRooms((data as Klass[]) || []);
      setLoading(false);
    })();
  }, []);

  const fmt = (iso: string | null) => {
    if (!iso) return 'Now';
    const d = new Date(iso);
    const today = new Date();
    const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
    const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (same(d, today)) return `Today · ${time}`;
    if (same(d, tomorrow)) return `Tomorrow · ${time}`;
    return `${d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} · ${time}`;
  };

  const isLive = (k: Klass) =>
    !!k.started_at && !k.ended_at;

  const joinUrl = (k: Klass) => {
    if (k.provider === 'jitsi') return `https://meet.jit.si/${k.room_code}`;
    return `/video-rooms?room=${k.room_code}`;
  };

  const googleCalUrl = (k: Klass) => {
    const start = k.scheduled_at ? new Date(k.scheduled_at) : new Date();
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const join = joinUrl(k);
    const absJoin = join.startsWith('http') ? join : `${window.location.origin}${join}`;
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: k.title,
      dates: `${fmt(start)}/${fmt(end)}`,
      details: `Live class on Edu Zambia. Join: ${absJoin}`,
      location: absJoin,
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const icsFeedUrl = () => {
    if (!user) return '';
    const base = (import.meta.env.VITE_SUPABASE_URL as string) || '';
    return `${base}/functions/v1/calendar-feed?uid=${user.id}`;
  };

  const copyFeed = async () => {
    const u = icsFeedUrl();
    if (!u) { toast.error('Sign in to get your calendar feed'); return; }
    try { await navigator.clipboard.writeText(u); toast.success('Subscribe URL copied — paste into Google/Apple Calendar'); } catch { toast.message(u); }
  };

  const demoRooms: Klass[] = [
    { id: 'demo-1', title: 'Physics · Motion in 2D', scheduled_at: new Date(Date.now() + 60*60*1000).toISOString(), started_at: null, ended_at: null, room_code: 'phys-12', provider: 'jitsi', scope: 'class' },
    { id: 'demo-2', title: 'Biology · Cell Structure', scheduled_at: new Date(Date.now() + 22*60*60*1000).toISOString(), started_at: null, ended_at: null, room_code: 'bio-04', provider: 'jitsi', scope: 'class' },
    { id: 'demo-3', title: 'Mathematics · Integration', scheduled_at: new Date(Date.now() + 26*60*60*1000).toISOString(), started_at: null, ended_at: null, room_code: 'math-08', provider: 'jitsi', scope: 'class' },
  ];
  const display: Klass[] = rooms.length ? rooms : (isDemo ? demoRooms : []);

  return (
    <Card className="p-4 lg:p-5 rounded-2xl border-border/40 shadow-sm">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-sm">Upcoming Classes</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/calendar')} className="text-xs text-primary font-medium hover:underline">Calendar</button>
          <button onClick={() => navigate('/live-learning')} className="text-xs text-primary font-medium hover:underline">All</button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[0,1,2].map(i => <div key={i} className="h-24 rounded-xl bg-muted/40 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {display.map(k => {
            const live = isLive(k);
            const url = joinUrl(k);
            const external = url.startsWith('http');
            return (
              <div key={k.id} className="p-3.5 rounded-xl bg-card border border-border/30 hover:border-primary/30 hover:shadow-elevated transition-all flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                    <Video className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <div className="text-[13px] font-bold truncate">{k.title}</div>
                      {live && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wide text-rose-600 bg-rose-500/10 px-1.5 py-0.5 rounded-full animate-pulse">
                          <Radio className="w-2.5 h-2.5" /> Live
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                      <Clock className="w-3 h-3" /><span>{fmt(k.scheduled_at)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                      <MapPin className="w-3 h-3" /><span className="truncate">{k.provider} · {k.room_code}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="h-7 px-3 text-[11px] flex-1"
                    onClick={() => {
                      if (external) window.open(url, '_blank', 'noopener');
                      else navigate(url);
                    }}
                  >
                    {live ? 'Join Live' : 'Join'}
                    {external ? <ExternalLink className="w-3 h-3 ml-1" /> : null}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-[11px]"
                    title="Add to Google Calendar"
                    onClick={() => window.open(googleCalUrl(k), '_blank', 'noopener')}
                  >
                    <CalendarPlus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] text-muted-foreground">Auto-syncs to Google / Apple Calendar via subscribe URL</span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={copyFeed} title="Copy iCal subscribe URL">
            <LinkIcon className="w-3 h-3 mr-1" /> Subscribe (.ics)
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => navigate('/video-rooms')}>
            <Plus className="w-3 h-3 mr-1" /> Schedule
          </Button>
        </div>
      </div>
    </Card>
  );
}
