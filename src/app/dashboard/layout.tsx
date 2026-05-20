// ============================================================
// Dashboard shell — sidebar + main content area
// ============================================================

import SidebarNav from "@/components/SidebarNav";
import MobileSidebarWrapper from "@/components/MobileSidebarWrapper";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row min-h-[100dvh] bg-gray-950">
      {/* Sidebar (Wrapped for Mobile) */}
      <MobileSidebarWrapper>
        <SidebarNav />
      </MobileSidebarWrapper>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-6 bg-gray-950 overflow-auto min-w-0">
        {children}
      </main>
    </div>
  );
}
