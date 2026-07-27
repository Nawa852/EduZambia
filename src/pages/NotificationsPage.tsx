import { useState, useEffect } from 'react';
import { LogoLoader } from '@/components/UI/LogoLoader';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bell, CheckCheck, FileText, Award, Clock, Calendar,
  AlertTriangle, Trash2, Inbox
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

const typeConfig: Record<string, { icon: typeof Bell; bg: string; text: string; label: string }> = {
  new_assignment: { icon: FileText, bg: 'bg-primary/10', text: 'text-primary', label: 'Assignment' },
  graded: { icon: Award, bg: 'bg-emerald-500/10', text: 'text-emerald-600', label: 'Grade' },
  deadline: { icon: AlertTriangle, bg: 'bg-amber-500/10', text: 'text-amber-600', label: 'Deadline' },
  reminder: { icon: Calendar, bg: 'bg-blue-500/10', text: 'text-blue-600', label: 'Reminder' },
};

const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetch = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (data) setNotifications(data as Notification[]);
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel('notifs-page')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAllRead = async () => {
    if (!user) { setLoading(false); return; }
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    toast.success('All notifications marked as read');
  };

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const unread = notifications.filter(n => !n.is_read);
  const read = notifications.filter(n => n.is_read);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <LogoLoader text="Loading notifications..." />
      </div>
    );
  }

  const NotifCard = ({ n }: { n: Notification }) => {
    const config = typeConfig[n.type] || { icon: Bell, bg: 'bg-muted', text: 'text-muted-foreground', label: 'Info' };
    const Icon = config.icon;
    return (
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
        <Card className={`transition-all ${!n.is_read ? 'border-primary/30 bg-primary/5' : ''}`}>
          <CardContent className="p-4 flex items-start gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${config.bg}`}>
              <Icon className={`w-5 h-5 ${config.text}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Badge variant="outline" className="text-[10px] h-4">{config.label}</Badge>
                {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
              </div>
              <h3 className={`text-sm ${!n.is_read ? 'font-semibold text-foreground' : 'text-foreground/80'}`}>{n.title}</h3>
              {n.message && <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>}
              <p className="text-[10px] text-muted-foreground/60 mt-1.5 flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" />
                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
              </p>
            </div>
            {!n.is_read && (
              <Button variant="ghost" size="sm" className="shrink-0 text-xs" onClick={() => markRead(n.id)}>
                <CheckCheck className="w-3 h-3 mr-1" /> Read
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" /> Notifications
          </h1>
          <p className="text-sm text-muted-foreground">{unread.length} unread · {notifications.length} total</p>
        </div>
        {unread.length > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="w-4 h-4 mr-2" /> Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Inbox className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="font-medium text-foreground">No notifications</p>
            <p className="text-sm text-muted-foreground mt-1">You'll receive alerts about assignments, grades, and deadlines here.</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
            <TabsTrigger value="unread">Unread ({unread.length})</TabsTrigger>
            <TabsTrigger value="read">Read ({read.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="space-y-2 mt-4">
            {notifications.map(n => <NotifCard key={n.id} n={n} />)}
          </TabsContent>
          <TabsContent value="unread" className="space-y-2 mt-4">
            {unread.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">All caught up! 🎉</CardContent></Card>
            ) : unread.map(n => <NotifCard key={n.id} n={n} />)}
          </TabsContent>
          <TabsContent value="read" className="space-y-2 mt-4">
            {read.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No read notifications.</CardContent></Card>
            ) : read.map(n => <NotifCard key={n.id} n={n} />)}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default NotificationsPage;
