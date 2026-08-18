import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { HomeownerSidebar } from "@/components/homeowner-sidebar";

export default function HomeownerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <HomeownerSidebar />
      <SidebarInset>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
