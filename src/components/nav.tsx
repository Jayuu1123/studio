'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  ShoppingCart,
  Package,
  Users,
  LineChart,
  Settings,
  Briefcase,
  FileText,
  Building,
  DollarSign,
  HeartHandshake,
  ArrowRightLeft,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import { cn, slugify } from '@/lib/utils';
import type { PermissionSet } from '@/lib/types';


const navItems = [
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
];

export function Nav({ isLicensed, permissions }: { isLicensed: boolean | null, permissions: PermissionSet }) {
  const pathname = usePathname();
  
  const hasAccess = (label: string) => {
    if (permissions.all) return true;
    return permissions[slugify(label)];
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <Link
          href="/dashboard"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
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
        <TooltipProvider>
          {navItems.map((item) => {
            if (!hasAccess(item.label)) return null;

            const isDisabled = isLicensed === false;
            return (
                <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                    <Link
                    href={isDisabled ? '#' : item.href}
                    className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                        pathname.startsWith(item.href) && !isDisabled && 'bg-accent text-accent-foreground',
                        isDisabled && 'pointer-events-none opacity-30'
                    )}
                    aria-disabled={isDisabled}
                    >
                    <item.icon className="h-5 w-5" />
                    <span className="sr-only">{item.label}</span>
                    </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{isDisabled ? 'License required' : item.label}</TooltipContent>
                </Tooltip>
            )
          })}
        </TooltipProvider>
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link
                    href="/settings"
                    className={cn('flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                    pathname.startsWith('/settings') && 'bg-accent text-accent-foreground'
                    )}
                    >
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">Settings</span>
                    </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
        </TooltipProvider>
      </nav>
    </aside>
  );
}
