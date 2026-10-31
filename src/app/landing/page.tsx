import React from "react";
import { auth } from "@/lib/auth";
import LandingView from "@/components/landing/LandingView";

export const metadata = {
  title: "HH Job Copilot — Поиск работы на HeadHunter",
  description:
    "Поиск работы на HeadHunter: вакансии под ваш опыт, сопроводительные письма, бесплатная аналитика и уведомления в Telegram. Исследуйте работодателей с Company Intel.",
};

export default async function LandingPage() {
  const session = await auth();
  const userEmail = session?.user?.email;

  return <LandingView userEmail={userEmail} />;
}
