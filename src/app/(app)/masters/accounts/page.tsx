'use client';
import { useMemo } from 'react';
import {
  File,
  MoreHorizontal,
  PlusCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { ChartOfAccounts } from '@/lib/types';


export default function AccountsPage() {
    const firestore = useFirestore();
    const { user } = useUser();

    const accountsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'chartOfAccounts'));
    }, [firestore, user]);

    const { data: accounts, isLoading } = useCollection<ChartOfAccounts>(accountsQuery);

  return (
    <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Chart of Accounts</CardTitle>
                    <CardDescription>
                    Manage your company's financial accounts.
                    </CardDescription>
                </div>
                 <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="h-8 gap-1">
                        <File className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Export
                        </span>
                    </Button>
                    <Button size="sm" className="h-8 gap-1">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Add Account
                        </span>
                    </Button>
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Code</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Account Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center">Loading accounts...</TableCell>
                    </TableRow>
                )}
                {!isLoading && accounts?.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">
                      {account.accountCode}
                    </TableCell>
                    <TableCell>{account.accountName}</TableCell>
                    <TableCell>{account.accountType}</TableCell>
                    <TableCell>{account.description}</TableCell>
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
                          <DropdownMenuItem>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                 {!isLoading && (!accounts || accounts.length === 0) && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center">No accounts found.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Showing <strong>1-{accounts?.length || 0}</strong> of <strong>{accounts?.length || 0}</strong> accounts
            </div>
          </CardFooter>
        </Card>
    </div>
  );
}
