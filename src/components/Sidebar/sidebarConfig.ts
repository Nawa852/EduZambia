import {
  LayoutDashboard, BookOpen, User, Brain, Users, BarChart3, Trophy,
  GraduationCap, Settings, FileText, Calendar, FolderOpen,
  MessageSquare, Target, ClipboardCheck, Building2,
  Bell, Shield, PieChart,
  Briefcase, Heart, Wrench, Sparkles,
  Layers, Timer, Award,
  Microscope, Bot, Zap, Rocket, Monitor,
  DollarSign, Flag, Lock, Search, Bookmark, Code,
  type LucideIcon
} from "lucide-react";
import { isStudentNavVisible } from "@/config/studentFeatures";


export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  badge?: string;
  shortTitle?: string;
  matchPrefixes?: string[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const roleLabels: Record<string, string> = {
  student: 'Student',
  teacher: 'Teacher',
  guardian: 'Guardian',
  institution: 'Institution',
  ministry: 'Ministry',
  
  
  
  
  
};

export function getNavigationByRole(role: string): NavGroup[] {
  switch (role) {
    case 'teacher': return teacherNavigation;
    case 'guardian':
    case 'parent': return guardianNavigation;
    case 'institution':
    case 'school_admin': return institutionNavigation;
    case 'ministry': return ministryNavigation;
    default:
      // Students never see a paused feature in navigation.
      return studentNavigation
        .map(g => ({ ...g, items: g.items.filter(i => isStudentNavVisible(i.url)) }))
        .filter(g => g.items.length > 0);
  }
}


// ─── Student ────────────────────────────────────────
// Four verbs, not fifteen screens: Home · Synapse AI · Practice · Me.
const studentNavigation: NavGroup[] = [
  {
    label: "Main",
    items: [
      { title: "Home", url: "/dashboard", icon: LayoutDashboard, shortTitle: "Home" },
      { title: "Synapse AI", url: "/synapse", icon: Sparkles, shortTitle: "Synapse", badge: "AI", matchPrefixes: ["/know-your-stuff", "/ai", "/snap-and-solve"] },
      { title: "Practice", url: "/practice", icon: Target, shortTitle: "Practice", matchPrefixes: ["/ecz", "/prepare"] },
      { title: "Me", url: "/profile", icon: User, shortTitle: "Me", matchPrefixes: ["/progress", "/settings"] },
    ],
  },
  {
    label: "Study",
    items: [
      { title: "My Files", url: "/study", icon: FolderOpen, shortTitle: "Files" },
      { title: "Resources", url: "/practice?tab=resources", icon: FileText, shortTitle: "Papers" },
      { title: "My Notes", url: "/prepare?tab=notes", icon: BookOpen, shortTitle: "Notes" },
      { title: "Planner", url: "/practice?tab=planner", icon: ClipboardCheck, shortTitle: "Plan" },
      { title: "Focus Timer", url: "/practice?tab=focus", icon: Timer, shortTitle: "Focus" },
    ],
  },
  {
    label: "More",
    items: [
      { title: "Progress", url: "/progress", icon: BarChart3, shortTitle: "Stats" },
      { title: "Family Link", url: "/profile?tab=family", icon: Users, shortTitle: "Family" },
      { title: "Settings", url: "/profile?tab=settings", icon: Settings, shortTitle: "Settings" },
    ],
  },
];


// ─── Teacher ────────────────────────────────────────
// Four verbs, mirroring the student side: Home · Co-Pilot · Teach · Me.
const teacherNavigation: NavGroup[] = [
  {
    label: "Main",
    items: [
      { title: "Home", url: "/dashboard", icon: LayoutDashboard, shortTitle: "Home" },
      { title: "Co-Pilot", url: "/teacher/copilot", icon: Sparkles, shortTitle: "Co-Pilot", badge: "AI", matchPrefixes: ["/ai-lesson-generator", "/ai-teacher-suite", "/teacher-test-generator"] },
      { title: "Teach", url: "/teach", icon: ClipboardCheck, shortTitle: "Teach", matchPrefixes: ["/teacher", "/gradebook", "/attendance"] },
      { title: "Me", url: "/profile", icon: User, shortTitle: "Me", matchPrefixes: ["/settings"] },
    ],
  },
  {
    label: "Classroom",
    items: [
      { title: "Teacher World", url: "/teacher/profile", icon: GraduationCap, badge: "★", shortTitle: "World" },
      { title: "Class Manager", url: "/teach?tab=classes", icon: Users, shortTitle: "Classes" },
      { title: "Grading Queue", url: "/teach?tab=grading-queue", icon: ClipboardCheck, shortTitle: "Marking" },
      { title: "Resource Library", url: "/library", icon: FolderOpen, shortTitle: "Library" },
      { title: "Students", url: "/teacher/students", icon: Users, shortTitle: "Students" },
      { title: "Gradebook", url: "/gradebook", icon: BarChart3, shortTitle: "Grades" },
      { title: "Attendance", url: "/attendance", icon: Calendar, shortTitle: "Attend" },
    ],
  },
  {
    label: "Planning",
    items: [
      { title: "Lesson Planner", url: "/teach?tab=lesson-plans", icon: FileText, shortTitle: "Plan" },
      { title: "Scheme of Work", url: "/teach?tab=scheme-of-work", icon: BookOpen, shortTitle: "Scheme" },
      { title: "Test Generator", url: "/teach?tab=test-generator", icon: Target, shortTitle: "Tests" },
      { title: "My Materials", url: "/teach?tab=my-materials", icon: FolderOpen, shortTitle: "Materials" },
      { title: "Analytics", url: "/teach?tab=analytics", icon: PieChart, shortTitle: "Reports" },
    ],
  },
  {
    label: "More",
    items: [
      { title: "Announcements", url: "/teach?tab=announcements", icon: Bell, shortTitle: "News" },
      { title: "Communication", url: "/communication", icon: MessageSquare, shortTitle: "Chat" },
      { title: "Calendar", url: "/calendar", icon: Calendar, shortTitle: "Cal" },
      { title: "Professional Development", url: "/teacher-specialization", icon: Award, shortTitle: "PD" },
      { title: "Settings", url: "/settings", icon: Settings, shortTitle: "Settings" },
    ],
  },
];




// ─── Guardian ───────────────────────────────────────
const guardianNavigation: NavGroup[] = [
  {
    label: "Main",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, shortTitle: "Home" },
      { title: "Family Hub", url: "/family", icon: Users, shortTitle: "Family" },
      { title: "My Children", url: "/family?tab=children", icon: Heart, shortTitle: "Kids" },
      { title: "Weekly Report", url: "/family?tab=report", icon: FileText, shortTitle: "Report" },
      { title: "Teacher Updates", url: "/family?tab=updates", icon: MessageSquare, shortTitle: "Updates" },
      { title: "Grades & Progress", url: "/family?tab=grades", icon: BarChart3, shortTitle: "Grades" },
      { title: "Homework", url: "/family?tab=homework", icon: ClipboardCheck, shortTitle: "HW" },
    ],
  },
  {
    label: "Care",
    items: [
      { title: "Rewards", url: "/family?tab=rewards", icon: Award, shortTitle: "Rewards" },
      { title: "Activity Feed", url: "/family?tab=activity", icon: Bell, shortTitle: "Activity" },
      { title: "Parental Controls", url: "/family?tab=controls", icon: Lock, shortTitle: "Control" },
      { title: "Link Child", url: "/family?tab=link", icon: Users, shortTitle: "Link" },
      { title: "Reports", url: "/guardian-reports", icon: FileText, shortTitle: "Reports" },
    ],
  },
  {
    label: "More",
    items: [
      { title: "Teacher Contact", url: "/parent-teacher-contact", icon: Users, shortTitle: "Teachers" },
      { title: "ECZ Resources", url: "/ecz", icon: FileText, shortTitle: "ECZ" },
      { title: "My Account", url: "/profile", icon: User, shortTitle: "Me" },
    ],
  },
];

