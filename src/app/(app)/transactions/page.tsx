'use client';

import React, { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import type { AppSubmodule } from '@/lib/types';
import { SubmoduleCard } from '@/components/submodule-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function TransactionsPage() {
  const firestore = useFirestore();

  const submodulesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'appSubmodules'),
      where('mainModule', '==', 'Transactions'),
      orderBy('group'),
      orderBy('position')
    );
  }, [firestore]);

  const { data: submodules, isLoading: isLoadingSubmodules } = useCollection<AppSubmodule>(submodulesQuery);

  const groupedSubmodules = useMemo(() => {
    if (!submodules) return {};
    return submodules.reduce((acc, submodule) => {
      const group = submodule.group || 'Uncategorized';
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(submodule);
      return acc;
    }, {} as Record<string, AppSubmodule[]>);
  }, [submodules]);

  const groupOrder = useMemo(() => {
    if (!submodules) return [];
    // Get unique group names in the order they first appear
    const order = submodules.map(s => s.group || 'Uncategorized');
    return [...new Set(order)];
  }, [submodules]);


  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-headline">Transactions</h1>
        <p className="text-sm text-muted-foreground">Home &gt; Transactions</p>
      </div>

      {isLoadingSubmodules && (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoadingSubmodules && submodules && submodules.length > 0 ? (
        <div className="space-y-8">
          {groupOrder.map(groupName => (
            <div key={groupName}>
              <h2 className="text-2xl font-semibold mb-4 font-headline">{groupName}</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {groupedSubmodules[groupName].map((submodule) => (
                  <SubmoduleCard key={submodule.id} submodule={submodule} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!isLoadingSubmodules && (!submodules || submodules.length === 0) && (
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

    