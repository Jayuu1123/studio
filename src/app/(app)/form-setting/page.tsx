'use client';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState, useMemo } from "react";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { collection, serverTimestamp, doc, query, orderBy, getDocs, writeBatch, where } from "firebase/firestore";
import type { AppSubmodule } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { addDoc } from "firebase/firestore";
import { Combobox } from "@/components/ui/combobox";


export default function FormSettingPage() {
    const [mainModule, setMainModule] = useState('');
    const [submoduleName, setSubmoduleName] = useState('');
    const [groupName, setGroupName] = useState('');
    const [selectedSubmodule, setSelectedSubmodule] = useState('');
    const [submoduleToDelete, setSubmoduleToDelete] = useState<AppSubmodule | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();
    const { user } = useUser();

    const submodulesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'appSubmodules'), orderBy('position'));
    }, [firestore]);

    const { data: submodules, isLoading } = useCollection<AppSubmodule>(submodulesQuery);
    
    const uniqueGroups = useMemo(() => {
        if (!submodules) return [];
        const groups = submodules.map(sub => sub.group);
        return [...new Set(groups)].map(group => ({ value: group.toLowerCase(), label: group }));
    }, [submodules]);
    
    const groupedSubmodules = useMemo(() => {
        if (!submodules) return {};
        return submodules.reduce((acc, submodule) => {
          const group = submodule.group || 'Uncategorized';
          if (!acc[group]) {
            acc[group] = [];
          }
          acc[group].push(submodule);
          return acc;
        }, {} as Record<string, AppSubmodule[]>);
    }, [submodules]);

    const groupOrder = useMemo(() => {
        if (!submodules) return [];
        const order = submodules.map(s => s.group || 'Uncategorized');
        return [...new Set(order)];
    }, [submodules]);

    const handleCreateSubmodule = async () => {
        if (!mainModule || !submoduleName || !groupName) {
            toast({
                variant: 'destructive',
                title: "Missing Information",
                description: "Please select a main module, provide a submodule name, and specify a group.",
            });
            return;
        }

        if (!firestore) {
             toast({
                variant: 'destructive',
                title: "Database Error",
                description: "Firestore is not available. Please try again later.",
            });
            return;
        }

        const newPosition = (submodules?.length || 0) + 1;

        const newSubmodule: Omit<AppSubmodule, 'id'> = {
            name: submoduleName,
            mainModule: mainModule,
            group: groupName,
            createdAt: serverTimestamp(),
            position: newPosition,
        };

        const submodulesCollection = collection(firestore, 'appSubmodules');
        await addDoc(submodulesCollection, newSubmodule);

        toast({
            title: "Submodule Created",
            description: `'${submoduleName}' has been added to the '${mainModule}' module under the '${groupName}' group.`,
        });

        // Reset form
        setMainModule('');
        setSubmoduleName('');
        setGroupName('');
    };
    
    const confirmDeleteSubmodule = (submodule: AppSubmodule) => {
        setSubmoduleToDelete(submodule);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteSubmodule = async () => {
        if (!firestore || !submoduleToDelete || !submoduleToDelete.id) return;
        
        const submoduleId = submoduleToDelete.id;
        const submodDocRef = doc(firestore, 'appSubmodules', submoduleId);

        try {
            const batch = writeBatch(firestore);

            batch.delete(submodDocRef);

            const fieldsQuery = query(collection(firestore, 'appSubmodules', submoduleId, 'formFields'));
            const fieldsSnapshot = await getDocs(fieldsQuery);
            fieldsSnapshot.forEach(fieldDoc => {
                batch.delete(fieldDoc.ref);
            });
            
            const entriesQuery = query(collection(firestore, 'transactionEntries'), where('submodule', '==', submoduleToDelete.name));
            const entriesSnapshot = await getDocs(entriesQuery);
            entriesSnapshot.forEach(entryDoc => {
                batch.delete(entryDoc.ref);
            });

            await batch.commit();

            toast({
                title: "Submodule Deleted",
                description: `The submodule '${submoduleToDelete.name}' and all its associated data have been successfully deleted.`,
            });

        } catch (error) {
            console.error("Error deleting submodule:", error);
            toast({
                variant: 'destructive',
                title: "Deletion Failed",
                description: "Could not delete the submodule. Please try again.",
            });
        } finally {
            setIsDeleteDialogOpen(false);
            setSubmoduleToDelete(null);
        }
    };
    
    const handleMoveSubmodule = (submodulesInGroup: AppSubmodule[], currentIndex: number, direction: 'up' | 'down') => {
        if (!firestore || !submodules) return;

        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        if (targetIndex < 0 || targetIndex >= submodulesInGroup.length) return;

        const currentSub = submodulesInGroup[currentIndex];
        const targetSub = submodulesInGroup[targetIndex];

        if (!currentSub.id || !targetSub.id) return;

        const batch = writeBatch(firestore);
        const currentDocRef = doc(firestore, 'appSubmodules', currentSub.id);
        const targetDocRef = doc(firestore, 'appSubmodules', targetSub.id);

        batch.update(currentDocRef, { position: targetSub.position });
        batch.update(targetDocRef, { position: currentSub.position });

        batch.commit().then(() => {
            toast({ title: "Submodule Moved", description: `Moved '${currentSub.name}'.` });
        });
    };

    const handleMoveGroup = async (groupName: string, direction: 'up' | 'down') => {
        if (!firestore || !submodules) return;

        const currentGroupIndex = groupOrder.indexOf(groupName);
        const targetGroupIndex = direction === 'up' ? currentGroupIndex - 1 : currentGroupIndex + 1;

        if (targetGroupIndex < 0 || targetGroupIndex >= groupOrder.length) return;

        const targetGroupName = groupOrder[targetGroupIndex];
        const currentGroupItems = groupedSubmodules[groupName].sort((a, b) => a.position - b.position);
        const targetGroupItems = groupedSubmodules[targetGroupName].sort((a, b) => a.position - b.position);

        const allItemsToUpdate = [...currentGroupItems, ...targetGroupItems];
        const originalPositions = allItemsToUpdate.map(item => item.position).sort((a, b) => a - b);
        
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
            toast({ title: "Group Reordered", description: `The '${groupName}' group has been moved.` });
        } catch (error) {
            console.error("Error reordering group:", error);
            toast({ variant: 'destructive', title: "Reorder Failed", description: "Could not reorder the group." });
        }
    };

    const handleDesignForm = () => {
        if (!selectedSubmodule) {
            toast({
                variant: 'destructive',
                title: "No Submodule Selected",
                description: "Please select a submodule to design its form.",
            });
            return;
        }
        router.push(`/form-setting/${selectedSubmodule}/design`);
    }

  return (
    <>
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">Form Setting</h1>
      <p className="text-muted-foreground">
        Use this section to customize your ERP by adding new submodules, creating entry forms, and adding new fields.
      </p>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-1 flex flex-col gap-8">
            <Card>
            <CardHeader>
                <CardTitle>Create New Submodule</CardTitle>
                <CardDescription>Add a new submodule to an existing main module and group.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                <Label htmlFor="main-module">Main Module</Label>
                <Select onValueChange={setMainModule} value={mainModule}>
                    <SelectTrigger id="main-module">
                    <SelectValue placeholder="Select a main module" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="Transactions">Transactions</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Inventory">Inventory</SelectItem>
                    <SelectItem value="Purchase">Purchase</SelectItem>
                    <SelectItem value="CRM">CRM</SelectItem>
                    <SelectItem value="Reports">Reports</SelectItem>
                    </SelectContent>
                </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="group-name">Group Name</Label>
                    <Combobox
                        options={uniqueGroups}
                        value={groupName}
                        onChange={setGroupName}
                        placeholder="Select or create a group..."
                        emptyText="No groups found. Type to create one."
                    />
                </div>
                <div className="space-y-2">
                <Label htmlFor="submodule-name">Submodule Name</Label>
                <Input 
                    id="submodule-name" 
                    placeholder="e.g., 'Invoices', 'Production Order'"
                    value={submoduleName}
                    onChange={(e) => setSubmoduleName(e.target.value)}
                />
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleCreateSubmodule}>Create Submodule</Button>
            </CardFooter>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Design Entry Form</CardTitle>
                    <CardDescription>Create or modify the entry form for a submodule.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Label htmlFor="design-submodule">Submodule</Label>
                    <Select onValueChange={setSelectedSubmodule} value={selectedSubmodule}>
                    <SelectTrigger id="design-submodule">
                        <SelectValue placeholder="Select a submodule" />
                    </SelectTrigger>
                    <SelectContent>
                        {submodules && submodules.map(sub => <SelectItem key={sub.id} value={sub.id as string}>{sub.name}</SelectItem>)}
                    </SelectContent>
                    </Select>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleDesignForm}>Design Form</Button>
                </CardFooter>
            </Card>
        </div>

        {/* Right Column */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Manage Submodules</CardTitle>
            <CardDescription>Edit, reorder, or delete existing submodules and groups.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">Submodule Name</TableHead>
                  <TableHead>Main Module</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center">Loading submodules...</TableCell>
                    </TableRow>
                )}
                {!isLoading && groupOrder.map((group, groupIndex) => (
                    <>
                        <TableRow key={`group-${group}`} className="bg-muted/50 hover:bg-muted/50">
                            <TableCell colSpan={2} className="font-bold">
                                {group}
                            </TableCell>
                            <TableCell className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleMoveGroup(group, 'up')} disabled={groupIndex === 0}>
                                    <ArrowUp className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleMoveGroup(group, 'down')} disabled={groupIndex === groupOrder.length - 1}>
                                    <ArrowDown className="h-4 w-4" />
                                </Button>
                            </TableCell>
                            <TableCell></TableCell>
                        </TableRow>
                        {groupedSubmodules[group].map((sub, subIndex) => (
                            <TableRow key={sub.id}>
                                <TableCell className="pl-8 font-medium">{sub.name}</TableCell>
                                <TableCell>{sub.mainModule}</TableCell>
                                <TableCell className="flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => handleMoveSubmodule(groupedSubmodules[group], subIndex, 'up')} disabled={subIndex === 0}>
                                        <ArrowUp className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleMoveSubmodule(groupedSubmodules[group], subIndex, 'down')} disabled={subIndex === groupedSubmodules[group].length - 1}>
                                        <ArrowDown className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                                <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Toggle menu</span>
                                    </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuItem>Edit</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => confirmDeleteSubmodule(sub)} className="text-red-500 focus:text-red-500 focus:bg-red-50">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </>
                ))}
                {!isLoading && (!submodules || submodules.length === 0) && (
                     <TableRow>
                        <TableCell colSpan={4} className="text-center">No submodules found.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the submodule
                <span className="font-bold"> {submoduleToDelete?.name}</span>, all of its associated form fields,
                and all transaction entries created under it.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
                onClick={handleDeleteSubmodule}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
                Delete
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
