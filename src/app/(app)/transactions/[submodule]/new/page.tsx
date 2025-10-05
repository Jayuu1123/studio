'use client';
import Link from 'next/link';
import {
  ChevronLeft,
  PlusCircle,
  Upload,
  Printer,
  Copy,
  Trash2,
  Edit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
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
import { unslugify } from '@/lib/utils';
import { DatePicker } from '@/components/ui/date-picker';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp, getDocs, query, where, orderBy, limit, doc, Timestamp, runTransaction } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import type { TransactionEntry, FormField, AppSubmodule } from '@/lib/types';
import React, { useEffect, useState, useMemo, useRef } from 'react';


function DynamicFormField({ field, value, onChange, disabled }: { field: FormField, value: any, onChange: (fieldId: string, value: any) => void, disabled: boolean }) {
    const fieldId = field.name.toLowerCase().replace(/\s/g, '-');
    switch (field.type) {
        case 'text':
            return (
                <div className="grid gap-3">
                    <Label htmlFor={fieldId}>{field.name}</Label>
                    <Input id={fieldId} value={value || ''} onChange={(e) => onChange(field.id!, e.target.value)} disabled={disabled} />
                </div>
            );
        case 'number':
            return (
                <div className="grid gap-3">
                    <Label htmlFor={fieldId}>{field.name}</Label>
                    <Input id={fieldId} type="number" value={value || ''} onChange={(e) => onChange(field.id!, e.target.value)} disabled={disabled} />
                </div>
            );
        case 'date':
             return (
                <div className="grid gap-3">
                    <Label htmlFor={fieldId}>{field.name}</Label>
                    <DatePicker date={value ? new Date(value) : undefined} setDate={(d) => onChange(field.id!, d)} disabled={disabled} />
                </div>
            );
        case 'boolean':
             return (
                <div className="flex items-center gap-2 pt-4">
                    <Checkbox id={fieldId} checked={value || false} onCheckedChange={(c) => onChange(field.id!, c)} disabled={disabled} />
                    <Label htmlFor={fieldId}>{field.name}</Label>
                </div>
            );
        case 'select':
            return (
                <div className="grid gap-3">
                    <Label htmlFor={fieldId}>{field.name}</Label>
                    <Select value={value} onValueChange={(v) => onChange(field.id!, v)} disabled={disabled}>
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
      status: 'DR',
      user: 'Current User', // Should be replaced with actual user
      customFields: {},
      lineItems: [{}], // Start with one empty line item
  });
  
  const [initialFormData, setInitialFormData] = useState<Partial<TransactionEntry> | null>(null);
  const [isEditing, setIsEditing] = useState(!editId);

  // Use a ref to keep the latest formData for the cleanup function
  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

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
  
  const headerFields = useMemo(() => allFormFields?.filter(f => f.section === 'header') || [], [allFormFields]);
  const detailFields = useMemo(() => allFormFields?.filter(f => f.section === 'detail') || [], [allFormFields]);

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
            dataToLoad.status = 'DR'; // Start as a draft/pending
            setIsEditing(true); // Duplicates should be editable
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

        if (!dataToLoad.lineItems || dataToLoad.lineItems.length === 0) {
            dataToLoad.lineItems = [{}];
        }

        setFormData(dataToLoad);
        // Store a deep copy for later comparison
        setInitialFormData(JSON.parse(JSON.stringify(dataToLoad)));
    }
  }, [loadedEntry, duplicateId]);


  // Effect for auto-saving as draft on navigation
  useEffect(() => {
    return () => {
      // This is the cleanup function that runs when the component unmounts
      const hasChanged = JSON.stringify(initialFormData) !== JSON.stringify(formDataRef.current);
      
      if (isEditing && editId && hasChanged && firestore) {
        console.log("Auto-saving entry as draft...");
        const docRef = doc(firestore, 'transactionEntries', editId);
        
        // Create a copy of the data and set status to 'DR' for Draft
        const dataToSave = { ...formDataRef.current, status: 'DR' };
        
        // Convert dates back to Timestamps for Firestore
        const convertDatesToTimestamps = (obj: any) => {
            for (const key in obj) {
                if (obj[key] instanceof Date) {
                    obj[key] = Timestamp.fromDate(obj[key]);
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    convertDatesToTimestamps(obj[key]);
                }
            }
        };
        convertDatesToTimestamps(dataToSave);
        
        setDocumentNonBlocking(docRef, dataToSave, { merge: true });
        toast({
          title: "Draft Saved",
          description: `Your changes to ${dataToSave.docNo} have been automatically saved as a draft.`,
        });
      }
    };
  }, [isEditing, editId, initialFormData, firestore]);


  const handleSaveEntry = async (submissionStatus: 'DR' | 'A') => {
    if (!firestore || !submoduleId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to the database.' });
      return;
    }
    
    // Set a flag to prevent auto-save on manual save
    setInitialFormData(null);

    const finalData = JSON.parse(JSON.stringify(formData));
    finalData.status = submissionStatus;

    const convertDatesToTimestamps = (obj: any) => {
        for (const key in obj) {
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


    if (editId && !duplicateId) {
        const docRef = doc(firestore, 'transactionEntries', editId);
        setDocumentNonBlocking(docRef, finalData, { merge: true });
        toast({
            title: `Entry ${submissionStatus === 'A' ? 'Submitted' : 'Saved'}`,
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
            
            addDocumentNonBlocking(collection(firestore, 'transactionEntries'), newEntry);
            
            toast({
                title: `Entry ${submissionStatus === 'A' ? 'Submitted' : 'Saved'}`,
                description: `New entry saved with Doc No: ${newEntry.docNo}`,
            });

        } catch (error) {
            console.error("Transaction failed: ", error);
            toast({ variant: 'destructive', title: 'Failed to Save', description: 'Could not generate a document number. Please try again.' });
            return;
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
  
  const pageTitle = editId && !duplicateId
    ? `View ${submoduleName} Entry`
    : duplicateId
    ? `Duplicate ${submoduleName} Entry`
    : `New ${submoduleName} Entry`;


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
          {isEditing ? pageTitle.replace('View', 'Edit') : pageTitle}
        </h1>

        <div className="hidden items-center gap-2 md:ml-auto md:flex">
           {editId && !isEditing && (
             <Button onClick={() => setIsEditing(true)}>
               <Edit className="h-4 w-4 mr-2" />
               Edit Entry
             </Button>
           )}
           {isEditing && (
             <>
                <Button variant="outline" onClick={() => handleSaveEntry('DR')}>Save as Draft</Button>
                <Button onClick={() => handleSaveEntry('A')}>Submit for Approval</Button>
             </>
           )}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid auto-rows-max items-start gap-4 lg:col-span-3">
          
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
                        disabled={!isEditing}
                    />
                ))}
                {!isLoadingFields && headerFields?.length === 0 && (
                    <p className="text-muted-foreground md:col-span-full">No header fields have been defined for this form. <Link href={`/form-setting/${submoduleId}/header`} className="text-primary underline">Design the form now</Link>.</p>
                )}
              </div>
            </CardContent>
          </Card>

           <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Indent Detail</CardTitle>
                        {isEditing && (
                           <Button size="sm" onClick={addLineItem}>
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Add Row
                           </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {detailFields.map(field => (
                                    <TableHead key={field.id}>{field.name}</TableHead>
                                ))}
                                {isEditing && (
                                <TableHead className="w-[50px]">
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {formData.lineItems?.map((item, rowIndex) => (
                                <TableRow key={rowIndex}>
                                    {detailFields.map(field => (
                                        <TableCell key={field.id}>
                                            <Input
                                                type={field.type === 'number' ? 'number' : 'text'}
                                                value={item[field.id!] || ''}
                                                onChange={(e) => handleDetailFieldChange(rowIndex, field.id!, e.target.value)}
                                                className="w-full"
                                                disabled={!isEditing}
                                            />
                                        </TableCell>
                                    ))}
                                    {isEditing && (
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeLineItem(rowIndex)}
                                            disabled={!isEditing}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                    )}
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
         {editId && !isEditing && (
             <Button onClick={() => setIsEditing(true)}>
               <Edit className="h-4 w-4 mr-2" />
               Edit Entry
             </Button>
           )}
           {isEditing && (
             <>
                <Button variant="outline" onClick={() => handleSaveEntry('DR')}>Save as Draft</Button>
                <Button onClick={() => handleSaveEntry('A')}>Submit for Approval</Button>
             </>
           )}
      </div>
    </div>
  );
}
