
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
import { useState, useEffect } from "react";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { setDoc, doc, collection, updateDoc } from "firebase/firestore";
import type { Role, User } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface AddUserDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  userToEdit?: User;
}

export function AddUserDialog({ isOpen, setIsOpen, userToEdit }: AddUserDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isEditMode = Boolean(userToEdit);

  useEffect(() => {
    if (isEditMode && userToEdit) {
        setUsername(userToEdit.username || "");
        setEmail(userToEdit.email || "");
        setSelectedRole(userToEdit.roles?.[0] || "");
    } else {
        // Reset form for create mode
        setUsername("");
        setEmail("");
        setPassword("");
        setSelectedRole("");
    }
  }, [userToEdit, isEditMode, isOpen]);
  
  const rolesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'roles');
  }, [firestore, user]);

  const { data: roles } = useCollection<Role>(rolesQuery);

  const handleSaveUser = async () => {
    if ((!email || !password && !isEditMode) || !username || !selectedRole) {
      toast({ variant: "destructive", title: "Error", description: "Please fill all required fields." });
      return;
    }

    setIsLoading(true);

    try {
        if (isEditMode && userToEdit?.id) {
            // Update existing user
            const userDocRef = doc(firestore!, "users", userToEdit.id);
            await updateDoc(userDocRef, {
                username: username,
                roles: [selectedRole] // Store the role name directly
            });
            toast({ title: "User Updated", description: "The user has been updated successfully." });
        } else {
            // Create new user
            const auth = getAuth();
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const newUserId = userCredential.user.uid;

            if (firestore) {
                await setDoc(doc(firestore, "users", newUserId), {
                    id: newUserId,
                    username: username,
                    email: email,
                    roles: [selectedRole], // Store the role name directly
                    status: 'active'
                });
            }
            toast({ title: "User Created", description: "The new user has been added successfully." });
        }

      setIsOpen(false);

    } catch (error: any) {
      console.error("Error saving user:", error);
      toast({ variant: "destructive", title: "Error saving user", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Update the user's details below." : "Create a new user and assign them a role."}
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
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" disabled={isEditMode} />
          </div>
          {!isEditMode && (
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                Password
                </Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="col-span-3" />
            </div>
          )}
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
                        <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button type="submit" onClick={handleSaveUser} disabled={isLoading}>
            {isLoading ? (isEditMode ? "Saving..." : "Creating...") : (isEditMode ? "Save Changes" : "Create User")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