// ─── Institution / School Admin ─────────────────────
const institutionNavigation: NavGroup[] = [
  {
    label: "Main",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, shortTitle: "Home" },
      { title: "Admin Hub", url: "/admin", icon: Building2, shortTitle: "Admin" },
      { title: "Teachers", url: "/school-teachers", icon: GraduationCap, badge: "NEW", shortTitle: "Staff" },
      { title: "Users", url: "/admin?tab=users", icon: Users, shortTitle: "Users" },
      { title: "Curriculum", url: "/admin?tab=curriculum", icon: BookOpen, shortTitle: "Curric" },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Analytics", url: "/admin?tab=analytics", icon: PieChart, shortTitle: "Stats" },
      { title: "Attendance", url: "/admin?tab=attendance", icon: ClipboardCheck, shortTitle: "Attend" },
      { title: "Scheduling", url: "/admin?tab=scheduling", icon: Calendar, shortTitle: "Sched" },
      { title: "ECZ Resources", url: "/ecz", icon: FileText, shortTitle: "ECZ" },
      { title: "My Account", url: "/profile", icon: User, shortTitle: "Me" },
    ],
  },
];

// ─── Ministry ───────────────────────────────────────
const ministryNavigation: NavGroup[] = [
  {
    label: "Main",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, shortTitle: "Home" },
      { title: "Ministry Hub", url: "/ministry", icon: Building2, shortTitle: "Ministry" },
      { title: "Schools", url: "/ministry?tab=schools", icon: GraduationCap, shortTitle: "Schools" },
      { title: "Policies", url: "/ministry?tab=policy", icon: Flag, shortTitle: "Policy" },
    ],
  },
  {
    label: "Insights",
    items: [
      { title: "ECZ Analytics", url: "/ministry?tab=analytics", icon: PieChart, shortTitle: "Stats" },
      { title: "Budget", url: "/ministry?tab=budget", icon: DollarSign, shortTitle: "Budget" },
      { title: "ECZ Resources", url: "/ecz", icon: FileText, shortTitle: "ECZ" },
      { title: "My Account", url: "/profile", icon: User, shortTitle: "Me" },
    ],
  },
];

