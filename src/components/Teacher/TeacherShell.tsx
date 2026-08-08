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
    <section className="space-y-4">
      <div className="space-y-3">
        <div className="px-0.5">
          <Badge variant="secondary" className="text-[10px] tracking-wider mb-1.5">TEACHER</Badge>
          {title && <h1 className="text-[22px] sm:text-[26px] font-bold tracking-[-0.025em] leading-tight">{title}</h1>}
        </div>
        <nav
          className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0 pb-0.5"
          aria-label="Teacher pages"
        >
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/teacher"}
                className={({ isActive }) => cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium whitespace-nowrap transition-colors shrink-0",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/70 text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>
      {children}
    </section>
  );
}


export default TeacherShell;
