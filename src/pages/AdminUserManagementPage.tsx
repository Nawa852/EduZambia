import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, UserPlus, Search, Mail, Shield, MoreHorizontal, ArrowLeft, CheckCircle2, UserCog } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useProfile } from '@/hooks/useProfile';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const AdminUserManagementPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'teacher', department: '' });
  const { profile } = useProfile();
  const schoolName = profile?.school || '';

  const { data: staffMembers = [], isLoading } = useQuery({
    queryKey: ['school-staff', schoolName],
    queryFn: async () => {
      if (!schoolName) return [];
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, role, created_at, bio')
        .eq('school', schoolName)
        .in('role', ['teacher', 'institution']);
      return data || [];
    },
    enabled: !!schoolName,
  });

  const teacherCount = staffMembers.filter(s => s.role === 'teacher').length;
  const adminCount = staffMembers.filter(s => s.role === 'institution').length;

  const filtered = staffMembers.filter(u => {
    const matchSearch = (u.full_name || '').toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleAddUser = () => {
    toast.success(`Invitation sent to ${newUser.email}`);
    setAddDialogOpen(false);
    setNewUser({ name: '', email: '', role: 'teacher', department: '' });
  };

  const stats = [
    { label: 'Total Staff', value: String(staffMembers.length), icon: Users, gradient: 'from-primary/20 to-accent/10', iconColor: 'text-primary' },
    { label: 'Teachers', value: String(teacherCount), icon: CheckCircle2, gradient: 'from-green-500/15 to-emerald-500/10', iconColor: 'text-green-600' },
    { label: 'Admins', value: String(adminCount), icon: Shield, gradient: 'from-purple-500/15 to-violet-500/10', iconColor: 'text-purple-600' },
    { label: 'School', value: schoolName || '—', icon: Mail, gradient: 'from-amber-500/15 to-orange-500/10', iconColor: 'text-amber-600' },
  ];

  const roleColors: Record<string, string> = {
    teacher: 'bg-primary/10 text-primary border-primary/20',
    institution: 'bg-accent/10 text-accent-foreground border-accent/20',
  };

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-primary/10" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">User Management</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage staff, teachers, and administrators</p>
        </div>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 rounded-xl shadow-md hover:shadow-lg transition-shadow bg-gradient-to-r from-primary to-accent text-primary-foreground">
              <UserPlus className="w-4 h-4" />Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><UserCog className="w-5 h-5 text-primary" />Add New Staff Member</DialogTitle>
              <DialogDescription>Send an invitation to join the platform.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input placeholder="Full Name" className="rounded-xl" value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} />
              <Input placeholder="Email Address" type="email" className="rounded-xl" value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))} />
              <Select value={newUser.role} onValueChange={v => setNewUser(p => ({ ...p, role: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="institution">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" className="rounded-xl" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button className="rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground" onClick={handleAddUser}>Send Invitation</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
            <CardContent className="p-5 relative">
              <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />
              <div className="relative flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-background/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
                  <s.icon className={`w-6 h-6 ${s.iconColor}`} />
                </div>
                <div>
                  <p className="text-3xl font-extrabold tracking-tight">{s.value}</p>
                  <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name..." className="pl-10 rounded-xl bg-card border-border/60 focus:border-primary/40" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40 rounded-xl"><SelectValue placeholder="Filter role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="teacher">Teachers</SelectItem>
            <SelectItem value="institution">Admins</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-3">
        {isLoading && <p className="text-muted-foreground text-sm">Loading staff...</p>}
        {!isLoading && filtered.length === 0 && <p className="text-muted-foreground text-sm">No staff members found{schoolName ? ` at ${schoolName}` : '. Set your school in profile first.'}.</p>}
        {filtered.map((user, i) => (
          <motion.div key={user.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="border-border/40 hover:border-primary/30 hover:shadow-md transition-all duration-300 group">
              <CardContent className="p-4 flex items-center gap-4">
                <Avatar className="h-11 w-11 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold text-sm">
                    {(user.full_name || '??').split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{user.full_name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.bio || 'No bio'}</p>
                </div>
                <Badge variant="outline" className={`capitalize text-[10px] px-2 rounded-lg ${roleColors[user.role] || ''}`}>
                  {user.role === 'institution' ? 'admin' : user.role}
                </Badge>
                <span className="hidden lg:block text-xs text-muted-foreground w-24 text-right">{new Date(user.created_at).toLocaleDateString()}</span>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
};

export default AdminUserManagementPage;
