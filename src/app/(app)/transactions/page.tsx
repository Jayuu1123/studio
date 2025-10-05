'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from 'next/link';
import { slugify } from "@/lib/utils";
import {
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
  Home
} from 'lucide-react';
import type { AppSubmodule } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";


const allModules = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, entries: 0, pending: 0, isStatic: true },
  { name: 'Sales', href: '/sales', icon: ShoppingCart, entries: 0, pending: 0, isStatic: true },
  { name: 'Inventory', href: '/inventory', icon: Package, entries: 4, pending: 0, isStatic: true },
  { name: 'Purchase', href: '#', icon: Briefcase, entries: 0, pending: 0, isStatic: true },
  { name: 'Accounting', href: '#', icon: DollarSign, entries: 0, pending: 0, isStatic: true },
  { name: 'HR & Payroll', href: '#', icon: Users, entries: 0, pending: 0, isStatic: true },
  { name: 'Manufacturing', href: '#', icon: Building, entries: 0, pending: 0, isStatic: true },
  { name: 'CRM', href: '/crm', icon: HeartHandshake, entries: 0, pending: 0, isStatic: true },
  { name: 'Reports', href: '/reports', icon: LineChart, entries: 0, pending: 0, isStatic: true },
  { name: 'Form Setting', href: '/form-setting', icon: FileText, entries: 0, pending: 0, isStatic: true },
  { name: 'Settings', href: '/settings', icon: Settings, entries: 0, pending: 0, isStatic: true },
];


export default function TransactionsPage() {
    const firestore = useFirestore();

    const submodulesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'appSubmodules');
    }, [firestore]);

    const { data: dynamicSubmodules, isLoading } = useCollection<AppSubmodule>(submodulesQuery);
    
    const combinedModules = [
        ...allModules,
        ...(dynamicSubmodules || []).map(sub => ({
            name: sub.name,
            href: `/transactions/${slugify(sub.name)}`,
            icon: FileText,
            entries: 0,
            pending: 0,
            isStatic: false,
        }))
    ]

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">SynergyFlow Modules</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {combinedModules.map((item) => (
                <Card key={item.name} className="hover:shadow-lg transition-shadow">
                    <Link href={item.href} className="block h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                                    <item.icon className="h-5 w-5" />
                                </span>
                                <span className="text-lg">{item.name}</span>
                            </CardTitle>
                        </CardHeader>
                        {item.isStatic && (
                             <CardContent className="flex justify-center text-sm">
                                <p className="text-muted-foreground">System Module</p>
                            </CardContent>
                        )}
                        {!item.isStatic && (
                            <CardContent className="flex justify-between text-sm">
                                <div>
                                    <p className="text-green-600">Entries</p>
                                    <p className="text-2xl font-bold">{item.entries}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-red-600">Pendings</p>
                                    <p className="text-2xl font-bold">{item.pending}</p>
                                </div>
                            </CardContent>
                        )}
                    </Link>
                </Card>
            ))}
            {isLoading && (
                <Card>
                    <CardHeader><CardTitle>Loading custom modules...</CardTitle></CardHeader>
                    <CardContent><p>Please wait.</p></CardContent>
                </Card>
            )}
        </div>
    </div>
  );
}
