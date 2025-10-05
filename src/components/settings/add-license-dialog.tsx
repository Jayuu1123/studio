
'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { collection, serverTimestamp, Timestamp } from "firebase/firestore";
import { v4 as uuidv4 } from 'uuid';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import type { User } from "@/lib/types";
import { DatePicker } from "../ui/date-picker";


interface AddLicenseDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function AddLicenseDialog({ isOpen, setIsOpen }: AddLicenseDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [userId, setUserId] = useState("");
  const [expiryDate, setExpiryDate] = useState<Date | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const { data: users } = useCollection<User>(usersQuery);

  const handleAddLicense = async () => {
    if (!expiryDate) {
      toast({ variant: "destructive", title: "Error", description: "Please select an expiry date." });
      return;
    }
    if (!firestore) {
      toast({ variant: "destructive", title: "Error", description: "Database not connected." });
      return;
    }
    setIsLoading(true);

    try {
        const licenseKey = `SF-${uuidv4().toUpperCase()}`;
        const selectedUser = users?.find(u => u.id === userId);

        const newLicense = {
            licenseKey,
            userId: userId && userId !== 'none' ? userId : null,
            userEmail: selectedUser?.email || null,
            status: 'inactive',
            createdAt: serverTimestamp(),
            expiryDate: Timestamp.fromDate(expiryDate),
        };

        await addDocumentNonBlocking(collection(firestore, "licenses"), newLicense);

        toast({ title: "License Created", description: `Key: ${licenseKey}` });
        setIsOpen(false);
        // Reset form
        setUserId("");
        setExpiryDate(undefined);
        
    } catch (error: any) {
      console.error("Error creating license:", error);
      toast({ variant: "destructive", title: "Error creating license", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New License</DialogTitle>
          <DialogDescription>
            Generate a new license and optionally assign it to a user. The license will be created as 'inactive'.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="user" className="text-right">
              Assign To
            </Label>
            <Select onValueChange={setUserId} value={userId}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a user (optional)" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {users?.map(user => (
                        <SelectItem key={user.id} value={user.id!}>{user.email}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="expiry" className="text-right">
              Expiry Date
            </Label>
            <div className="col-span-3">
                <DatePicker date={expiryDate} setDate={setExpiryDate} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button type="submit" onClick={handleAddLicense} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create License"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
