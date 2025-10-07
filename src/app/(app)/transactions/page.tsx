'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { AppSubmodule, PermissionSet } from '@/lib/types';
import { SubmoduleCard } from '@/components/submodule-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { slugify } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function TransactionsPage({ permissions }: { permissions: PermissionSet }) {
  const firestore = useFirestore();

  const submodulesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Query directly for transaction submodules
    return query(collection(firestore, 'appSubmodules'), where('mainModule', '==', 'Transactions'));
  }, [firestore]);

  const { data: allSubmodules, isLoading: isLoadingSubmodules } = useCollection<AppSubmodule>(submodulesQuery);
  
  const filteredSubmodules = useMemo(() => {
    if (!allSubmodules || !permissions) return [];
    
    // If user has all permissions, no further filtering is needed
    if (permissions.all) {
      return allSubmodules;
    }
    
    // @ts-ignore
    const transactionPermissions = permissions['transactions'];
    if (typeof transactionPermissions !== 'object' || transactionPermissions === null) {
        return [];
    }

    // Filter based on specific read permissions for each submodule
    return allSubmodules.filter(sub => {
        const subSlug = slugify(sub.name);
        // @ts-ignore
        return transactionPermissions[subSlug]?.read;
    });

  }, [allSubmodules, permissions]);


  if (isLoadingSubmodules || !permissions) {
      return (
          <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
      );
  }


  return (
    <div className="space-y-6">
      {filteredSubmodules.length > 0 ? (
        <div>
          <h2 className="text-xl font-semibold mb-3 text-muted-foreground">
            Transactions
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredSubmodules.map((submodule) => (
              <SubmoduleCard key={submodule.id} submodule={submodule} />
            ))}
          </div>
        </div>
      ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Accessible Submodules Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You do not have permission to view any submodules in the Transactions module. Please contact an administrator.
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
