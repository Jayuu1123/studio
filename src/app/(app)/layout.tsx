
'use client';
import React, { useEffect, useState } from 'react';
import { Nav } from '@/components/nav';
import { Header } from '@/components/header';
import { useAuth, useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { doc, setDoc, getDoc, collection, query, where, Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import type { License, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { usePathname } from 'next/navigation';

function LicenseWall() {
    return (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center p-8 bg-card border rounded-lg shadow-lg max-w-md mx-4">
                <ShieldAlert className="mx-auto h-16 w-16 text-destructive mb-4" />
                <h2 className="text-2xl font-bold font-headline mb-2">License Required</h2>
                <p className="text-muted-foreground mb-6">
                    Your software license is inactive or has expired. Most features have been disabled.
                </p>
                <p className="text-sm text-muted-foreground">
                    Please contact your administrator or log in as an administrator to activate a license.
                </p>
                <Button asChild className="mt-6">
                    <Link href="/settings/licensing">Go to License Management</Link>
                </Button>
            </div>
        </div>
    );
}

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const [isLicensed, setIsLicensed] = useState<boolean | null>(null);

  const activeLicenseQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
        collection(firestore, 'licenses'), 
        where('status', '==', 'active')
    );
  }, [firestore]);

  const { data: activeLicenses } = useCollection<License>(activeLicenseQuery);

  useEffect(() => {
    if (activeLicenses) {
        const now = Timestamp.now();
        const hasValidLicense = activeLicenses.some(license => 
            license.expiryDate && license.expiryDate.seconds > now.seconds
        );
        setIsLicensed(hasValidLicense);
    } else {
        setIsLicensed(null); // Still loading or no licenses found
    }
  }, [activeLicenses]);

  useEffect(() => {
    const setupAdmin = async () => {
        if (!auth || !firestore) return;

        const adminEmail = 'sa@admin.com';
        const adminPassword = 'saadmin';
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
            const adminUID = userCredential.user.uid;

            const userDocRef = doc(firestore, 'users', adminUID);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                await setDoc(userDocRef, {
                    username: 'sa',
                    email: adminEmail,
                    id: adminUID,
                    roles: ['admin']
                });
                console.log("Admin user and roles document created in Firestore.");
            }
        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                console.log("Admin auth user already exists.");
            } else {
                console.error("Failed to set up admin user:", error);
            }
        }
    };
    
    setupAdmin();
  }, [auth, firestore]);
  
   useEffect(() => {
    if (auth && !user && !isUserLoading) {
      initiateAnonymousSignIn(auth);
    }
  }, [auth, user, isUserLoading]);

  const shouldShowWall = isLicensed === false && !pathname.startsWith('/settings') && pathname !== '/';

  return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <Nav isLicensed={isLicensed} />
            <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
                <Header isLicensed={isLicensed} />
                <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 relative">
                    {shouldShowWall && <LicenseWall />}
                    <div className={shouldShowWall ? 'opacity-20 pointer-events-none' : ''}>
                         {children}
                    </div>
                </main>
            </div>
        </div>
  );
}
