import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import { Menu } from "lucide-react";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { TrialBanner } from "@/components/TrialBanner";
import { SubscriptionGate } from "@/components/SubscriptionGate";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <PaymentTestModeBanner />
          <TrialBanner />
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
            <SidebarTrigger className="h-8 w-8">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
          </header>
          <div className="flex-1 overflow-auto">
            <SubscriptionGate>{children}</SubscriptionGate>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;
