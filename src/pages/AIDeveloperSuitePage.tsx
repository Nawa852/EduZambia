import AIToolSuite, { Category } from '@/components/AISuite/AIToolSuite';

const CATEGORIES: Category[] = [
  {
    title: 'Code & Debug',
    tint: 'from-indigo-400/20 to-blue-300/10',
    tools: [
      { id: 'dev-code-review', name: 'Code Review', desc: 'Senior-level review', icon: 'rate_review', fields: [{ key: 'code', label: 'Paste code', type: 'textarea' }] },
      { id: 'dev-refactor', name: 'Refactor', desc: 'Clarity + performance', icon: 'auto_fix_high', fields: [{ key: 'code', label: 'Code', type: 'textarea' }] },
      { id: 'dev-debug', name: 'Debug Helper', desc: 'Rank hypotheses', icon: 'bug_report', fields: [{ key: 'error', label: 'Error / behaviour', type: 'textarea' }, { key: 'stack', label: 'Stack' }] },
      { id: 'dev-tests', name: 'Test Generator', desc: 'Unit + integration', icon: 'science', fields: [{ key: 'code', label: 'Function / module', type: 'textarea' }] },
      { id: 'dev-regex', name: 'Regex Builder', desc: 'Pattern + tests', icon: 'pattern', fields: [{ key: 'pattern', label: 'Describe the pattern' }] },
      { id: 'dev-sql', name: 'SQL Optimiser', desc: 'Query + indexes', icon: 'database', fields: [{ key: 'need', label: 'Requirement', type: 'textarea' }, { key: 'schema', label: 'Schema', type: 'textarea' }] },
    ],
  },
  {
    title: 'Architecture & Ops',
    tint: 'from-slate-400/20 to-zinc-300/10',
    tools: [
      { id: 'dev-architecture', name: 'System Design', desc: 'Components + diagram', icon: 'schema', fields: [{ key: 'product', label: 'Product' }, { key: 'scale', label: 'Scale target' }] },
      { id: 'dev-api-design', name: 'API Design', desc: 'REST / GraphQL', icon: 'api', fields: [{ key: 'need', label: 'Need', type: 'textarea' }] },
      { id: 'dev-db-schema', name: 'DB Schema', desc: 'Tables + SQL', icon: 'storage', fields: [{ key: 'domain', label: 'Domain' }] },
      { id: 'dev-devops', name: 'CI/CD & Docker', desc: 'Pipeline + Dockerfile', icon: 'settings_suggest', fields: [{ key: 'stack', label: 'Stack' }] },
      { id: 'dev-security-audit', name: 'Security Audit', desc: 'OWASP checklist', icon: 'security', fields: [{ key: 'app', label: 'App description', type: 'textarea' }] },
    ],
  },
  {
    title: 'Docs & Career',
    tint: 'from-emerald-400/20 to-teal-300/10',
    tools: [
      { id: 'dev-readme', name: 'README Writer', desc: 'Pro README.md', icon: 'article', fields: [{ key: 'project', label: 'Project', type: 'textarea' }] },
      { id: 'dev-changelog', name: 'Changelog', desc: 'Semver notes', icon: 'history', fields: [{ key: 'changes', label: 'Changes', type: 'textarea' }] },
      { id: 'dev-commit-msg', name: 'Commit Message', desc: 'Conventional format', icon: 'commit', fields: [{ key: 'diff', label: 'What changed', type: 'textarea' }] },
      { id: 'dev-interview-prep', name: 'Interview Prep', desc: '15 Q + answers', icon: 'quiz', fields: [{ key: 'role', label: 'Role' }] },
      { id: 'dev-project-idea', name: 'Project Ideas', desc: '5 portfolio ideas', icon: 'lightbulb', fields: [{ key: 'track', label: 'Career track' }] },
    ],
  },
];

export default function AIDeveloperSuitePage() {
  return (
    <AIToolSuite
      title="AI Developer Suite"
      subtitle="Ship faster — code review, architecture, tests and career tools."
      heroIcon="terminal"
      heroGradient="from-indigo-400/50 via-blue-300/30 to-transparent"
      categories={CATEGORIES}
    />
  );
}
