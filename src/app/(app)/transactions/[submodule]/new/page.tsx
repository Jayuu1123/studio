'use client';
import Link from 'next/link';
import {
  ChevronLeft,
  PlusCircle,
  MoreVertical,
  Upload,
  Printer,
  Copy,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { unslugify } from '@/lib/utils';
import { DatePicker } from '@/components/ui/date-picker';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp, getDocs, query, where, orderBy, limit, doc, Timestamp, runTransaction } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import type { TransactionEntry, FormField, AppSubmodule } from '@/lib/types';
import React, { useEffect, useState, useCallback } from 'react';


function DynamicFormField({ field, value, onChange }: { field: FormField, value: any, onChange: (fieldId: string, value: any) => void }) {
    const fieldId = field.name.toLowerCase().replace(/\s/g, '-');
    switch (field.type) {
        case 'text':
            return (
                <div className="grid gap-3">
                    <Label htmlFor={fieldId}>{field.name}</Label>
                    <Input id={fieldId} value={value || ''} onChange={(e) => onChange(field.id!, e.target.value)} />
                </div>
            );
        case 'number':
            return (
                <div className="grid gap-3">
                    <Label htmlFor={fieldId}>{field.name}</Label>
                    <Input id={fieldId} type="number" value={value || ''} onChange={(e) => onChange(field.id!, e.target.value)} />
                </div>
            );
        case 'date':
             return (
                <div className="grid gap-3">
                    <Label htmlFor={fieldId}>{field.name}</Label>
                    <DatePicker date={value ? new Date(value) : undefined} setDate={(d) => onChange(field.id!, d)} />
                </div>
            );
        case 'boolean':
             return (
                <div className="flex items-center gap-2 pt-4">
                    <Checkbox id={fieldId} checked={value || false} onCheckedChange={(c) => onChange(field.id!, c)} />
                    <Label htmlFor={fieldId}>{field.name}</Label>
                </div>
            );
        case 'select':
            return (
                <div className="grid gap-3">
                    <Label htmlFor={fieldId}>{field.name}</Label>
                    <Select value={value} onValueChange={(v) => onChange(field.id!, v)}>
                        <SelectTrigger id={fieldId}>
                            <SelectValue placeholder={`Select ${field.name}`} />
                        </SelectTrigger>
                        <SelectContent>
                           {/* In a real app, options would come from the field definition */}
                           <SelectItem value="option-1">Option 1</SelectItem>
                           <SelectItem value="option-2">Option 2</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            );
        default:
            return null;
    }
}


