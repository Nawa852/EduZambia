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
  doctor: 'Doctor',
  entrepreneur: 'Entrepreneur',
  developer: 'Developer',
  skills: 'Skills Development',
  cybersecurity: 'Cybersecurity',
};

export function getNavigationByRole(role: string): NavGroup[] {
  switch (role) {
    case 'teacher': return teacherNavigation;
    case 'guardian':
    case 'parent': return guardianNavigation;
    case 'institution':
    case 'school_admin': return institutionNavigation;
    case 'ministry': return ministryNavigation;
    case 'doctor':
    case 'medical': return doctorNavigation;
    case 'entrepreneur': return entrepreneurNavigation;
    case 'developer': return developerNavigation;
    case 'skills': return skillsNavigation;
    case 'cybersecurity': return cybersecurityNavigation;
    default: return studentNavigation;
  }
}

// ─── Student ────────────────────────────────────────
const studentNavigation: NavGroup[] = [
  {
    label: "Main",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, shortTitle: "Home" },
      { title: "My Learning", url: "/learn", icon: GraduationCap, shortTitle: "Learn", matchPrefixes: ["/course", "/lessons"] },
      { title: "AI Workspace", url: "/ai", icon: Brain, badge: "AI", shortTitle: "AI" },
      { title: "Study Hub", url: "/prepare", icon: Calendar, shortTitle: "Study" },
      { title: "ECZ Exams", url: "/ecz", icon: FileText, shortTitle: "ECZ" },
    ],
  },
  {
    label: "More",
    items: [
      { title: "Tools & Resources", url: "/tools", icon: Wrench, shortTitle: "Tools" },
      { title: "Free Courses", url: "/free-courses", icon: GraduationCap, shortTitle: "Free", badge: "NEW" },
      { title: "Progress", url: "/progress", icon: BarChart3, shortTitle: "Stats" },
      { title: "Connect", url: "/connect", icon: MessageSquare, shortTitle: "Connect" },
      { title: "My Account", url: "/profile", icon: User, shortTitle: "Me" },
    ],
  },
];

// ─── Teacher ────────────────────────────────────────
const teacherNavigation: NavGroup[] = [
  {
    label: "Main",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, shortTitle: "Home" },
      { title: "Teaching Hub", url: "/teach", icon: ClipboardCheck, shortTitle: "Teach" },
      { title: "AI Studio", url: "/ai", icon: Brain, badge: "AI", shortTitle: "AI" },
      { title: "ECZ Resources", url: "/ecz", icon: FileText, shortTitle: "ECZ" },
    ],
  },
  {
    label: "Classroom",
    items: [
      { title: "Lesson Plans", url: "/teach?tab=lesson-plans", icon: FileText, shortTitle: "Plans" },
      { title: "Gradebook", url: "/teach?tab=gradebook", icon: ClipboardCheck, shortTitle: "Grades" },
      { title: "Attendance", url: "/teach?tab=attendance", icon: Calendar, shortTitle: "Attend" },
      { title: "Analytics", url: "/teach?tab=analytics", icon: BarChart3, shortTitle: "Stats" },
    ],
  },
  {
    label: "Resources",
    items: [
      { title: "Notes Repo", url: "/teacher-notes-repo", icon: Bookmark, shortTitle: "Notes" },
      { title: "Specialization", url: "/teacher-specialization", icon: Award, shortTitle: "Subj" },
      { title: "Connect", url: "/connect", icon: MessageSquare, shortTitle: "Connect" },
      { title: "My Account", url: "/profile", icon: User, shortTitle: "Me" },
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
      { title: "Children", url: "/family?tab=children", icon: Heart, shortTitle: "Kids" },
      { title: "Grades", url: "/family?tab=grades", icon: BarChart3, shortTitle: "Grades" },
    ],
  },
  {
    label: "More",
    items: [
      { title: "Homework", url: "/family?tab=homework", icon: ClipboardCheck, shortTitle: "HW" },
      { title: "Controls", url: "/family?tab=controls", icon: Lock, shortTitle: "Control" },
      { title: "ECZ Resources", url: "/ecz", icon: FileText, shortTitle: "ECZ" },
      { title: "Connect", url: "/connect", icon: MessageSquare, shortTitle: "Connect" },
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
      { title: "Connect", url: "/connect", icon: MessageSquare, shortTitle: "Connect" },
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

// ─── Doctor / Medical ───────────────────────────────
const doctorNavigation: NavGroup[] = [
  {
    label: "Main",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, shortTitle: "Home" },
      { title: "Medical Hub", url: "/medical", icon: Heart, shortTitle: "Medical" },
      { title: "Case Simulator", url: "/medical-case-simulator", icon: Microscope, badge: "SIM", shortTitle: "Cases" },
      { title: "AI Coach", url: "/ai", icon: Brain, badge: "AI", shortTitle: "AI" },
    ],
  },
  {
    label: "Clinical",
    items: [
      { title: "Case Log", url: "/medical-case-log", icon: ClipboardCheck, shortTitle: "Log" },
      { title: "Clinical Notes", url: "/medical-clinical-notes", icon: FileText, shortTitle: "Notes" },
      { title: "Rotations", url: "/medical-rotations", icon: Calendar, shortTitle: "Rot" },
      { title: "Drug Reference", url: "/medical-drug-reference", icon: Bookmark, shortTitle: "Drugs" },
    ],
  },
  {
    label: "Learn",
    items: [
      { title: "My Learning", url: "/learn", icon: GraduationCap, shortTitle: "Learn" },
      { title: "Connect", url: "/connect", icon: MessageSquare, shortTitle: "Connect" },
      { title: "My Account", url: "/profile", icon: User, shortTitle: "Me" },
    ],
  },
];

