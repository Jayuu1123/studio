
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
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { setDoc, doc, collection } from "firebase/firestore";
import type { Role } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

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
  const [selectedRole, setSelectedRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const rolesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'roles');
  }, [firestore]);

  const { data: roles } = useCollection<Role>(rolesQuery);

  const handleAddUser = async () => {
    if (!email || !password || !username || !selectedRole) {
      toast({ variant: "destructive", title: "Error", description: "Please fill all fields, including role." });
      return;
    }

    setIsLoading(true);

    try {
        const auth = getAuth();
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUserId = userCredential.user.uid;

        if (firestore) {
            await setDoc(doc(firestore, "users", newUserId), {
                id: newUserId,
                username: username,
                email: email,
                roles: [selectedRole] // Assign selected role
            });
        }

      toast({ title: "User Created", description: "The new user has been added successfully." });
      setIsOpen(false);
      // Reset form
      setEmail("");
      setPassword("");
      setUsername("");
      setSelectedRole("");

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
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <Select onValueChange={setSelectedRole} value={selectedRole}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                    {roles?.map(role => (
                        <SelectItem key={role.id} value={role.name.toLowerCase()}>{role.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
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
