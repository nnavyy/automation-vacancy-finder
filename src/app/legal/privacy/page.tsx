import Link from "next/link";
import { BRAND_NAME } from "@/lib/brand";

export const metadata = {
  title: `Privacy Policy — ${BRAND_NAME}`,
  description: `Privacy Policy explaining how ${BRAND_NAME} handles user data.`,
};

export default function PrivacyPage() {
  const updated = "October 2026";

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-300">
      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="mb-12 pb-8 border-b border-zinc-800">
          <Link
            href="/dashboard/settings"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors mb-6 inline-block"
          >
            &larr; Back to Settings
          </Link>
          <h1 className="text-2xl font-bold text-zinc-100 mt-2">Privacy Policy</h1>
          <p className="text-sm text-zinc-500 mt-1">Last updated: {updated}</p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed">

          {/* Overview */}
          <section className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <h2 className="text-base font-semibold text-zinc-100 mb-2">Overview</h2>
            <p>
              {BRAND_NAME} is a hosted cloud platform providing automated job search intelligence and AI copilot
              features for candidates. We are committed to transparency and respect for candidate privacy. This Privacy
              Policy explains what information we collect, how it is secured, and your rights regarding your data.
            </p>
          </section>

          {/* 1 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">1. Information We Collect</h2>
            <p>When you register and use the Service, we process the following categories of information:</p>
            <div className="mt-4 space-y-3">
              {[
                {
                  label: "Account Credentials",
                  detail:
                    "Your email address and cryptographically hashed password (using bcrypt) used to secure your account access.",
                },
                {
                  label: "Job Search Preferences",
                  detail:
                    "Target job titles, required technical skills, minimum salary floor, desired location/work format (remote/hybrid/office), and search keywords.",
                },
                {
                  label: "Resume Context & Materials",
                  detail:
                    "Candidate resume summary, portfolio links, and preferred experience highlights provided to tailor match evaluation and cover letter drafts.",
                },
                {
                  label: "Vacancy & Application History",
                  detail:
                    "Postings matched to your criteria, saved vacancies, AI synergy assessments, application statuses, and tracking notes.",
                },
                {
                  label: "Platform Tokens & Sensitive Credentials",
                  detail:
                    "Encrypted session tokens or optional integration secrets (such as Telegram chat IDs or HeadHunter session tokens), stored at rest using AES-256-GCM authenticated encryption.",
                },
              ].map(({ label, detail }) => (
                <div key={label} className="bg-zinc-900/40 border border-zinc-800/60 rounded-lg px-4 py-3">
                  <span className="text-xs font-semibold text-zinc-200 block mb-1">{label}</span>
                  <span className="text-zinc-400">{detail}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">2. How We Use Your Information</h2>
            <p>We use collected data solely to deliver, protect, and optimize the Service, including:</p>
            <ul className="mt-3 space-y-2 list-disc list-inside text-zinc-400">
              <li>Executing periodic automated HeadHunter vacancy sweeps matched to your preferences.</li>
              <li>Performing AI-based compatibility scoring and drafting contextual cover letters.</li>
              <li>Delivering automated vacancy alerts to your configured Telegram channel.</li>
              <li>Maintaining your pipeline conversion funnel and search telemetry.</li>
              <li>Protecting platform integrity against abuse, brute-force attacks, and scraping.</li>
            </ul>
            <p className="mt-3 text-zinc-400">
              We never sell, rent, or monetize your personal information or candidate data to data brokers or advertisers.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">3. Subprocessors and Third-Party Infrastructure</h2>
            <p>
              To provide the hosted service, {BRAND_NAME} utilizes trusted enterprise infrastructure and API providers:
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-2 pr-4 text-zinc-400 font-semibold">Provider</th>
                    <th className="text-left py-2 pr-4 text-zinc-400 font-semibold">Purpose</th>
                    <th className="text-left py-2 text-zinc-400 font-semibold">Data Transmitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {[
                    { provider: "Vercel", purpose: "Application hosting and privacy-preserving performance telemetry", data: "Aggregate web performance & anonymous request metrics" },
                    { provider: "Managed PostgreSQL", purpose: "Encrypted cloud database storage", data: "Account profiles, vacancy queue, user preferences" },
                    { provider: "Groq / Google Gemini", purpose: "Server-side LLM compatibility evaluation and cover letter drafts", data: "Vacancy requirements and candidate skills / resume context" },
                    { provider: "Telegram API", purpose: "Real-time vacancy alerts", data: "Encrypted chat identifier and formatted alert text" },
                    { provider: "HeadHunter (hh.ru)", purpose: "Ingestion of public vacancy feeds and optional session synchronization", data: "Search queries and candidate session tokens (when connected)" },
                  ].map(({ provider, purpose, data }) => (
                    <tr key={provider}>
                      <td className="py-2.5 pr-4 font-medium text-zinc-200">{provider}</td>
                      <td className="py-2.5 pr-4 text-zinc-400">{purpose}</td>
                      <td className="py-2.5 text-zinc-500">{data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">4. Security Architecture</h2>
            <p>
              We implement comprehensive technical and organizational safeguards to protect your data:
            </p>
            <ul className="mt-3 space-y-2 list-disc list-inside text-zinc-400">
              <li>
                <strong>AES-256-GCM Encryption:</strong> Sensitive secrets, integration tokens, and private session cookies
                are encrypted at rest using authenticated cryptography.
              </li>
              <li>
                <strong>Encrypted In-Transit:</strong> All communication between your client and our servers is enforced over
                TLS/HTTPS with modern cipher suites.
              </li>
              <li>
                <strong>Tenant Isolation:</strong> Data access is strictly compartmentalized; queries enforce multi-tenant
                session constraints ensuring users can only view and manage their own data.
              </li>
              <li>
                <strong>Server-Side AI API Keys:</strong> Third-party model credentials remain confidential on server infrastructure
                and are never exposed to browser clients.
              </li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">5. Data Retention &amp; User Rights</h2>
            <p>
              You maintain full control over your candidate information:
            </p>
            <ul className="mt-3 space-y-2 list-disc list-inside text-zinc-400">
              <li>You may view, update, or clear your profile, resume text, and search criteria at any time via Settings.</li>
              <li>You may disconnect Telegram notifications or remove synced session cookies with a single click.</li>
              <li>You may request complete deletion of your account and associated records by contacting support.</li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">6. Updates to this Policy</h2>
            <p>
              We may update this Privacy Policy periodically to reflect service enhancements or legal requirements.
              The &quot;Last updated&quot; date at the top of this document indicates when changes were published.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">7. Contact Information</h2>
            <p>
              For privacy inquiries, data deletion requests, or questions regarding this policy, contact us at:{" "}
              <a href="mailto:nandazhafran@gmail.com" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                nandazhafran@gmail.com
              </a>
              .
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-zinc-800 flex flex-wrap gap-4 text-xs text-zinc-600">
          <Link href="/legal/terms" className="hover:text-zinc-400 transition-colors">
            Terms of Service
          </Link>
          <span>&middot;</span>
          <Link href="/dashboard/settings" className="hover:text-zinc-400 transition-colors">
            Settings
          </Link>
          <span>&middot;</span>
          <span>{BRAND_NAME}</span>
        </div>
      </div>
    </main>
  );
}
