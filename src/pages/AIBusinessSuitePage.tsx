import AIToolSuite, { Category } from '@/components/AISuite/AIToolSuite';

const CATEGORIES: Category[] = [
  {
    title: 'Business Creation',
    tint: 'from-blue-400/20 to-cyan-300/10',
    tools: [
      { id: 'business-idea', name: 'Idea Generator', desc: 'Fresh Zambia-ready ideas', icon: 'lightbulb', fields: [{ key: 'interests', label: 'Interests / skills', type: 'textarea' }, { key: 'budget', label: 'Starting budget (ZMW)' }] },
      { id: 'business-plan', name: 'Business Plan', desc: 'Investor-ready plan', icon: 'description', fields: [{ key: 'name', label: 'Business name' }, { key: 'sector', label: 'Sector' }, { key: 'description', label: 'Description', type: 'textarea' }] },
      { id: 'pitch-deck', name: 'Pitch Deck', desc: '10-slide investor deck', icon: 'slideshow', fields: [{ key: 'name', label: 'Company' }, { key: 'stage', label: 'Stage' }, { key: 'ask', label: 'Ask (ZMW)' }] },
      { id: 'financial-projection', name: 'Financial Projection', desc: '3-year projection ZMW', icon: 'trending_up', fields: [{ key: 'model', label: 'Revenue model' }, { key: 'assumptions', label: 'Assumptions', type: 'textarea' }] },
      { id: 'company-registration', name: 'PACRA Registration', desc: 'PACRA + ZRA guide', icon: 'gavel', fields: [{ key: 'type', label: 'Entity type' }] },
      { id: 'brand-name', name: 'Brand Names', desc: '15 name candidates', icon: 'label', fields: [{ key: 'sector', label: 'Sector' }, { key: 'vibe', label: 'Vibe' }] },
      { id: 'logo-brief', name: 'Logo Brief', desc: 'Design direction', icon: 'palette', fields: [{ key: 'name', label: 'Brand' }, { key: 'style', label: 'Style' }] },
      { id: 'brand-identity', name: 'Brand Identity', desc: 'Voice, colors, type', icon: 'brush', fields: [{ key: 'name', label: 'Brand' }, { key: 'audience', label: 'Audience' }] },
      { id: 'website-copy', name: 'Website Copy', desc: 'Full site copy', icon: 'web', fields: [{ key: 'name', label: 'Business' }, { key: 'offer', label: 'Offer', type: 'textarea' }] },
      { id: 'landing-page', name: 'Landing Page', desc: 'Conversion copy', icon: 'view_carousel', fields: [{ key: 'product', label: 'Product' }, { key: 'audience', label: 'Audience' }] },
      { id: 'pricing-strategy', name: 'Pricing Strategy', desc: 'Tiered pricing', icon: 'sell', fields: [{ key: 'product', label: 'Product' }, { key: 'costs', label: 'Unit cost (ZMW)' }] },
      { id: 'proposal', name: 'Proposal', desc: 'Client proposal', icon: 'contract', fields: [{ key: 'client', label: 'Client' }, { key: 'scope', label: 'Scope', type: 'textarea' }, { key: 'budget', label: 'Budget (ZMW)' }] },
      { id: 'invoice', name: 'Invoice', desc: 'Pro invoice + VAT', icon: 'receipt_long', fields: [{ key: 'client', label: 'Client' }, { key: 'items', label: 'Line items', type: 'textarea' }] },
      { id: 'quotation', name: 'Quotation', desc: 'Formal quote', icon: 'request_quote', fields: [{ key: 'client', label: 'Client' }, { key: 'items', label: 'Items', type: 'textarea' }] },
      { id: 'contract', name: 'Contract', desc: 'Service contract', icon: 'assignment', fields: [{ key: 'parties', label: 'Parties' }, { key: 'scope', label: 'Scope', type: 'textarea' }] },
    ],
  },
  {
    title: 'Sales & Marketing',
    tint: 'from-fuchsia-400/20 to-pink-300/10',
    tools: [
      { id: 'marketing-plan', name: 'Marketing Plan', desc: '90-day plan', icon: 'campaign', fields: [{ key: 'business', label: 'Business' }, { key: 'budget', label: 'Budget ZMW' }] },
      { id: 'ad-copy', name: 'Ad Generator', desc: 'Meta / Google ads', icon: 'ads_click', fields: [{ key: 'product', label: 'Product' }, { key: 'audience', label: 'Audience' }] },
      { id: 'social-post', name: 'Social Posts', desc: '7 platform posts', icon: 'share', fields: [{ key: 'topic', label: 'Topic' }, { key: 'brand', label: 'Brand voice' }] },
      { id: 'content-plan', name: 'Content Calendar', desc: '4-week calendar', icon: 'calendar_month', fields: [{ key: 'niche', label: 'Niche' }] },
      { id: 'video-script', name: 'Video Script', desc: '60-second script', icon: 'movie', fields: [{ key: 'topic', label: 'Topic' }] },
      { id: 'copywriting', name: 'Copywriter', desc: 'AIDA rewrite', icon: 'edit_note', fields: [{ key: 'text', label: 'Original', type: 'textarea' }] },
      { id: 'email-campaign', name: 'Email Sequence', desc: '5-email nurture', icon: 'mail', fields: [{ key: 'offer', label: 'Offer' }] },
      { id: 'sms-campaign', name: 'SMS Campaign', desc: '5 variants', icon: 'sms', fields: [{ key: 'offer', label: 'Offer' }] },
      { id: 'whatsapp-campaign', name: 'WhatsApp Blast', desc: 'Broadcast + follow-up', icon: 'chat', fields: [{ key: 'offer', label: 'Offer' }] },
      { id: 'lead-magnet', name: 'Lead Magnet', desc: 'Opt-in generator', icon: 'download', fields: [{ key: 'audience', label: 'Audience' }] },
      { id: 'sales-pipeline', name: 'Sales Pipeline', desc: 'Stages + KPIs', icon: 'view_kanban', fields: [{ key: 'model', label: 'Sales model' }] },
      { id: 'referral-plan', name: 'Referral Program', desc: 'Viral loop', icon: 'group_add', fields: [{ key: 'product', label: 'Product' }] },
      { id: 'seo-audit', name: 'SEO Plan', desc: 'Keywords + fixes', icon: 'search', fields: [{ key: 'url', label: 'Website / niche' }] },
    ],
  },
  {
    title: 'Operations & Finance',
    tint: 'from-emerald-400/20 to-teal-300/10',
    tools: [
      { id: 'budget-plan', name: 'Budget Planner', desc: 'Monthly ZMW budget', icon: 'account_balance_wallet', fields: [{ key: 'income', label: 'Income ZMW' }, { key: 'notes', label: 'Notes', type: 'textarea' }] },
      { id: 'cashflow', name: 'Cash Flow', desc: '12-month forecast', icon: 'waterfall_chart', fields: [{ key: 'business', label: 'Business' }, { key: 'assumptions', label: 'Assumptions', type: 'textarea' }] },
      { id: 'pnl', name: 'P&L Statement', desc: 'Profit & loss', icon: 'query_stats', fields: [{ key: 'period', label: 'Period' }] },
      { id: 'tax-guide', name: 'Tax Guide', desc: 'VAT / PAYE / WHT', icon: 'account_balance', fields: [{ key: 'type', label: 'Business type' }] },
      { id: 'loan-analysis', name: 'Loan Calculator', desc: 'Amortisation', fields: [{ key: 'amount', label: 'Amount ZMW' }, { key: 'rate', label: 'Rate %' }, { key: 'term', label: 'Term (months)' }], icon: 'calculate' },
      { id: 'grant-finder', name: 'Grant Finder', desc: '10 grants for you', icon: 'volunteer_activism', fields: [{ key: 'sector', label: 'Sector' }] },
      { id: 'inventory-plan', name: 'Inventory', desc: 'ABC + reorder', icon: 'inventory_2', fields: [{ key: 'products', label: 'Products', type: 'textarea' }] },
      { id: 'supplier-eval', name: 'Supplier Scoring', desc: 'Weighted matrix', icon: 'factory', fields: [{ key: 'suppliers', label: 'Suppliers', type: 'textarea' }] },
    ],
  },
];

export default function AIBusinessSuitePage() {
  return (
    <AIToolSuite
      title="AI Business Suite"
      subtitle="Everything you need to start, run and grow a Zambian business."
      heroIcon="rocket_launch"
      heroGradient="from-blue-400/50 via-cyan-300/30 to-transparent"
      categories={CATEGORIES}
    />
  );
}
