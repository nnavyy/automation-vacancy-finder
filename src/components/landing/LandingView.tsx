import React from "react";
import LandingHeader from "@/components/landing/LandingHeader";
import HeroSection from "@/components/landing/HeroSection";
import ProjectPreviewSimulator from "@/components/landing/ProjectPreviewSimulator";
import ScrollStorySection from "@/components/landing/ScrollStorySection";
import WorkflowSection from "@/components/landing/WorkflowSection";
import ArchitectureSection from "@/components/landing/ArchitectureSection";
import LandingBlogSection from "@/components/landing/LandingBlogSection";
import DubCtaSection from "@/components/landing/DubCtaSection";
import LandingFooter from "@/components/landing/LandingFooter";

interface LandingViewProps {
  userEmail?: string | null;
}

export default function LandingView({ userEmail }: LandingViewProps) {
  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-white selection:text-black antialiased">
      {/* Navigation Header */}
      <LandingHeader userEmail={userEmail} />

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <HeroSection />

        {/* Interactive Live Project Preview */}
        <ProjectPreviewSimulator />

        {/* Dynamic Scroll Storytelling with Morphing Left/Right Cards */}
        <ScrollStorySection />

        {/* Autonomous Loop Workflow */}
        <WorkflowSection />

        {/* In-Depth Architecture */}
        <ArchitectureSection />

        {/* Engineering Blog Articles Preview */}
        <LandingBlogSection />

        {/* Inset Dark CTA Card */}
        <DubCtaSection />


      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
