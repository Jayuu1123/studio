'use client';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, ChevronLeft } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { collection, serverTimestamp, doc } from "firebase/firestore";
import type { AppSubmodule, FormField } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function DesignFormPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const firestore = useFirestore();
    const submoduleId = params.submoduleId as string;

    const [fieldName, setFieldName] = useState('');
    const [fieldType, setFieldType] = useState('');

    const submoduleRef = useMemoFirebase(() => {
        if (!firestore || !submoduleId) return null;
        return doc(firestore, 'appSubmodules', submoduleId);
    }, [firestore, submoduleId]);

    const { data: submodule, isLoading: isLoadingSubmodule } = useDoc<AppSubmodule>(submoduleRef);

    //TODO: This needs to point to a subcollection of formFields for the submodule
    const fieldsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        // This should be a subcollection in a real app, e.g., collection(firestore, 'appSubmodules', submoduleId, 'formFields')
        // For simplicity, we'll filter from a root collection for now.
        return collection(firestore, 'formFields');
    }, [firestore, submoduleId]);

    const { data: fields, isLoading: isLoadingFields } = useCollection<FormField>(fieldsQuery);
    
    const handleAddField = () => {
        if (!fieldName || !fieldType) {
            toast({
                variant: 'destructive',
                title: "Missing Information",
                description: "Please provide a field name and select a field type.",
            });
            return;
        }

        if (!firestore) {
            toast({
                variant: 'destructive',
                title: "Database Error",
                description: "Firestore is not available.",
            });
            return;
        }

        const newField: Omit<FormField, 'id'> = {
            formDefinitionId: submoduleId,
            name: fieldName,
            type: fieldType
        };

        const fieldsCollection = collection(firestore, 'formFields');
        addDocumentNonBlocking(fieldsCollection, newField);

        toast({
            title: "Field Added",
            description: `'${fieldName}' has been added to the form.`,
        });

        // Reset form
        setFieldName('');
        setFieldType('');
    };

    const handleDeleteField = (id: string) => {
        if (!firestore) return;
        const docRef = doc(firestore, 'formFields', id);
        deleteDocumentNonBlocking(docRef);
        toast({
            title: "Field Deleted",
            description: "The field has been successfully deleted.",
        });
    }


    if (isLoadingSubmodule) {
        return <div>Loading submodule details...</div>
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                <Link href="/form-setting">
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                </Link>
                </Button>
                <h1 className="text-3xl font-bold font-headline">Design Form: {submodule?.name}</h1>
            </div>
            
            <div className="grid gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Add New Field</CardTitle>
                        <CardDescription>Add a new field to your form.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="field-name">Field Name</Label>
                            <Input id="field-name" placeholder="e.g., 'Customer Name'" value={fieldName} onChange={(e) => setFieldName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="field-type">Field Type</Label>
                            <Select onValueChange={setFieldType} value={fieldType}>
                                <SelectTrigger id="field-type">
                                    <SelectValue placeholder="Select a field type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="text">Text</SelectItem>
                                    <SelectItem value="number">Number</SelectItem>
                                    <SelectItem value="date">Date</SelectItem>
                                    <SelectItem value="boolean">Checkbox / Boolean</SelectItem>
                                    <SelectItem value="select">Dropdown (Select)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleAddField}>Add Field</Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Current Form Fields</CardTitle>
                        <CardDescription>Manage the fields for this form.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Field Name</TableHead>
                                    <TableHead>Field Type</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingFields && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center">Loading fields...</TableCell>
                                    </TableRow>
                                )}
                                {fields?.filter(f => f.formDefinitionId === submoduleId).map((field) => (
                                    <TableRow key={field.id}>
                                        <TableCell className="font-medium">{field.name}</TableCell>
                                        <TableCell>{field.type}</TableCell>
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
                                                    <DropdownMenuItem onClick={() => field.id && handleDeleteField(field.id)} className="text-red-500">Delete</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!isLoadingFields && fields?.filter(f => f.formDefinitionId === submoduleId).length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center">No fields defined yet.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