// ─── Helpers ────────────────────────────────────────
export function matchesNavItem(pathname: string, item: Pick<NavItem, "url" | "matchPrefixes">) {
  const candidates = [item.url, ...(item.matchPrefixes ?? [])];
  return candidates.some((c) => pathname === c || pathname.startsWith(`${c}/`));
}

const isStudentRole = (role: string) => role === 'student' || !role;

/** Bottom-bar / primary destinations. Students get exactly the four core tabs. */
export function getPrimaryNavigationByRole(role: string): NavItem[] {
  const nav = getNavigationByRole(role);
  const main = nav[0]?.items ?? [];
  if (isStudentRole(role)) return main;
  return main.length >= 4 ? main : nav.flatMap(g => g.items);
}


export function getCommandNavigationByRole(role: string): Array<NavItem & { group: string }> {
  // All hub pages for the command palette
  const baseItems: Array<NavItem & { group: string }> = [
    { title: "Home", url: "/dashboard", icon: LayoutDashboard, group: "Navigate", shortTitle: "Home" },
    ...(isStudentRole(role)
      ? [
          { title: "Synapse AI", url: "/synapse", icon: Sparkles, group: "Navigate", shortTitle: "Synapse" },
          { title: "Practice", url: "/practice", icon: Target, group: "Navigate", shortTitle: "Practice" },
          { title: "My Files", url: "/study", icon: FolderOpen, group: "Navigate", shortTitle: "Files" },
          { title: "Family Link", url: "/profile?tab=family", icon: Users, group: "Account", shortTitle: "Family" },
        ]
      : []),

    { title: "My Learning", url: "/learn", icon: GraduationCap, group: "Navigate", shortTitle: "Learn" },
    { title: "AI Workspace", url: "/ai", icon: Brain, group: "Navigate", shortTitle: "AI" },
    { title: "Study Hub", url: "/prepare", icon: Calendar, group: "Navigate", shortTitle: "Study" },
    { title: "ECZ Exams", url: "/ecz", icon: FileText, group: "Navigate", shortTitle: "ECZ" },
    { title: "Progress", url: "/progress", icon: BarChart3, group: "Navigate", shortTitle: "Stats" },
    { title: "Profile", url: "/profile", icon: User, group: "Account", shortTitle: "Me" },
    { title: "Settings", url: "/profile?tab=settings", icon: Settings, group: "Account" },
    { title: "Notifications", url: "/profile?tab=notifications", icon: Bell, group: "Account" },
    { title: "Bookmarks", url: "/prepare?tab=bookmarks", icon: Bookmark, group: "Account" },
    { title: "Knowledge Hub", url: "/prepare?tab=notes", icon: FolderOpen, group: "Study", shortTitle: "Notes" },
    { title: "Flashcards", url: "/ai?tab=flashcards", icon: Layers, group: "Study", shortTitle: "Cards" },
    { title: "Tasks & Planner", url: "/prepare?tab=planner", icon: ClipboardCheck, group: "Study", shortTitle: "Tasks" },
    { title: "Focus Timer", url: "/prepare?tab=focus", icon: Timer, group: "Study", shortTitle: "Focus" },
    { title: "Smart Study Tools", url: "/tools", icon: Sparkles, group: "Study", shortTitle: "Tools" },
    { title: "Quiz Generator", url: "/ai?tab=quiz", icon: Target, group: "Study" },
    { title: "Mind Maps", url: "/ai?tab=mind-maps", icon: Layers, group: "Study" },
  ];

  // Add role-specific entries
  if (role === 'teacher') {
    baseItems.splice(2, 0,
      { title: "Teaching Hub", url: "/teach", icon: ClipboardCheck, group: "Navigate", shortTitle: "Teach" },
      { title: "My Classes", url: "/teacher-classes", icon: Users, group: "Teacher", shortTitle: "Classes" },
      { title: "Lesson Planner", url: "/teach?tab=lesson-plans", icon: FileText, group: "Teacher", shortTitle: "Plan" },
      { title: "Scheme of Work", url: "/teach?tab=scheme-of-work", icon: BookOpen, group: "Teacher", shortTitle: "Scheme" },
      { title: "Gradebook", url: "/gradebook", icon: BarChart3, group: "Teacher", shortTitle: "Grades" },
      { title: "Attendance", url: "/attendance", icon: Calendar, group: "Teacher", shortTitle: "Attend" },
      { title: "Communication", url: "/communication", icon: MessageSquare, group: "Teacher", shortTitle: "Chat" },
      { title: "Announcements", url: "/teach?tab=announcements", icon: Bell, group: "Teacher" },
      { title: "Analytics", url: "/teach?tab=analytics", icon: PieChart, group: "Teacher" },
      { title: "Notes Repo", url: "/teacher-notes-repo", icon: Bookmark, group: "Teacher", shortTitle: "Notes" },
      { title: "Resources", url: "/resource-library", icon: FolderOpen, group: "Teacher" },
      { title: "My Materials", url: "/my-materials", icon: FolderOpen, group: "Teacher" },
      { title: "Specialization", url: "/teacher-specialization", icon: Award, group: "Teacher" },
      { title: "AI Lesson Generator", url: "/ai-lesson-generator", icon: Sparkles, group: "Teacher" },
    );
  }
  if (role === 'guardian' || role === 'parent') {
    baseItems.splice(2, 0,
      { title: "Family Hub", url: "/family", icon: Users, group: "Navigate", shortTitle: "Family" },
      { title: "My Children", url: "/family?tab=children", icon: Heart, group: "Guardian", shortTitle: "Kids" },
      { title: "Grades & Progress", url: "/family?tab=grades", icon: BarChart3, group: "Guardian", shortTitle: "Grades" },
      { title: "Homework Tracker", url: "/family?tab=homework", icon: ClipboardCheck, group: "Guardian", shortTitle: "HW" },
      { title: "Rewards", url: "/family?tab=rewards", icon: Award, group: "Guardian" },
      { title: "Activity Feed", url: "/family?tab=activity", icon: Bell, group: "Guardian" },
      { title: "Parental Controls", url: "/family?tab=controls", icon: Lock, group: "Guardian" },
      { title: "Link Child", url: "/family?tab=link", icon: Users, group: "Guardian" },
      { title: "Reports", url: "/guardian-reports", icon: FileText, group: "Guardian" },
      { title: "Teacher Contact", url: "/parent-teacher-contact", icon: MessageSquare, group: "Guardian" },
    );
  }
  if (role === 'institution' || role === 'school_admin') {
    baseItems.splice(1, 0, { title: "Admin", url: "/admin", icon: Building2, group: "Navigate", shortTitle: "Admin" });
  }
  if (role === 'ministry') {
    baseItems.splice(1, 0, { title: "Ministry", url: "/ministry", icon: Building2, group: "Navigate", shortTitle: "Ministry" });
  }

  // Add quick-access tabs as command items
  const tabItems: Array<NavItem & { group: string }> = [
    { title: "Flashcards", url: "/ai?tab=flashcards", icon: Layers, group: "AI Tools" },
    { title: "AI Chat", url: "/ai?tab=chat", icon: Brain, group: "AI Tools" },
    { title: "AI Tutor", url: "/ai?tab=tutor", icon: Sparkles, group: "AI Tools" },
    { title: "Quiz Generator", url: "/ai?tab=quiz", icon: Target, group: "AI Tools" },
    { title: "Mind Maps", url: "/ai?tab=mind-maps", icon: Brain, group: "AI Tools" },
    { title: "Focus Mode", url: "/prepare?tab=focus", icon: Timer, group: "Study" },
    { title: "My Notes", url: "/prepare?tab=notes", icon: FileText, group: "Study" },
    { title: "Past Papers", url: "/ecz?tab=papers", icon: FileText, group: "ECZ" },
    { title: "Exam Simulator", url: "/ecz?tab=simulator", icon: FileText, group: "ECZ" },
    { title: "Achievements", url: "/progress?tab=achievements", icon: Award, group: "Progress" },
  ];

  const all = [...baseItems, ...tabItems];
  return isStudentRole(role) ? all.filter(i => isStudentNavVisible(i.url)) : all;

}
