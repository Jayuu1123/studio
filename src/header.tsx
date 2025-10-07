'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  ShoppingCart,
  Package,
  Users,
  LineChart,
  Settings,
  PanelLeft,
  Briefcase,
  Building,
  DollarSign,
  HeartHandshake,
  ArrowRightLeft,
  FileText,
  Fingerprint,
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { TransactionCodeSearch } from './transaction-code-search';
import { UserNav } from './user-nav';
import { cn, slugify } from '@/lib/utils';
import type { PermissionSet, AppSubmodule } from '@/lib/types';
import { useUser } from '@/firebase';

const mobileNavItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/transactions', icon: ArrowRightLeft, label: 'Transactions' },
    { href: '/sales', icon: ShoppingCart, label: 'Sales' },
    { href: '/inventory', icon: Package, label: 'Inventory' },
    { href: '/purchase', icon: Briefcase, label: 'Purchase' },
    { href: '/accounting', icon: DollarSign, label: 'Accounting' },
    { href: '/hr', icon: Users, label: 'HR & Payroll' },
    { href: '/manufacturing', icon: Building, label: 'Manufacturing' },
    { href: '/crm', icon: HeartHandshake, label: 'CRM' },
    { href: '/reports', icon: LineChart, label: 'Reports' },
    { href: '/form-setting', icon: FileText, label: 'Form Setting' },
    { href: '/settings', icon: Settings, label: 'Settings' },
];

function BreadcrumbNav() {
    const pathname = usePathname();
    const segments = pathname.split('/').filter(Boolean);

    // Don't show breadcrumbs on the dashboard
    if (segments.length === 1 && segments[0] === 'dashboard') {
        return (
            <Breadcrumb className="hidden md:flex">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbPage>Dashboard</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
        );
    }
    
    // Don't show breadcrumbs on root pages that are not dashboard
    if (segments.length === 0) return null;


    return (
        <Breadcrumb className="hidden md:flex">
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link href="/dashboard">Dashboard</Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                {segments.map((segment, index, arr) => {
                    const href = `/${segments.slice(0, index + 1).join('/')}`;
                    const isLast = index === arr.length - 1;
                    const segmentName = segment.replace(/-/g, ' ');
                    return (
                        <React.Fragment key={href}>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage className="capitalize">{segmentName}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link href={href} className="capitalize">{segmentName}</Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                        </React.Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}


export function Header({ isLicensed, permissions, submodules }: { isLicensed: boolean | null, permissions: PermissionSet, submodules: AppSubmodule[] }) {
  const pathname = usePathname();
  const { user } = useUser();
  
  const hasAccess = (label: string) => {
    if (permissions === null) return true;
    if (user?.email === 'sa@admin.com') return true;
    if (permissions.all) return true;

    const hasSubmodulesForModule = submodules.some(sub => sub.mainModule === label);
    if (!hasSubmodulesForModule && !['Dashboard', 'Form Setting', 'Settings'].includes(label)) return false;

    const permission = permissions[slugify(label)];
    return permission === true || (typeof permission === 'object' && permission !== null);
  }

  const memoizedMobileNavItems = useMemo(() => {
    return mobileNavItems.filter(item => hasAccess(item.label));
  }, [permissions, submodules]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/dashboard"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 transition-all group-hover:scale-110"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span className="sr-only">SynergyFlow ERP</span>
            </Link>
            {memoizedMobileNavItems.map((item) => {
                const isDisabled = isLicensed === false && !item.href.startsWith('/settings');
                 return (
                    <Link
                        key={item.href}
                        href={isDisabled ? '#' : item.href}
                        className={cn('flex items-center gap-4 px-2.5',
                            pathname.startsWith(item.href) && !isDisabled ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                            isDisabled && 'pointer-events-none opacity-30'
                        )}
                        aria-disabled={isDisabled}
                    >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                    </Link>
                );
            })}
          </nav>
        </SheetContent>
      </Sheet>
      
      <BreadcrumbNav />
      
      <div className="relative ml-auto flex-1 md:grow-0">
        <TransactionCodeSearch />
      </div>
      <UserNav />
    </header>
  );
}
