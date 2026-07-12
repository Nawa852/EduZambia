import { NavLink } from "react-router-dom";
import { ReactNode } from "react";
import {
  LayoutDashboard, Users, BookOpen, ClipboardList, GraduationCap,
  CalendarCheck, FileBarChart2, FolderOpen, MessageSquare, Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/teacher", label: "Dashboard", icon: LayoutDashboard },
  { to: "/teacher/classes", label: "My Classes", icon: Users },
  { to: "/teacher/lessons", label: "Lessons", icon: BookOpen },
  { to: "/teacher/assignments", label: "Assignments", icon: ClipboardList },
  { to: "/teacher/gradebook", label: "Gradebook", icon: GraduationCap },
  { to: "/teacher/students", label: "Students", icon: Users },
  { to: "/teacher/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/teacher/reports", label: "Reports & Analytics", icon: FileBarChart2 },
  { to: "/teacher/copilot", label: "Curriculum Co-Pilot", icon: Sparkles, ai: true },
  { to: "/teacher/resources", label: "Resources", icon: FolderOpen },
  { to: "/teacher/communications", label: "Communication", icon: MessageSquare },
];

export function TeacherShell({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <section className="max-w-[1280px] mx-auto space-y-4 pb-8">
      <div className="rounded-2xl bg-card border border-border/40 shadow-sm p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge variant="secondary" className="text-[10px] tracking-wider mb-2">TEACHER WORKSPACE</Badge>
            {title && <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>}
          </div>
          <nav className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0" aria-label="Teacher pages">
            {NAV.slice(0, 9).map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => cn(
                    "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors border",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-secondary/50 text-muted-foreground border-border/40 hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                  {item.ai && <Sparkles className="w-3 h-3" />}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>
      {children}
    </section>
  );
}

export default TeacherShell;
