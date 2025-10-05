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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useFirestore } from "@/firebase";
import { collection, query, where, getDocs, writeBatch, serverTimestamp } from "firebase/firestore";

interface LicensingDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function LicensingDialog({ isOpen, setIsOpen }: LicensingDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [licenseKey, setLicenseKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleActivateLicense = async () => {
    if (!licenseKey) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a license key." });
      return;
    }
    if (!firestore) {
      toast({ variant: "destructive", title: "Error", description: "Database not connected." });
      return;
    }
    setIsLoading(true);

    try {
      const licensesRef = collection(firestore, "licenses");
      const q = query(licensesRef, where("licenseKey", "==", licenseKey));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toast({ variant: "destructive", title: "Invalid Key", description: "The license key you entered does not exist." });
        setIsLoading(false);
        return;
      }
      
      const licenseDoc = querySnapshot.docs[0];
      const licenseData = licenseDoc.data();

      if (licenseData.status === 'active') {
          toast({ variant: "destructive", title: "Already Active", description: "This license key is already active." });
          setIsLoading(false);
          return;
      }

      // In a real scenario, you might have complex logic. Here we just activate it.
      const batch = writeBatch(firestore);
      batch.update(licenseDoc.ref, { 
          status: 'active',
          activationDate: serverTimestamp()
      });
      await batch.commit();
      
      toast({ title: "License Activated", description: "The license has been successfully activated." });
      setIsOpen(false);
      setLicenseKey("");

    } catch (error: any) {
      console.error("Error activating license:", error);
      toast({ variant: "destructive", title: "Error activating license", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Activate License</DialogTitle>
          <DialogDescription>
            Enter a license key to activate your software.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="license-key" className="text-right">
              License Key
            </Label>
            <Input 
                id="license-key" 
                value={licenseKey} 
                onChange={(e) => setLicenseKey(e.target.value)} 
                className="col-span-3"
                placeholder="Enter your license key"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button type="submit" onClick={handleActivateLicense} disabled={isLoading}>
            {isLoading ? "Activating..." : "Activate License"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
