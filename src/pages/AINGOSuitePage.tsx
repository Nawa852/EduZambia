import AIToolSuite, { Category } from '@/components/AISuite/AIToolSuite';

const CATEGORIES: Category[] = [
  {
    title: 'Strategy & Design',
    tint: 'from-orange-400/20 to-amber-300/10',
    tools: [
      { id: 'ngo-theory-of-change', name: 'Theory of Change', desc: 'Inputs → impact', icon: 'account_tree', fields: [{ key: 'program', label: 'Program', type: 'textarea' }] },
      { id: 'ngo-logframe', name: 'Logframe', desc: 'Logical framework', icon: 'grid_on', fields: [{ key: 'project', label: 'Project', type: 'textarea' }] },
      { id: 'ngo-mne-plan', name: 'M&E Plan', desc: 'Indicators + tools', icon: 'monitoring', fields: [{ key: 'project', label: 'Project' }] },
      { id: 'ngo-risk-register', name: 'Risk Register', desc: 'Risk matrix', icon: 'warning', fields: [{ key: 'project', label: 'Project', type: 'textarea' }] },
    ],
  },
  {
    title: 'Fundraising',
    tint: 'from-emerald-400/20 to-green-300/10',
    tools: [
      { id: 'ngo-grant-proposal', name: 'Grant Proposal', desc: 'Full proposal', icon: 'description', fields: [{ key: 'funder', label: 'Funder' }, { key: 'project', label: 'Project', type: 'textarea' }, { key: 'budget', label: 'Budget (ZMW)' }] },
      { id: 'ngo-donor-report', name: 'Donor Report', desc: 'Narrative + finance', icon: 'summarize', fields: [{ key: 'project', label: 'Project' }, { key: 'period', label: 'Reporting period' }] },
      { id: 'ngo-impact-report', name: 'Impact Report', desc: 'Annual report', icon: 'insights', fields: [{ key: 'org', label: 'Organisation' }, { key: 'year', label: 'Year' }] },
      { id: 'ngo-fundraising-strategy', name: 'Fundraising Strategy', desc: '12-month plan', icon: 'volunteer_activism', fields: [{ key: 'target', label: 'Target ZMW' }] },
    ],
  },
  {
    title: 'Field Ops',
    tint: 'from-sky-400/20 to-cyan-300/10',
    tools: [
      { id: 'ngo-community-survey', name: 'Needs Survey', desc: 'Kobo-ready form', icon: 'poll', fields: [{ key: 'community', label: 'Community / topic' }] },
      { id: 'ngo-training-curriculum', name: 'Training Curriculum', desc: 'Facilitator modules', icon: 'school', fields: [{ key: 'topic', label: 'Topic' }, { key: 'audience', label: 'Audience' }] },
      { id: 'ngo-safeguarding', name: 'Safeguarding Policy', desc: 'Child protection + PSEA', icon: 'shield', fields: [{ key: 'org', label: 'Organisation' }] },
      { id: 'ngo-partnership-mou', name: 'Partnership MOU', desc: 'MOU template', icon: 'handshake', fields: [{ key: 'partner', label: 'Partner' }, { key: 'scope', label: 'Scope', type: 'textarea' }] },
      { id: 'ngo-comms-plan', name: 'Comms Plan', desc: 'External comms', icon: 'campaign', fields: [{ key: 'audience', label: 'Audience' }] },
      { id: 'ngo-volunteer-jd', name: 'Volunteer JD', desc: 'Role description', icon: 'badge', fields: [{ key: 'role', label: 'Role' }] },
    ],
  },
];

export default function AINGOSuitePage() {
  return (
    <AIToolSuite
      title="AI NGO Suite"
      subtitle="Design programs, win grants and report impact — end-to-end."
      heroIcon="diversity_3"
      heroGradient="from-orange-400/50 via-amber-300/30 to-transparent"
      categories={CATEGORIES}
    />
  );
}
