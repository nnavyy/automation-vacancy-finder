import type { Metadata } from "next";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingHeader from "@/components/landing/LandingHeader";
import CompareArticle from "@/components/public/CompareArticle";
import { auth } from "@/lib/auth";
import { BRAND_NAME } from "@/lib/brand";
import { LanguageProvider } from "@/lib/i18n";
import { siteOrigin } from "@/lib/site-url";

export const metadata: Metadata = {
  title: `Сравнение инструментов для поиска работы | ${BRAND_NAME}`,
  description: "Сравните HH Job Copilot, HeadHunter, Teal и Huntr по поиску вакансий, оценке предложений и отслеживанию откликов.",
  alternates: { canonical: new URL("/compare", siteOrigin) },
};

export default async function ComparePage(): Promise<React.JSX.Element> {
  const session = await auth();

  return (
    <LanguageProvider>
      <div className="fw-public-theme min-h-screen bg-background text-foreground">
        <LandingHeader userEmail={session?.user?.email} localized />
        <CompareArticle />
        <LandingFooter localized />
      </div>
    </LanguageProvider>
  );
}
