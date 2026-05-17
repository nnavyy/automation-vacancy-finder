// ============================================================
// Dashboard shell — sidebar + main content area
// ============================================================

import SidebarNav from "@/components/SidebarNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-950">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 min-h-screen flex flex-col shrink-0 sticky top-0 h-screen overflow-y-auto">
        <SidebarNav />
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 bg-gray-950 overflow-auto min-w-0">
        {children}
      </main>
    </div>
  );
}
