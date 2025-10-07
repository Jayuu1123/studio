'use server';
import React from 'react';
import { getDocs, collection, query, orderBy } from 'firebase/firestore';
import { adminFirestore } from '@/firebase/server';
import { Nav } from '@/components/nav';
import { Header } from '@/components/header';
import type { AppSubmodule } from '@/lib/types';
import { AppLayoutClient } from './layout-client';

async function getSubmodules(firestore: any): Promise<AppSubmodule[]> {
  if (!firestore) return [];
  try {
    const submodulesQuery = query(collection(firestore, 'appSubmodules'), orderBy('group'), orderBy('position'));
    const snapshot = await getDocs(submodulesQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AppSubmodule[];
  } catch (error) {
    console.error("Critical Error: Failed to fetch submodules on server-side:", error);
    return [];
  }
}

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const submodules = await getSubmodules(adminFirestore);

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Nav isLicensed={null} permissions={{}} submodules={submodules || []} />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <Header isLicensed={null} permissions={{}} submodules={submodules || []} />
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 relative">
           <AppLayoutClient submodules={submodules}>
              {children}
           </AppLayoutClient>
        </main>
      </div>
    </div>
  );
}
