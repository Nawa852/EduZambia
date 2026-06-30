import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-8">
    <h2 className="text-xl font-semibold mb-2 text-foreground">{title}</h2>
    <div className="text-sm leading-relaxed text-muted-foreground space-y-2">{children}</div>
  </section>
);

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-primary mb-6">
          <ArrowLeft className="w-4 h-4" /> Back home
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 grid place-items-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        </div>
        <p className="text-xs text-muted-foreground mb-8">Last updated: 30 June 2026</p>

        <Section title="1. Who we are">
          <p>Edu Zambia ("we", "us") provides an ECZ-aligned learning platform for students, teachers, parents and institutions in Zambia. Contact: privacy@eduzambia.xyz.</p>
        </Section>
        <Section title="2. Data we collect">
          <p>Account details (name, email, phone, role), learning activity (lessons, quizzes, attendance, grades), AI prompts you submit, device and usage diagnostics, and optional profile data such as school and grade.</p>
        </Section>
        <Section title="3. How we use your data">
          <p>To deliver lessons and AI tutoring, personalise learning, allow teachers and guardians to support their learners, secure the service, and improve quality. We do not sell personal data.</p>
        </Section>
        <Section title="4. AI features">
          <p>AI features process your inputs via trusted providers (Google, OpenAI and the Lovable AI Gateway). Do not paste highly sensitive personal information into AI tools.</p>
        </Section>
        <Section title="5. Sharing">
          <p>We share data only with: your linked teachers/guardians/school, infrastructure providers (Supabase/Lovable Cloud, hosting, email/SMS), and authorities where required by Zambian law.</p>
        </Section>
        <Section title="6. Children">
          <p>Learners under 16 require guardian consent. Guardians can review or request deletion of their child's data at any time.</p>
        </Section>
        <Section title="7. Your rights">
          <p>You may access, correct, export or delete your data, withdraw consent, and lodge a complaint. Email privacy@eduzambia.xyz and we will respond within 30 days.</p>
        </Section>
        <Section title="8. Security & retention">
          <p>Data is encrypted in transit and at rest. We keep account data while your account is active and for a limited period afterwards for legal and academic-record purposes.</p>
        </Section>
        <Section title="9. Changes">
          <p>We will notify you in-app of material changes to this policy.</p>
        </Section>

        <div className="text-xs text-muted-foreground border-t pt-4 mt-8">
          See also our <Link to="/terms" className="text-primary underline">Terms of Service</Link>.
        </div>
      </div>
    </div>
  );
};

export default Privacy;
