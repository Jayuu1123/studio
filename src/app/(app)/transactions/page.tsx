'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import type { AppSubmodule, PermissionSet, User, Role } from '@/lib/types';
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

export default function TransactionsPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [permissions, setPermissions] = React.useState<PermissionSet | null>(null);

  // Fetch user data from 'users' collection
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc<User>(userDocRef);

  // Fetch roles based on user's roles
  const userRoles = userData?.roles || [];
  const rolesQuery = useMemoFirebase(() => {
    if (!firestore || userRoles.length === 0) return null;
    return query(collection(firestore, 'roles'), where('name', 'in', userRoles));
  }, [firestore, userRoles]);
  const { data: roleDocs, isLoading: isLoadingRoles } = useCollection<Role>(rolesQuery);

  // Calculate permissions
  React.useEffect(() => {
    if (userData?.email === 'sa@admin.com') {
      setPermissions({ all: true });
      return;
    }
    
    if (!isLoadingRoles && roleDocs) {
      const mergedPermissions: PermissionSet = {};
      roleDocs.forEach(role => {
        Object.assign(mergedPermissions, role.permissions);
      });
      setPermissions(mergedPermissions);
    }
  }, [userData, roleDocs, isLoadingRoles]);


  // Fetch all submodules
  const submodulesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'appSubmodules'), where('mainModule', '==', 'Transactions'));
  }, [firestore]);
  const { data: dynamicSubmodules, isLoading: isLoadingSubmodules } = useCollection<AppSubmodule>(submodulesQuery);

  // Filter submodules based on calculated permissions
  const filteredSubmodules = useMemo(() => {
    if (!dynamicSubmodules || !permissions) return [];
    if (permissions.all) return dynamicSubmodules;
    
    return dynamicSubmodules.filter(sub => {
        const mainModuleSlug = slugify(sub.mainModule);
        const submoduleSlug = slugify(sub.name);
        
        const mainModulePerms = permissions[mainModuleSlug];
        if (typeof mainModulePerms === 'object' && mainModulePerms !== null) {
            // @ts-ignore
            const subPerms = mainModulePerms[submoduleSlug];
            return subPerms?.read;
        }
        return false;
    });
  }, [dynamicSubmodules, permissions]);

  // Main loading gate for the component
  const isLoading = isUserLoading || isUserDataLoading || isLoadingRoles || isLoadingSubmodules || permissions === null;

  if (isLoading) {
      return (
          <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
      );
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
