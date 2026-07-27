import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send, Users, Search, MessageCircle, Plus, Loader2,
  Hash, Smile, ImageIcon, Mic, MoreHorizontal, Phone, Video,
  Pin, ArrowLeft, Sparkles, Circle, CheckCheck
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider,
} from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ChatRoom {
  id: string;
  name: string;
  is_group: boolean;
  created_by: string | null;
  description: string | null;
}

interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
  file_url: string | null;
}

interface ChatMember {
  user_id: string;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
}

const AVATAR_COLORS = [
  'from-blue-500 to-cyan-500',
  'from-violet-500 to-purple-500',
  'from-rose-500 to-pink-500',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-500',
  'from-indigo-500 to-blue-500',
];

function getAvatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// Typing indicator dots
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <div className="flex gap-0.5">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground ml-1">typing...</span>
    </div>
  );
}

const MessengerChat = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [profileMap, setProfileMap] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchRooms = async () => {
      setLoading(true);
      const { data: memberRows } = await supabase
        .from('chat_members')
        .select('room_id')
        .eq('user_id', user.id);
      if (memberRows?.length) {
        const roomIds = memberRows.map(m => m.room_id);
        const { data: roomData } = await supabase
          .from('chat_rooms')
          .select('*')
          .in('id', roomIds)
          .order('created_at', { ascending: false });
        setRooms(roomData || []);
      }
      setLoading(false);
    };
    fetchRooms();
  }, [user]);

  useEffect(() => {
    if (!selectedRoom || !user) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', selectedRoom.id)
        .order('created_at', { ascending: true })
        .limit(200);
      setMessages(data || []);
      const userIds = [...new Set((data || []).map(m => m.user_id))];
      if (userIds.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
        const map: Record<string, string> = {};
        profiles?.forEach(p => { map[p.id] = p.full_name || 'User'; });
        setProfileMap(prev => ({ ...prev, ...map }));
      }
    };
    const fetchMembers = async () => {
      const { data } = await supabase
        .from('chat_members')
        .select('user_id')
        .eq('room_id', selectedRoom.id);
      setMembers((data || []) as ChatMember[]);
    };
    fetchMessages();
    fetchMembers();

    const channel = supabase
      .channel(`room-${selectedRoom.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `room_id=eq.${selectedRoom.id}`,
      }, async (payload) => {
        const newMsg = payload.new as ChatMessage;
        setMessages(prev => [...prev, newMsg]);
        if (!profileMap[newMsg.user_id]) {
          const { data: p } = await supabase
            .from('profiles').select('id, full_name').eq('id', newMsg.user_id).single();
          if (p) setProfileMap(prev => ({ ...prev, [p.id]: p.full_name || 'User' }));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedRoom, user]);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Simulate typing indicator when user types
  useEffect(() => {
    if (newMessage.trim().length > 0) {
      setShowTyping(true);
      const timer = setTimeout(() => setShowTyping(false), 2000);
      return () => clearTimeout(timer);
    } else {
      setShowTyping(false);
    }
  }, [newMessage]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || !user) return;
    setSendingMessage(true);
    const { error } = await supabase.from('messages').insert({
      room_id: selectedRoom.id, user_id: user.id, content: newMessage.trim(),
    });
    if (error) toast.error('Failed to send message');
    setNewMessage('');
    setSendingMessage(false);
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim() || !user) return;
    const { data: room, error } = await supabase
      .from('chat_rooms')
      .insert({ name: newRoomName.trim(), created_by: user.id, is_group: true })
      .select().single();
    if (error || !room) { toast.error('Failed to create room'); return; }
    await supabase.from('chat_members').insert({ room_id: room.id, user_id: user.id });
    setRooms(prev => [room, ...prev]);
    setSelectedRoom(room);
    setNewRoomName('');
    setDialogOpen(false);
    toast.success('Chat room created!');
  };

  const handleSelectRoom = (room: ChatRoom) => {
    setSelectedRoom(room);
    setShowMobileChat(true);
  };

  const filteredRooms = searchQuery.trim()
    ? rooms.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : rooms;

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <TooltipProvider>
      <div className="h-[calc(100vh-8rem)] bg-card rounded-xl overflow-hidden border border-border shadow-sm flex">
        {/* ── Conversations Sidebar ── */}
        <div className={cn(
          "w-full md:w-80 lg:w-[340px] bg-card border-r border-border flex flex-col shrink-0",
          showMobileChat && "hidden md:flex"
        )}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-border space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground tracking-tight">Messages</h2>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20 text-primary">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>New conversation</TooltipContent>
                  </Tooltip>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader><DialogTitle>Create Chat Room</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-2">
                    <Input
                      placeholder="Room name..."
                      value={newRoomName}
                      onChange={e => setNewRoomName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCreateRoom()}
                      className="h-10"
                    />
                    <Button onClick={handleCreateRoom} className="w-full" disabled={!newRoomName.trim()}>
                      Create Room
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-secondary/50 border-border/50 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Room List */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-0.5">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <p className="text-xs text-muted-foreground">Loading chats...</p>
                </div>
              ) : filteredRooms.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <MessageCircle className="w-7 h-7 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">No conversations</p>
                  <p className="text-xs text-muted-foreground">Create a chat room to start messaging</p>
                </div>
              ) : (
                filteredRooms.map(room => {
                  const active = selectedRoom?.id === room.id;
                  const color = getAvatarColor(room.id);
                  return (
                    <button
                      key={room.id}
                      className={cn(
                        "w-full text-left p-3 rounded-xl transition-all duration-150 group",
                        active
                          ? "bg-primary/10 ring-1 ring-primary/20"
                          : "hover:bg-secondary/80"
                      )}
                      onClick={() => handleSelectRoom(room)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-semibold text-xs shrink-0",
                          color
                        )}>
                          {room.is_group ? (
                            <Hash className="w-4.5 h-4.5" />
                          ) : (
                            getInitials(room.name)
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn(
                              "text-sm truncate",
                              active ? "font-semibold text-foreground" : "font-medium text-foreground"
                            )}>
                              {room.name}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {room.description || (room.is_group ? 'Group chat' : 'Direct message')}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* ── Chat Area ── */}
        <div className={cn(
          "flex-1 flex flex-col bg-background",
          !showMobileChat && "hidden md:flex"
        )}>
          {selectedRoom ? (
            <>
              {/* Chat Header */}
              <div className="h-14 px-4 border-b border-border flex items-center justify-between shrink-0 bg-card/80 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 md:hidden"
                    onClick={() => setShowMobileChat(false)}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div className={cn(
                    "w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center text-white text-xs font-semibold",
                    getAvatarColor(selectedRoom.id)
                  )}>
                    {selectedRoom.is_group ? <Hash className="w-4 h-4" /> : getInitials(selectedRoom.name)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground leading-tight">{selectedRoom.name}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" />
                      <p className="text-[11px] text-muted-foreground">
                        {members.length} member{members.length !== 1 ? 's' : ''} • online
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Phone className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Voice call</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Video className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Video call</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Pin className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Pinned messages</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>More options</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 px-4 py-3">
                <div className="space-y-4 max-w-3xl mx-auto">
                  {messages.length === 0 && (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-8 h-8 text-primary" />
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">Start the conversation</p>
                      <p className="text-xs text-muted-foreground">Be the first to say hello! 👋</p>
                    </div>
                  )}
                  {messages.map((msg, idx) => {
                    const isMe = msg.user_id === user?.id;
                    const senderName = profileMap[msg.user_id] || 'User';
                    const showAvatar = !isMe && (idx === 0 || messages[idx - 1]?.user_id !== msg.user_id);
                    const avatarColor = getAvatarColor(msg.user_id);

                    return (
                      <div key={msg.id} className={cn("flex gap-2.5", isMe ? 'justify-end' : 'justify-start')}>
                        {!isMe && (
                          <div className="w-8 shrink-0">
                            {showAvatar && (
                              <div className={cn(
                                "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white text-[10px] font-bold",
                                avatarColor
                              )}>
                                {getInitials(senderName)}
                              </div>
                            )}
                          </div>
                        )}
                        <div className={cn(
                          "max-w-[65%] group",
                          isMe ? 'items-end' : 'items-start'
                        )}>
                          {showAvatar && !isMe && (
                            <p className="text-[11px] font-medium text-muted-foreground mb-1 ml-1">{senderName}</p>
                          )}
                          <div className={cn(
                            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                            isMe
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-secondary text-foreground rounded-bl-md"
                          )}>
                            <p>{msg.content}</p>
                          </div>
                          <div className={cn(
                            "flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity",
                            isMe ? "justify-end mr-1" : "ml-1"
                          )}>
                            <p className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                            </p>
                            {/* Read receipt for own messages */}
                            {isMe && (
                              <CheckCheck className="w-3 h-3 text-primary/60" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {/* Typing indicator */}
                  {showTyping && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-3 border-t border-border bg-card/80 backdrop-blur-sm shrink-0">
                <div className="flex items-center gap-2 max-w-3xl mx-auto">
                  <div className="flex items-center gap-0.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-full">
                          <ImageIcon className="w-4.5 h-4.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Attach image</TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
                      }}
                      className="h-10 pr-10 rounded-xl bg-secondary/50 border-border/50 text-sm"
                      disabled={sendingMessage}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground rounded-full"
                    >
                      <Smile className="w-4 h-4" />
                    </Button>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sendingMessage}
                        size="icon"
                        className="h-10 w-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                      >
                        {sendingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Send message</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-secondary/20">
              <div className="text-center space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto">
                  <MessageCircle className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">Your Messages</p>
                  <p className="text-sm text-muted-foreground mt-1">Select a conversation or start a new one</p>
                </div>
                <Button
                  variant="outline"
                  className="rounded-xl gap-2"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="w-4 h-4" /> New conversation
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default MessengerChat;
