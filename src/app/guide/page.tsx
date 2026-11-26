import LandingFooter from "@/components/landing/LandingFooter";
import LandingHeader from "@/components/landing/LandingHeader";
import { auth } from "@/lib/auth";
import { BRAND_NAME } from "@/lib/brand";
import { LanguageProvider } from "@/lib/i18n";
import GuideClient from "./GuideClient";

export const metadata = {
  title: `User guide | ${BRAND_NAME}`,
  description: "Set up your job search profile, run a HeadHunter search, and review your matches.",
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
