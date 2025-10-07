'use client';
import { useMemo } from 'react';
import type { AppSubmodule } from "@/lib/types";
import { SubmoduleCard } from "@/components/submodule-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface CrmPageProps {
    submodules: AppSubmodule[];
}

export default function CrmPage({ submodules = [] }: CrmPageProps) {
    const crmSubmodules = useMemo(() => {
        return submodules.filter(sub => sub.mainModule === 'CRM');
    }, [submodules]);

    // The parent (`AppLayoutClient`) will show a loader, so we don't need a separate one here.
    // However, we can keep a check for safety.
    const isLoading = false; // Data is passed down directly.

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold font-headline">CRM</h1>
            </div>

            {isLoading && (
                 <div className="flex items-center justify-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            )}

            {!isLoading && crmSubmodules && crmSubmodules.length > 0 && (
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {crmSubmodules.map(submodule => (
                        <SubmoduleCard key={submodule.id} submodule={submodule} />
                    ))}
                </div>
            )}
            
            {!isLoading && (!crmSubmodules || crmSubmodules.length === 0) && (
                <Card>
                    <CardHeader>
                        <CardTitle>No CRM Submodules Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            You can create new CRM submodules in the <Link href="/form-setting" className="text-primary underline">Form Setting</Link> page.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
