'use client';
import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import type { AppSubmodule } from "@/lib/types";
import { SubmoduleCard } from "@/components/submodule-card";
import { Loader2 } from "lucide-react";

interface PurchasePageProps {
    submodules: AppSubmodule[];
}

export default function PurchasePage({ submodules = [] }: PurchasePageProps) {
  const purchaseSubmodules = useMemo(() => {
    return submodules.filter(sub => sub.mainModule === 'Purchase');
  }, [submodules]);

  // The parent (`AppLayoutClient`) will show a loader.
  const isLoading = false;

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold font-headline">Purchase</h1>
        </div>

        {isLoading && (
            <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )}

        {!isLoading && purchaseSubmodules && purchaseSubmodules.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {purchaseSubmodules.map(submodule => (
                    <SubmoduleCard key={submodule.id} submodule={submodule} />
                ))}
            </div>
        )}

        {!isLoading && (!purchaseSubmodules || purchaseSubmodules.length === 0) && (
            <Card>
                <CardHeader>
                <CardTitle>No Purchase Submodules Found</CardTitle>
                <CardDescription>
                    Manage your procurement and purchase orders.
                </CardDescription>
                </CardHeader>
                <CardContent>
                <p>You can create a new submodule for the purchase module from the Form Setting page.</p>
                </CardContent>
            </Card>
        )}
    </div>
  );
}
