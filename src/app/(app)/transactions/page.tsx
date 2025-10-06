
'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { AppSubmodule, PermissionSet } from '@/lib/types';
import { SubmoduleCard } from '@/components/submodule-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { slugify } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const groupSubmodules = (submodules: AppSubmodule[]): { [key: string]: AppSubmodule[] } => {
  return submodules.reduce((acc, submodule) => {
    const mainModule = submodule.mainModule;
    if (!acc[mainModule]) {
      acc[mainModule] = [];
    }
    acc[mainModule].push(submodule);
    return acc;
  }, {} as { [key: string]: AppSubmodule[] });
};

const mainModuleOrder = [
    'Transactions',
    'Sales',
    'Inventory',
    'Purchase',
    'CRM',
    'Reports',
    'User Management',
];

interface TransactionsPageProps {
  permissions?: PermissionSet;
}

export default function TransactionsPage({ permissions }: TransactionsPageProps) {
  const firestore = useFirestore();

  const submodulesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'appSubmodules'), orderBy('position'));
  }, [firestore]);

  const { data: dynamicSubmodules, isLoading } = useCollection<AppSubmodule>(submodulesQuery);

  const filteredSubmodules = useMemo(() => {
    if (!dynamicSubmodules || !permissions) return [];
    if (permissions.all) return dynamicSubmodules;
    
    return dynamicSubmodules.filter(sub => {
        const mainModuleSlug = slugify(sub.mainModule);
        const submoduleSlug = slugify(sub.name);
        // @ts-ignore
        const mainModulePerms = permissions[mainModuleSlug];
        
        if (mainModulePerms === true) return true; // Legacy support, grants access to all submodules

        if (typeof mainModulePerms === 'object' && mainModulePerms !== null) {
            // New hierarchical check: grants access if user has 'read' permission for the specific submodule.
            // @ts-ignore
            const subPerms = mainModulePerms[submoduleSlug];
            return subPerms?.read;
        }
        return false;
    });
  }, [dynamicSubmodules, permissions]);

  if (isLoading) {
      return (
          <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
      )
  }

  const groupedSubmodules = groupSubmodules(filteredSubmodules);
  const sortedMainModules = Object.keys(groupedSubmodules).sort((a, b) => {
    const indexA = mainModuleOrder.indexOf(a);
    const indexB = mainModuleOrder.indexOf(b);
    if (indexA === -1 && indexB === -1) return a.localeCompare(b);
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  return (
    <div className="space-y-6">
      {sortedMainModules.length > 0 ?
        sortedMainModules.map((mainModule) => (
          <div key={mainModule}>
            <h2 className="text-xl font-semibold mb-3 text-muted-foreground">
              {mainModule}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {groupedSubmodules[mainModule].map((submodule) => (
                <SubmoduleCard key={submodule.id} submodule={submodule} />
              ))}
            </div>
          </div>
        )) : (
          <Card>
            <CardHeader>
              <CardTitle>No Accessible Submodules Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You do not have permission to view any submodules. Please contact an administrator.
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
