
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
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import type { License } from "@/lib/types";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { LicensingDialog } from "@/components/settings/licensing-dialog";

export default function LicensingPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [isActivateLicenseOpen, setIsActivateLicenseOpen] = useState(false);

    const licensesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'licenses');
    }, [firestore]);

    const { data: licenses, isLoading } = useCollection<License>(licensesQuery);
    
    const isAdmin = user?.email === 'sa@admin.com';

    const handleSetLicenseStatus = (licenseId: string, status: 'active' | 'inactive') => {
        if (!firestore || !isAdmin) return;
        const licenseDocRef = doc(firestore, 'licenses', licenseId);
        const updateData: { status: 'active' | 'inactive', activationDate?: any } = { status };
        
        if (status === 'active' && !licenses?.find(l => l.id === licenseId)?.activationDate) {
            updateData.activationDate = serverTimestamp();
        }

        updateDocumentNonBlocking(licenseDocRef, updateData);
        toast({ title: "License Updated", description: `The license has been set to ${status}.` });
    }

    const getStatusVariant = (license: License) => {
        const now = new Date();
        const expiryDate = license.expiryDate ? new Date(license.expiryDate.seconds * 1000) : null;
        
        if (expiryDate && expiryDate < now) {
            return 'destructive';
        }

        switch (license.status) {
            case 'active': return 'default';
            case 'inactive': return 'secondary';
            case 'expired': return 'destructive';
            default: return 'outline';
        }
    }
    
    const getStatusText = (license: License) => {
        const now = new Date();
        const expiryDate = license.expiryDate ? new Date(license.expiryDate.seconds * 1000) : null;
        
        if (expiryDate && expiryDate < now) {
            return 'Expired';
        }
        return license.status;
    }

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        // Handle both server timestamps and date objects from the form
        const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
        return date.toLocaleDateString();
    }

    if (!isAdmin) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Access Denied</CardTitle>
                    <CardDescription>You do not have permission to view this page.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Only administrators can manage licenses.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">License Management</h1>
                    <p className="text-muted-foreground">
                        Activate, assign, and manage user licenses for the ERP.
                    </p>
                </div>
                <Button onClick={() => setIsActivateLicenseOpen(true)} disabled={!isAdmin}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Activate License
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
                                        <Badge variant={getStatusVariant(license)} className="capitalize">{getStatusText(license)}</Badge>
                                    </TableCell>
                                    <TableCell>{formatDate(license.createdAt)}</TableCell>
                                    <TableCell>{formatDate(license.expiryDate)}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost" disabled={!isAdmin}>
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
            <LicensingDialog isOpen={isActivateLicenseOpen} setIsOpen={setIsActivateLicenseOpen} />
        </>
    );
}
