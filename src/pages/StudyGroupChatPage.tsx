import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageSquare, Send, Plus, Users, Hash, Search,
  ArrowLeft, Smile, Paperclip
} from 'lucide-react';

interface ChatRoom {
  id: string;
  name: string;
  description: string | null;
  is_group: boolean;
  created_by: string | null;
  created_at: string;
}

interface Message {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  file_url: string | null;
  created_at: string;
  profile?: { full_name: string | null; avatar_url: string | null };
}

const StudyGroupChatPage = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch user's rooms
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchRooms = async () => {
      const { data, error } = await supabase
        .from('chat_members')
        .select('room_id, chat_rooms(id, name, description, is_group, created_by, created_at)')
        .eq('user_id', user.id);

      if (!error && data) {
        const chatRooms = data
          .map((m: any) => m.chat_rooms)
          .filter(Boolean) as ChatRoom[];
        setRooms(chatRooms);
        if (chatRooms.length > 0 && !activeRoom) setActiveRoom(chatRooms[0]);
      }
      setLoading(false);
    };
    fetchRooms();
  }, [user]);

  // Fetch messages for active room
  useEffect(() => {
    if (!activeRoom) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*, profiles:user_id(full_name, avatar_url)')
        .eq('room_id', activeRoom.id)
        .order('created_at', { ascending: true })
        .limit(200);

      if (data) {
        setMessages(data.map((m: any) => ({ ...m, profile: m.profiles })));
      }
    };
    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`room-${activeRoom.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room_id=eq.${activeRoom.id}`,
      }, async (payload) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', payload.new.user_id)
          .single();

        setMessages(prev => [...prev, { ...payload.new as Message, profile: profile || undefined }]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeRoom]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeRoom || !user) return;
    const content = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase.from('messages').insert({
      room_id: activeRoom.id,
      user_id: user.id,
      content,
    });

    if (error) toast.error('Failed to send message');
  };

  const createRoom = async () => {
    if (!newRoomName.trim() || !user) return;

    const { data: room, error } = await supabase
      .from('chat_rooms')
      .insert({ name: newRoomName.trim(), description: newRoomDesc.trim() || null, is_group: true, created_by: user.id })
      .select()
      .single();

    if (error || !room) { toast.error('Failed to create room'); return; }

    // Add creator as member
    await supabase.from('chat_members').insert({ room_id: room.id, user_id: user.id });

    setRooms(prev => [room, ...prev]);
    setActiveRoom(room);
    setNewRoomName('');
    setNewRoomDesc('');
    setCreateDialogOpen(false);
    toast.success('Study group created!');
  };

  const filteredRooms = rooms.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const formatTime = (date: string) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-background">
      {/* Sidebar - Room List */}
      <div className={`w-80 border-r border-border flex flex-col bg-card ${activeRoom ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Study Groups
            </h2>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost"><Plus className="w-5 h-5" /></Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Study Group</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div><Label>Group Name</Label><Input value={newRoomName} onChange={e => setNewRoomName(e.target.value)} placeholder="e.g. Physics Grade 12" /></div>
                  <div><Label>Description (optional)</Label><Textarea value={newRoomDesc} onChange={e => setNewRoomDesc(e.target.value)} placeholder="What's this group about?" /></div>
                  <Button className="w-full" onClick={createRoom} disabled={!newRoomName.trim()}>Create Group</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search groups..." className="pl-9" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">Loading...</div>
          ) : filteredRooms.length === 0 ? (
            <div className="p-6 text-center space-y-3">
              <Users className="w-10 h-10 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No study groups yet</p>
              <Button size="sm" onClick={() => setCreateDialogOpen(true)}>Create your first group</Button>
            </div>
          ) : (
            filteredRooms.map(room => (
              <button
                key={room.id}
                onClick={() => setActiveRoom(room)}
                className={`w-full p-3 flex items-center gap-3 text-left hover:bg-muted/50 transition-colors border-b border-border/50 ${
                  activeRoom?.id === room.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                  <Hash className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{room.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{room.description || 'Study group'}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!activeRoom ? 'hidden md:flex' : 'flex'}`}>
        {activeRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center gap-3 bg-card">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setActiveRoom(null)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Hash className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{activeRoom.name}</h3>
                <p className="text-xs text-muted-foreground">{activeRoom.description || 'Study group chat'}</p>
              </div>
              <Badge variant="outline" className="hidden sm:flex"><Users className="w-3 h-3 mr-1" /> Group</Badge>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isOwn = msg.user_id === user?.id;
                  const showAvatar = i === 0 || messages[i - 1].user_id !== msg.user_id;

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isOwn && showAvatar && (
                        <Avatar className="w-8 h-8 mt-1">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(msg.profile?.full_name || null)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      {!isOwn && !showAvatar && <div className="w-8" />}
                      <div className={`max-w-[70%] ${isOwn ? 'order-first' : ''}`}>
                        {!isOwn && showAvatar && (
                          <p className="text-xs text-muted-foreground mb-1 ml-1">
                            {msg.profile?.full_name || 'User'}
                          </p>
                        )}
                        <div className={`px-3 py-2 rounded-2xl text-sm ${
                          isOwn
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : 'bg-muted text-foreground rounded-bl-sm'
                        }`}>
                          {msg.content}
                        </div>
                        <p className={`text-[10px] text-muted-foreground mt-0.5 ${isOwn ? 'text-right mr-1' : 'ml-1'}`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border bg-card">
              <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex items-center gap-2">
                <Input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                  autoFocus
                />
                <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-6">
            <div>
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Select a study group</h3>
              <p className="text-sm text-muted-foreground mb-4">Choose a group to start chatting, or create a new one.</p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> New Study Group
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyGroupChatPage;
