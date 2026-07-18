import AIToolSuite, { Category } from '@/components/AISuite/AIToolSuite';

const CATEGORIES: Category[] = [
  {
    title: 'Skills & Learning',
    tint: 'from-violet-400/20 to-purple-300/10',
    tools: [
      { id: 'skill-learning-path', name: 'Learning Path', desc: '12-week roadmap', icon: 'route', fields: [{ key: 'skill', label: 'Target skill' }, { key: 'level', label: 'Current level' }] },
      { id: 'skill-portfolio-brief', name: 'Portfolio Projects', desc: '3 project briefs', icon: 'folder_special', fields: [{ key: 'skill', label: 'Skill' }] },
      { id: 'skill-gap-analysis', name: 'Skill Gap Analysis', desc: 'Current vs target', icon: 'compare_arrows', fields: [{ key: 'current', label: 'Current skills', type: 'textarea' }, { key: 'role', label: 'Target role' }] },
    ],
  },
  {
    title: 'Career & Jobs',
    tint: 'from-blue-400/20 to-indigo-300/10',
    tools: [
      { id: 'skill-cv', name: 'CV Writer', desc: 'ATS-friendly', icon: 'description', fields: [{ key: 'info', label: 'Your info', type: 'textarea' }, { key: 'role', label: 'Target role' }] },
      { id: 'skill-cover-letter', name: 'Cover Letter', desc: 'Tailored letter', icon: 'mail', fields: [{ key: 'role', label: 'Role' }, { key: 'company', label: 'Company' }, { key: 'about', label: 'About you', type: 'textarea' }] },
      { id: 'skill-interview-prep', name: 'Interview Prep', desc: '10 Q + STAR answers', icon: 'record_voice_over', fields: [{ key: 'role', label: 'Role' }] },
      { id: 'skill-career-plan', name: 'Career Plan', desc: '3-year plan', icon: 'trending_up', fields: [{ key: 'goal', label: 'Career goal' }] },
      { id: 'skill-freelance-profile', name: 'Freelance Profile', desc: 'Upwork/Fiverr', icon: 'work', fields: [{ key: 'skill', label: 'Skill' }] },
    ],
  },
  {
    title: 'Networking',
    tint: 'from-teal-400/20 to-emerald-300/10',
    tools: [
      { id: 'skill-networking-outreach', name: 'Outreach Messages', desc: '5 LinkedIn/email', icon: 'send', fields: [{ key: 'target', label: 'Whom to reach' }] },
      { id: 'skill-mentor-request', name: 'Mentor Request', desc: 'Warm intro', icon: 'supervisor_account', fields: [{ key: 'mentor', label: 'Mentor field' }, { key: 'ask', label: 'Specific ask' }] },
      { id: 'skill-apprenticeship-pitch', name: 'Apprenticeship Pitch', desc: 'Application', icon: 'engineering', fields: [{ key: 'program', label: 'Program' }, { key: 'about', label: 'About you', type: 'textarea' }] },
    ],
  },
];

export default function AISkillsSuitePage() {
  return (
    <AIToolSuite
      title="AI Career & Skills Suite"
      subtitle="Grow, get hired, and thrive — from CV to career plan."
      heroIcon="workspace_premium"
      heroGradient="from-violet-400/50 via-purple-300/30 to-transparent"
      categories={CATEGORIES}
    />
  );
}
