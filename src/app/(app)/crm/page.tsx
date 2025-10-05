'use client';

import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import type { AppSubmodule } from "@/lib/types";
import { collection, query, where } from "firebase/firestore";
import { SubmoduleCard } from "@/components/submodule-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function CrmPage() {
    const firestore = useFirestore();
    const crmSubmodulesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'appSubmodules'), where('mainModule', '==', 'CRM'));
    }, [firestore]);

    const { data: submodules, isLoading } = useCollection<AppSubmodule>(crmSubmodulesQuery);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline mb-4">CRM</h1>
                {isLoading && <p>Loading CRM modules...</p>}

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
        </div>
    );
}
