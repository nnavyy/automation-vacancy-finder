import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth-helpers";
import { hasCompanyIntelAccess } from "@/lib/entitlements";
import CompanyIntelPaywall from "@/components/CompanyIntelPaywall";

export default async function CompanyIntelLayout({ children }: { children: ReactNode }): Promise<ReactNode> {
  const user = await requireUser();
  if (hasCompanyIntelAccess(user.id)) return children;

  return <div className="p-4 sm:p-8"><CompanyIntelPaywall /></div>;
}
