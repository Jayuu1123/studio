import type { Metadata } from 'next';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Nav } from '@/components/nav';
import { Header } from '@/components/header';

export const metadata: Metadata = {
  title: 'Dashboard - SynergyFlow ERP',
  description: 'A comprehensive ERP solution.',
};

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <Nav />
            <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
                <Header />
                <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                    {children}
                </main>
            </div>
        </div>
    </SidebarProvider>
  );
}
