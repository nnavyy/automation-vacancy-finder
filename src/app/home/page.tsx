import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import LandingView from "@/components/landing/LandingView";

export const metadata = {
  title: "HH Job Copilot — Autonomous Local Job Search & AI Scoring",
  description:
    "Hosted job search copilot for HeadHunter (hh.ru), with free Analytics and paid Company Intel. Caches vacancies matching your developer profile, evaluates compatibility with multi-tier AI, verifies vacancy liveness, and dispatches to Telegram.",
};

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

interface HomePageProps {
  searchParams?: Promise<{ preview?: string }> | { preview?: string };
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const session = await auth();
  const userEmail = session?.user?.email?.toLowerCase();
  const resolvedParams = searchParams ? await searchParams : {};
  const isPreview = resolvedParams.preview === "true" || resolvedParams.preview === "landing";

  // If the user is signed in and registered over 7 days ago, automatically redirect to the main dashboard
  if (userEmail && !isPreview) {
    const dbUser = await prisma.user
      .findUnique({
        where: { email: userEmail },
        select: { createdAt: true },
      })
      .catch(() => null);

    if (dbUser && Date.now() - dbUser.createdAt.getTime() >= SEVEN_DAYS_MS) {
      redirect("/dashboard");
    }
  }

  // First-time visitors and users registered for less than 7 days see the Landing showcase
  return <LandingView userEmail={userEmail} />;
}
