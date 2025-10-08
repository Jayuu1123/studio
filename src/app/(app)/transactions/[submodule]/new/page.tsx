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
import { unslugify, slugify } from '@/lib/utils';
import { DatePicker } from '@/components/ui/date-picker';
import { useFirestore, useDoc, useMemoFirebase, useUser, useCollection } from '@/firebase';
import { addDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp, getDocs, query, where, orderBy, limit, doc, Timestamp, runTransaction } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import type { TransactionEntry, FormField, AppSubmodule, PermissionSet, Role, User } from '@/lib/types';
import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { LineItemFormDialog } from '@/components/transactions/line-item-form-dialog';


function DynamicFormField({ field, value, onChange, disabled }: { field: FormField, value: any, onChange: (fieldKey: string, value: any) => void, disabled: boolean }) {
    const fieldId = field.key.toLowerCase().replace(/\s/g, '-');
    switch (field.type) {
        case 'text':
            return (
                <div className="grid gap-3">
                    <Label htmlFor={fieldId}>{field.label}</Label>
                    <Input id={fieldId} value={value || ''} onChange={(e) => onChange(field.key, e.target.value)} disabled={disabled} placeholder={field.placeholder}/>
                </div>
            );
        case 'number':
            return (
                <div className="grid gap-3">
                    <Label htmlFor={fieldId}>{field.label}</Label>
                    <Input id={fieldId} type="number" value={value || ''} onChange={(e) => onChange(field.key, e.target.valueAsNumber)} disabled={disabled} placeholder={field.placeholder} />
                </div>
            );
        case 'date':
             return (
                <div className="grid gap-3">
                    <Label htmlFor={fieldId}>{field.label}</Label>
                    <DatePicker date={value ? new Date(value) : undefined} setDate={(d) => onChange(field.key, d)} disabled={disabled} />
                </div>
            );
        case 'boolean':
             return (
                <div className="flex items-center gap-2 pt-4">
                    <Checkbox id={fieldId} checked={value || false} onCheckedChange={(c) => onChange(field.key, c)} disabled={disabled} />
                    <Label htmlFor={fieldId}>{field.label}</Label>
                </div>
            );
        case 'select':
            return (
                <div className="grid gap-3">
                    <Label htmlFor={fieldId}>{field.label}</Label>
                    <Select value={value} onValueChange={(v) => onChange(field.key, v)} disabled={disabled}>
                        <SelectTrigger id={fieldId}>
                            <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
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
  const { user } = useUser();
  
  const [formData, setFormData] = useState<Partial<TransactionEntry>>({
      status: 'DR',
      user: user?.displayName || user?.email || 'Current User',
      customFields: {},
      lineItems: [],
  });
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ index: number; data: any } | null>(null);

  const [entryId, setEntryId] = useState<string | null>(searchParams.get('editId') || searchParams.get('duplicateId'));
  
  const [initialFormData, setInitialFormData] = useState<Partial<TransactionEntry> | null>(null);
  
  const formDataRef = useRef(formData);
  const manualSaveRef = useRef(false);

  const [allFormFields, setAllFormFields] = useState<FormField[]>([]);
  const [isLoadingFields, setIsLoadingFields] = useState(true);

  const submodulesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'appSubmodules'), orderBy('position'));
  }, [firestore]);

  const { data: submodules, isLoading: isLoadingSubmodules } = useCollection<AppSubmodule>(submodulesQuery);
  const submodule = useMemo(() => submodules?.find(s => s.name === submoduleName), [submodules, submoduleName]);
  const submoduleId = submodule?.id;

  const userDocRef = useMemoFirebase(() => {
      if (!firestore || !user) return null;
      return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData } = useDoc<User>(userDocRef);
  
   const rolesQuery = useMemoFirebase(() => {
    if (!firestore || !user || !userData?.roles || userData.roles.length === 0) return null;
    return query(collection(firestore, 'roles'), where('__name__', 'in', userData.roles.map(role => slugify(role)) ));
  }, [firestore, user, userData?.roles]);

  const { data: roleDocs } = useCollection<Role>(rolesQuery);
  
  const permissions = useMemo<PermissionSet | null>(() => {
    if (!user) return null;
    if (user.email === 'sa@admin.com') return { all: true };
    if (!roleDocs) return null;

    const mergedPermissions: PermissionSet = {};
    roleDocs.forEach(role => {
      if (role.permissions) {
        Object.assign(mergedPermissions, role.permissions);
      }
    });
    return mergedPermissions;
  }, [user, roleDocs]);

  const canWrite = useMemo(() => {
      if (!permissions || !submodule) return false;
      if (user?.email === 'sa@admin.com') return true;
      if (permissions.all) return true;
      const mainModuleSlug = slugify(submodule.mainModule);
      const subSlug = slugify(submodule.name);
      // @ts-ignore
      return permissions[mainModuleSlug]?.[subSlug]?.write;
  }, [permissions, submodule, user]);

  const [isEditing, setIsEditing] = useState(false);
  
   useEffect(() => {
    if (canWrite) {
      setIsEditing(true);
    }
  }, [canWrite]);


  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);
  
  useEffect(() => {
    const fetchFields = async () => {
        if (!firestore || !submoduleId) {
            setIsLoadingFields(false);
            return;
        }

        setIsLoadingFields(true);
        try {
            const fieldsQuery = query(collection(firestore, 'appSubmodules', submoduleId, 'formFields'), orderBy('position'));
            const querySnapshot = await getDocs(fieldsQuery);
            const fields = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FormField));
            setAllFormFields(fields);
        } catch (error) {
            console.error("Failed to fetch form fields:", error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not load form fields.'
            });
        } finally {
            setIsLoadingFields(false);
        }
    };

    if (submoduleId) {
        fetchFields();
    }
  }, [firestore, submoduleId, toast]);

  const headerFields = useMemo(() => allFormFields?.filter(f => f.section === 'header') || [], [allFormFields]);
  const detailFields = useMemo(() => allFormFields?.filter(f => f.section === 'detail') || [], [allFormFields]);

  const docToLoadRef = useMemoFirebase(() => {
    if (!firestore || !entryId) return null;
    return doc(firestore, 'transactionEntries', entryId);
  }, [firestore, entryId]);

  const { data: loadedEntry, isLoading: isLoadingEntry } = useDoc<TransactionEntry>(docToLoadRef);
  
  const recursiveConvertToDate = (obj: any): any => {
    if (!obj) return obj;
    if (Array.isArray(obj)) {
        return obj.map(item => recursiveConvertToDate(item));
    }
    if (typeof obj === 'object') {
        if (obj instanceof Timestamp) {
            return obj.toDate();
        }
        if(Object.prototype.toString.call(obj) === '[object Object]') {
            const newObj: { [key: string]: any } = {};
            for (const key in obj) {
                newObj[key] = recursiveConvertToDate(obj[key]);
            }
            return newObj;
        }
    }
    return obj;
  };
  
  useEffect(() => {
    if (loadedEntry) {
        let dataToLoad = { ...loadedEntry };
        
        dataToLoad = recursiveConvertToDate(dataToLoad);

        if (searchParams.get('duplicateId')) {
            delete dataToLoad.id;
            delete dataToLoad.docNo;
            delete dataToLoad.docNo_sequential;
            dataToLoad.status = 'DR';
            setEntryId(null);
            setIsEditing(true);
        }
        
        if (!dataToLoad.lineItems) {
            dataToLoad.lineItems = [];
        }


        setFormData(dataToLoad);
        setInitialFormData(JSON.parse(JSON.stringify(dataToLoad)));
    }
}, [loadedEntry, searchParams]);


  const recursiveConvertToTimestamp = (obj: any): any => {
    if (!obj) return obj;
    if (Array.isArray(obj)) {
        return obj.map(item => recursiveConvertToTimestamp(item));
    }
    if (typeof obj === 'object' && !(obj instanceof Timestamp)) {
        const newObj: { [key: string]: any } = {};
        for (const key in obj) {
            const value = obj[key];
            if (value instanceof Date) {
                newObj[key] = Timestamp.fromDate(value);
            } else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)) {
                newObj[key] = Timestamp.fromDate(new Date(value));
            } else if (typeof value === 'object') {
                newObj[key] = recursiveConvertToTimestamp(value);
            }
             else {
                newObj[key] = value;
            }
        }
        return newObj;
    }
    return obj;
  };
  
 const saveCurrentStateAsDraft = useCallback(async (currentData: Partial<TransactionEntry>) => {
    if (!firestore || !submoduleId) return null;

    const dataToSave = recursiveConvertToTimestamp(JSON.parse(JSON.stringify(currentData)));
    dataToSave.status = 'DR';
    dataToSave.submodule = submoduleName;

    if (dataToSave.id) {
        const docRef = doc(firestore, 'transactionEntries', dataToSave.id);
        await setDocumentNonBlocking(docRef, dataToSave, { merge: true });
        return dataToSave.id;
    } else {
        dataToSave.createdAt = serverTimestamp();
        const newDocRef = await addDocumentNonBlocking(collection(firestore, 'transactionEntries'), dataToSave);
        return newDocRef?.id || null;
    }
}, [firestore, submoduleId, submoduleName]);


  useEffect(() => {
    const autosave = () => {
        if (manualSaveRef.current) return;
        
        const hasChanged = JSON.stringify(initialFormData) !== JSON.stringify(formDataRef.current);
        
        if (isEditing && hasChanged && formDataRef.current.status !== 'A') {
          saveCurrentStateAsDraft(formDataRef.current);
          toast({
            title: "Draft Saved",
            description: "Your changes have been automatically saved as a draft.",
          });
        }
    };

    const intervalId = setInterval(autosave, 30000); // Autosave every 30 seconds
    
    return () => {
      clearInterval(intervalId);
      autosave(); // Save once on unmount
    };
  }, [isEditing, initialFormData, saveCurrentStateAsDraft, toast]);


  const handleSaveEntry = async (submissionStatus: 'DR' | 'A') => {
    if (!firestore || !submoduleId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to the database.' });
      return;
    }
    
    manualSaveRef.current = true;

    const finalData = recursiveConvertToTimestamp(JSON.parse(JSON.stringify(formData)));
    finalData.status = submissionStatus;
    finalData.submodule = submoduleName;
    
    const isNewEntry = !finalData.id;

    if (isNewEntry && submissionStatus === 'A') {
         const counterRef = doc(firestore, 'counters', submoduleId);
        try {
            const newSequentialNo = await runTransaction(firestore, async (transaction) => {
                const counterDoc = await transaction.get(counterRef);
                const currentCount = counterDoc.exists() ? counterDoc.data().count : 0;
                const nextCount = currentCount + 1;
                transaction.set(counterRef, { count: nextCount }, { merge: true });
                return nextCount;
            });
            finalData.docNo = `tic/25-26/${newSequentialNo}`;
            finalData.docNo_sequential = newSequentialNo;
        } catch (error) {
            console.error("Transaction failed: ", error);
            toast({ variant: 'destructive', title: 'Failed to Save', description: 'Could not generate a document number. Please try again.' });
            manualSaveRef.current = false;
            return;
        }
    }

    if (finalData.id) {
        const docRef = doc(firestore, 'transactionEntries', finalData.id);
        await setDocumentNonBlocking(docRef, finalData, { merge: true });
    } else {
        finalData.createdAt = serverTimestamp();
        await addDocumentNonBlocking(collection(firestore, 'transactionEntries'), finalData);
    }
    
    toast({
        title: `Entry ${submissionStatus === 'A' ? 'Submitted' : 'Saved'}`,
        description: `Entry ${finalData.docNo || 'Draft'} has been saved.`,
    });
    
    router.push(`/transactions/${submoduleSlug}`);
  };

  const handleHeaderFieldChange = (fieldKey: string, value: any) => {
    setFormData(prev => ({ 
        ...prev, 
        customFields: {
            ...prev.customFields,
            [fieldKey]: value
        }
    }));
  };

  const handleSaveLineItem = (itemData: any) => {
    setFormData(prev => {
      const newLineItems = [...(prev.lineItems || [])];
      if (editingItem !== null) {
        // Update existing item
        newLineItems[editingItem.index] = itemData;
      } else {
        // Add new item
        newLineItems.push(itemData);
      }
      return { ...prev, lineItems: newLineItems };
    });
    setEditingItem(null);
    setIsDialogOpen(false);
  };

  const handleEditItem = (index: number) => {
    setEditingItem({ index, data: formData.lineItems?.[index] || {} });
    setIsDialogOpen(true);
  };
  
  const handleAddNewItem = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const removeLineItem = (rowIndex: number) => {
    setFormData(prev => ({
      ...prev,
      lineItems: (prev.lineItems || []).filter((_, index) => index !== rowIndex)
    }));
  };


  if (isLoadingEntry || isLoadingFields || isLoadingSubmodules || !submodule) {
    return <div>Loading form...</div>
  }
  
  const pageTitle = searchParams.get('editId')
    ? `View ${submoduleName} Entry`
    : searchParams.get('duplicateId')
    ? `Duplicate ${submoduleName} Entry`
    : `New ${submoduleName} Entry`;

  const effectiveIsEditing = isEditing && canWrite;

  return (
    <>
      <LineItemFormDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        onSave={handleSaveLineItem}
        fields={detailFields}
        initialData={editingItem?.data}
        isEditing={effectiveIsEditing}
      />
      <div className="mx-auto grid w-full flex-1 auto-rows-max gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-7 w-7" asChild>
            <Link href={`/transactions/${submoduleSlug}`}>
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
          <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold font-headline tracking-tight sm:grow-0">
            {effectiveIsEditing ? pageTitle.replace('View', 'Edit') : pageTitle}
          </h1>

          <div className="hidden items-center gap-2 md:ml-auto md:flex">
            {searchParams.get('editId') && !effectiveIsEditing && canWrite && (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Entry
              </Button>
            )}
            {effectiveIsEditing && (
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
                  {headerFields && headerFields.map(field => (
                      <DynamicFormField 
                          key={field.id} 
                          field={field} 
                          value={formData.customFields?.[field.key] ?? ''}
                          onChange={handleHeaderFieldChange}
                          disabled={!effectiveIsEditing}
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
                          <CardTitle>Item Details</CardTitle>
                          {effectiveIsEditing && (
                            <Button size="sm" onClick={handleAddNewItem}>
                                  <PlusCircle className="h-4 w-4 mr-2" />
                                  Add Item
                            </Button>
                          )}
                      </div>
                  </CardHeader>
                  <CardContent>
                      <Table>
                          <TableHeader>
                              <TableRow>
                                  {detailFields.map(field => (
                                      <TableHead key={field.id}>{field.label}</TableHead>
                                  ))}
                                  {effectiveIsEditing && (
                                  <TableHead className="w-[100px] text-right">
                                      Actions
                                  </TableHead>
                                  )}
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              {formData.lineItems?.map((item, rowIndex) => (
                                  <TableRow key={rowIndex}>
                                      {detailFields.map(field => (
                                          <TableCell key={field.id}>
                                              {item[field.key] || 'N/A'}
                                          </TableCell>
                                      ))}
                                      {effectiveIsEditing && (
                                      <TableCell className="text-right">
                                          <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => handleEditItem(rowIndex)}
                                              disabled={!effectiveIsEditing}
                                          >
                                              <Edit className="h-4 w-4 text-blue-500" />
                                          </Button>
                                          <Button
                                              variant="ghost"
                                              size="icon"
                                              onClick={() => removeLineItem(rowIndex)}
                                              disabled={!effectiveIsEditing}
                                          >
                                              <Trash2 className="h-4 w-4 text-red-500" />
                                          </Button>
                                      </TableCell>
                                      )}
                                  </TableRow>
                              ))}
                              {!formData.lineItems?.length && (
                                <TableRow>
                                  <TableCell colSpan={detailFields.length + 1} className="text-center">
                                    No items added yet.
                                  </TableCell>
                                </TableRow>
                              )}
                          </TableBody>
                      </Table>
                      {detailFields.length === 0 && !isLoadingFields &&(
                          <p className="text-muted-foreground text-center py-4">No detail fields have been defined for this form. <Link href={`/form-setting/${submoduleId}/details`} className="text-primary underline">Design the form now</Link>.</p>
                      )}
                      {isLoadingFields && <p className="text-muted-foreground text-center py-4">Loading fields...</p>}
                  </CardContent>
              </Card>
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 md:hidden">
          {searchParams.get('editId') && !effectiveIsEditing && canWrite && (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Entry
              </Button>
            )}
            {effectiveIsEditing && (
              <>
                  <Button variant="outline" onClick={() => handleSaveEntry('DR')}>Save as Draft</Button>
                  <Button onClick={() => handleSaveEntry('A')}>Submit for Approval</Button>
              </>
            )}
        </div>
      </div>
    </>
  );
}
