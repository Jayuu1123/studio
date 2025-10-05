'use client';
import Link from 'next/link';
import {
  ChevronLeft,
  PlusCircle,
  MoreVertical,
  Upload,
  Printer,
  Copy,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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
import { collection, serverTimestamp, getDocs, query, where, orderBy, limit, doc, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import type { TransactionEntry, FormField, AppSubmodule } from '@/lib/types';
import React, { useEffect, useState } from 'react';


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
    return collection(firestore, 'appSubmodules', submoduleId, 'formFields');
  }, [firestore, submoduleId]);

  const { data: formFields, isLoading: isLoadingFields } = useCollection<FormField>(formFieldsQuery);
  
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
        if (dataToLoad.date && dataToLoad.date instanceof Timestamp) {
            dataToLoad.date = dataToLoad.date.toDate();
        }
        // Handle custom fields, which might be Timestamps
        if (dataToLoad.customFields) {
            Object.keys(dataToLoad.customFields).forEach(key => {
                const value = dataToLoad.customFields[key];
                if (value instanceof Timestamp) {
                    dataToLoad.customFields[key] = value.toDate();
                }
            });
        }
        setFormData(dataToLoad);
    }
  }, [loadedEntry, duplicateId]);


  const handleSaveEntry = async () => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to the database.' });
      return;
    }
    
    const entriesCollection = collection(firestore, 'transactionEntries');
    const finalData = { ...formData };

    // Convert all date objects in customFields to Firestore Timestamps
    if (finalData.customFields) {
        Object.keys(finalData.customFields).forEach(key => {
            const value = finalData.customFields[key];
            if (value instanceof Date) {
                finalData.customFields[key] = Timestamp.fromDate(value);
            }
        });
    }

    if (editId) {
        const docRef = doc(firestore, 'transactionEntries', editId);
        setDocumentNonBlocking(docRef, finalData, { merge: true });
        toast({
            title: 'Entry Updated',
            description: `Entry ${finalData.docNo} has been updated.`,
        });
    } else {
        const q = query(
          entriesCollection,
          where('submodule', '==', submoduleName),
          orderBy('docNo_sequential', 'desc'),
          limit(1)
        );

        const querySnapshot = await getDocs(q);
        let nextDocNo = 1;
        if (!querySnapshot.empty) {
          const latestEntry = querySnapshot.docs[0].data() as TransactionEntry;
          nextDocNo = (latestEntry.docNo_sequential || 0) + 1;
        }

        const newEntry: Partial<TransactionEntry> = {
            ...finalData,
            submodule: submoduleName,
            docNo: `tic/25-26/${nextDocNo}`,
            docNo_sequential: nextDocNo,
            createdAt: serverTimestamp(),
        };
        
        addDocumentNonBlocking(entriesCollection, newEntry);
        
        toast({
            title: 'Entry Saved',
            description: `New entry for ${submoduleName} has been saved with Doc No: ${newEntry.docNo}`,
        });
    }
    router.push(`/transactions/${submoduleSlug}`);
  };

  const handleCustomFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ 
        ...prev, 
        customFields: {
            ...prev.customFields,
            [fieldId]: value
        }
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
        <div className="grid auto-rows-max items-start gap-4 lg:col-span-2">
          
          {/* Dynamic Form Section */}
          <Card>
            <CardHeader>
              <CardTitle>{submoduleName} Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {isLoadingFields && <p>Loading form...</p>}
                {formFields && formFields.map(field => (
                    <DynamicFormField 
                        key={field.id} 
                        field={field} 
                        value={formData.customFields?.[field.id!] || ''}
                        onChange={handleCustomFieldChange}
                    />
                ))}
                {!isLoadingFields && formFields?.length === 0 && (
                    <p className="text-muted-foreground md:col-span-2">No fields have been defined for this form. <Link href={`/form-setting/${submoduleId}/design`} className="text-primary underline">Design the form now</Link>.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Sidebar Section */}
        <div className="grid auto-rows-max items-start gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="grid gap-3">
                    <Label>Doc No</Label>
                    <p className="text-sm font-medium text-muted-foreground">{formData.docNo || 'Will be generated on save'}</p>
                </div>
                <div className="grid gap-3">
                    <Label htmlFor="status">Status</Label>                    
                    <Select value={formData.status} onValueChange={(v) => setFormData(p => ({...p, status: v as any}))} disabled={!editId}>
                        <SelectTrigger id="status" aria-label="Select status">
                        <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="P">Pending</SelectItem>
                        <SelectItem value="A">Approved</SelectItem>
                        <SelectItem value="D">Denied</SelectItem>
                        <SelectItem value="L">Locked</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              </div>
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
