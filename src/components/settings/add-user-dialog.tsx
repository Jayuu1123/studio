
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
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { useFirestore } from "@/firebase";
import { setDoc, doc } from "firebase/firestore";

interface AddUserDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function AddUserDialog({ isOpen, setIsOpen }: AddUserDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("user"); // Default role
  const [isLoading, setIsLoading] = useState(false);

  const handleAddUser = async () => {
    if (!email || !password || !username) {
      toast({ variant: "destructive", title: "Error", description: "Please fill all fields." });
      return;
    }

    setIsLoading(true);

    try {
        // We need a separate auth instance to create a user while being logged in as another
        const auth = getAuth();
        
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUserId = userCredential.user.uid;

        // Create user document in Firestore
        if (firestore) {
            await setDoc(doc(firestore, "users", newUserId), {
                id: newUserId,
                username: username,
                email: email,
                roles: [role]
            });
        }

      toast({ title: "User Created", description: "The new user has been added successfully." });
      setIsOpen(false);
      // Reset form
      setEmail("");
      setPassword("");
      setUsername("");
      setRole("user");

    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({ variant: "destructive", title: "Error creating user", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new user and assign them a role.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              Password
            </Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="col-span-3" />
          </div>
          {/* A simple text input for role, could be a select dropdown with pre-defined roles */}
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} className="col-span-3" placeholder="e.g., admin, user" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button type="submit" onClick={handleAddUser} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