export default function NewTransactionEntryPage() {
  const params = useParams();
  const submoduleSlug = params.submodule as string;
  const submoduleName = unslugify(submoduleSlug);
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const duplicateId = searchParams.get('duplicateId');
  const editId = searchParams.get('editId');
  
  const [formData, setFormData] = useState<Partial<TransactionEntry>>({
      status: 'P',
      user: 'Current User', // Should be replaced with actual user
      customFields: {},
      lineItems: [{}], // Start with one empty line item
  });

  const submoduleQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'appSubmodules'), where('name', '==', submoduleName), limit(1));
  }, [firestore, submoduleName]);
  
  const { data: submodules } = useCollection<AppSubmodule>(submoduleQuery);
  const submodule = submodules?.[0];
  const submoduleId = submodule?.id;

  const formFieldsQuery = useMemoFirebase(() => {
    if(!firestore || !submoduleId) return null;
    return query(collection(firestore, 'appSubmodules', submoduleId, 'formFields'), orderBy('name'));
  }, [firestore, submoduleId]);

  const { data: allFormFields, isLoading: isLoadingFields } = useCollection<FormField>(formFieldsQuery);
  
  const headerFields = useMemoFirebase(() => allFormFields?.filter(f => f.section === 'header') || [], [allFormFields]);
  const detailFields = useMemoFirebase(() => allFormFields?.filter(f => f.section === 'detail') || [], [allFormFields]);

  const docToLoadRef = useMemoFirebase(() => {
    if (!firestore || (!duplicateId && !editId)) return null;
    const id = duplicateId || editId;
    return doc(firestore, 'transactionEntries', id!);
  }, [firestore, duplicateId, editId]);

  const { data: loadedEntry, isLoading: isLoadingEntry } = useDoc<TransactionEntry>(docToLoadRef);

  useEffect(() => {
    if (loadedEntry) {
        const dataToLoad = { ...loadedEntry };
        if (duplicateId) {
            delete dataToLoad.id;
            delete dataToLoad.docNo;
            delete dataToLoad.docNo_sequential;
            dataToLoad.status = 'P';
        }
        
        // Convert Timestamps back to JS Dates for DatePicker and other components
        const convertTimestamps = (obj: any) => {
            for (const key in obj) {
                if (obj[key] instanceof Timestamp) {
                    obj[key] = obj[key].toDate();
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    convertTimestamps(obj[key]);
                }
            }
        };
        convertTimestamps(dataToLoad);

        // Ensure lineItems is an array with at least one object
        if (!dataToLoad.lineItems || dataToLoad.lineItems.length === 0) {
            dataToLoad.lineItems = [{}];
        }

        setFormData(dataToLoad);
    }
  }, [loadedEntry, duplicateId]);


  const handleSaveEntry = async () => {
    if (!firestore || !submoduleId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to the database.' });
      return;
    }
    
    const entriesCollection = collection(firestore, 'transactionEntries');
    
    // Create a deep copy to avoid mutating state directly
    const finalData = JSON.parse(JSON.stringify(formData));

    // Convert all date objects back to Firestore Timestamps before saving
    const convertDatesToTimestamps = (obj: any) => {
        for (const key in obj) {
            // Check if it's a string that looks like a date (from JSON stringify)
            if (typeof obj[key] === 'string' && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(obj[key])) {
                const d = new Date(obj[key]);
                if (!isNaN(d.getTime())) {
                    obj[key] = Timestamp.fromDate(d);
                }
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                convertDatesToTimestamps(obj[key]);
            }
        }
    };
    convertDatesToTimestamps(finalData);


    if (editId) {
        const docRef = doc(firestore, 'transactionEntries', editId);
        setDocumentNonBlocking(docRef, finalData, { merge: true });
        toast({
            title: 'Entry Updated',
            description: `Entry ${finalData.docNo} has been updated.`,
        });
    } else {
        const counterRef = doc(firestore, 'counters', submoduleId);

        try {
            const newSequentialNo = await runTransaction(firestore, async (transaction) => {
                const counterDoc = await transaction.get(counterRef);
                const currentCount = counterDoc.exists() ? counterDoc.data().count : 0;
                const nextCount = currentCount + 1;
                transaction.set(counterRef, { count: nextCount }, { merge: true });
                return nextCount;
            });
            
            const newEntry: Partial<TransactionEntry> = {
                ...finalData,
                submodule: submoduleName,
                docNo: `tic/25-26/${newSequentialNo}`,
                docNo_sequential: newSequentialNo,
                createdAt: serverTimestamp(),
            };
            
            addDocumentNonBlocking(entriesCollection, newEntry);
            
            toast({
                title: 'Entry Saved',
                description: `New entry for ${submoduleName} has been saved with Doc No: ${newEntry.docNo}`,
            });

        } catch (error) {
            console.error("Transaction failed: ", error);
            toast({ variant: 'destructive', title: 'Failed to Save', description: 'Could not generate a document number. Please try again.' });
            return; // Stop execution if we can't get a number
        }

    }
    router.push(`/transactions/${submoduleSlug}`);
  };

  const handleHeaderFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ 
        ...prev, 
        customFields: {
            ...prev.customFields,
            [fieldId]: value
        }
    }));
  };

  const handleDetailFieldChange = (rowIndex: number, fieldId: string, value: any) => {
    setFormData(prev => {
      const newLineItems = [...(prev.lineItems || [])];
      if (!newLineItems[rowIndex]) newLineItems[rowIndex] = {};
      newLineItems[rowIndex][fieldId] = value;
      return { ...prev, lineItems: newLineItems };
    });
  };

  const addLineItem = () => {
    setFormData(prev => ({
      ...prev,
      lineItems: [...(prev.lineItems || []), {}]
    }));
  };

  const removeLineItem = (rowIndex: number) => {
    setFormData(prev => ({
      ...prev,
      lineItems: (prev.lineItems || []).filter((_, index) => index !== rowIndex)
    }));
  };


  if (isLoadingEntry || isLoadingFields) {
    return <div>Loading...</div>
  }

  return (
    <div className="mx-auto grid w-full flex-1 auto-rows-max gap-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href={`/transactions/${submoduleSlug}`}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold font-headline tracking-tight sm:grow-0">
          {editId ? `Edit ${submoduleName} Entry` : duplicateId ? `Duplicate ${submoduleName} Entry` : `New ${submoduleName} Entry`}
        </h1>

        <div className="hidden items-center gap-2 md:ml-auto md:flex">
           <Button variant="outline">
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
          <Button variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleSaveEntry}>Save Entry</Button>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid auto-rows-max items-start gap-4 lg:col-span-3">
          
          {/* Header Fields Section */}
          <Card>
            <CardHeader>
              <CardTitle>Principle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {isLoadingFields && <p>Loading form...</p>}
                {headerFields && headerFields.map(field => (
                    <DynamicFormField 
                        key={field.id} 
                        field={field} 
                        value={formData.customFields?.[field.id!] || ''}
                        onChange={handleHeaderFieldChange}
                    />
                ))}
                {!isLoadingFields && headerFields?.length === 0 && (
                    <p className="text-muted-foreground md:col-span-full">No header fields have been defined for this form. <Link href={`/form-setting/${submoduleId}/header`} className="text-primary underline">Design the form now</Link>.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detail Fields Section */}
           <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Indent Detail</CardTitle>
                        <Button size="sm" onClick={addLineItem}>
                            <PlusCircle className="h-4 w-4 mr-2" />
                            Add Row
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {detailFields.map(field => (
                                    <TableHead key={field.id}>{field.name}</TableHead>
                                ))}
                                <TableHead className="w-[50px]">
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {formData.lineItems?.map((item, rowIndex) => (
                                <TableRow key={rowIndex}>
                                    {detailFields.map(field => (
                                        <TableCell key={field.id}>
                                            {/* We render a simple input for all types in the table for simplicity */}
                                            {/* A more robust solution might use a switch or different components */}
                                            <Input
                                                type={field.type === 'number' ? 'number' : 'text'}
                                                value={item[field.id!] || ''}
                                                onChange={(e) => handleDetailFieldChange(rowIndex, field.id!, e.target.value)}
                                                className="w-full"
                                            />
                                        </TableCell>
                                    ))}
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeLineItem(rowIndex)}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {detailFields.length === 0 && (
                         <p className="text-muted-foreground text-center py-4">No detail fields have been defined for this form. <Link href={`/form-setting/${submoduleId}/details`} className="text-primary underline">Design the form now</Link>.</p>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 md:hidden">
        <Button variant="outline" size="sm">
          Discard
        </Button>
        <Button size="sm" onClick={handleSaveEntry}>Save Entry</Button>
      </div>
    </div>
  );
}
