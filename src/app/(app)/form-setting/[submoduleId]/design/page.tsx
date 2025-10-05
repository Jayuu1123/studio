'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, FileText, Settings, ShieldCheck, FileUp } from "lucide-react";
import { useState } from "react";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { AppSubmodule } from "@/lib/types";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FormSettingSidebar } from "@/components/settings/form-setting-sidebar";

function SwitchControl({ label, id }: { label: string, id: string }) {
    return (
        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
            <Label htmlFor={id} className="text-sm font-medium">
                {label}
            </Label>
            <Switch id={id} />
        </div>
    )
}

export default function DesignFormPage() {
    const params = useParams();
    const firestore = useFirestore();
    const submoduleId = params.submoduleId as string;

    const submoduleRef = useMemoFirebase(() => {
        if (!firestore || !submoduleId) return null;
        return doc(firestore, 'appSubmodules', submoduleId);
    }, [firestore, submoduleId]);

    const { data: submodule, isLoading: isLoadingSubmodule } = useDoc<AppSubmodule>(submoduleRef);


    if (isLoadingSubmodule) {
        return <div>Loading submodule details...</div>
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">
            <FormSettingSidebar />
            
            <div className="space-y-6">
                 <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                        <Link href="/form-setting">
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">Back</span>
                        </Link>
                    </Button>
                    <div className="flex-1">
                        <p className="text-sm text-muted-foreground">
                            <Link href="/form-setting" className="hover:underline">Form Setting</Link> &gt; 
                             <span className="font-medium text-foreground"> {submodule?.name}</span> &gt;
                             <span className="font-medium text-foreground"> Basic</span>
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <Settings className="h-6 w-6" />
                        <h1 className="text-2xl font-bold font-headline">Basic</h1>
                    </div>
                    
                    <Card>
                        <CardContent className="p-6 space-y-6">
                            <div>
                                <p className="text-sm text-muted-foreground">Template Name</p>
                                <p className="font-semibold">Default {submodule?.name}</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select defaultValue={submodule?.id}>
                                    <SelectTrigger id="category">
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {submodule && <SelectItem value={submodule.id}>{submodule.name}</SelectItem>}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dynamic-list-sp">Dynamic List Sp</Label>
                                <Input id="dynamic-list-sp" placeholder="Enter dynamic list" />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                                <SwitchControl id="pending-from" label="Pending From" />
                                <SwitchControl id="amendment" label="Amendment" />
                                <SwitchControl id="direct-block" label="Direct Block" />
                                <SwitchControl id="stock-effect" label="Stock Effect" />
                                <SwitchControl id="foreign-currency" label="Foreign Currency" />
                                <SwitchControl id="additional-charges" label="Additional Charges" />
                                <SwitchControl id="email-setting" label="Email Setting" />
                                <SwitchControl id="account-posting" label="Account Posting" />
                                <SwitchControl id="amount-adjustment" label="Amount Adjustment" />
                                <SwitchControl id="image-box" label="Image Box" />
                                <SwitchControl id="auto-approve" label="Auto Approve" />
                                <SwitchControl id="auto-capitalize" label="Auto Capitalize" />
                                <SwitchControl id="follow-up" label="Follow-up" />
                                <SwitchControl id="restrict-draft" label="Restrict Draft" />
                                <SwitchControl id="user-wise-list" label="User Wise List" />
                                <SwitchControl id="attachment-mandatory" label="Attachment Mandatory" />
                                <SwitchControl id="adjsust-sp" label="Adjsust SP" />
                                <SwitchControl id="back-days" label="Back Days" />
                            </div>

                        </CardContent>
                    </Card>
                </div>
                
                 <div className="flex justify-end gap-2">
                    <Button variant="outline">Cancel</Button>
                    <Button>Save Changes</Button>
                </div>

            </div>
        </div>
    );
}
