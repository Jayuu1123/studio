
'use client';
import { useState } from "react";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, doc } from 'firebase/firestore';
import type { License } from "@/lib/types";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { AddLicenseDialog } from "@/components/settings/add-license-dialog";

export default function LicensingPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isAddLicenseOpen, setIsAddLicenseOpen] = useState(false);

    const licensesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'licenses');
    }, [firestore]);

    const { data: licenses, isLoading } = useCollection<License>(licensesQuery);
    
    const handleSetLicenseStatus = (licenseId: string, status: 'active' | 'inactive') => {
        if (!firestore) return;
        const licenseDocRef = doc(firestore, 'licenses', licenseId);
        const updateData: { status: 'active' | 'inactive', activationDate?: any } = { status };
        
        if (status === 'active') {
            updateData.activationDate = new Date();
        }

        updateDocumentNonBlocking(licenseDocRef, updateData);
        toast({ title: "License Updated", description: `The license has been set to ${status}.` });
    }

    const getStatusVariant = (status: License['status']) => {
        switch (status) {
            case 'active': return 'default';
            case 'inactive': return 'secondary';
            case 'expired': return 'destructive';
            default: return 'outline';
        }
    }

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        return new Date(timestamp.seconds * 1000).toLocaleDateString();
    }

    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">License Management</h1>
                    <p className="text-muted-foreground">
                        Generate, assign, and manage user licenses for the ERP.
                    </p>
                </div>
                <Button onClick={() => setIsAddLicenseOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add License
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Licenses</CardTitle>
                    <CardDescription>A list of all licenses in the system.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>License Key</TableHead>
                                <TableHead>Assigned To</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead>Expires At</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading && <TableRow><TableCell colSpan={6} className="text-center">Loading licenses...</TableCell></TableRow>}
                            {!isLoading && licenses?.map((license) => (
                                <TableRow key={license.id}>
                                    <TableCell className="font-mono text-xs">{license.licenseKey}</TableCell>
                                    <TableCell>{license.userEmail || 'Unassigned'}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(license.status)} className="capitalize">{license.status}</Badge>
                                    </TableCell>
                                    <TableCell>{formatDate(license.createdAt)}</TableCell>
                                    <TableCell>{formatDate(license.expiryDate)}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleSetLicenseStatus(license.id, 'active')} disabled={license.status === 'active'}>
                                                    Activate
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleSetLicenseStatus(license.id, 'inactive')} disabled={license.status === 'inactive'}>
                                                    Deactivate
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!isLoading && !licenses?.length && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center">No licenses found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <AddLicenseDialog isOpen={isAddLicenseOpen} setIsOpen={setIsAddLicenseOpen} />
        </>
    );
}

    