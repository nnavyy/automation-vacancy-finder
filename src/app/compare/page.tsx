import type { Metadata } from "next";
import LandingFooter from "@/components/landing/LandingFooter";
import LandingHeader from "@/components/landing/LandingHeader";
import CompareArticle from "@/components/public/CompareArticle";
import { auth } from "@/lib/auth";
import { LanguageProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Compare job-search tools | HH Job Copilot",
  description: "Compare HH Job Copilot, HeadHunter, Teal, and Huntr by how they help you find, review, and track job opportunities.",
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
