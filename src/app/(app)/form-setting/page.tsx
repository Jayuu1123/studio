'use client';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { collection, serverTimestamp } from "firebase/firestore";
import type { AppSubmodule } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";


export default function FormSettingPage() {
    const [mainModule, setMainModule] = useState('');
    const [submoduleName, setSubmoduleName] = useState('');
    const firestore = useFirestore();
    const { toast } = useToast();

    const submodulesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'appSubmodules');
    }, [firestore]);

    const { data: submodules, isLoading } = useCollection<AppSubmodule>(submodulesQuery);

    const handleCreateSubmodule = () => {
        if (!mainModule || !submoduleName) {
            toast({
                variant: 'destructive',
                title: "Missing Information",
                description: "Please select a main module and provide a submodule name.",
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

        const newSubmodule: Omit<AppSubmodule, 'id'> = {
            name: submoduleName,
            mainModule: mainModule,
            createdAt: serverTimestamp(),
        };

        const submodulesCollection = collection(firestore, 'appSubmodules');
        addDocumentNonBlocking(submodulesCollection, newSubmodule);

        toast({
            title: "Submodule Created",
            description: `'${submoduleName}' has been added to the '${mainModule}' module.`,
        });

        // Reset form
        setMainModule('');
        setSubmoduleName('');
    };
    
    const handleDeleteSubmodule = (id: string) => {
        if(!firestore) return;
        const docRef = doc(firestore, 'appSubmodules', id);
        deleteDocumentNonBlocking(docRef);
        toast({
            title: "Submodule Deleted",
            description: "The submodule has been successfully deleted.",
        });
    }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">Form Setting</h1>
      <p className="text-muted-foreground">
        Use this section to customize your ERP by adding new submodules, creating entry forms, and adding new fields.
      </p>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Create New Submodule */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Submodule</CardTitle>
            <CardDescription>Add a new submodule to an existing main module.</CardDescription>
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
              <Label htmlFor="submodule-name">Submodule Name</Label>
              <Input 
                id="submodule-name" 
                placeholder="e.g., 'Invoices'"
                value={submoduleName}
                onChange={(e) => setSubmoduleName(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleCreateSubmodule}>Create Submodule</Button>
          </CardFooter>
        </Card>

        {/* Manage Submodules */}
        <Card>
          <CardHeader>
            <CardTitle>Manage Submodules</CardTitle>
            <CardDescription>Edit or delete existing submodules.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Submodule Name</TableHead>
                  <TableHead>Main Module</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center">Loading submodules...</TableCell>
                    </TableRow>
                )}
                {submodules && submodules.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium">{sub.name}</TableCell>
                    <TableCell>{sub.mainModule}</TableCell>
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
                          <DropdownMenuItem onClick={() => sub.id && handleDeleteSubmodule(sub.id)} className="text-red-500">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && (!submodules || submodules.length === 0) && (
                     <TableRow>
                        <TableCell colSpan={3} className="text-center">No submodules found.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Design Entry Form */}
        <Card>
          <CardHeader>
            <CardTitle>Design Entry Form</CardTitle>
            <CardDescription>Create or modify the entry form for a submodule.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="design-submodule">Submodule</Label>
            <Select>
              <SelectTrigger id="design-submodule">
                <SelectValue placeholder="Select a submodule" />
              </SelectTrigger>
              <SelectContent>
                {submodules && submodules.map(sub => <SelectItem key={sub.id} value={sub.id as string}>{sub.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
          <CardFooter>
            <Button>Design Form</Button>
          </CardFooter>
        </Card>

        {/* Add Custom Fields */}
        <Card>
          <CardHeader>
            <CardTitle>Add Custom Fields</CardTitle>
            <CardDescription>Add new fields to an existing entry form.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
                <Label htmlFor="field-submodule">Submodule</Label>
                <Select>
                  <SelectTrigger id="field-submodule">
                    <SelectValue placeholder="Select a submodule" />
                  </SelectTrigger>
                  <SelectContent>
                     {submodules && submodules.map(sub => <SelectItem key={sub.id} value={sub.id as string}>{sub.name}</SelectItem>)}
                  </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="field-name">Field Name</Label>
                <Input id="field-name" placeholder="e.g., 'Due Date'" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="field-type">Field Type</Label>
                <Select>
                  <SelectTrigger id="field-type">
                    <SelectValue placeholder="Select a field type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="boolean">Checkbox</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button>Add Field</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
