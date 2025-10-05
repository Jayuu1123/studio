'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
} from '@/firebase/non-blocking-updates';
import { collection, doc } from 'firebase/firestore';
import type { Role } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

export default function RolesPage() {
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const firestore = useFirestore();
  const { toast } = useToast();

  const rolesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'roles');
  }, [firestore]);

  const { data: roles, isLoading } = useCollection<Role>(rolesQuery);

  const handleCreateRole = () => {
    if (!roleName) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide a role name.',
      });
      return;
    }

    if (!firestore) return;

    const newRole: Omit<Role, 'id'> = {
      name: roleName,
      description: roleDescription,
      permissions: [],
    };

    const rolesCollection = collection(firestore, 'roles');
    addDocumentNonBlocking(rolesCollection, newRole);

    toast({
      title: 'Role Created',
      description: `Role '${roleName}' has been created.`,
    });

    setRoleName('');
    setRoleDescription('');
  };

  const handleDeleteRole = (id: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'roles', id);
    deleteDocumentNonBlocking(docRef);
    toast({
      title: 'Role Deleted',
      description: 'The role has been successfully deleted.',
    });
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">Roles & Permissions</h1>
      <div className="grid gap-8 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Create New Role</CardTitle>
            <CardDescription>
              Define a new user role for your organization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">Role Name</Label>
              <Input
                id="role-name"
                placeholder="e.g., 'Sales Manager'"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-description">Description</Label>
              <Textarea
                id="role-description"
                placeholder="Describe the responsibilities of this role"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleCreateRole}>Create Role</Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Existing Roles</CardTitle>
            <CardDescription>
              Manage existing roles and their permissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      Loading roles...
                    </TableCell>
                  </TableRow>
                )}
                {roles?.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium capitalize">{role.name}</TableCell>
                    <TableCell>{role.description}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>Manage Permissions</DropdownMenuItem>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => role.id && handleDeleteRole(role.id)}
                            className="text-red-500"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && (!roles || roles.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      No roles found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
