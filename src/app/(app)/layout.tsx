'use server';
import React from 'react';
import { AppLayoutClient } from './layout-client';


export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The seeding logic was causing server crashes and has been removed.
  // await seedDatabase();

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
       <AppLayoutClient>
          {children}
       </AppLayoutClient>
    </div>
  );
}
