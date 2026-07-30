import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Video, Plus, Users, Calendar, Copy, PlayCircle, StopCircle, ClipboardList, Radio } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { toast } from 'sonner';
import JitsiRoom from '@/components/Video/JitsiRoom';

interface Room {
  id: string; host_id: string; room_code: string; title: string; description: string | null;
  scope: string; scheduled_at: string | null; started_at: string | null; ended_at: string | null;
  recording_url: string | null; created_at: string;
}

interface Attendee {
  user_id: string; joined_at: string; left_at: string | null;
  profile?: { full_name: string | null };
}

const VideoRoomsPage: React.FC = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [open, setOpen] = useState(false);
  const [attendance, setAttendance] = useState<{ room: Room; list: Attendee[] } | null>(null);
  const [endRoom, setEndRoom] = useState<Room | null>(null);
  const [replayUrl, setReplayUrl] = useState('');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('video_rooms')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    setRooms((data as Room[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Realtime: new classes appear instantly for everyone in the community hub
  useEffect(() => {
    const channel = supabase
      .channel('video-rooms-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'video_rooms' }, () => { load(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const now = Date.now();
  const isLive = (r: Room) => !r.ended_at && (!r.scheduled_at || new Date(r.scheduled_at).getTime() <= now);
  const live = useMemo(() => rooms.filter(r => isLive(r)), [rooms]);
  const upcoming = useMemo(() => rooms.filter(r => !r.ended_at && r.scheduled_at && new Date(r.scheduled_at).getTime() > now), [rooms]);
  const replays = useMemo(() => rooms.filter(r => !!r.ended_at), [rooms]);

  const createRoom = async () => {
    if (!user || !title.trim()) return;
    const scheduled = scheduledAt ? new Date(scheduledAt).toISOString() : null;
    const { data, error } = await supabase.from('video_rooms').insert({
      host_id: user.id, title: title.trim(), scope: 'public',
      description: description.trim() || null,
      scheduled_at: scheduled,
      started_at: scheduled ? null : new Date().toISOString(),
    }).select().single();
    if (error) { toast.error(error.message); return; }
    toast.success(scheduled ? 'Class scheduled — followers notified' : 'You are live — followers notified');
    setOpen(false); setTitle(''); setDescription(''); setScheduledAt('');
    load();
    if (!scheduled) setActiveRoom(data as Room);
  };

  const joinRoom = async (room: Room) => {
    if (user) {
      if (room.host_id === user.id && !room.started_at) {
        await supabase.from('video_rooms').update({ started_at: new Date().toISOString() }).eq('id', room.id);
      }
      await supabase.from('video_room_participants').insert({ room_id: room.id, user_id: user.id });
    }
    setActiveRoom(room);
  };

  const leaveRoom = async () => {
    if (user && activeRoom) {
      await supabase.from('video_room_participants').update({ left_at: new Date().toISOString() })
        .eq('room_id', activeRoom.id).eq('user_id', user.id).is('left_at', null);
    }
    setActiveRoom(null);
    load();
  };

  const finishClass = async () => {
    if (!endRoom) return;
    const { error } = await supabase.from('video_rooms').update({
      ended_at: new Date().toISOString(),
      recording_url: replayUrl.trim() || null,
    }).eq('id', endRoom.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Class ended and saved to replays');
    setEndRoom(null); setReplayUrl('');
    if (activeRoom?.id === endRoom.id) setActiveRoom(null);
    load();
  };

  const openAttendance = async (room: Room) => {
    const { data } = await supabase.from('video_room_participants')
      .select('user_id, joined_at, left_at').eq('room_id', room.id).order('joined_at');
    const list = (data as Attendee[]) || [];
    if (list.length) {
      const { data: profs } = await supabase.from('profiles').select('id, full_name').in('id', [...new Set(list.map(l => l.user_id))]);
      const map = new Map((profs || []).map((p: any) => [p.id, p]));
      list.forEach(l => { l.profile = map.get(l.user_id); });
    }
    setAttendance({ room, list });
  };

  if (activeRoom) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold">{activeRoom.title}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              Code: <code className="bg-muted px-2 py-0.5 rounded">{activeRoom.room_code}</code>
              <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(activeRoom.room_code); toast.success('Copied'); }}>
                <Copy className="h-3 w-3" />
              </Button>
            </p>
          </div>
          <div className="flex gap-2">
            {activeRoom.host_id === user?.id && (
              <>
                <Button variant="outline" onClick={() => openAttendance(activeRoom)}><ClipboardList className="h-4 w-4 mr-1" />Attendance</Button>
                <Button variant="secondary" onClick={() => setEndRoom(activeRoom)}><StopCircle className="h-4 w-4 mr-1" />End class</Button>
              </>
            )}
            <Button variant="destructive" onClick={leaveRoom}>Leave</Button>
          </div>
        </div>
        <JitsiRoom roomCode={activeRoom.room_code} onLeave={leaveRoom} height={600} />
        <AttendanceDialog attendance={attendance} onClose={() => setAttendance(null)} />
        <EndDialog room={endRoom} url={replayUrl} setUrl={setReplayUrl} onClose={() => setEndRoom(null)} onConfirm={finishClass} />
      </div>
    );
  }

  const RoomCard = ({ r, variant }: { r: Room; variant: 'live' | 'upcoming' | 'replay' }) => (
    <Card className="hover:shadow-md transition">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="truncate">{r.title}</span>
          {variant === 'live' && <Badge className="shrink-0"><Radio className="h-3 w-3 mr-1" />Live</Badge>}
          {variant === 'upcoming' && <Badge variant="outline" className="shrink-0">Scheduled</Badge>}
          {variant === 'replay' && <Badge variant="secondary" className="shrink-0">Replay</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {r.description && <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>}
        {r.scheduled_at && (
          <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(r.scheduled_at).toLocaleString()}</p>
        )}
        <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" /> Code: {r.room_code}</p>
        <div className="flex gap-2 flex-wrap">
          {variant !== 'replay' && (
            <Button size="sm" className="flex-1" onClick={() => joinRoom(r)}>
              <PlayCircle className="h-4 w-4 mr-1" />{variant === 'live' ? 'Join now' : 'Join early'}
            </Button>
          )}
          {variant === 'replay' && (
            r.recording_url
              ? <Button size="sm" className="flex-1" asChild><a href={r.recording_url} target="_blank" rel="noreferrer">Watch replay</a></Button>
              : <Button size="sm" variant="outline" className="flex-1" disabled>No replay saved</Button>
          )}
          {r.host_id === user?.id && (
            <>
              <Button size="sm" variant="outline" onClick={() => openAttendance(r)}><ClipboardList className="h-4 w-4" /></Button>
              {variant !== 'replay' && <Button size="sm" variant="secondary" onClick={() => setEndRoom(r)}><StopCircle className="h-4 w-4" /></Button>}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const Grid = ({ list, variant, empty }: { list: Room[]; variant: 'live' | 'upcoming' | 'replay'; empty: string }) => (
    list.length === 0
      ? <p className="text-sm text-muted-foreground py-8 text-center">{empty}</p>
      : <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{list.map(r => <RoomCard key={r.id} r={r} variant={variant} />)}</div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Video className="h-7 w-7 text-primary" /> Live Classes</h1>
          <p className="text-muted-foreground">Host sessions, schedule classes, track attendance and share replays.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> New class</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create live class</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Grade 12 Maths revision" /></div>
              <div><Label>Description</Label><Textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="What will you cover?" /></div>
              <div><Label>Schedule (optional)</Label><Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} /></div>
              <Button onClick={createRoom} className="w-full">{scheduledAt ? 'Schedule class' : 'Go live now'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Loading classes…</p> : (
        <Tabs defaultValue="live">
          <TabsList>
            <TabsTrigger value="live">Live ({live.length})</TabsTrigger>
            <TabsTrigger value="upcoming">Scheduled ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="replays">Replays ({replays.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="live" className="mt-4"><Grid list={live} variant="live" empty="No classes are live right now." /></TabsContent>
          <TabsContent value="upcoming" className="mt-4"><Grid list={upcoming} variant="upcoming" empty="Nothing scheduled yet." /></TabsContent>
          <TabsContent value="replays" className="mt-4"><Grid list={replays} variant="replay" empty="No past classes yet." /></TabsContent>
        </Tabs>
      )}

      <AttendanceDialog attendance={attendance} onClose={() => setAttendance(null)} />
      <EndDialog room={endRoom} url={replayUrl} setUrl={setReplayUrl} onClose={() => setEndRoom(null)} onConfirm={finishClass} />
    </div>
  );
};

const AttendanceDialog: React.FC<{ attendance: { room: Room; list: Attendee[] } | null; onClose: () => void }> = ({ attendance, onClose }) => (
  <Dialog open={!!attendance} onOpenChange={(o) => !o && onClose()}>
    <DialogContent>
      <DialogHeader><DialogTitle>Attendance — {attendance?.room.title}</DialogTitle></DialogHeader>
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {(attendance?.list.length ?? 0) === 0 && <p className="text-sm text-muted-foreground py-6 text-center">Nobody has joined yet.</p>}
        {attendance?.list.map((a, i) => (
          <div key={`${a.user_id}-${i}`} className="flex items-center justify-between gap-2 p-2 rounded-lg border text-sm">
            <span className="truncate">{a.profile?.full_name || 'Learner'}</span>
            <span className="text-xs text-muted-foreground shrink-0">
              {new Date(a.joined_at).toLocaleTimeString()} → {a.left_at ? new Date(a.left_at).toLocaleTimeString() : 'in room'}
            </span>
          </div>
        ))}
      </div>
    </DialogContent>
  </Dialog>
);

const EndDialog: React.FC<{ room: Room | null; url: string; setUrl: (v: string) => void; onClose: () => void; onConfirm: () => void }> = ({ room, url, setUrl, onClose, onConfirm }) => (
  <Dialog open={!!room} onOpenChange={(o) => !o && onClose()}>
    <DialogContent>
      <DialogHeader><DialogTitle>End class & save replay</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">Paste the recording link (YouTube, Drive or uploaded file) so learners can rewatch “{room?.title}”.</p>
        <div><Label>Replay link (optional)</Label><Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" /></div>
        <Button className="w-full" onClick={onConfirm}>End class</Button>
      </div>
    </DialogContent>
  </Dialog>
);

export default VideoRoomsPage;
