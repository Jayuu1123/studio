'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, FileText, PlusCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { useFirestore, useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc, query, where } from "firebase/firestore";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import type { AppSubmodule, FormField } from "@/lib/types";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FormSettingSidebar } from "@/components/settings/form-setting-sidebar";
import { useToast } from "@/hooks/use-toast";

export default function DetailsFormPage() {
    const params = useParams();
    const firestore = useFirestore();
    const { toast } = useToast();
    const submoduleId = params.submoduleId as string;

    const [newFieldName, setNewFieldName] = useState('');
    const [newFieldType, setNewFieldType] = useState('');

    const submoduleRef = useMemoFirebase(() => {
        if (!firestore || !submoduleId) return null;
        return doc(firestore, 'appSubmodules', submoduleId);
    }, [firestore, submoduleId]);

    const { data: submodule, isLoading: isLoadingSubmodule } = useDoc<AppSubmodule>(submoduleRef);

    const formFieldsQuery = useMemoFirebase(() => {
        if (!firestore || !submoduleId) return null;
        return query(
            collection(firestore, 'appSubmodules', submoduleId, 'formFields'),
            where('section', '==', 'detail')
        );
    }, [firestore, submoduleId]);

    const { data: detailFields, isLoading: isLoadingFields } = useCollection<FormField>(formFieldsQuery);

    const handleAddField = () => {
        if (!newFieldName || !newFieldType) {
            toast({
                variant: 'destructive',
                title: "Missing Information",
                description: "Please provide both a field name and type.",
            });
            return;
        }

        if (!firestore || !submoduleId) return;

        const fieldsCollection = collection(firestore, 'appSubmodules', submoduleId, 'formFields');
        const newField: Omit<FormField, 'id'> = {
            formDefinitionId: submoduleId,
            name: newFieldName,
            type: newFieldType,
            section: 'detail',
        };

        addDocumentNonBlocking(fieldsCollection, newField);
        toast({
            title: "Field Added",
            description: `Field '${newFieldName}' has been added to the details grid.`,
        });

        setNewFieldName('');
        setNewFieldType('');
    };

     const handleDeleteField = (fieldId: string) => {
        if (!firestore || !submoduleId) return;
        const fieldDocRef = doc(firestore, 'appSubmodules', submoduleId, 'formFields', fieldId);
        deleteDocumentNonBlocking(fieldDocRef);
        toast({
             title: "Field Deleted",
             description: "The field has been removed.",
        })
    }

    if (isLoadingSubmodule) {
        return <div>Loading submodule details...</div>
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
            <FormSettingSidebar />
            
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                        <Link href="/form-setting">
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">Back</span>
                        </Link>
                    </Button>
                    <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                            <Link href="/form-setting" className="hover:underline">Form Setting</Link> &gt; 
                            <span className="font-medium text-foreground"> {submodule?.name}</span> &gt;
                            <span className="font-medium text-foreground"> Details</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6" />
                    <h1 className="text-2xl font-bold font-headline">Define Detail Grid Fields</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Add New Grid Column</CardTitle>
                        <CardDescription>Add columns that will appear in the line items grid.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-3 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="field-name">Column Name</Label>
                            <Input id="field-name" value={newFieldName} onChange={(e) => setNewFieldName(e.target.value)} placeholder="e.g. Item Name" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="field-type">Column Type</Label>
                             <Select value={newFieldType} onValueChange={setNewFieldType}>
                                <SelectTrigger id="field-type">
                                    <SelectValue placeholder="Select a type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="text">Text</SelectItem>
                                    <SelectItem value="number">Number</SelectItem>
                                    <SelectItem value="date">Date</SelectItem>
                                    <SelectItem value="boolean">Checkbox</SelectItem>
                                    <SelectItem value="select">Select</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                             <Button onClick={handleAddField}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Column
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Existing Grid Columns</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Column Name</TableHead>
                                    <TableHead>Column Type</TableHead>
                                    <TableHead className="w-16"><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingFields && <TableRow><TableCell colSpan={3} className="text-center">Loading columns...</TableCell></TableRow>}
                                {detailFields?.map(field => (
                                    <TableRow key={field.id}>
                                        <TableCell>{field.name}</TableCell>
                                        <TableCell className="capitalize">{field.type}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteField(field.id!)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!isLoadingFields && !detailFields?.length && <TableRow><TableCell colSpan={3} className="text-center">No grid columns defined.</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
