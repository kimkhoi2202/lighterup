"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

// Custom icon components
const ShopIcon = () => {
  return (
    <svg className="size-[18px]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="m4,13v7c0,1.105.895,2,2,2h12c1.105,0,2-.895,2-2v-7" fill="none" stroke="currentColor" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="2" strokeLinejoin="round"/>
      <polyline points="10 22 10 16 14 16 14 22" fill="none" stroke="currentColor" strokeMiterlimit="10" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
      <path d="m21.874,7l-2.874-5H5l-2.874,5c.444,1.725,2.01,3,3.874,3,1.202,0,2.267-.541,3-1.38.733.839,1.798,1.38,3,1.38s2.267-.541,3-1.38c.733.839,1.798,1.38,3,1.38,1.864,0,3.43-1.275,3.874-3Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  );
};

const SuitcaseIcon = () => {
  return (
    <svg className="size-[18px]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 6V2H16V6" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" fill="none" strokeLinejoin="round"/>
      <path d="M10 13H4C2.89543 13 2 12.1046 2 11V6H22V11C22 12.1046 21.1046 13 20 13H14" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" fill="none" strokeLinejoin="round"/>
      <path d="M2 17V21H22V17" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" fill="none" strokeLinejoin="round"/>
      <path d="M14 12H10V15C10 16.1046 10.8954 17 12 17C13.1046 17 14 16.1046 14 15V12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" strokeLinejoin="round"/>
    </svg>
  );
};

const WalletIcon = () => {
  return (
    <svg className="size-[18px]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 17H18C16.343 17 15 15.657 15 14C15 12.343 16.343 11 18 11H21" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" fill="none" strokeLinejoin="round"/>
      <path d="M12 7H19C20.1046 7 21 7.89543 21 9V13.5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5V5.5" stroke="currentColor" strokeWidth="2" strokeMiterlimit="10" strokeLinecap="round" fill="none" strokeLinejoin="round"/>
      <path d="M17 3H5C3.89543 3 3 3.89543 3 5V5C3 6.10457 3.89543 7 5 7H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" strokeLinejoin="round"/>
    </svg>
  );
};

const MessagingIcon = () => {
  return (
    <svg className="size-[18px]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="m16,2H4c-1.105,0-2,.895-2,2v8c0,1.105.895,2,2,2h1v5l7-5h4c1.105,0,2-.895,2-2V4c0-1.105-.895-2-2-2Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="2" strokeLinejoin="round"/>
      <path d="m22,7v9c0,1.105-.895,2-2,2h-1s0,4,0,4l-5-4h-2" fill="none" stroke="currentColor" strokeLinecap="round" strokeMiterlimit="10" strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  );
};

const ClockIcon = () => {
  return (
    <svg className="size-[18px]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="12 6 12 12 16 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

const CalendarCheckIcon = () => {
  return (
    <svg className="size-[18px]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M8 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M9 16L11 18L15 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
};

const UserIcon = () => {
  return (
    <svg className="size-[18px]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 21C20 16.5817 16.4183 13 12 13C7.58172 13 4 16.5817 4 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
};

const LogOutIcon = () => {
  return (
    <svg className="size-[18px]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
};

const DesignHomeIcon = () => {
  return (
    <svg className="size-[18px]" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="17" cy="6" r="2" fill="currentColor"/>
      <circle cx="19" cy="8" r="1.5" fill="currentColor"/>
      <circle cx="15" cy="7" r="1" fill="currentColor"/>
    </svg>
  );
};

const menuItems = [
  {
    title: "Available Jobs",
    url: "/app/contractor/jobs/feed",
    icon: ShopIcon,
  },
  {
    title: "My Jobs",
    url: "/app/contractor/my-jobs",
    icon: SuitcaseIcon,
  },
  {
    title: "Earnings",
    url: "/app/contractor/earnings",
    icon: WalletIcon,
  },
  {
    title: "Availability",
    url: "/app/contractor/availability",
    icon: ClockIcon,
  },
  {
    title: "Bookings",
    url: "/app/contractor/bookings",
    icon: CalendarCheckIcon,
  },
  {
    title: "Profile",
    url: "/app/contractor/profile",
    icon: UserIcon,
  },
  {
    title: "Messaging",
    url: "/app/contractor/messaging",
    icon: MessagingIcon,
  },
  {
    title: "Design Home",
    url: "/app/contractor/design",
    icon: DesignHomeIcon,
  },
];

export function ContractorSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      router.push("/auth");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out");
    }
  };

  return (
    <Sidebar collapsible="icon" className="bg-white border-r">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/app/contractor/dashboard" className="flex items-center gap-2">
                <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-[#EA2831] text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-5"
                  >
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                  </svg>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-bold text-lg">Lighter Up</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.url || pathname?.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} className="data-[active=true]:bg-transparent hover:bg-accent data-[active=true]:hover:bg-[#EA2831]/10">
                      <Link href={item.url} className={isActive ? "[&_svg_path]:!stroke-[#EA2831] [&_svg_polyline]:!stroke-[#EA2831] [&_svg_circle]:!stroke-[#EA2831]" : ""}>
                        <Icon />
                        <span className={isActive ? "font-medium text-[#EA2831] text-base" : "text-base"}>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="hover:bg-accent">
              <LogOutIcon />
              <span className="text-base">Log Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
