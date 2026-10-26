import React from "react";
import { auth } from "@/lib/auth";
import LandingView from "@/components/landing/LandingView";

export const metadata = {
  title: "HH Job Copilot — Autonomous Local Job Search & AI Scoring",
  description:
    "Open-source, self-hosted job search copilot for HeadHunter (hh.ru). Caches vacancies matching your developer profile, evaluates compatibility with multi-tier AI, verifies vacancy liveness, and dispatches to Telegram.",
};

export default async function LandingPage() {
  const session = await auth();
  const userEmail = session?.user?.email;

  return <LandingView userEmail={userEmail} />;
}
