import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Shield, Clock, Lock, Eye, Save, UserPlus } from 'lucide-react';
import { ScreenTimeDashboard } from '@/components/DeviceControl/ScreenTimeDashboard';
import { toast } from 'sonner';
import { LogoLoader } from '@/components/UI/LogoLoader';

interface LinkedStudent {
  student_id: string;
  student_name: string;
  controls: any;
}

const ParentalControlsPage = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<LinkedStudent[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [dailyLimit, setDailyLimit] = useState(120);
  const [focusRequired, setFocusRequired] = useState(true);
  const [minFocusMinutes, setMinFocusMinutes] = useState(30);
  const [startHour, setStartHour] = useState('06:00');
  const [endHour, setEndHour] = useState('21:00');
  const [filterLevel, setFilterLevel] = useState('strict');
  const [autoLock, setAutoLock] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchStudents = async () => {
      const { data: links } = await supabase
        .from('guardian_links')
        .select('student_id')
        .eq('guardian_id', user.id)
        .eq('status', 'active');

      if (!links || links.length === 0) { setLoading(false); return; }

      const studentIds = links.map(l => l.student_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', studentIds);

      const { data: controls } = await (supabase.from('device_controls') as any)
        .select('*')
        .eq('guardian_id', user.id);

      const controlsMap = new Map((controls || []).map((c: any) => [c.student_id, c]));

      const result = (profiles || []).map(p => ({
        student_id: p.id,
        student_name: p.full_name || 'Student',
        controls: controlsMap.get(p.id) || null,
      }));

      setStudents(result);
      if (result.length > 0) {
        setSelectedStudent(result[0].student_id);
        loadControls(result[0].controls);
      }
      setLoading(false);
    };
    fetchStudents();
  }, [user]);

  const loadControls = (c: any) => {
    if (!c) return;
    setDailyLimit(c.daily_screen_limit_minutes || 120);
    setFocusRequired(c.focus_required_before_free_time ?? true);
    setMinFocusMinutes(c.min_focus_minutes_per_day || 30);
    setStartHour(c.allowed_hours_start || '06:00');
    setEndHour(c.allowed_hours_end || '21:00');
    setFilterLevel(c.content_filter_level || 'strict');
    setAutoLock(c.auto_lock_during_schedule ?? true);
  };

  const handleStudentChange = (sid: string) => {
    setSelectedStudent(sid);
    const student = students.find(s => s.student_id === sid);
    if (student?.controls) loadControls(student.controls);
  };

  const handleSave = async () => {
    if (!user || !selectedStudent) return;
    setSaving(true);

    const payload = {
      student_id: selectedStudent,
      guardian_id: user.id,
      daily_screen_limit_minutes: dailyLimit,
      focus_required_before_free_time: focusRequired,
      min_focus_minutes_per_day: minFocusMinutes,
      allowed_hours_start: startHour,
      allowed_hours_end: endHour,
      content_filter_level: filterLevel,
      auto_lock_during_schedule: autoLock,
      updated_at: new Date().toISOString(),
    };

    const student = students.find(s => s.student_id === selectedStudent);
    if (student?.controls) {
      await (supabase.from('device_controls') as any)
        .update(payload)
        .eq('id', student.controls.id);
    } else {
      await (supabase.from('device_controls') as any).insert(payload);
    }

    toast.success('Parental controls saved!');
    setSaving(false);
  };

  if (loading) return <LogoLoader text="Loading controls..." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" /> Parental Controls
        </h1>
        <p className="text-muted-foreground mt-1">Manage your child's device usage and study enforcement</p>
      </div>

      {students.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="p-12 text-center">
            <UserPlus className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">No Linked Students</h2>
            <p className="text-muted-foreground">Ask your child to link you as a guardian first.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Student Selector */}
          {students.length > 1 && (
            <Select value={selectedStudent || ''} onValueChange={handleStudentChange}>
              <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent>
                {students.map(s => (
                  <SelectItem key={s.student_id} value={s.student_id}>{s.student_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Controls */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Screen Time Limits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Daily Screen Time Limit (minutes)</Label>
                    <Input type="number" value={dailyLimit} onChange={e => setDailyLimit(+e.target.value)} min={15} max={480} />
                  </div>
                  <div>
                    <Label>Allowed Hours</Label>
                    <div className="flex gap-2">
                      <Input type="time" value={startHour} onChange={e => setStartHour(e.target.value)} />
                      <span className="self-center text-muted-foreground">to</span>
                      <Input type="time" value={endHour} onChange={e => setEndHour(e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Lock className="w-4 h-4" /> Study Enforcement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Require focus before free time</Label>
                    <Switch checked={focusRequired} onCheckedChange={setFocusRequired} />
                  </div>
                  <div>
                    <Label>Minimum daily focus minutes</Label>
                    <Input type="number" value={minFocusMinutes} onChange={e => setMinFocusMinutes(+e.target.value)} min={5} max={240} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Auto-lock during study schedule</Label>
                    <Switch checked={autoLock} onCheckedChange={setAutoLock} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Eye className="w-4 h-4" /> Content Filtering
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={filterLevel} onValueChange={setFilterLevel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strict">Strict (educational only)</SelectItem>
                      <SelectItem value="moderate">Moderate (some non-educational)</SelectItem>
                      <SelectItem value="off">Off (no filtering)</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Button className="w-full" onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Controls'}
              </Button>
            </div>

            {/* Screen Time Dashboard for selected student */}
            {selectedStudent && (
              <ScreenTimeDashboard userId={selectedStudent} />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ParentalControlsPage;
