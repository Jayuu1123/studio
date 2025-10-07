'use client';
import React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { AppSubmodule } from '@/lib/types';
import { AppLayoutClient } from './layout-client';


export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const firestore = useFirestore();

  const submodulesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'appSubmodules'), orderBy('group'), orderBy('position'));
  }, [firestore]);

  const { data: submodules, isLoading } = useCollection<AppSubmodule>(submodulesQuery);


  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
       <AppLayoutClient submodules={submodules || []}>
          {children}
       </AppLayoutClient>
    </div>
  );
}
