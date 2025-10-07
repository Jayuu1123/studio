'use client';
import React, { useMemo } from 'react';
import {
  MoreHorizontal,
  PlusCircle,
  Search,
  RefreshCw,
  Lock,
  Edit,
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { unslugify, slugify } from '@/lib/utils';
import type { TransactionEntry, PermissionSet, AppSubmodule, Role, User } from '@/lib/types';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, query, where, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';


const statusConfig: {
  [key: string]: {
    label: string;
    color: 'bg-green-500' | 'bg-red-500' | 'bg-purple-500' | 'bg-gray-400';
    icon?: React.ReactNode;
    symbol?: string;
  };
} = {
  A: { label: 'Approved', color: 'bg-green-500', symbol: 'A' },
  D: { label: 'Denied', color: 'bg-red-500', symbol: 'D' },
  DR: { label: 'Draft', color: 'bg-purple-500', symbol: 'DR' },
  L: { label: 'Locked', color: 'bg-gray-400', icon: <Lock className="h-3 w-3 text-white" /> },
  P: { label: 'Pending', color: 'bg-purple-500', symbol: 'P' }, // Kept for backward compatibility
};


export default function TransactionSubmodulePage({ submodules = [] }: { submodules: AppSubmodule[] }) {
  const params = useParams();
  const submoduleSlug = params.submodule as string;
  const submoduleName = unslugify(submoduleSlug);
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();

  const userDocRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userData } = useDoc<User>(userDocRef);
  const userRoles = userData?.roles || [];

  const rolesQuery = useMemoFirebase(() => {
    if (!firestore || !user || userRoles.length === 0) return null;
    return query(collection(firestore, 'roles'), where('__name__', 'in', userRoles.map(role => slugify(role)) ));
  }, [firestore, user, userRoles]);

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

  const entriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'transactionEntries'), where('submodule', '==', submoduleName));
  }, [firestore, submoduleName]);

  const { data: transactionEntries, isLoading } = useCollection<TransactionEntry>(entriesQuery);

  const currentSubmodule = useMemo(() => submodules.find(s => s.name === submoduleName), [submodules, submoduleName]);


  const canDelete = useMemo(() => {
      if (!permissions || !currentSubmodule) return false;
      if (permissions.all) return true;
      const mainModuleSlug = slugify(currentSubmodule.mainModule);
      const subSlug = slugify(currentSubmodule.name);
      // @ts-ignore
      return permissions[mainModuleSlug]?.[subSlug]?.delete;
  }, [permissions, currentSubmodule]);
  
  const canWrite = useMemo(() => {
      if (!permissions || !currentSubmodule) return false;
      if (permissions.all) return true;
      const mainModuleSlug = slugify(currentSubmodule.mainModule);
      const subSlug = slugify(currentSubmodule.name);
      // @ts-ignore
      return permissions[mainModuleSlug]?.[subSlug]?.write;
  }, [permissions, currentSubmodule]);


  const handleDeleteEntry = (entryId: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'transactionEntries', entryId);
    deleteDocumentNonBlocking(docRef);
    toast({
      title: 'Entry Deleted',
      description: 'The transaction entry has been successfully deleted.',
    });
  };

  const handleDuplicateEntry = (entry: TransactionEntry) => {
    router.push(`/transactions/${submoduleSlug}/new?duplicateId=${entry.id}`);
  };

  const handleEditEntry = (entry: TransactionEntry) => {
    router.push(`/transactions/${submoduleSlug}/new?editId=${entry.id}`);
  };


  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline tracking-tight">
            {submoduleName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage and view all entries for {submoduleName}.
          </p>
        </div>
        <div className='flex items-center gap-2'>
            <Button variant="outline"><RefreshCw className="h-4 w-4" /></Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline"><MoreHorizontal className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem>Option 1</DropdownMenuItem>
                    <DropdownMenuItem>Option 2</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            {canWrite && (
              <Button asChild>
                <Link href={`/transactions/${submoduleSlug}/new`}>
                  <PlusCircle className="h-4 w-4 mr-2" />Add New
                </Link>
              </Button>
            )}
        </div>
      </div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Search entries..." className="w-full bg-background pl-8" />
            </div>
            <div>
                <Badge variant="secondary">No Tag</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[80px]'>Status</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Doc No</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Doc Date</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Production Item</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                  <TableRow>
                      <TableCell colSpan={8} className="text-center">Loading entries...</TableCell>
                  </TableRow>
              )}
              {!isLoading && transactionEntries?.map((entry) => {
                const config = statusConfig[entry.status] ?? statusConfig.P; // Fallback to pending
                return (
                <TableRow key={entry.id}>
                  <TableCell>
                    <div className='flex justify-center'>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className={`flex items-center justify-center h-6 w-6 rounded-full ${config.color}`}>
                               {config.icon ? config.icon : <span className="text-white font-bold text-xs">{config.symbol}</span>}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{config.label}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                  <TableCell>
                      <div className="font-medium">{entry.user}</div>
                      {entry.date && <div className="text-xs text-muted-foreground">{new Date(entry.date?.seconds * 1000).toLocaleDateString()}</div>}
                  </TableCell>
                  <TableCell className="font-medium text-primary hover:underline cursor-pointer" onClick={() => handleEditEntry(entry)}>
                    {entry.docNo}
                  </TableCell>
                  <TableCell>{entry.category}</TableCell>
                   <TableCell>{entry.date && new Date(entry.date?.seconds * 1000).toLocaleDateString()}</TableCell>
                  <TableCell>{entry.department}</TableCell>
                  <TableCell>{entry.productionItem}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditEntry(entry)}>
                          <Edit className='mr-2 h-4 w-4' />
                          View / Edit
                        </DropdownMenuItem>
                        {canWrite && <DropdownMenuItem onClick={() => handleDuplicateEntry(entry)}>Duplicate</DropdownMenuItem>}
                        {canDelete && 
                          <DropdownMenuItem
                            className="text-red-500"
                            onClick={() => entry.id && handleDeleteEntry(entry.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        }
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                )
              })}
               {!isLoading && (!transactionEntries || transactionEntries.length === 0) && (
                     <TableRow>
                        <TableCell colSpan={8} className="text-center">No entries found for {submoduleName}.</TableCell>
                    </TableRow>
                )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
