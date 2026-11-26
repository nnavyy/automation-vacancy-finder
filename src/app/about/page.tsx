import type { Metadata } from "next";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import AboutClient from "@/components/about/AboutClient";
import { auth } from "@/lib/auth";
import { BRAND_NAME } from "@/lib/brand";
import { LanguageProvider } from "@/lib/i18n";
import { siteOrigin } from "@/lib/site-url";

export const metadata: Metadata = {
  title: `О проекте | ${BRAND_NAME}`,
  description:
    "Как HH Job Copilot помогает искать вакансии на HeadHunter, оценивать совпадения с профилем и получать уведомления в Telegram.",
  alternates: { canonical: new URL("/about", siteOrigin) },
};

export default async function AboutPage() {
  const session = await auth();
  const userEmail = session?.user?.email;

  return (
    <LanguageProvider>
      <div className="fw-public-theme min-h-screen bg-background text-foreground antialiased">
        <LandingHeader userEmail={userEmail} localized />
        <AboutClient />
        <LandingFooter localized />
      </div>
    </LanguageProvider>
  );
}