// ─── Entrepreneur ───────────────────────────────────
const entrepreneurNavigation: NavGroup[] = [
  {
    label: "Main",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, shortTitle: "Home" },
      { title: "Venture Hub", url: "/entrepreneur", icon: Rocket, shortTitle: "Build" },
      { title: "AI Co-Pilot", url: "/ai", icon: Brain, badge: "AI", shortTitle: "AI" },
    ],
  },
  {
    label: "Build",
    items: [
      { title: "Business Plan", url: "/entrepreneur?tab=plan", icon: FileText, shortTitle: "Plan" },
      { title: "Pitch Deck", url: "/entrepreneur?tab=pitch", icon: Sparkles, shortTitle: "Pitch" },
      { title: "Financials", url: "/entrepreneur?tab=finance", icon: DollarSign, shortTitle: "$$" },
      { title: "Milestones", url: "/entrepreneur?tab=milestones", icon: Target, shortTitle: "Goals" },
    ],
  },
  {
    label: "Grow",
    items: [
      { title: "Marketplace", url: "/marketplace", icon: Briefcase, shortTitle: "Market" },
      { title: "Connect", url: "/connect", icon: MessageSquare, shortTitle: "Connect" },
      { title: "My Account", url: "/profile", icon: User, shortTitle: "Me" },
    ],
  },
];

// ─── Developer ──────────────────────────────────────
const developerNavigation: NavGroup[] = [
  {
    label: "Main",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, shortTitle: "Home" },
      { title: "Dev Hub", url: "/developer", icon: Code, shortTitle: "Dev" },
      { title: "IDE", url: "/developer-ide", icon: Monitor, badge: "LIVE", shortTitle: "IDE" },
      { title: "AI Review", url: "/ai", icon: Brain, badge: "AI", shortTitle: "AI" },
    ],
  },
  {
    label: "Build",
    items: [
      { title: "Projects", url: "/developer-projects", icon: FolderOpen, shortTitle: "Proj" },
      { title: "Code Review", url: "/developer-code-review", icon: Search, shortTitle: "Review" },
      { title: "Challenges", url: "/developer-challenges", icon: Target, shortTitle: "Daily" },
    ],
  },
  {
    label: "Learn",
    items: [
      { title: "My Learning", url: "/learn", icon: GraduationCap, shortTitle: "Learn" },
      { title: "Connect", url: "/connect", icon: MessageSquare, shortTitle: "Connect" },
      { title: "My Account", url: "/profile", icon: User, shortTitle: "Me" },
    ],
  },
];

// ─── Skills ─────────────────────────────────────────
const skillsNavigation: NavGroup[] = [
  {
    label: "Main",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, shortTitle: "Home" },
      { title: "My Learning", url: "/learn", icon: GraduationCap, shortTitle: "Learn" },
      { title: "Skill Passport", url: "/skill-passport", icon: Award, shortTitle: "Skills" },
      { title: "Marketplace", url: "/marketplace", icon: Briefcase, shortTitle: "Jobs" },
    ],
  },
  {
    label: "More",
    items: [
      { title: "AI Tools", url: "/ai", icon: Brain, badge: "AI", shortTitle: "AI" },
      { title: "Progress", url: "/progress", icon: BarChart3, shortTitle: "Stats" },
      { title: "Connect", url: "/connect", icon: MessageSquare, shortTitle: "Connect" },
      { title: "My Account", url: "/profile", icon: User, shortTitle: "Me" },
    ],
  },
];

