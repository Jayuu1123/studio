'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth, useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { doc, setDoc, getDoc, collection, query, where, Timestamp, serverTimestamp, updateDoc, orderBy } from 'firebase/firestore';
import type { License, User, Role, PermissionSet, AppSubmodule } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShieldAlert, UserX, Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { slugify } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { Nav } from '@/components/nav';
import { Header } from '@/components/header';


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

export function AppLayoutClient({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  console.log('--- AppLayoutClient: Render Start ---');
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [isLicensed, setIsLicensed] = useState<boolean | null>(null);
  const [permissions, setPermissions] = useState<PermissionSet | null>(null);
  
  console.log(`AppLayoutClient: isUserLoading is ${isUserLoading}, user object is ${user ? 'present' : 'null'}`);

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) {
        console.log('AppLayoutClient: userDocRef not created (no firestore or user)');
        return null;
    }
    console.log('AppLayoutClient: Creating userDocRef for user:', user.uid);
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData, isLoading: isUserDataLoading } = useDoc<User>(userDocRef);
  console.log(`AppLayoutClient: isUserDataLoading is ${isUserDataLoading}, userData is ${userData ? 'present' : 'null'}`);
  
  const userRoles = userData?.roles || [];
  
  const rolesQuery = useMemoFirebase(() => {
    if (!firestore || !user || userRoles.length === 0) {
        console.log('AppLayoutClient: rolesQuery not created (missing dependencies)');
        return null;
    }
    console.log('AppLayoutClient: Creating rolesQuery for roles:', userRoles);
    return query(collection(firestore, 'roles'), where('name', 'in', userRoles));
  }, [firestore, user, userRoles]);

  const { data: roleDocs, isLoading: isLoadingRoles } = useCollection<Role>(rolesQuery);
   console.log(`AppLayoutClient: isLoadingRoles is ${isLoadingRoles}`);
  
  const submodulesQuery = useMemoFirebase(() => {
    if (isUserLoading || !user) {
      console.log('AppLayoutClient: submodulesQuery not created (user is loading or not present)');
      return null;
    }
    console.log('AppLayoutClient: Creating submodulesQuery.');
    return query(collection(firestore, 'appSubmodules'), orderBy('position'));
  }, [firestore, isUserLoading, user]);

  const { data: submodules, isLoading: isLoadingSubmodules } = useCollection<AppSubmodule>(submodulesQuery);
  console.log(`AppLayoutClient: isLoadingSubmodules is ${isLoadingSubmodules}`);


  useEffect(() => {
    console.log('AppLayoutClient: Permissions useEffect triggered.');
    if (isUserLoading || isUserDataLoading || isLoadingRoles) {
        console.log('AppLayoutClient: Permissions useEffect waiting for data...');
        return;
    }

    console.log('AppLayoutClient: Calculating permissions.');
    if (userData?.email === 'sa@admin.com') {
      console.log('AppLayoutClient: Super admin detected, setting full permissions.');
      setPermissions({ all: true });
      return;
    }
    
    if (roleDocs) {
      console.log('AppLayoutClient: Merging permissions from role documents.');
      const mergedPermissions: PermissionSet = {};
      roleDocs.forEach(role => {
        if (role.permissions) {
          Object.assign(mergedPermissions, role.permissions);
        }
      });
      setPermissions(mergedPermissions);
    } else {
      console.log('AppLayoutClient: No role documents found, setting empty permissions.');
      setPermissions({});
    }
  }, [userData, roleDocs, isLoadingRoles, isUserDataLoading, isUserLoading]);


  const activeLicenseQuery = useMemoFirebase(() => {
    if (isUserLoading || !user) {
      console.log('AppLayoutClient: activeLicenseQuery not created (user loading or not present)');
      return null;
    }
    console.log('AppLayoutClient: Creating activeLicenseQuery.');
    return query(
        collection(firestore, 'licenses'), 
        where('status', '==', 'active')
    );
  }, [firestore, isUserLoading, user]);

  const { data: activeLicenses, isLoading: isLoadingLicenses } = useCollection<License>(activeLicenseQuery);
  console.log(`AppLayoutClient: isLoadingLicenses is ${isLoadingLicenses}`);

  useEffect(() => {
    console.log('AppLayoutClient: License status useEffect triggered.');
    if (isLoadingLicenses) {
        console.log('AppLayoutClient: License status waiting...');
        return;
    };

    if (activeLicenses && activeLicenses.length > 0) {
        const now = Timestamp.now();
        const hasValidLicense = activeLicenses.some(license => 
            license.expiryDate && license.expiryDate.seconds > now.seconds
        );
        console.log(`AppLayoutClient: License status set to ${hasValidLicense}`);
        setIsLicensed(hasValidLicense);
    } else {
        console.log('AppLayoutClient: No active licenses found, setting status to false.');
        setIsLicensed(false);
    }
  }, [activeLicenses, isLoadingLicenses]);

   useEffect(() => {
        console.log('AppLayoutClient: Auth/Session useEffect triggered.');
        if (isUserLoading) {
            console.log('AppLayoutClient: Auth/Session useEffect waiting for user loading to finish.');
            return;
        }

        if (!user) {
            console.log('AppLayoutClient: No user found, redirecting to login page.');
            router.push('/');
            return;
        }

        if (userData?.status === 'disabled') {
            if (auth) {
                console.log('AppLayoutClient: User account is disabled, signing out.');
                toast({
                    variant: 'destructive',
                    title: 'Account Disabled',
                    description: 'Your account has been disabled. Logging you out.',
                });
                 signOut(auth).then(() => {
                    sessionStorage.removeItem('userSessionId');
                    router.push('/');
                });
            }
        }
        
        const clientSessionId = sessionStorage.getItem('userSessionId');
        if (userData && clientSessionId && userData.sessionId && userData.sessionId !== clientSessionId) {
             if (auth) {
                console.log('AppLayoutClient: Session mismatch detected, signing out.');
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

    }, [user, userData, isUserLoading, auth, toast, router]);

  
  const isAppLoading = isUserLoading || isUserDataLoading || isLoadingLicenses || permissions === null || isLoadingSubmodules;
  const isSettingsPath = pathname.startsWith('/settings');
  const shouldShowWall = isLicensed === false && !isSettingsPath && pathname !== '/';
  
  console.log(`AppLayoutClient: Final loading state: isAppLoading is ${isAppLoading}`);

  if (isAppLoading) {
    console.log('AppLayoutClient: App is loading, showing main loader.');
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  const childrenWithPermissions = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      // @ts-ignore
      return React.cloneElement(child, { permissions });
    }
    return child;
  });

  if (userData && userData.status === 'disabled') {
    console.log('AppLayoutClient: Rendering DisabledAccountWall.');
    return <DisabledAccountWall />;
  }

  if (!user && !isUserLoading) {
    console.log('AppLayoutClient: Fallback render for unauthenticated user.');
    // This case is handled by the useEffect redirect, but as a fallback render nothing.
    return null;
  }
  
  console.log('--- AppLayoutClient: Rendering main layout ---');
  return (
        <>
            <Nav isLicensed={isLicensed} permissions={permissions} submodules={submodules || []} />
            <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
                <Header isLicensed={isLicensed} permissions={permissions} submodules={submodules || []} />
                <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 relative">
                    <div className={shouldShowWall ? 'opacity-20 pointer-events-none' : ''}>
                        {childrenWithPermissions}
                    </div>
                    {shouldShowWall && <LicenseWall />}
                </main>
            </div>
        </>
  );
}
