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
    // Query directly for transaction submodules that the user has permission to read.
    const allowedSubmoduleSlugs = permissions?.all 
      ? null // null will skip the slug-based filter if user has 'all' permissions
      // @ts-ignore
      : Object.keys(permissions?.transactions || {}).filter(slug => permissions.transactions[slug]?.read);
    
    if (allowedSubmoduleSlugs && allowedSubmoduleSlugs.length === 0) {
        return null; // The user has no permissions for any transaction submodule.
    }

    let q = query(collection(firestore, 'appSubmodules'), where('mainModule', '==', 'Transactions'));

    // This check is important. If the user has 'all' permissions, we should not add a 'where' clause for slugs.
    if (allowedSubmoduleSlugs) {
        const allowedSubmoduleNames = allowedSubmoduleSlugs.map(slug => slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));
         q = query(q, where('name', 'in', allowedSubmoduleNames));
    }
    
    return q;

  }, [firestore, permissions]);

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
              <CardTitle>No Accessible Submodules Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You do not have permission to view any submodules in the Transactions module, or none have been created. Please contact an administrator or <Link href="/form-setting" className='text-primary underline'>create one now</Link>.
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
