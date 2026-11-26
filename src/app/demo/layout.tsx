import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BRAND_NAME } from "@/lib/brand";
import { siteOrigin } from "@/lib/site-url";

export const metadata: Metadata = {
  title: `Interactive job search demo | ${BRAND_NAME}`,
  description: "Try the vacancy shortlist, fit scores, and application tracker with sample data in the HH Job Copilot demo.",
  alternates: { canonical: new URL("/demo", siteOrigin) },
};

export default function DemoLayout({ children }: { children: ReactNode }): React.JSX.Element {
  return <>{children}</>;
}
