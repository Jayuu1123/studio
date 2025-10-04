'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from 'next/link';
import { slugify } from "@/lib/utils";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { AppSubmodule } from "@/lib/types";

// Static modules that are always present
const staticTransactionModules = [
  {
    category: 'Production',
    items: [
      { name: 'Production Order', code: 'PO', entries: 33, pending: 297 },
      { name: 'Production Issue', code: 'PI', entries: 0, pending: 1461 },
      { name: 'Production Receipt', code: 'PR', entries: 0, pending: 45 },
      { name: 'In House Job Work', code: 'IHJW', entries: 10, pending: 73 },
    ]
  },
  {
    category: 'Purchase',
    items: [
      { name: 'Indent', code: 'ID', entries: 660, pending: 60 },
      { name: 'Purchase Order', code: 'PO', entries: 1335, pending: 3128 },
      { name: 'GRN', code: 'GN', entries: 1374, pending: 457 },
    ]
  },
  {
    category: 'Store Management',
    items: [
      { name: 'Requisition', code: 'RE', entries: 680, pending: 1337 },
      { name: 'Material Issue', code: 'MI', entries: 754, pending: 1725 },
      { name: 'Material Receipt', code: 'MR', entries: 275, pending: 3262 },
    ]
  }
];


export default function TransactionsPage() {
    const firestore = useFirestore();

    const submodulesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'appSubmodules');
    }, [firestore]);

    const { data: dynamicSubmodules, isLoading } = useCollection<AppSubmodule>(submodulesQuery);
    
    const transactionSubmodules = dynamicSubmodules?.filter(m => m.mainModule === 'Transactions');

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">Transactions</h1>

      {/* Dynamic Submodules for Transactions */}
      {transactionSubmodules && transactionSubmodules.length > 0 && (
        <div>
            <h2 className="text-2xl font-semibold mb-4">Custom Submodules</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {transactionSubmodules.map((item) => (
                    <Card key={item.id} className="hover:shadow-lg transition-shadow">
                        <Link href={`/transactions/${slugify(item.name)}`} className="block h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold">{item.name.substring(0, 2).toUpperCase()}</span>
                                    <span className="text-lg">{item.name}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex justify-between text-sm">
                                <div>
                                    <p className="text-green-600">Entries</p>
                                    <p className="text-2xl font-bold">{0}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-red-600">Pendings</p>
                                    <p className="text-2xl font-bold">{0}</p>
                                </div>
                            </CardContent>
                        </Link>
                    </Card>
                ))}
            </div>
        </div>
      )}


      {/* Static Modules */}
      {staticTransactionModules.map((module) => (
        <div key={module.category}>
          <h2 className="text-2xl font-semibold mb-4">{module.category}</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {module.items.map((item) => (
                <Card key={item.name} className="hover:shadow-lg transition-shadow">
                    <Link href={`/transactions/${slugify(item.name)}`} className="block h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold">{item.code}</span>
                                <span className="text-lg">{item.name}</span>
                            </CardTitle>
                        </CardHeader>
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
                    </Link>
                </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
