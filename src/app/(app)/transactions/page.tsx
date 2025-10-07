'use client';

import React, { useMemo } from 'react';
import type { AppSubmodule } from '@/lib/types';
import { SubmoduleCard } from '@/components/submodule-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';


export default function TransactionsPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const submodulesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'appSubmodules'), orderBy('position'));
  }, [firestore, user]);

  const { data: submodules, isLoading: isLoadingSubmodules } = useCollection<AppSubmodule>(submodulesQuery);

  const transactionSubmodules = useMemo(() => {
    if (!submodules) return [];
    return submodules.filter(sub => sub.mainModule === 'Transactions');
  }, [submodules]);

  const groupedSubmodules = useMemo(() => {
    if (!transactionSubmodules) return {};
    return transactionSubmodules.reduce((acc, submodule) => {
      const group = submodule.group || 'Uncategorized';
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(submodule);
      return acc;
    }, {} as Record<string, AppSubmodule[]>);
  }, [transactionSubmodules]);

  const groupOrder = useMemo(() => {
    if (!transactionSubmodules) return [];
    const order = transactionSubmodules.map(s => s.group || 'Uncategorized');
    return [...new Set(order)];
  }, [transactionSubmodules]);


  return (
    <div className="space-y-8">
       <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline">Transactions</h1>
          <p className="text-muted-foreground">Home > Transactions</p>
        </div>
      </div>

      {isLoadingSubmodules && (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoadingSubmodules && transactionSubmodules && transactionSubmodules.length > 0 ? (
        <div className="space-y-8">
          {groupOrder.map((groupName) => (
            <div key={groupName}>
              <div className="flex items-center mb-4 gap-2">
                <h2 className="text-2xl font-semibold font-headline">{groupName}</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {groupedSubmodules[groupName]
                  .sort((a, b) => a.position - b.position)
                  .map((submodule) => (
                    <SubmoduleCard key={submodule.id} submodule={submodule} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!isLoadingSubmodules && (!transactionSubmodules || transactionSubmodules.length === 0) && (
        <Card>
          <CardHeader>
            <CardTitle>No Transaction Submodules Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              No submodules have been created for the Transactions module yet. You can create one from the <Link href="/form-setting" className="text-primary underline">Form Setting</Link> page.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
