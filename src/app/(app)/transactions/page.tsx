'use client';

import React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { AppSubmodule } from '@/lib/types';
import { SubmoduleCard } from '@/components/submodule-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Loader2, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TransactionsPage() {
  const firestore = useFirestore();

  const submodulesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'appSubmodules'), where('mainModule', '==', 'Transactions'));
  }, [firestore]);

  const { data: submodules, isLoading: isLoadingSubmodules } = useCollection<AppSubmodule>(submodulesQuery);


  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold font-headline">Transactions</h1>
        </div>

      {isLoadingSubmodules && (
          <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
      )}

      {!isLoadingSubmodules && submodules && submodules.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {submodules.map((submodule) => (
              <SubmoduleCard key={submodule.id} submodule={submodule} />
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
                No submodules have been created for the Transactions module yet. You can create one from the Form Setting page.
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
