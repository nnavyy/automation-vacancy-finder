import React from "react";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import AboutClient from "@/components/about/AboutClient";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "About the Creator - Nanda (@nnavyy)",
  description:
    "Full-Stack Engineer & Automation Specialist. Creator of HH Job Copilot.",
};

export default async function AboutPage() {
  const session = await auth();
  const userEmail = session?.user?.email;

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-white selection:text-black antialiased">
      <LandingHeader userEmail={userEmail} />
      <AboutClient userEmail={userEmail} />
      <LandingFooter />
    </div>
  );
}
