import Link from "next/link";
import { BRAND_NAME } from "@/lib/brand";

export const metadata = {
  title: `Terms of Service — ${BRAND_NAME}`,
  description: `Terms of Service governing the use of ${BRAND_NAME}.`,
};

export default function TermsPage() {
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
          <h1 className="text-2xl font-bold text-zinc-100 mt-2">Terms of Service</h1>
          <p className="text-sm text-zinc-500 mt-1">Last updated: {updated}</p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed">

          {/* 1 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing, creating an account on, or using {BRAND_NAME} (the &quot;Service&quot; or &quot;Software&quot;),
              you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms,
              do not access or use the Service.
            </p>
            <p className="mt-3">
              These Terms apply to all users, registered account holders, visitors, and subscribers of {BRAND_NAME}.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">2. Description of Service</h2>
            <p>
              {BRAND_NAME} is a proprietary, hosted SaaS platform and career automation copilot designed to
              streamline the discovery, assessment, and management of job vacancies from third-party employment
              platforms, primarily HeadHunter (hh.ru).
            </p>
            <p className="mt-3">
              The Service provides automated vacancy monitoring, AI-assisted candidate fit analysis, cover letter
              drafting, application tracking, analytics telemetry, and direct recruiter intelligence.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">3. Permitted Use &amp; Account License</h2>
            <p>
              Subject to these Terms, {BRAND_NAME} grants you a personal, revocable, non-exclusive, non-transferable,
              and non-sublicensable right to access and use the Service strictly for your own personal, non-commercial job
              search automation and career planning.
            </p>
            <p className="mt-3">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities
              that occur under your account.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">4. Prohibited Use &amp; Restrictions</h2>
            <p>You must not, directly or indirectly:</p>
            <ul className="mt-3 space-y-2 list-disc list-inside text-zinc-400">
              <li>
                Reverse engineer, decompile, disassemble, copy, reproduce, modify, or create derivative works
                based upon any part of the Software, service infrastructure, or underlying algorithms.
              </li>
              <li>
                Sublicense, sell, rent, lease, distribute, redistribute, or commercially exploit access to {BRAND_NAME}
                or operate it as a white-label or multi-tenant commercial offering for third parties.
              </li>
              <li>
                Send unsolicited bulk messages, spam, harassment, or abusive communications to recruiters, hiring
                managers, or third-party platforms.
              </li>
              <li>
                Misrepresent your credentials, fabricate qualifications, or impersonate another individual in
                automated job applications or communications.
              </li>
              <li>
                Circumvent, disable, or tamper with security controls, rate limiters, payment verifications, or feature
                entitlements of the Service.
              </li>
              <li>
                Scrape, harvest, aggregate, or bulk export data from {BRAND_NAME} or third-party platforms in violation of
                applicable terms of service or data protection regulations.
              </li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">
              5. Third-Party Platforms and Integrations
            </h2>
            <p>
              {BRAND_NAME} interfaces with external third-party services and APIs (including HeadHunter, Telegram,
              and AI reasoning providers). When using these integrations:
            </p>
            <ul className="mt-3 space-y-2 list-disc list-inside text-zinc-400">
              <li>You agree to comply with each external platform&apos;s published Terms of Service and API policies.</li>
              <li>You acknowledge that {BRAND_NAME} is independent of and not endorsed or sponsored by HeadHunter LLC.</li>
              <li>
                External platform rate limits, terms changes, or access restrictions are outside the control of {BRAND_NAME}.
              </li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">6. Data Privacy and Security</h2>
            <p>
              Your personal data, search criteria, resume text, application history, and session settings are handled
              strictly in accordance with our{" "}
              <Link href="/legal/privacy" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                Privacy Policy
              </Link>
              . We implement industry-standard encryption (including AES-256-GCM for sensitive secrets and tokens) to
              protect candidate information across our hosted infrastructure.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">7. Disclaimer of Warranties</h2>
            <p>
              The Service is provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; without warranties of any kind, either
              express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose,
              and non-infringement. We do not warrant that the Service will be uninterrupted, error-free, or that it will guarantee
              interviews, job offers, or specific employment outcomes.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, {BRAND_NAME}, its founders, operators, and affiliates shall not be
              liable for any indirect, incidental, consequential, special, or punitive damages, or loss of profits, data,
              or employment opportunities arising from your use of or inability to use the Service.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">9. Proprietary Rights and Intellectual Property</h2>
            <p>
              {BRAND_NAME} is proprietary software. All rights, title, and interest in and to the Software, source code,
              algorithms, database schemas, visual designs, interfaces, and branding belong exclusively to {BRAND_NAME} and
              its operators.
            </p>
            <p className="mt-3">
              This project is not licensed under the MIT License or any open-source license. No license or transfer of
              intellectual property rights is granted by implication, estoppel, or otherwise, except for the limited right
              to access the hosted service as expressly set forth herein.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">10. Modifications to Terms and Service</h2>
            <p>
              We reserve the right to modify or replace these Terms, or modify or discontinue the Service, at any time.
              Continued access to the Service following any modifications constitutes acceptance of the revised Terms.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-zinc-800 flex flex-wrap gap-4 text-xs text-zinc-600">
          <Link href="/legal/privacy" className="hover:text-zinc-400 transition-colors">
            Privacy Policy
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
