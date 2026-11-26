import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import AboutClient from "@/components/about/AboutClient";
import { auth } from "@/lib/auth";
import { BRAND_NAME } from "@/lib/brand";
import { LanguageProvider } from "@/lib/i18n";

export const metadata = {
  title: `About | ${BRAND_NAME}`,
  description:
    "Full-Stack Engineer & Automation Specialist. Creator of HH Job Copilot.",
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
