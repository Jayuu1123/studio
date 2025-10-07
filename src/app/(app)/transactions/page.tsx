'use client';

import React, { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { AppSubmodule } from '@/lib/types';
import { SubmoduleCard } from '@/components/submodule-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function TransactionsPage() {
  const firestore = useFirestore();

  const submodulesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'appSubmodules'), where('mainModule', '==', 'Transactions'));
  }, [firestore]);

  const { data: submodules, isLoading: isLoadingSubmodules } = useCollection<AppSubmodule>(submodulesQuery);

  if (isLoadingSubmodules) {
      return (
          <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
      );
  }

  return (
    <div className="space-y-6">
      {submodules && submodules.length > 0 ? (
        <div>
          <h2 className="text-xl font-semibold mb-3 text-muted-foreground">
            Transactions
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {submodules.map((submodule) => (
              <SubmoduleCard key={submodule.id} submodule={submodule} />
            ))}
          </div>
        </div>
      ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Transaction Submodules Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                No submodules have been created for the Transactions module yet. You can <Link href="/form-setting" className='text-primary underline'>create one now</Link>.
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
