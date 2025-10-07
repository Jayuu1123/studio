'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import type { Role, AppSubmodule, PermissionSet } from '@/lib/types';
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
import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { slugify } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const ALL_MAIN_MODULES = [
  'Dashboard', 
  'Transactions',
  'Sales',
  'Inventory',
  'Purchase',
  'CRM',
  'Reports',
  'Form Setting',
  'Settings', 
  'User Management', 
  'Roles & Permissions', 
  'Licensing'
];


export default function ManagePermissionsPage({ submodules = [] }: { submodules: AppSubmodule[] }) {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const roleId = params.roleId as string;

  const [permissions, setPermissions] = useState<PermissionSet>({});

  const roleRef = useMemoFirebase(() => {
    if (!firestore || !roleId || !user) return null;
    return doc(firestore, 'roles', roleId);
  }, [firestore, roleId, user]);

  const { data: role, isLoading: isLoadingRole } = useDoc<Role>(roleRef);

  useEffect(() => {
    if (role?.permissions) {
      setPermissions(role.permissions);
    }
  }, [role]);
  
  const groupedSubmodules = useMemo(() => {
    if (!submodules) return {};
    return submodules.reduce((acc, sub) => {
      if (!acc[sub.mainModule]) {
        acc[sub.mainModule] = [];
      }
      acc[sub.mainModule].push(sub);
      return acc;
    }, {} as Record<string, AppSubmodule[]>);
  }, [submodules]);


  const handleMainModuleChange = (moduleSlug: string, isChecked: boolean) => {
    setPermissions(prev => {
      const newPerms = { ...prev };
      if (isChecked) {
        // Add the module with an empty object to signify access
        // but no specific submodule perms yet.
        newPerms[moduleSlug] = newPerms[moduleSlug] || {};
      } else {
        // Remove the entire module entry
        delete newPerms[moduleSlug];
      }
      return newPerms;
    });
  };

  const handleSubmodulePermissionChange = (mainModuleSlug: string, submoduleSlug: string, action: 'read' | 'write' | 'delete', isChecked: boolean) => {
    setPermissions(prev => {
      const newPerms = JSON.parse(JSON.stringify(prev)); // Deep copy

      // Ensure main module exists
      newPerms[mainModuleSlug] = newPerms[mainModuleSlug] || {};
      
      // Ensure it's an object for sub-permissions
      if (newPerms[mainModuleSlug] === true) {
         newPerms[mainModuleSlug] = {};
      }

      // Ensure submodule object exists
      newPerms[mainModuleSlug][submoduleSlug] = newPerms[mainModuleSlug][submoduleSlug] || {};

      if (isChecked) {
        newPerms[mainModuleSlug][submoduleSlug][action] = true;
      } else {
        delete newPerms[mainModuleSlug][submoduleSlug][action];
        // Clean up empty objects
        if (Object.keys(newPerms[mainModuleSlug][submoduleSlug]).length === 0) {
          delete newPerms[mainModuleSlug][submoduleSlug];
        }
      }
      
      return newPerms;
    });
  };

  const getSubmodulePermission = (mainModuleSlug: string, submoduleSlug: string, action: 'read' | 'write' | 'delete'): boolean => {
    const mainPerm = permissions[mainModuleSlug];
    if (typeof mainPerm === 'object' && mainPerm !== null) {
      // @ts-ignore
      const subPerm = mainPerm[submoduleSlug];
      if (typeof subPerm === 'object' && subPerm !== null) {
        return !!subPerm[action];
      }
    }
    return false;
  };

  const handleSaveChanges = async () => {
    if (!roleRef) return;
    try {
      await updateDoc(roleRef, { permissions });
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
  
  if (isLoadingRole) {
    return <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>;
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
            Select the modules and actions this role should have access to.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ALL_MAIN_MODULES.map((moduleName) => {
            const moduleSlug = slugify(moduleName);
            const relatedSubmodules = groupedSubmodules[moduleName] || [];

            return (
              <div key={moduleSlug} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center space-x-3">
                   <Checkbox
                    id={`perm-${moduleSlug}`}
                    checked={!!permissions[moduleSlug]}
                    onCheckedChange={(checked) => handleMainModuleChange(moduleSlug, !!checked)}
                  />
                  <Label htmlFor={`perm-${moduleSlug}`} className="text-lg font-semibold">{moduleName}</Label>
                </div>
                
                {relatedSubmodules.length > 0 && (
                  <div className="pl-8 space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Submodule Permissions</p>
                    {relatedSubmodules.map(submodule => {
                      const submoduleSlug = slugify(submodule.name);
                      return (
                        <div key={submodule.id} className="border-l-2 pl-4 py-2">
                           <p className="font-medium mb-2">{submodule.name}</p>
                           <div className="flex items-center space-x-6">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`perm-${moduleSlug}-${submoduleSlug}-read`}
                                  checked={getSubmodulePermission(moduleSlug, submoduleSlug, 'read')}
                                  onCheckedChange={(checked) => handleSubmodulePermissionChange(moduleSlug, submoduleSlug, 'read', !!checked)}
                                />
                                <Label htmlFor={`perm-${moduleSlug}-${submoduleSlug}-read`}>Read</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`perm-${moduleSlug}-${submoduleSlug}-write`}
                                  checked={getSubmodulePermission(moduleSlug, submoduleSlug, 'write')}
                                  onCheckedChange={(checked) => handleSubmodulePermissionChange(moduleSlug, submoduleSlug, 'write', !!checked)}
                                />
                                <Label htmlFor={`perm-${moduleSlug}-${submoduleSlug}-write`}>Write</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`perm-${moduleSlug}-${submoduleSlug}-delete`}
                                  checked={getSubmodulePermission(moduleSlug, submoduleSlug, 'delete')}
                                  onCheckedChange={(checked) => handleSubmodulePermissionChange(moduleSlug, submoduleSlug, 'delete', !!checked)}
                                />
                                <Label htmlFor={`perm-${moduleSlug}-${submoduleSlug}-delete`}>Delete</Label>
                              </div>
                           </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveChanges}>Save Permissions</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
