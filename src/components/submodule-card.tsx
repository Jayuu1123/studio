'use client';

import { useEffect, useState } from "react";
import { useFirestore } from "@/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import type { AppSubmodule } from "@/lib/types";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { slugify } from "@/lib/utils";

interface SubmoduleCardProps {
    submodule: AppSubmodule;
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase();
}


export function SubmoduleCard({ submodule }: SubmoduleCardProps) {
    const firestore = useFirestore();
    const [counts, setCounts] = useState({ entries: 0, pending: 0 });

    useEffect(() => {
        const fetchCounts = async () => {
            if (!firestore || !submodule.name) return;

            try {
                // Get total entries
                const entriesQuery = query(collection(firestore, 'transactionEntries'), where('submodule', '==', submodule.name));
                const entriesSnapshot = await getDocs(entriesQuery);
                const totalEntries = entriesSnapshot.size;

                // Get pending entries
                const pendingQuery = query(
                    collection(firestore, 'transactionEntries'),
                    where('submodule', '==', submodule.name),
                    where('status', '==', 'P')
                );
                const pendingSnapshot = await getDocs(pendingQuery);
                const pendingEntries = pendingSnapshot.size;

                setCounts({ entries: totalEntries, pending: pendingEntries });

            } catch (error) {
                console.error(`Failed to fetch counts for ${submodule.name}:`, error)
            }
        };

        fetchCounts();
    }, [firestore, submodule.name]);


    return (
        <Card className="hover:shadow-lg transition-shadow w-full">
            <Link href={`/transactions/${slugify(submodule.name)}`} className="block h-full">
                <CardContent className="p-4 flex flex-col justify-between h-full">
                    <div className="flex items-center gap-3 mb-2">
                         <span className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-sm font-semibold">
                            {getInitials(submodule.name)}
                        </span>
                        <CardTitle className="text-base font-medium">{submodule.name}</CardTitle>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <div>
                            <p className="text-green-600">Entries</p>
                            <p className="text-xl font-bold">{counts.entries}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-red-600">Pendings</p>
                            <p className="text-xl font-bold">{counts.pending}</p>
                        </div>
                    </div>
                </CardContent>
            </Link>
        </Card>
    );
}
