'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { Role } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { slugify } from '@/lib/utils';

const ALL_MODULES = [
  'Dashboard',
  'Transactions',
  'Sales',
  'Inventory',
  'Purchase',
  'CRM',
  'Reports',
  'Form Setting',
  'Settings'
];

export default function ManagePermissionsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const roleId = params.roleId as string;

  const roleRef = useMemoFirebase(() => {
    if (!firestore || !roleId) return null;
    return doc(firestore, 'roles', roleId);
  }, [firestore, roleId]);

  const { data: role, isLoading } = useDoc<Role>(roleRef);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (role?.permissions) {
      setSelectedPermissions(role.permissions);
    }
  }, [role]);

  const handlePermissionChange = (module: string, checked: boolean) => {
    setSelectedPermissions((prev) =>
      checked ? [...prev, slugify(module)] : prev.filter((p) => p !== slugify(module))
    );
  };

  const handleSaveChanges = async () => {
    if (!roleRef) return;
    try {
      await updateDoc(roleRef, {
        permissions: selectedPermissions,
      });
      toast({
        title: 'Permissions Updated',
        description: `Permissions for the '${role?.name}' role have been saved.`,
      });
      router.push('/settings/roles');
    } catch (error) {
      console.error('Error updating permissions:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update permissions.',
      });
    }
  };

  if (isLoading) {
    return <div>Loading role details...</div>;
  }

  if (!role) {
    return <div>Role not found.</div>;
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/settings/roles">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold font-headline">Manage Permissions</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role: <span className="font-bold capitalize text-primary">{role.name}</span></CardTitle>
          <CardDescription>
            Select the modules this role should have access to.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {ALL_MODULES.map((module) => (
              <div key={module} className="flex items-center space-x-2">
                <Checkbox
                  id={slugify(module)}
                  checked={selectedPermissions.includes(slugify(module))}
                  onCheckedChange={(checked) =>
                    handlePermissionChange(module, !!checked)
                  }
                />
                <Label
                  htmlFor={slugify(module)}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {module}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveChanges}>Save Permissions</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
