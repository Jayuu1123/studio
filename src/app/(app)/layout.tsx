'use client';
import React from 'react';
import { AppLayoutClient } from './layout-client';


export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
       <AppLayoutClient>
          {children}
       </AppLayoutClient>
    </div>
  );
}
