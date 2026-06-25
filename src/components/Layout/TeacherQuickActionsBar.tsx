import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { Calendar, FileText, ClipboardCheck, Megaphone, Zap } from 'lucide-react';

/**
 * Sticky desktop-only quick actions bar shown for teachers (mirrors the
 * "Quick Actions" footer in the Teacher dashboard mockup).
 */
export function TeacherQuickActionsBar() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  if (profile?.role !== 'teacher') return null;

  const actions = [
    { icon: Calendar, label: 'Take Attendance', to: '/attendance' },
    { icon: FileText, label: 'Create Assignment', to: '/assignments?new=1' },
    { icon: ClipboardCheck, label: 'Record Grades', to: '/gradebook' },
    { icon: Megaphone, label: 'Send Announcement', to: '/communication?tab=announcements' },
  ];

  return (
    <div className="hidden lg:block sticky bottom-0 z-30 -mx-5 mt-4">
      <div className="border-t border-border/40 bg-card/90 backdrop-blur-xl px-5 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 pr-3 border-r border-border/40">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold">Quick Actions</span>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {actions.map((a) => (
              <button
                key={a.label}
                onClick={() => navigate(a.to)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-muted text-xs font-medium transition-colors"
              >
                <a.icon className="w-3.5 h-3.5 text-muted-foreground" />
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
