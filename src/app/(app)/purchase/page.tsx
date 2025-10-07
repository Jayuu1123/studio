'use client';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import type { AppSubmodule } from "@/lib/types";
import { SubmoduleCard } from "@/components/submodule-card";
import { Loader2 } from "lucide-react";

export default function PurchasePage() {
  const firestore = useFirestore();

  const submodulesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'appSubmodules'), where('mainModule', '==', 'Purchase'));
  }, [firestore]);

  const { data: submodules, isLoading } = useCollection<AppSubmodule>(submodulesQuery);


  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold font-headline">Purchase</h1>
            <Button asChild>
                <Link href="/form-setting">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Submodule
                </Link>
            </Button>
        </div>

        {isLoading && (
            <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )}

        {!isLoading && submodules && submodules.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {submodules.map(submodule => (
                    <SubmoduleCard key={submodule.id} submodule={submodule} />
                ))}
            </div>
        )}

        {!isLoading && (!submodules || submodules.length === 0) && (
            <Card>
                <CardHeader>
                <CardTitle>No Purchase Submodules Found</CardTitle>
                <CardDescription>
                    Manage your procurement and purchase orders.
                </CardDescription>
                </CardHeader>
                <CardContent>
                <p>You can create a new submodule for the purchase module using the button above.</p>
                </CardContent>
            </Card>
        )}
    </div>
  );
}