// ─── Cybersecurity ──────────────────────────────────
const cybersecurityNavigation: NavGroup[] = [
  {
    label: "Main",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, shortTitle: "Home" },
      { title: "Cyber Hub", url: "/cybersecurity", icon: Shield, shortTitle: "Cyber" },
      { title: "Terminal", url: "/cyber-terminal", icon: Monitor, badge: "LIVE", shortTitle: "Term" },
      { title: "SOC Sim", url: "/cyber-soc", icon: Bot, shortTitle: "SOC" },
    ],
  },
  {
    label: "Skills",
    items: [
      { title: "Skill Tree", url: "/cyber-skills", icon: Layers, shortTitle: "Tree" },
      { title: "AI Mentor", url: "/ai", icon: Brain, badge: "AI", shortTitle: "AI" },
      { title: "Connect", url: "/connect", icon: MessageSquare, shortTitle: "Connect" },
      { title: "My Account", url: "/profile", icon: User, shortTitle: "Me" },
    ],
  },
];

// ─── Helpers ────────────────────────────────────────
export function matchesNavItem(pathname: string, item: Pick<NavItem, "url" | "matchPrefixes">) {
  const candidates = [item.url, ...(item.matchPrefixes ?? [])];
  return candidates.some((c) => pathname === c || pathname.startsWith(`${c}/`));
}

export function getPrimaryNavigationByRole(role: string): NavItem[] {
  const nav = getNavigationByRole(role);
  return nav.flatMap(g => g.items);
}

export function getCommandNavigationByRole(role: string): Array<NavItem & { group: string }> {
  // All hub pages for the command palette
  const baseItems: Array<NavItem & { group: string }> = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, group: "Navigate", shortTitle: "Home" },
    { title: "My Learning", url: "/learn", icon: GraduationCap, group: "Navigate", shortTitle: "Learn" },
    { title: "AI Workspace", url: "/ai", icon: Brain, group: "Navigate", shortTitle: "AI" },
    { title: "Study Hub", url: "/prepare", icon: Calendar, group: "Navigate", shortTitle: "Study" },
    { title: "ECZ Exams", url: "/ecz", icon: FileText, group: "Navigate", shortTitle: "ECZ" },
    { title: "Progress", url: "/progress", icon: BarChart3, group: "Navigate", shortTitle: "Stats" },
    { title: "Connect", url: "/connect", icon: MessageSquare, group: "Navigate", shortTitle: "Connect" },
    { title: "Profile", url: "/profile", icon: User, group: "Account", shortTitle: "Me" },
    { title: "Settings", url: "/profile?tab=settings", icon: Settings, group: "Account" },
    { title: "Notifications", url: "/profile?tab=notifications", icon: Bell, group: "Account" },
    { title: "Bookmarks", url: "/prepare?tab=bookmarks", icon: Bookmark, group: "Account" },
  ];

  // Add role-specific entries
  if (role === 'teacher') {
    baseItems.splice(2, 0, { title: "Teaching Hub", url: "/teach", icon: ClipboardCheck, group: "Navigate", shortTitle: "Teach" });
  }
  if (role === 'guardian') {
    baseItems.splice(2, 0, { title: "Family", url: "/family", icon: Users, group: "Navigate", shortTitle: "Family" });
  }
  if (role === 'institution') {
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
    { title: "Goals", url: "/prepare?tab=goals", icon: Target, group: "Study" },
    { title: "Past Papers", url: "/ecz?tab=papers", icon: FileText, group: "ECZ" },
    { title: "Exam Simulator", url: "/ecz?tab=simulator", icon: FileText, group: "ECZ" },
    { title: "Messenger", url: "/connect?tab=messenger", icon: MessageSquare, group: "Connect" },
    { title: "Study Groups", url: "/connect?tab=groups", icon: Users, group: "Connect" },
    { title: "Leaderboard", url: "/progress?tab=leaderboard", icon: Trophy, group: "Progress" },
    { title: "Achievements", url: "/progress?tab=achievements", icon: Award, group: "Progress" },
  ];

  return [...baseItems, ...tabItems];
}
