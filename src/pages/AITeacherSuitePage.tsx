import AIToolSuite, { Category } from '@/components/AISuite/AIToolSuite';

const CATEGORIES: Category[] = [
  {
    title: 'Planning',
    tint: 'from-blue-400/20 to-sky-300/10',
    tools: [
      { id: 'teach-lesson-plan', name: 'Lesson Plan', desc: 'ECZ-aligned plan', icon: 'menu_book', fields: [{ key: 'subject', label: 'Subject' }, { key: 'grade', label: 'Grade' }, { key: 'topic', label: 'Topic' }] },
      { id: 'teach-scheme-of-work', name: 'Scheme of Work', desc: 'Term plan', icon: 'view_timeline', fields: [{ key: 'subject', label: 'Subject' }, { key: 'grade', label: 'Grade' }, { key: 'term', label: 'Term' }] },
      { id: 'teach-differentiation', name: 'Differentiation', desc: '5 strategies', icon: 'diversity_2', fields: [{ key: 'lesson', label: 'Lesson', type: 'textarea' }] },
    ],
  },
  {
    title: 'Assessment',
    tint: 'from-amber-400/20 to-orange-300/10',
    tools: [
      { id: 'teach-worksheet', name: 'Worksheet', desc: '15 Qs + answers', icon: 'assignment', fields: [{ key: 'topic', label: 'Topic' }, { key: 'grade', label: 'Grade' }] },
      { id: 'teach-quiz', name: 'Quiz Maker', desc: '10-Q quiz', icon: 'quiz', fields: [{ key: 'topic', label: 'Topic' }, { key: 'grade', label: 'Grade' }] },
      { id: 'teach-exam-paper', name: 'Exam Paper', desc: 'ECZ style', icon: 'draft', fields: [{ key: 'subject', label: 'Subject' }, { key: 'grade', label: 'Grade' }, { key: 'topics', label: 'Topics', type: 'textarea' }] },
      { id: 'teach-rubric', name: 'Rubric', desc: '4-level rubric', icon: 'checklist', fields: [{ key: 'task', label: 'Task', type: 'textarea' }] },
    ],
  },
  {
    title: 'Communication & Care',
    tint: 'from-pink-400/20 to-rose-300/10',
    tools: [
      { id: 'teach-parent-letter', name: 'Parent Update', desc: 'EN + local lang', icon: 'forward_to_inbox', fields: [{ key: 'student', label: 'Student name' }, { key: 'notes', label: 'Notes', type: 'textarea' }] },
      { id: 'teach-remedial-plan', name: 'Remedial Plan', desc: 'For struggling learner', icon: 'support', fields: [{ key: 'student', label: 'Student profile', type: 'textarea' }] },
      { id: 'teach-classroom-mgmt', name: 'Classroom Mgmt', desc: 'Strategies + scripts', icon: 'groups', fields: [{ key: 'challenge', label: 'Challenge', type: 'textarea' }] },
    ],
  },
];

export default function AITeacherSuitePage() {
  return (
    <AIToolSuite
      title="AI Teacher Suite"
      subtitle="Plan, assess, and communicate — ECZ-aligned tools for Zambian teachers."
      heroIcon="school"
      heroGradient="from-blue-400/50 via-sky-300/30 to-transparent"
      categories={CATEGORIES}
    />
  );
}
