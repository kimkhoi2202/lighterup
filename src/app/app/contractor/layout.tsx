import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ContractorSidebar } from "@/components/contractor-sidebar";

export default function ContractorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <ContractorSidebar />
      <SidebarInset>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
