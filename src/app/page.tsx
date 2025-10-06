'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { placeholderImages } from '@/lib/placeholder-images';
import { useState } from 'react';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { doc, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-8 w-8 text-primary"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
      <span className="text-xl font-bold font-headline text-primary">SynergyFlow</span>
    </div>
  );
}

export default function LoginPage() {
  const loginImage = placeholderImages.find(p => p.id === 'login-background');
  const [email, setEmail] = useState('sa@admin.com');
  const [password, setPassword] = useState('saadmin');
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();


  const handleLogin = async () => {
    if (!auth || !firestore) {
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "Could not connect to authentication service."
        });
        return;
    }
    if (!email || !password) {
        toast({
            variant: "destructive",
            title: "Missing Information",
            description: "Please enter both email and password."
        });
        return;
    }

    setIsLoading(true);

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Generate a new session ID
        const newSessionId = uuidv4();
        
        // Use setDoc with merge to safely create or update the user's document
        const userDocRef = doc(firestore, 'users', user.uid);
        await setDoc(userDocRef, {
            sessionId: newSessionId,
        }, { merge: true });

        // Store the session ID in the client's session storage
        sessionStorage.setItem('userSessionId', newSessionId);
        
        router.push('/dashboard');

    } catch (error: any) {
        console.error("Login failed:", error);
        toast({
            variant: "destructive",
            title: "Login Failed",
            description: "Invalid username or password. Please try again."
        });
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <Logo />
            <h1 className="text-3xl font-bold font-headline mt-4">Login</h1>
            <p className="text-balance text-muted-foreground">
              Enter your email below to login to your account
            </p>
          </div>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)}/>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                <Link href="#" className="ml-auto inline-block text-sm underline">
                  Forgot your password?
                </Link>
              </div>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button onClick={handleLogin} type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
            <Button variant="outline" className="w-full">
              Login with Google
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="#" className="underline">
              Sign up
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block">
        {loginImage && (
             <Image
             src={loginImage.imageUrl}
             alt="SynergyFlow ERP"
             width="1920"
             height="1080"
             className="h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
             data-ai-hint={loginImage.imageHint}
           />
        )}
      </div>
    </div>
  );
}
