'use server';
import React from 'react';
import { getDocs, collection, query, orderBy } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase/server'; // Import a server-side initializer
import { Nav } from '@/components/nav';
import { Header } from '@/components/header';
import type { AppSubmodule } from '@/lib/types';
import { AppLayoutClient } from './layout-client';

// This is now a Server Component. It fetches data on the server.
async function getSubmodules(firestore: any): Promise<AppSubmodule[]> {
  if (!firestore) return [];
  try {
    const submodulesQuery = query(collection(firestore, 'appSubmodules'), orderBy('group'), orderBy('position'));
    const snapshot = await getDocs(submodulesQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as AppSubmodule[];
  } catch (error) {
    // This error will be caught by Next.js error boundaries on the server.
    console.error("Critical Error: Failed to fetch submodules on server-side:", error);
    // Return empty array to allow the app to render, though nav will be incomplete.
    return [];
  }
}

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Initialize firebase admin on the server to fetch data without rule restrictions
  const { firestore } = initializeFirebase();
  const submodules = await getSubmodules(firestore);

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
