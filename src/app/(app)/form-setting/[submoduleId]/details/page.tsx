'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, FileText, PlusCircle, Trash2, Save, AlertCircle } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { collection, doc, query, orderBy, getDocs } from "firebase/firestore";
import { addDocumentNonBlocking, deleteDocumentNonBlocking, setDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import type { AppSubmodule, FormField } from "@/lib/types";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FormSettingSidebar } from "@/components/settings/form-setting-sidebar";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { slugify } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default function DetailsFormPage() {
    const params = useParams();
    const firestore = useFirestore();
    const { toast } = useToast();
    const submoduleId = params.submoduleId as string;

    const [fields, setFields] = useState<FormField[]>([]);
    const [isLoadingFields, setIsLoadingFields] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const submoduleRef = useMemoFirebase(() => {
        if (!firestore || !submoduleId) return null;
        return doc(firestore, 'appSubmodules', submoduleId);
    }, [firestore, submoduleId]);

    const { data: submodule, isLoading: isLoadingSubmodule } = useDoc<AppSubmodule>(submoduleRef);

    useEffect(() => {
        const fetchFields = async () => {
            if (!firestore || !submoduleId) {
                setIsLoadingFields(false);
                return;
            };

            setIsLoadingFields(true);
            setError(null);

            try {
                // Fetch all fields and filter/sort on the client to avoid index issues
                const formFieldsQuery = query(
                    collection(firestore, 'appSubmodules', submoduleId, 'formFields')
                );
                const querySnapshot = await getDocs(formFieldsQuery);
                const allFields = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FormField));
                
                const detailFields = allFields
                    .filter(field => field.section === 'detail')
                    .sort((a, b) => a.position - b.position);

                setFields(detailFields);
            } catch (e: any) {
                console.error("Failed to fetch detail fields:", e);
                setError("Could not load detail fields. Please check permissions and try again.");
            } finally {
                setIsLoadingFields(false);
            }
        };

        fetchFields();
    }, [firestore, submoduleId]);

    const handleFieldChange = (index: number, prop: keyof FormField, value: any) => {
        const newFields = [...fields];
        if (prop === 'label' && !newFields[index].key) {
            newFields[index].key = slugify(value);
        }
        // @ts-ignore
        newFields[index][prop] = value;
        setFields(newFields);
    };

    const handleAddField = () => {
        const newPosition = fields.length > 0 ? Math.max(...fields.map(f => f.position)) + 1 : 1;
        setFields([...fields, {
            formDefinitionId: submoduleId,
            key: '',
            label: '',
            type: 'text',
            section: 'detail',
            position: newPosition,
            required: false,
            placeholder: ''
        }]);
    };
    
    const handleSaveField = async (index: number) => {
        if (!firestore || !submoduleId) return;
        const field = fields[index];
        if (!field.key || !field.label) {
            toast({
                variant: 'destructive',
                title: "Validation Error",
                description: "Field Key and Label are required.",
            });
            return;
        }

        const fieldsCollection = collection(firestore, 'appSubmodules', submoduleId, 'formFields');
        
        if (field.id) {
            // Update existing field
            const fieldDocRef = doc(fieldsCollection, field.id);
            await setDocumentNonBlocking(fieldDocRef, field, { merge: true });
             toast({
                title: "Field Updated",
                description: `Field '${field.label}' has been updated.`,
            });
        } else {
            // Create new field
            const docRef = await addDocumentNonBlocking(fieldsCollection, field);
            if(docRef) {
                const newFields = [...fields];
                newFields[index].id = docRef.id;
                setFields(newFields);
            }
             toast({
                title: "Field Created",
                description: `Field '${field.label}' has been created.`,
            });
        }
    };

    const handleDeleteField = (index: number) => {
        if (!firestore || !submoduleId) return;
        const field = fields[index];
        if (field.id) {
            const fieldDocRef = doc(firestore, 'appSubmodules', submoduleId, 'formFields', field.id);
            deleteDocumentNonBlocking(fieldDocRef);
        }
        const newFields = fields.filter((_, i) => i !== index);
        setFields(newFields);
        toast({
             title: "Field Removed",
             description: "The field has been removed from the UI. Save to commit changes.",
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
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Manage Detail Grid Columns</CardTitle>
                                <CardDescription>Add, edit, and reorder columns for the line items grid.</CardDescription>
                            </div>
                            <Button onClick={handleAddField}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Column
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                         {error && (
                             <Alert variant="destructive" className="mb-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Column Key</TableHead>
                                    <TableHead>Label</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Required</TableHead>
                                    <TableHead>Placeholder</TableHead>
                                    <TableHead className="w-28 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoadingFields && <TableRow><TableCell colSpan={6} className="text-center">Loading columns...</TableCell></TableRow>}
                                {!isLoadingFields && !error && fields.map((field, index) => (
                                    <TableRow key={field.id || index}>
                                        <TableCell>
                                            <Input value={field.key} onChange={e => handleFieldChange(index, 'key', e.target.value)} placeholder="e.g., item_name" />
                                        </TableCell>
                                        <TableCell>
                                            <Input value={field.label} onChange={e => handleFieldChange(index, 'label', e.target.value)} placeholder="e.g., Item Name" />
                                        </TableCell>
                                        <TableCell>
                                            <Select value={field.type} onValueChange={v => handleFieldChange(index, 'type', v)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="text">Text</SelectItem>
                                                    <SelectItem value="number">Number</SelectItem>
                                                    <SelectItem value="date">Date</SelectItem>
                                                    <SelectItem value="boolean">Checkbox</SelectItem>
                                                    <SelectItem value="select">Select</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Checkbox checked={field.required} onCheckedChange={c => handleFieldChange(index, 'required', c)} />
                                        </TableCell>
                                        <TableCell>
                                            <Input value={field.placeholder || ''} onChange={e => handleFieldChange(index, 'placeholder', e.target.value)} placeholder="Enter hint text" />
                                        </TableCell>
                                        <TableCell className="text-right space-x-1">
                                            <Button variant="ghost" size="icon" onClick={() => handleSaveField(index)}>
                                                <Save className="h-4 w-4 text-blue-500" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteField(index)}>
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!isLoadingFields && !error && !fields.length && <TableRow><TableCell colSpan={6} className="text-center py-8">No grid columns defined. Click "Add Column" to begin.</TableCell></TableRow>}

                                {!isLoadingFields && error && <TableRow><TableCell colSpan={6} className="text-center py-8 text-destructive">{error}</TableCell></TableRow>}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
