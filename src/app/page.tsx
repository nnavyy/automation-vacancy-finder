import React from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import UnderConstruction404 from "@/components/UnderConstruction404";
import LandingView from "@/components/landing/LandingView";
import { IS_MAINTENANCE_LOCKDOWN, isEmailWhitelisted } from "@/lib/maintenance";

export const metadata = {
  title: "HH Job Copilot — Autonomous Local Job Search & AI Scoring",
  description:
    "Open-source, self-hosted job search copilot for HeadHunter (hh.ru). Caches vacancies matching your developer profile, evaluates compatibility with multi-tier AI, verifies vacancy liveness, and dispatches to Telegram.",
};

interface HomePageProps {
  searchParams?: Promise<{ preview?: string }> | { preview?: string };
}

export default async function Home({ searchParams }: HomePageProps) {
  const session = await auth();
  const userEmail = session?.user?.email?.toLowerCase();
  const isWhitelisted = isEmailWhitelisted(userEmail);
  const resolvedParams = searchParams ? await searchParams : {};
  const isPreview = resolvedParams.preview === "true" || resolvedParams.preview === "landing";

  // If maintenance lockdown is active, authorized testers are routed to /dashboard unless previewing
  if (IS_MAINTENANCE_LOCKDOWN && isWhitelisted && !isPreview) {
    redirect("/dashboard");
  }

  // When maintenance lockdown is active, public/guests always see Under Construction / Coming Soon
  if (IS_MAINTENANCE_LOCKDOWN && !isPreview) {
    return <UnderConstruction404 is404={false} />;
  }

  // Showcase Landing Page (rendered when maintenance is disabled or when ?preview=true is passed)
  return <LandingView userEmail={userEmail} />;
}
