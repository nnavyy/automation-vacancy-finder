// ============================================================
// Dashboard shell — sidebar + main content area
// ============================================================

import MobileSidebarWrapper from "@/components/MobileSidebarWrapper";
import { LanguageProvider } from "@/lib/i18n";
import { requireUser } from "@/lib/auth-helpers";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <LanguageProvider>
      <div className="flex flex-col md:flex-row min-h-[100dvh] bg-zinc-950 text-zinc-100">
        {/* Sidebar (Wrapped for Mobile) */}
        <MobileSidebarWrapper />

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 bg-zinc-950 overflow-auto min-w-0">
          {children}
        </main>
      </div>
    </LanguageProvider>
  );
}
