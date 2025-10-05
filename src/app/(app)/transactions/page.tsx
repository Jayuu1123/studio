'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from 'next/link';
import type { AppSubmodule } from "@/lib/types";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { SubmoduleCard } from "@/components/submodule-card";

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
        {isLoading && <p>Loading custom modules...</p>}
        
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
