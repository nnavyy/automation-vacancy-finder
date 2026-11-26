import { Suspense } from "react";
import { auth } from "@/lib/auth";
import LandingActivityPanel from "@/components/landing/LandingActivityPanel";
import LandingView from "@/components/landing/LandingView";
import { siteOrigin } from "@/lib/site-url";
import LandingActivity from "./LandingActivity";

export const metadata = {
  title: "HH Job Copilot — Поиск работы на HeadHunter",
  description:
    "Поиск работы на HeadHunter: вакансии под ваш опыт, сопроводительные письма, бесплатная аналитика и уведомления в Telegram. Исследуйте работодателей с Company Intel.",
  alternates: { canonical: new URL("/", siteOrigin) },
};

export default async function LandingPage() {
  const session = await auth();
  const userEmail = session?.user?.email;

  return <LandingView userEmail={userEmail} activity={
    <Suspense fallback={<LandingActivityPanel />}><LandingActivity /></Suspense>
  } />;
}
