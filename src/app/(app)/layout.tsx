'use server';
import React from 'react';
import { AppLayoutClient } from './layout-client';
import { seedDatabase } from '@/firebase/seed';


export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This will run on the server when the layout is rendered.
  // It checks if data exists and seeds it if necessary.
  await seedDatabase();

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
       <AppLayoutClient>
          {children}
       </AppLayoutClient>
    </div>
  );
}
