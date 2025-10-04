'use client';
import type { Metadata } from 'next';
import { Nav } from '@/components/nav';
import { Header } from '@/components/header';
import React, { useEffect } from 'react';
import { useAuth } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';

// This is a client component, so metadata should be exported from a server component if needed.
// For now, we'll keep it simple.

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const auth = useAuth();

  useEffect(() => {
    if (auth) {
      initiateAnonymousSignIn(auth);
    }
  }, [auth]);

  return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <Nav />
            <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
                <Header />
                <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
                    {children}
                </main>
            </div>
        </div>
  );
}
