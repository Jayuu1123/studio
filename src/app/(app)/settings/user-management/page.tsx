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
import type { User } from "@/lib/types";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { AddUserDialog } from "@/components/settings/add-user-dialog";

export default function UserManagementPage() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | undefined>(undefined);


    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'users');
    }, [firestore]);

    const { data: users, isLoading } = useCollection<User>(usersQuery);

    const handleOpenDialog = (user?: User) => {
      setUserToEdit(user);
      setIsAddUserOpen(true);
    };

    const handleCloseDialog = () => {
      setIsAddUserOpen(false);
      setUserToEdit(undefined);
    };


    const handleDeleteUser = (userId: string) => {
        if (!firestore) {
            toast({ variant: "destructive", title: "Error", description: "Firestore not available." });
            return;
        }
        // Note: This only deletes the Firestore document, not the Firebase Auth user.
        // A full implementation would require a backend function to delete the auth user.
        const userDocRef = doc(firestore, 'users', userId);
        deleteDocumentNonBlocking(userDocRef);
        toast({ title: "User Deleted", description: "The user document has been deleted." });
    }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold font-headline">User Management</h1>
            <p className="text-muted-foreground">
                Add, remove, and manage users and their roles.
            </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>A list of all the users in your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={4} className="text-center">Loading users...</TableCell></TableRow>}
              {!isLoading && users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.roles?.map(role => <Badge key={role} variant="secondary" className="mr-1 capitalize">{role}</Badge>)}
                  </TableCell>
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
                        <DropdownMenuItem onClick={() => handleOpenDialog(user)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => user.id && handleDeleteUser(user.id)} className="text-red-500">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && !users?.length && (
                <TableRow>
                    <TableCell colSpan={4} className="text-center">No users found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <AddUserDialog isOpen={isAddUserOpen} setIsOpen={handleCloseDialog} userToEdit={userToEdit} />
    </>
  );
}
