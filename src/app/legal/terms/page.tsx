import Link from "next/link";
import { BRAND_NAME } from "@/lib/brand";

export const metadata = {
  title: `Terms of Service — ${BRAND_NAME}`,
  description: `Terms of Service governing the use of ${BRAND_NAME}.`,
};

export default function TermsPage() {
  const updated = "September 2026";

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
              By installing, configuring, or operating {BRAND_NAME} (the &quot;Software&quot;),
              you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree,
              do not use the Software.
            </p>
            <p className="mt-3">
              These Terms apply to all users who self-host or otherwise run the Software locally or
              on any infrastructure they control.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">2. Description of Software</h2>
            <p>
              {BRAND_NAME} is an open-source, self-hosted tool that automates the discovery
              and AI-based evaluation of job vacancies from third-party employment platforms, primarily
              HH.ru. The Software interfaces with external APIs (Groq, Google Gemini, Hunter.io,
              Apollo.io, Telegram) on behalf of the user.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">3. Permitted Use</h2>
            <p>You may use the Software solely for:</p>
            <ul className="mt-3 space-y-2 list-disc list-inside text-zinc-400">
              <li>Personal job search automation on your own behalf.</li>
              <li>Local development, testing, and modification under the project license.</li>
              <li>Non-commercial research into AI-assisted recruitment tooling.</li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">4. Prohibited Use</h2>
            <p>You must not use the Software to:</p>
            <ul className="mt-3 space-y-2 list-disc list-inside text-zinc-400">
              <li>
                Send unsolicited bulk messages or spam to recruiters, hiring managers, or any third
                party.
              </li>
              <li>
                Impersonate any individual or misrepresent your credentials in automatically
                generated cover letters or outreach.
              </li>
              <li>
                Violate the Terms of Service of any third-party platform that the Software interacts
                with, including but not limited to HH.ru, LinkedIn, Hunter.io, or Apollo.io.
              </li>
              <li>
                Harvest, aggregate, or resell data obtained through the Software for commercial
                purposes without explicit written consent of the data subjects.
              </li>
              <li>
                Deploy the Software as a multi-tenant SaaS product without removing all references
                to the original project and complying with the applicable open-source license.
              </li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">
              5. Third-Party Services and API Credentials
            </h2>
            <p>
              The Software requires API keys and authentication tokens provided by third parties
              (Groq, Google, Telegram, HH.ru, Hunter.io, Apollo.io). You are solely responsible
              for:
            </p>
            <ul className="mt-3 space-y-2 list-disc list-inside text-zinc-400">
              <li>Obtaining those credentials lawfully.</li>
              <li>Securing them in your environment (e.g., <code className="font-mono text-zinc-300">.env</code> files).</li>
              <li>Complying with each provider&apos;s usage policies and rate limits.</li>
            </ul>
            <p className="mt-3">
              The project maintainers accept no liability for costs, bans, or data exposure arising
              from misuse of third-party credentials.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">6. Data and Privacy</h2>
            <p>
              All data processed by the Software (resume text, HH.ru session cookies, contact
              information) is stored exclusively in the PostgreSQL database you configure and control.
              The project maintainers never collect, receive, or have access to your personal data.
              Please review the{" "}
              <Link href="/legal/privacy" className="text-emerald-400 hover:text-emerald-300 transition-colors">
                Privacy Policy
              </Link>{" "}
              for full details.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">7. Disclaimer of Warranties</h2>
            <p>
              The Software is provided &quot;AS IS&quot; without warranty of any kind, express or implied,
              including but not limited to the implied warranties of merchantability, fitness for a
              particular purpose, and non-infringement. The project maintainers do not warrant that
              the Software will be error-free, uninterrupted, or that it will produce any particular
              job search outcome.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">8. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, the project maintainers shall not be
              liable for any indirect, incidental, special, consequential, or punitive damages, or
              any loss of profits or revenues, whether incurred directly or indirectly, arising from
              your use of the Software or its interaction with third-party platforms.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">9. Open-Source License</h2>
            <p>
              The Software is distributed under the MIT License. Use, modification, and distribution
              of the source code are governed by that license. These Terms of Service apply to the
              operational use of the running Software and do not supersede the MIT License with
              respect to copyright and redistribution rights.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">10. Changes to Terms</h2>
            <p>
              These Terms may be updated at any time. Continued use of the Software after an update
              constitutes acceptance of the revised Terms. The &quot;Last updated&quot; date at the top of
              this page reflects when changes were last made.
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
