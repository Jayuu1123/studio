'use client';
import React from 'react';
import {
  MoreHorizontal,
  PlusCircle,
  Search,
  RefreshCw,
  Lock,
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
import { unslugify } from '@/lib/utils';
import type { TransactionEntry } from '@/lib/types';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';

const statusConfig: {
  [key: string]: {
    label: string;
    color: 'bg-green-500' | 'bg-red-500' | 'bg-yellow-500' | 'bg-gray-400';
    icon?: React.ReactNode;
  };
} = {
  A: { label: 'Approved', color: 'bg-green-500' },
  D: { label: 'Denied', color: 'bg-red-500' },
  P: { label: 'Pending', color: 'bg-yellow-500' },
  L: { label: 'Locked', color: 'bg-gray-400', icon: <Lock className="h-3 w-3 text-white" /> },
};


export default function TransactionSubmodulePage({
  params,
}: {
  params: { submodule: string };
}) {
  const submoduleName = unslugify(params.submodule);
  const firestore = useFirestore();

  const entriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'transactionEntries'), where('submodule', '==', submoduleName));
  }, [firestore, submoduleName]);

  const { data: transactionEntries, isLoading } = useCollection<TransactionEntry>(entriesQuery);

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
            <Button asChild>
              <Link href={`/transactions/${params.submodule}/new`}>
                <PlusCircle className="h-4 w-4 mr-2" />Add New
              </Link>
            </Button>
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
              {!isLoading && transactionEntries?.map((entry) => (
                <TableRow key={entry.docNo}>
                  <TableCell>
                    <div className='flex justify-center'>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className={`flex items-center justify-center h-6 w-6 rounded-full ${statusConfig[entry.status].color}`}>
                               {statusConfig[entry.status].icon ? statusConfig[entry.status].icon : <span className="text-white font-bold text-xs">{entry.status}</span>}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{statusConfig[entry.status].label}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                  <TableCell>
                      <div className="font-medium">{entry.user}</div>
                      <div className="text-xs text-muted-foreground">{entry.date?.toDate().toLocaleDateString()}</div>
                  </TableCell>
                  <TableCell className="font-medium text-primary hover:underline cursor-pointer">
                    {entry.docNo}
                  </TableCell>
                  <TableCell>{entry.category}</TableCell>
                  <TableCell>{entry.date?.toDate().toLocaleDateString()}</TableCell>
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
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
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
