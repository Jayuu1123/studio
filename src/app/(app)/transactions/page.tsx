'use client';

import React, { useMemo } from 'react';
import type { AppSubmodule } from '@/lib/types';
import { SubmoduleCard } from '@/components/submodule-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowDown, ArrowUp, Loader2 } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, writeBatch, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';


export default function TransactionsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const submodulesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'appSubmodules'), orderBy('position'));
  }, [firestore, user]);

  const { data: submodules, isLoading: isLoadingSubmodules } = useCollection<AppSubmodule>(submodulesQuery);

  const transactionSubmodules = useMemo(() => {
    if (!submodules) return [];
    return submodules.filter(sub => sub.mainModule === 'Transactions');
  }, [submodules]);

  const groupedSubmodules = useMemo(() => {
    if (!transactionSubmodules) return {};
    return transactionSubmodules.reduce((acc, submodule) => {
      const group = submodule.group || 'Uncategorized';
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(submodule);
      return acc;
    }, {} as Record<string, AppSubmodule[]>);
  }, [transactionSubmodules]);

  const groupOrder = useMemo(() => {
    if (!transactionSubmodules) return [];
    // Get unique group names in the order they first appear based on original `position` sort
    const order = transactionSubmodules.map(s => s.group || 'Uncategorized');
    return [...new Set(order)];
  }, [transactionSubmodules]);

  const handleMoveGroup = async (groupName: string, direction: 'up' | 'down') => {
    if (!firestore || !submodules) return;

    const currentGroupIndex = groupOrder.indexOf(groupName);
    const targetGroupIndex = direction === 'up' ? currentGroupIndex - 1 : currentGroupIndex + 1;

    if (targetGroupIndex < 0 || targetGroupIndex >= groupOrder.length) {
      return; // Can't move
    }

    const targetGroupName = groupOrder[targetGroupIndex];

    const currentGroupItems = groupedSubmodules[groupName].sort((a, b) => a.position - b.position);
    const targetGroupItems = groupedSubmodules[targetGroupName].sort((a, b) => a.position - b.position);

    // Get the full range of positions to swap
    const allItemsToUpdate = [...currentGroupItems, ...targetGroupItems];
    const originalPositions = allItemsToUpdate.map(item => item.position).sort((a, b) => a - b);
    
    // The new arrangement will be the target group items followed by the current group items (if moving down), or vice versa
    const newArrangement = direction === 'down' 
      ? [...targetGroupItems, ...currentGroupItems]
      : [...currentGroupItems, ...targetGroupItems];

    try {
        const batch = writeBatch(firestore);
        
        newArrangement.forEach((item, index) => {
            const docRef = doc(firestore, 'appSubmodules', item.id!);
            batch.update(docRef, { position: originalPositions[index] });
        });

        await batch.commit();

        toast({
            title: "Group Reordered",
            description: `The '${groupName}' group has been moved.`,
        });

    } catch (error) {
        console.error("Error reordering group:", error);
        toast({
            variant: 'destructive',
            title: "Reorder Failed",
            description: "Could not reorder the group. Please try again.",
        });
    }
  }


  return (
    <div className="space-y-8">
       <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline">Transactions</h1>
          <p className="text-muted-foreground">Home > Transactions</p>
        </div>
      </div>

      {isLoadingSubmodules && (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoadingSubmodules && transactionSubmodules && transactionSubmodules.length > 0 ? (
        <div className="space-y-8">
          {groupOrder.map((groupName, index) => (
            <div key={groupName}>
              <div className="flex items-center mb-4 gap-2">
                <h2 className="text-2xl font-semibold font-headline">{groupName}</h2>
                 <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleMoveGroup(groupName, 'up')} disabled={index === 0}>
                        <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleMoveGroup(groupName, 'down')} disabled={index === groupOrder.length - 1}>
                        <ArrowDown className="h-4 w-4" />
                    </Button>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {groupedSubmodules[groupName]
                  // Secondary sort by position within the group on the client-side
                  .sort((a, b) => a.position - b.position)
                  .map((submodule) => (
                    <SubmoduleCard key={submodule.id} submodule={submodule} />
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!isLoadingSubmodules && (!transactionSubmodules || transactionSubmodules.length === 0) && (
        <Card>
          <CardHeader>
            <CardTitle>No Transaction Submodules Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              No submodules have been created for the Transactions module yet. You can create one from the <Link href="/form-setting" className="text-primary underline">Form Setting</Link> page.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
