import Link from "next/link";
import { BRAND_NAME } from "@/lib/brand";

export const metadata = {
  title: `Privacy Policy — ${BRAND_NAME}`,
  description: `Privacy Policy explaining how ${BRAND_NAME} handles user data.`,
};

export default function PrivacyPage() {
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
          <h1 className="text-2xl font-bold text-zinc-100 mt-2">Privacy Policy</h1>
          <p className="text-sm text-zinc-500 mt-1">Last updated: {updated}</p>
        </div>

        <div className="space-y-10 text-sm leading-relaxed">

          {/* Overview */}
          <section className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5">
            <h2 className="text-base font-semibold text-zinc-100 mb-2">Overview</h2>
            <p>
              {BRAND_NAME} is a self-hosted, open-source application. This means the
              project maintainers have no access to your data, your database, your API keys, or
              any information you enter into the Software. All data resides in the PostgreSQL
              database that you provision and control.
            </p>
          </section>

          {/* 1 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">1. Data We Do Not Collect</h2>
            <p>The project maintainers do not collect, store, or process any of the following:</p>
            <ul className="mt-3 space-y-2 list-disc list-inside text-zinc-400">
              <li>Your name, email address, or contact information.</li>
              <li>Your HH.ru session cookies or authentication tokens.</li>
              <li>Your resume text or portfolio URLs.</li>
              <li>Job vacancy data or AI analysis results.</li>
              <li>Telegram chat IDs or message history.</li>
              <li>Any analytics, telemetry, or usage statistics.</li>
            </ul>
            <p className="mt-3">
              The Software contains no telemetry, no crash reporting services, and no analytics
              SDKs that phone home to any external server controlled by the maintainers.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">2. Data You Store Locally</h2>
            <p>
              When you operate the Software, the following categories of data are written to your
              PostgreSQL database:
            </p>
            <div className="mt-4 space-y-3">
              {[
                {
                  label: "Profile Settings",
                  detail:
                    "Name, target roles, required skills, salary range, language preferences, and other search configuration.",
                },
                {
                  label: "HH.ru Credentials",
                  detail:
                    "Your HH.ru session cookie string, used exclusively to authenticate API requests on your behalf. Never transmitted to any server other than HH.ru.",
                },
                {
                  label: "Vacancy Data",
                  detail:
                    "Job postings fetched from HH.ru, including titles, descriptions, employer names, and AI-generated scores and analysis.",
                },
                {
                  label: "Resume and Cover Letter Context",
                  detail:
                    "The resume text and portfolio URL you provide, used by the AI provider to generate personalized cover letters.",
                },
                {
                  label: "Application History",
                  detail:
                    "Negotiation statuses synced from your HH.ru account, stored to power the analytics and pipeline dashboards.",
                },
              ].map(({ label, detail }) => (
                <div key={label} className="bg-zinc-900/40 border border-zinc-800/60 rounded-lg px-4 py-3">
                  <span className="text-xs font-semibold text-zinc-200 block mb-1">{label}</span>
                  <span className="text-zinc-400">{detail}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">3. Third-Party Services</h2>
            <p>
              To function, the Software makes outbound requests to third-party services on your
              behalf. Each service has its own privacy policy governing the data it receives:
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-2 pr-4 text-zinc-400 font-semibold">Service</th>
                    <th className="text-left py-2 pr-4 text-zinc-400 font-semibold">Purpose</th>
                    <th className="text-left py-2 text-zinc-400 font-semibold">Data Sent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {[
                    { service: "HH.ru", purpose: "Vacancy scraping, application sync", data: "Session cookie, search keywords" },
                    { service: "Groq / OpenAI", purpose: "AI vacancy scoring and cover letter generation", data: "Job description, resume text" },
                    { service: "Google Gemini", purpose: "AI fallback provider", data: "Job description, resume text" },
                    { service: "Hunter.io", purpose: "HR contact discovery (optional)", data: "Company domain name" },
                    { service: "Apollo.io", purpose: "HR contact discovery (optional)", data: "Company name" },
                    { service: "Telegram", purpose: "Push notifications for high-score vacancies", data: "Chat ID, notification text" },
                  ].map(({ service, purpose, data }) => (
                    <tr key={service}>
                      <td className="py-2.5 pr-4 font-medium text-zinc-200">{service}</td>
                      <td className="py-2.5 pr-4 text-zinc-400">{purpose}</td>
                      <td className="py-2.5 text-zinc-500">{data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-zinc-500">
              OSINT services (Hunter.io, Apollo.io) are optional and only invoked when you actively
              use the Company Intel feature.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">4. Authentication and Session Security</h2>
            <p>
              Authentication is handled by NextAuth.js using a Prisma adapter. Session tokens are
              stored as secure, HttpOnly cookies in your browser and as hashed records in your
              database. The application does not implement email marketing, password recovery
              emails, or any form of outbound communication to the registered account address.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">5. Data Retention and Deletion</h2>
            <p>
              Because all data is stored in your own PostgreSQL database, you have full control
              over retention and deletion:
            </p>
            <ul className="mt-3 space-y-2 list-disc list-inside text-zinc-400">
              <li>
                Vacancies can be individually hidden or deleted through the dashboard interface.
              </li>
              <li>
                All data can be wiped by dropping or resetting your database (
                <code className="font-mono text-zinc-300">npx prisma db push --force-reset</code>).
              </li>
              <li>
                API keys and session cookies can be revoked at any time from your
                <code className="font-mono text-zinc-300"> .env</code> file or the Settings page.
              </li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">6. Security Recommendations</h2>
            <p>Because you are operating your own infrastructure, you are responsible for:</p>
            <ul className="mt-3 space-y-2 list-disc list-inside text-zinc-400">
              <li>Keeping your <code className="font-mono text-zinc-300">.env</code> file outside of version control (it is listed in <code className="font-mono text-zinc-300">.gitignore</code> by default).</li>
              <li>Securing your PostgreSQL database with strong credentials and network firewall rules.</li>
              <li>Using HTTPS when exposing the application over the public internet.</li>
              <li>Rotating your HH.ru session cookie and external API keys periodically.</li>
            </ul>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">7. Children</h2>
            <p>
              The Software is not intended for use by individuals under the age of 16. By using
              the Software, you confirm that you meet this age requirement.
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">8. Changes to This Policy</h2>
            <p>
              This Privacy Policy may be updated to reflect changes in the Software or applicable
              regulations. The &quot;Last updated&quot; date at the top of this page reflects when the
              policy was last revised. Continued use of the Software after a revision constitutes
              acceptance of the updated policy.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-base font-semibold text-zinc-100 mb-3">9. Contact</h2>
            <p>
              If you have questions about this Privacy Policy or wish to report a potential
              security issue, please open an issue in the project repository on GitHub. Do not
              include personally identifiable information in public issue reports.
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
