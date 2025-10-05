'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from 'next/link';
import { slugify } from "@/lib/utils";
import {
  FileText,
  ShoppingCart,
  Package,
  Briefcase,
  HeartHandshake,
  LineChart,
} from 'lucide-react';
import type { AppSubmodule } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useEffect, useState, ReactNode } from "react";

// Helper function to group submodules by their mainModule
const groupSubmodules = (submodules: AppSubmodule[]) => {
    return submodules.reduce((acc, submodule) => {
        const mainModule = submodule.mainModule;
        if (!acc[mainModule]) {
            acc[mainModule] = [];
        }
        acc[mainModule].push(submodule);
        return acc;
    }, {} as { [key: string]: AppSubmodule[] });
};

interface SubmoduleCardProps {
    submodule: AppSubmodule;
}

const coreModules: { name: string; icon: ReactNode; href: string }[] = [
    { name: "Sales", icon: <ShoppingCart className="h-4 w-4" />, href: "/sales"},
    { name: "Inventory", icon: <Package className="h-4 w-4" />, href: "/inventory"},
    { name: "Purchase", icon: <Briefcase className="h-4 w-4" />, href: "/purchase"},
    { name: "CRM", icon: <HeartHandshake className="h-4 w-4" />, href: "/crm"},
    { name: "Reports", icon: <LineChart className="h-4 w-4" />, href: "/reports"},
];

function CoreModuleCard({ name, icon, href }: { name: string; icon: ReactNode; href: string }) {
    return (
        <Card className="hover:shadow-lg transition-shadow w-full">
            <Link href={href} className="block h-full">
                <CardContent className="p-4 flex flex-col justify-between h-full">
                    <div className="flex items-center gap-3 mb-2">
                         <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-sm font-semibold">
                            {icon}
                        </span>
                        <CardTitle className="text-base font-medium">{name}</CardTitle>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Access the {name} module.
                    </div>
                </CardContent>
            </Link>
        </Card>
    );
}

function SubmoduleCard({ submodule }: SubmoduleCardProps) {
    const firestore = useFirestore();
    const [counts, setCounts] = useState({ entries: 0, pending: 0 });

    useEffect(() => {
        const fetchCounts = async () => {
            if (!firestore || !submodule.name) return;

            try {
                // Get total entries
                const entriesQuery = query(collection(firestore, 'transactionEntries'), where('submodule', '==', submodule.name));
                const entriesSnapshot = await getDocs(entriesQuery);
                const totalEntries = entriesSnapshot.size;

                // Get pending entries
                const pendingQuery = query(
                    collection(firestore, 'transactionEntries'),
                    where('submodule', '==', submodule.name),
                    where('status', '==', 'P')
                );
                const pendingSnapshot = await getDocs(pendingQuery);
                const pendingEntries = pendingSnapshot.size;

                setCounts({ entries: totalEntries, pending: pendingEntries });

            } catch (error) {
                console.error(`Failed to fetch counts for ${submodule.name}:`, error)
            }
        };

        fetchCounts();
    }, [firestore, submodule.name]);


    return (
        <Card className="hover:shadow-lg transition-shadow w-full">
            <Link href={`/transactions/${slugify(submodule.name)}`} className="block h-full">
                <CardContent className="p-4 flex flex-col justify-between h-full">
                    <div className="flex items-center gap-3 mb-2">
                         <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-sm font-semibold">
                            <FileText className="h-4 w-4" />
                        </span>
                        <CardTitle className="text-base font-medium">{submodule.name}</CardTitle>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <div>
                            <p className="text-green-600">Entries</p>
                            <p className="text-xl font-bold">{counts.entries}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-red-600">Pendings</p>
                            <p className="text-xl font-bold">{counts.pending}</p>
                        </div>
                    </div>
                </CardContent>
            </Link>
        </Card>
    );
}

export default function TransactionsPage() {
    const firestore = useFirestore();

    const submodulesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'appSubmodules');
    }, [firestore]);

    const { data: dynamicSubmodules, isLoading } = useCollection<AppSubmodule>(submodulesQuery);
    
    const groupedSubmodules = dynamicSubmodules ? groupSubmodules(dynamicSubmodules) : {};
    const mainModuleOrder = ['Transactions', 'Sales', 'Inventory', 'Purchase', 'CRM', 'Reports', 'User Management'];

    const sortedMainModules = Object.keys(groupedSubmodules).sort((a, b) => {
        const indexA = mainModuleOrder.indexOf(a);
        const indexB = mainModuleOrder.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b); // both not in order list
        if (indexA === -1) return 1; // a is not in order list, push to end
        if (indexB === -1) return -1; // b is not in order list, push to end
        return indexA - indexB;
    });

    return (
    <div className="space-y-6">
        <div>
            <h2 className="text-xl font-semibold mb-3 text-muted-foreground">Core Modules</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {coreModules.map(module => (
                    <CoreModuleCard key={module.name} {...module} />
                ))}
            </div>
        </div>

        {isLoading && <p>Loading custom modules...</p>}
        
        {!isLoading && sortedMainModules.length > 0 && <hr/>}

        {!isLoading && sortedMainModules.map((mainModule) => (
            <div key={mainModule}>
                <h2 className="text-xl font-semibold mb-3 text-muted-foreground">{mainModule}</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {groupedSubmodules[mainModule].map(submodule => (
                        <SubmoduleCard key={submodule.id} submodule={submodule} />
                    ))}
                </div>
            </div>
        ))}
        {!isLoading && (!dynamicSubmodules || dynamicSubmodules.length === 0) && (
             <Card>
                <CardHeader>
                    <CardTitle>No Custom Submodules Found</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                       You can create new submodules in the <Link href="/form-setting" className="text-primary underline">Form Setting</Link> page.
                    </p>
                </CardContent>
            </Card>
        )}
    </div>
  );
}
