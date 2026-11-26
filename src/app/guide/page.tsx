import type { Metadata } from "next";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingHeader from "@/components/landing/LandingHeader";
import { auth } from "@/lib/auth";
import { BRAND_NAME } from "@/lib/brand";
import { LanguageProvider } from "@/lib/i18n";
import { siteOrigin } from "@/lib/site-url";
import GuideClient from "./GuideClient";

export const metadata: Metadata = {
  title: `Как начать поиск работы на HeadHunter | ${BRAND_NAME}`,
  description: "Создайте профиль, запустите поиск вакансий на HeadHunter и разберите подходящие предложения в HH Job Copilot.",
  alternates: { canonical: new URL("/guide", siteOrigin) },
};

export default async function GuidePage() {
  const session = await auth();
  const userEmail = session?.user?.email;

  return (
    <LanguageProvider>
      <div className="fw-public-theme min-h-screen bg-background text-foreground antialiased">
        <LandingHeader userEmail={userEmail} localized />
        <GuideClient signedIn={Boolean(userEmail)} />
        <LandingFooter localized />
      </div>
    </LanguageProvider>
  );
}
