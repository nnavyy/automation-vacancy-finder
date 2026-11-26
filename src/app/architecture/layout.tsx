import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BRAND_NAME } from "@/lib/brand";
import { siteOrigin } from "@/lib/site-url";

export const metadata: Metadata = {
  title: `Job search pipeline architecture | ${BRAND_NAME}`,
  description: "Follow a HeadHunter vacancy through collection, filtering, profile scoring, and delivery to see how HH Job Copilot works.",
  alternates: { canonical: new URL("/architecture", siteOrigin) },
};

export default function ArchitectureLayout({ children }: { children: ReactNode }): React.JSX.Element {
  return <>{children}</>;
}
