import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-8">
    <h2 className="text-xl font-semibold mb-2 text-foreground">{title}</h2>
    <div className="text-sm leading-relaxed text-muted-foreground space-y-2">{children}</div>
  </section>
);

const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-primary mb-6">
          <ArrowLeft className="w-4 h-4" /> Back home
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 grid place-items-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
        </div>
        <p className="text-xs text-muted-foreground mb-8">Last updated: 30 June 2026</p>

        <Section title="1. Acceptance">
          <p>By using Edu Zambia you agree to these terms. If you do not agree, do not use the service.</p>
        </Section>
        <Section title="2. Accounts">
          <p>You are responsible for the accuracy of your information and the security of your password. One person per account; teachers and guardians must use their real identity.</p>
        </Section>
        <Section title="3. Acceptable use">
          <p>No harassment, cheating in graded work, scraping, reverse engineering, uploading malware, or sharing copyrighted content you do not own. AI outputs are aids — not a substitute for your own learning.</p>
        </Section>
        <Section title="4. Content">
          <p>You keep ownership of work you upload. You grant us a limited licence to host and display it to the people you share it with (teachers, classmates, guardians).</p>
        </Section>
        <Section title="5. Paid features">
          <p>Some features may require payment. Prices are shown in-app. Refunds follow the Zambian consumer protection rules.</p>
        </Section>
        <Section title="6. Termination">
          <p>We may suspend accounts that violate these terms. You may close your account at any time from settings.</p>
        </Section>
        <Section title="7. Disclaimer">
          <p>The service is provided "as is". We do not guarantee specific exam outcomes.</p>
        </Section>
        <Section title="8. Governing law">
          <p>These terms are governed by the laws of the Republic of Zambia.</p>
        </Section>

        <div className="text-xs text-muted-foreground border-t pt-4 mt-8">
          See also our <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>.
        </div>
      </div>
    </div>
  );
};

export default Terms;
