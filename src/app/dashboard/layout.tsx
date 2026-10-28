// ============================================================
// Dashboard shell â€” sidebar + main content area
// ============================================================

import MobileSidebarWrapper from "@/components/MobileSidebarWrapper";
import { LanguageProvider } from "@/lib/i18n";
import { requireUser } from "@/lib/auth-helpers";
import { IS_MAINTENANCE_LOCKDOWN, isEmailWhitelisted } from "@/lib/maintenance";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  if (IS_MAINTENANCE_LOCKDOWN && !isEmailWhitelisted(user.email)) {
    redirect("/");
  }

  return (
    <LanguageProvider>
      <div className="flex flex-col md:flex-row min-h-[100dvh] bg-[#09090b] text-zinc-100 antialiased">
        {/* Sidebar (Wrapped for Mobile) */}
        <MobileSidebarWrapper />

        {/* Main content */}
        <main className="dash-backdrop flex-1 px-4 py-6 md:px-10 md:py-9 overflow-auto min-w-0">
          {children}
        </main>
      </div>
    </LanguageProvider>
  );
}
