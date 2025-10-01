import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <DashboardHeader />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
