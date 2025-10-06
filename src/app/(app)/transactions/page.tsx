'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { AppSubmodule, PermissionSet } from '@/lib/types';
import { SubmoduleCard } from '@/components/submodule-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { slugify } from '@/lib/utils';

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

interface TransactionsPageProps {
  permissions: PermissionSet;
}

export default function TransactionsPage({ permissions }: TransactionsPageProps) {
  const firestore = useFirestore();

  const submodulesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'appSubmodules'), orderBy('position'));
  }, [firestore]);

  const { data: dynamicSubmodules, isLoading } =
    useCollection<AppSubmodule>(submodulesQuery);

  const filteredSubmodules = useMemo(() => {
    if (!dynamicSubmodules || !permissions) return [];
    // If permissions object is empty, it might still be loading, so we wait.
    if (Object.keys(permissions).length === 0) return []; 
    if (permissions.all) return dynamicSubmodules;
    
    return dynamicSubmodules.filter(sub => {
        const mainModuleSlug = slugify(sub.mainModule);
        const submoduleSlug = slugify(sub.name);
        const mainModulePerms = permissions[mainModuleSlug];
        
        if (mainModulePerms === true) return true;

        if (typeof mainModulePerms === 'object') {
            const subPerms = mainModulePerms[submoduleSlug];
            // @ts-ignore
            return subPerms?.read;
        }
        return false;
    });
  }, [dynamicSubmodules, permissions]);

  const groupedSubmodules = filteredSubmodules
    ? groupSubmodules(filteredSubmodules)
    : {};
  const mainModuleOrder = [
    'Transactions',
    'Sales',
    'Inventory',
    'Purchase',
    'CRM',
    'Reports',
    'User Management',
  ];

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

      {!isLoading && sortedMainModules.length > 0 &&
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
        ))}
      {!isLoading &&
        (!filteredSubmodules || filteredSubmodules.length === 0) && (
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
