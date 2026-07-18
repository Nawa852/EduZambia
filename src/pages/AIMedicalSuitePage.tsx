import AIToolSuite, { Category } from '@/components/AISuite/AIToolSuite';

const CATEGORIES: Category[] = [
  {
    title: 'Clinical Reasoning',
    tint: 'from-rose-400/20 to-red-300/10',
    tools: [
      { id: 'med-differential', name: 'Differential Diagnosis', desc: 'Ranked DDx + next steps', icon: 'stethoscope', fields: [{ key: 'complaint', label: 'Chief complaint' }, { key: 'findings', label: 'History & exam', type: 'textarea' }] },
      { id: 'med-triage', name: 'Triage Assistant', desc: 'RED/YELLOW/GREEN', icon: 'emergency', fields: [{ key: 'symptoms', label: 'Symptoms', type: 'textarea' }] },
      { id: 'med-imci', name: 'IMCI (Under-5)', desc: 'Classify + treat + counsel', icon: 'child_care', fields: [{ key: 'age', label: 'Age (months)' }, { key: 'symptoms', label: 'Symptoms', type: 'textarea' }] },
      { id: 'med-case-sim', name: 'Case Simulator', desc: 'Interactive branching', icon: 'play_circle', fields: [{ key: 'topic', label: 'Topic / system' }] },
      { id: 'med-clinical-guideline', name: 'Guideline Summary', desc: 'MOH / WHO summary', icon: 'menu_book', fields: [{ key: 'condition', label: 'Condition' }] },
    ],
  },
  {
    title: 'Documentation',
    tint: 'from-pink-400/20 to-fuchsia-300/10',
    tools: [
      { id: 'med-soap', name: 'SOAP Note', desc: 'Structured note', icon: 'note_alt', fields: [{ key: 'encounter', label: 'Encounter details', type: 'textarea' }] },
      { id: 'med-referral-letter', name: 'Referral Letter', desc: 'To specialist', icon: 'forward_to_inbox', fields: [{ key: 'patient', label: 'Patient summary', type: 'textarea' }, { key: 'to', label: 'Referring to' }] },
      { id: 'med-discharge-summary', name: 'Discharge Summary', desc: 'On-discharge letter', icon: 'assignment_turned_in', fields: [{ key: 'admission', label: 'Admission summary', type: 'textarea' }] },
      { id: 'med-patient-education', name: 'Patient Handout', desc: 'English + Nyanja', icon: 'health_and_safety', fields: [{ key: 'condition', label: 'Condition' }] },
    ],
  },
  {
    title: 'Reference & CPD',
    tint: 'from-cyan-400/20 to-blue-300/10',
    tools: [
      { id: 'med-drug-info', name: 'Drug Reference', desc: 'Zambia EML', icon: 'medication', fields: [{ key: 'drug', label: 'Drug name' }] },
      { id: 'med-research-brief', name: 'Evidence Brief', desc: '500-word summary', icon: 'science', fields: [{ key: 'topic', label: 'Topic' }] },
      { id: 'med-cpd-reflection', name: 'CPD Reflection', desc: 'Kolb-cycle write-up', icon: 'psychology', fields: [{ key: 'event', label: 'Learning event', type: 'textarea' }] },
    ],
  },
];

export default function AIMedicalSuitePage() {
  return (
    <AIToolSuite
      title="AI Medical Suite"
      subtitle="Clinical reasoning, documentation and CPD for Zambian healthcare workers."
      heroIcon="health_and_safety"
      heroGradient="from-rose-400/50 via-pink-300/30 to-transparent"
      categories={CATEGORIES}
    />
  );
}
