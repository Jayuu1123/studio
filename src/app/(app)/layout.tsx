'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { Nav } from '@/components/nav';
import { Header } from '@/components/header';
import { useAuth, useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { doc, setDoc, getDoc, collection, query, where, Timestamp, getDocs, orderBy } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import type { License, User, Role, PermissionSet, AppSubmodule } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShieldAlert, UserX, Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { slugify } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

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

function DisabledAccountWall() {
    const auth = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        if (auth) {
            await signOut(auth);
            router.push('/');
        }
    }

    return (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center p-8 bg-card border rounded-lg shadow-lg max-w-md mx-4">
                <UserX className="mx-auto h-16 w-16 text-destructive mb-4" />
                <h2 className="text-2xl font-bold font-headline mb-2">Account Disabled</h2>
                <p className="text-muted-foreground mb-6">
                    Your account has been disabled by an administrator. Please contact support if you believe this is an error.
                </p>
                <Button onClick={handleLogout} className="mt-6">
                    Logout
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
  const router = useRouter();
  const { toast } = useToast();
  const [isLicensed, setIsLicensed] = useState<boolean | null>(null);
  const [permissions, setPermissions] = useState<PermissionSet | null>(null);
  
  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isUserDataLoading } = useDoc<User>(userDocRef);
  
  const userRoles = userData?.roles || [];
  
  const rolesQuery = useMemoFirebase(() => {
    if (!firestore || userRoles.length === 0) return null;
    return query(collection(firestore, 'roles'), where('name', 'in', userRoles));
  }, [firestore, userRoles]);

  const { data: roleDocs, isLoading: isLoadingRoles } = useCollection<Role>(rolesQuery);

  const submodulesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'appSubmodules'), orderBy('position'));
  }, [firestore]);

  const { data: submodules, isLoading: isLoadingSubmodules } = useCollection<AppSubmodule>(submodulesQuery);


  useEffect(() => {
    if (isUserDataLoading || isLoadingRoles) return;

    if (userData?.email === 'sa@admin.com') {
      setPermissions({ all: true });
      return;
    }
    
    if (roleDocs) {
      const mergedPermissions: PermissionSet = {};
      roleDocs.forEach(role => {
        if (role.permissions) {
          Object.assign(mergedPermissions, role.permissions);
        }
      });
      setPermissions(mergedPermissions);
    } else {
      setPermissions({});
    }
  }, [userData, roleDocs, isLoadingRoles, isUserDataLoading]);


  const activeLicenseQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
        collection(firestore, 'licenses'), 
        where('status', '==', 'active')
    );
  }, [firestore, user]);

  const { data: activeLicenses, isLoading: isLoadingLicenses } = useCollection<License>(activeLicenseQuery);

  useEffect(() => {
    if (isLoadingLicenses) return;

    if (activeLicenses) {
        const now = Timestamp.now();
        const hasValidLicense = activeLicenses.some(license => 
            license.expiryDate && license.expiryDate.seconds > now.seconds
        );
        setIsLicensed(hasValidLicense);
    } else if (!isUserLoading && user) {
        setIsLicensed(false);
    } else {
        setIsLicensed(null);
    }
  }, [activeLicenses, isLoadingLicenses, isUserLoading, user]);

   useEffect(() => {
        if (userData?.status === 'disabled') {
            if (auth) {
                toast({
                    variant: 'destructive',
                    title: 'Account Disabled',
                    description: 'Your account has been disabled. Logging you out.',
                });
            }
        }
        
        const clientSessionId = sessionStorage.getItem('userSessionId');
        if (userData && clientSessionId && userData.sessionId && userData.sessionId !== clientSessionId) {
             if (auth) {
                toast({
                    variant: 'destructive',
                    title: 'Session Expired',
                    description: 'You have been logged out because you signed in on another device.',
                });
                signOut(auth).then(() => {
                    sessionStorage.removeItem('userSessionId');
                    router.push('/');
                });
            }
        }

    }, [userData, auth, toast, router]);

  useEffect(() => {
    const setupAdmin = async () => {
        if (!auth || !firestore) return;

        const adminEmail = 'sa@admin.com';
        const adminPassword = 'saadmin';
        
        try {
            const adminRoleRef = doc(firestore, 'roles', 'admin');
            const adminRoleSnap = await getDoc(adminRoleRef);
            if (!adminRoleSnap.exists()) {
                await setDoc(adminRoleRef, {
                    id: 'admin',
                    name: 'Admin',
                    description: 'Super administrator with all permissions.',
                    permissions: { all: true }
                });
            }

            const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
            const adminUID = userCredential.user.uid;

            const userDocRef = doc(firestore, 'users', adminUID);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                await setDoc(userDocRef, {
                    username: 'sa',
                    email: adminEmail,
                    id: adminUID,
                    roles: ['Admin'],
                    status: 'active'
                });
                console.log("Admin user and roles document created in Firestore.");
            }
        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                // This is expected if the admin user already exists, so we can ignore it.
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

  // The main loading gate. Do not render children until all data is ready.
  const isAppLoading = isUserLoading || isUserDataLoading || isLoadingLicenses || permissions === null || isLoadingSubmodules;

  if (isAppLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (userData && userData.status === 'disabled') {
    return <DisabledAccountWall />;
  }

  const isSettingsPath = pathname.startsWith('/settings');
  const shouldShowWall = isLicensed === false && !isSettingsPath && pathname !== '/';
  
  const childrenWithPermissions = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      // @ts-ignore
      return React.cloneElement(child, { permissions });
    }
    return child;
  });

  return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <Nav isLicensed={isLicensed} permissions={permissions} submodules={submodules || []} />
            <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
                <Header isLicensed={isLicensed} permissions={permissions} submodules={submodules || []} />
                <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 relative">
                    {shouldShowWall && <LicenseWall />}
                    <div className={shouldShowWall ? 'opacity-20 pointer-events-none' : ''}>
                         {childrenWithPermissions}
                    </div>
                </main>
            </div>
        </div>
  );
}
