"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/context/user-context";
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { AppLogo } from "./icons";
import { Button } from "./ui/button";
import { LogOut, User, Gauge, Truck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, logout } = useUser();

  const navItems = {
    Admin: [
        { href: "/dashboard/admin", label: "Admin Panel", icon: Gauge },
    ],
    Dispatcher: [
        { href: "/dashboard/dispatcher", label: "Dashboard", icon: Gauge },
    ],
    Driver: [
        { href: "/dashboard/driver", label: "My Bookings", icon: Truck },
    ],
  };

  const userRole = user?.role || "Driver";
  const currentNavItems = navItems[userRole] || [];

  return (
    <Sidebar collapsible="icon" side="left" variant="sidebar">
      <SidebarHeader className="h-16 justify-center text-primary-foreground bg-primary flex items-center">
        <AppLogo className="w-8 h-8 mr-2" stroke="white"/>
        <span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">
          PTSFleet
        </span>
      </SidebarHeader>

      <SidebarMenu className="flex-1 p-2">
        {currentNavItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} legacyBehavior passHref>
              <SidebarMenuButton
                isActive={pathname === item.href}
                tooltip={{ children: item.label }}
              >
                <item.icon />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      
      <SidebarFooter className="p-2 border-t">
          <div className="flex items-center gap-3 p-2 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:justify-center">
              <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                  <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden group-data-[collapsible=icon]:hidden">
                  <p className="font-semibold text-sm truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 group-data-[collapsible=icon]:hidden" onClick={logout}>
                  <LogOut className="h-4 w-4"/>
              </Button>
          </div>
      </SidebarFooter>
    </Sidebar>
  );
}
