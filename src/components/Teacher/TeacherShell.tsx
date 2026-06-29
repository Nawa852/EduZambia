import { NavLink, useLocation, Link } from "react-router-dom";
import { ReactNode } from "react";
import {
  LayoutDashboard, Users, BookOpen, ClipboardList, GraduationCap,
  CalendarCheck, FileBarChart2, FolderOpen, MessageSquare, Sparkles,
  Settings, Search, Bell, Sun, Moon, ChevronDown, Trophy
} from "lucide-react";
import { useAuth } from "@/components/Auth/AuthProvider";
import { useProfile } from "@/hooks/useProfile";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

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
  { to: "/settings", label: "Settings", icon: Settings },
];

export function TeacherShell({ children, title }: { children: ReactNode; title?: string }) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { theme, setTheme } = useTheme();
  const loc = useLocation();
  const name = profile?.full_name || user?.email?.split("@")[0] || "Teacher";

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r bg-card sticky top-0 h-screen">
        <div className="flex items-center gap-2 px-5 h-16 border-b">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground grid place-items-center font-bold">EZ</div>
          <span className="font-semibold">Edu Zambia</span>
        </div>
        <div className="px-5 pt-4">
          <Badge variant="secondary" className="text-[10px] tracking-wider">TEACHER</Badge>
        </div>
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = loc.pathname === item.to || (item.to !== "/teacher" && loc.pathname.startsWith(item.to));
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/80 hover:bg-accent"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
                {item.ai && <Sparkles className="w-3 h-3 ml-auto opacity-70" />}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-3 border-t space-y-3">
          <div className="rounded-xl border p-3 text-xs">
            <div className="text-muted-foreground">School</div>
            <div className="font-medium truncate">{profile?.school || "Lusaka Secondary School"}</div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 p-3 text-center border border-primary/20">
            <Trophy className="w-5 h-5 mx-auto text-primary" />
            <div className="text-xs font-semibold mt-1">You're a top educator!</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Keep engaging your students and tracking their progress.</div>
            <Button size="sm" className="mt-2 w-full h-7 text-xs">View Achievements</Button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b">
          <div className="flex items-center gap-3 px-4 lg:px-8 h-16">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/60 flex-1 max-w-md">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                placeholder="Search students, classes, resources…"
                className="bg-transparent text-sm outline-none flex-1"
              />
              <kbd className="text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded border">⌘K</kbd>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </Button>
              <Link to="/teacher/communications">
                <Button variant="ghost" size="icon"><MessageSquare className="w-4 h-4" /></Button>
              </Link>
              <Link to="/profile" className="flex items-center gap-2 pl-2">
                <Avatar className="w-9 h-9">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback>{name.slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:block leading-tight">
                  <div className="text-sm font-medium">{name}</div>
                  <div className="text-[11px] text-muted-foreground">{profile?.role === "teacher" ? "Mathematics Teacher" : "Teacher"}</div>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 lg:px-8 py-6">
          {title && <h1 className="text-2xl font-semibold mb-4">{title}</h1>}
          {children}
        </main>
      </div>
    </div>
  );
}

export default TeacherShell;
