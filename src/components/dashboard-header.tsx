import { SidebarTrigger } from "@/components/ui/sidebar";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <div>
            <SidebarTrigger />
        </div>
        <div className="flex-1">
            {/* Can add breadcrumbs or title here */}
        </div>
    </header>
  );
}
