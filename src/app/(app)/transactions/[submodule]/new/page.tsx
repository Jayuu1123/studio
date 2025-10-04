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
import { Textarea } from '@/components/ui/textarea';
import { unslugify } from '@/lib/utils';
import { DatePicker } from '@/components/ui/date-picker';
import { useFirestore } from '@/firebase';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { TransactionEntry } from '@/lib/types';
import React from 'react';


export default function NewTransactionEntryPage({
  params,
}: {
  params: { submodule: string };
}) {
  const { submodule } = params;
  const submoduleName = unslugify(submodule);
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();


  const handleSaveEntry = () => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to the database.' });
      return;
    }

    const newEntry: Omit<TransactionEntry, 'id'> = {
        submodule: submoduleName,
        status: 'P',
        user: 'Current User', // Placeholder
        docNo: `DOC-${Date.now()}`, // Placeholder
        category: 'Requisition', // Placeholder
        date: serverTimestamp(),
        department: 'Store', // Placeholder
        productionItem: 'N/A' // Placeholder
    };

    const entriesCollection = collection(firestore, 'transactionEntries');
    addDocumentNonBlocking(entriesCollection, newEntry);
    
    toast({
        title: 'Entry Saved',
        description: `New entry for ${submoduleName} has been saved.`,
    });

    router.push(`/transactions/${submodule}`);
  };

  return (
    <div className="mx-auto grid w-full flex-1 auto-rows-max gap-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href={`/transactions/${submodule}`}>
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold font-headline tracking-tight sm:grow-0">
          New {submoduleName} Entry
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
          {/* Principle Section */}
          <Card>
            <CardHeader>
              <CardTitle>Principle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="grid gap-3">
                  <Label htmlFor="category">Category</Label>
                  <Select>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="requisition">Requisition</SelectItem>
                      <SelectItem value="order">Order</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3">
                    <Label htmlFor="doc-date">Doc Date</Label>
                    <DatePicker />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="department">Department</Label>
                   <Select>
                    <SelectTrigger id="department">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paint">Paint</SelectItem>
                      <SelectItem value="store">Store</SelectItem>
                       <SelectItem value="mechanical">Mechanical</SelectItem>
                       <SelectItem value="valve">Valve</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="production-item">Production Item</Label>
                  <Select>
                    <SelectTrigger id="production-item">
                      <SelectValue placeholder="Select item" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="item-1">Item 1</SelectItem>
                      <SelectItem value="item-2">Item 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                 <div className="grid gap-3">
                  <Label htmlFor="requisition-by">Requisition By</Label>
                  <Input id="requisition-by" defaultValue="RATAN" />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="job-no">Job No</Label>
                  <Input id="job-no" defaultValue="NA" />
                </div>
                <div className="grid gap-3 md:col-span-2">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input id="project-name" defaultValue="NA" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Item Details Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Item Details</CardTitle>
              <div className="flex items-center gap-2">
                 <Button size="sm" variant="outline">
                    <MoreVertical className="h-3.5 w-3.5" />
                 </Button>
                 <Button size="sm" variant="outline">
                    <PlusCircle className="h-3.5 w-3.5" />
                 </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Sr No</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>UOM</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Required Date</TableHead>
                    <TableHead>Required Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell><MoreVertical className="h-4 w-4 text-muted-foreground" /></TableCell>
                    <TableCell>1</TableCell>
                    <TableCell className="font-medium">INDICATION PLATE</TableCell>
                    <TableCell>NOS</TableCell>
                    <TableCell>
                        <Input defaultValue="" className="w-24" />
                    </TableCell>
                    <TableCell>
                      <DatePicker />
                    </TableCell>
                    <TableCell>
                      <Input type="number" defaultValue="300" className="w-24" />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
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
                    <Label>URN</Label>
                    <p className="text-sm font-medium text-muted-foreground">SRQ02001005000309</p>
                </div>
                <div className="grid gap-3">
                    <Label>Doc No</Label>
                    <p className="text-sm font-medium text-muted-foreground">TIC/25-26/730</p>
                </div>
                <div className="grid gap-3">
                    <Label htmlFor="status">Status</Label>
                    <Select defaultValue="approved">
                        <SelectTrigger id="status" aria-label="Select status">
                        <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="denied">Denied</SelectItem>
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
