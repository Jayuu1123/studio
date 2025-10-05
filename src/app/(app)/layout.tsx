'use client';
import type { Metadata } from 'next';
import { Nav } from '@/components/nav';
import { Header } from '@/components/header';
import React, { useEffect } from 'react';
import { useAuth, useFirestore, useUser } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

// This is a client component, so metadata should be exported from a server component if needed.
// For now, we'll keep it simple.

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    const setupAdmin = async () => {
        if (!auth || !firestore) return;

        const adminEmail = 'sa@admin.com';
        const adminPassword = 'saadmin';
        
        try {
            // Attempt to create the user. If it fails because the email is in use,
            // we assume the admin user is already set up in Auth.
            const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
            const adminUID = userCredential.user.uid;

            // Now, check if the Firestore document exists for this new user
            const userDocRef = doc(firestore, 'users', adminUID);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                // Create the user document in Firestore with the admin role
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
                // This is expected if the admin was already created.
                // In a real-world scenario, you might want to verify the user
                // has the admin role in Firestore here, but for this setup, we'll assume it's correct.
                console.log("Admin auth user already exists.");
            } else {
                // Log other errors
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
