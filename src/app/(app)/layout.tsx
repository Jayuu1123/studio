'use server';
import React from 'react';
import { getDocs, collection, query, orderBy } from 'firebase/firestore';
import { adminFirestore } from '@/firebase/server';
import { Nav } from '@/components/nav';
import { Header } from '@/components/header';
import type { AppSubmodule } from '@/lib/types';
import { AppLayoutClient } from './layout-client';

async function getSubmodules(): Promise<AppSubmodule[]> {
  try {
    const submodulesQuery = query(collection(adminFirestore, 'appSubmodules'), orderBy('group'), orderBy('position'));
    const snapshot = await getDocs(submodulesQuery);
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AppSubmodule[];
  } catch (error) {
    console.error("Critical Error: Failed to fetch submodules on server-side:", error);
    // In case of a critical error, return an empty array to prevent a full crash.
    // The UI will show a "no submodules" state.
    return [];
  }
}

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const submodules = await getSubmodules();

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
       <AppLayoutClient submodules={submodules}>
          {children}
       </AppLayoutClient>
    </div>
  );
}
