'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, collection, query, orderBy, where } from 'firebase/firestore';
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
import { ChevronLeft } from 'lucide-react';
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


export default function ManagePermissionsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const roleId = params.roleId as string;

  const [permissions, setPermissions] = useState<PermissionSet>({});

  const roleRef = useMemoFirebase(() => {
    if (!firestore || !roleId) return null;
    return doc(firestore, 'roles', roleId);
  }, [firestore, roleId]);
  const { data: role, isLoading: isLoadingRole } = useDoc<Role>(roleRef);

  const submodulesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'appSubmodules'), orderBy('position'));
  }, [firestore]);
  const { data: submodules, isLoading: isLoadingSubmodules } = useCollection<AppSubmodule>(submodulesQuery);

  useEffect(() => {
    if (role?.permissions) {
      setPermissions(role.permissions);
    }
  }, [role]);

  const handleModulePermissionChange = (moduleSlug: string, checked: boolean) => {
    setPermissions(prev => {
      const newPerms = { ...prev };
      if (checked) {
        newPerms[moduleSlug] = true;
      } else {
        delete newPerms[moduleSlug];
      }
      return newPerms;
    });
  };

  const handleSubmodulePermissionChange = (mainModuleSlug: string, submoduleSlug: string, action: 'read' | 'write' | 'delete', checked: boolean) => {
      setPermissions(prev => {
          const newPerms = JSON.parse(JSON.stringify(prev));

          // Ensure main module entry exists and is an object
          if (typeof newPerms[mainModuleSlug] !== 'object' || newPerms[mainModuleSlug] === true) {
              newPerms[mainModuleSlug] = {};
          }
          
          // Ensure submodule entry exists and is an object
          if (typeof newPerms[mainModuleSlug][submoduleSlug] !== 'object') {
              newPerms[mainModuleSlug][submoduleSlug] = {};
          }
          
          if (checked) {
            newPerms[mainModuleSlug][submoduleSlug][action] = true;
          } else {
            delete newPerms[mainModuleSlug][submoduleSlug][action];
            // Clean up empty objects
            if (Object.keys(newPerms[mainModuleSlug][submoduleSlug]).length === 0) {
              delete newPerms[mainModuleSlug][submoduleSlug];
            }
             if (Object.keys(newPerms[mainModuleSlug]).length === 0) {
              // If we just removed the last submodule permission, we shouldn't delete the main module key
              // if the main module checkbox is still checked. We'll handle this by setting it to `true`
              // if it's empty, but only if the main checkbox is intended to be checked.
              // This part is tricky, we'll rely on the main checkbox handler to set it to `true`.
              // For now, just clean up sub-objects.
            }
          }

          return newPerms;
      });
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
  
  const getSubmodulePermission = (mainModuleSlug: string, submoduleSlug: string, action: 'read' | 'write' | 'delete') => {
      // @ts-ignore
      return !!permissions[mainModuleSlug]?.[submoduleSlug]?.[action];
  }
  
  const groupedSubmodules = useMemo(() => {
    if (!submodules) return {};
    
    const grouped = submodules.reduce((acc, sub) => {
        if (!acc[sub.mainModule]) {
            acc[sub.mainModule] = [];
        }
        acc[sub.mainModule].push(sub);
        return acc;
    }, {} as {[key: string]: AppSubmodule[]});

    return grouped;
  }, [submodules]);

  if (isLoadingRole || isLoadingSubmodules) {
    return <div>Loading...</div>;
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
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {ALL_MAIN_MODULES.map((moduleName) => {
                const moduleSlug = slugify(moduleName);
                const relatedSubmodules = groupedSubmodules[moduleName] || [];
                
                return (
                    <AccordionItem value={moduleSlug} key={moduleSlug}>
                         <div className="flex items-center gap-4">
                             <div className="py-4 flex items-center gap-4">
                                <Checkbox
                                    id={moduleSlug}
                                    checked={!!permissions[moduleSlug]}
                                    onCheckedChange={(checked) => handleModulePermissionChange(moduleSlug, !!checked)}
                                />
                                <Label htmlFor={moduleSlug} className="text-lg font-semibold cursor-pointer">{moduleName}</Label>
                            </div>
                            <AccordionTrigger className="p-0" disabled={relatedSubmodules.length === 0} />
                        </div>
                        <AccordionContent className="pl-12">
                            {relatedSubmodules.length > 0 ? (
                                <div className="space-y-4">
                                    {relatedSubmodules.map(sub => {
                                        const subSlug = slugify(sub.name);
                                        return (
                                            <div key={sub.id} className="border-l pl-4">
                                                <h4 className="font-medium mb-2">{sub.name}</h4>
                                                <div className="flex items-center gap-6">
                                                     <div className="flex items-center gap-2">
                                                        <Checkbox 
                                                            id={`${subSlug}-read`}
                                                            checked={getSubmodulePermission(moduleSlug, subSlug, 'read')}
                                                            onCheckedChange={(checked) => handleSubmodulePermissionChange(moduleSlug, subSlug, 'read', !!checked)}
                                                        />
                                                        <Label htmlFor={`${subSlug}-read`}>Read</Label>
                                                    </div>
                                                     <div className="flex items-center gap-2">
                                                        <Checkbox 
                                                            id={`${subSlug}-write`}
                                                            checked={getSubmodulePermission(moduleSlug, subSlug, 'write')}
                                                            onCheckedChange={(checked) => handleSubmodulePermissionChange(moduleSlug, subSlug, 'write', !!checked)}
                                                        />
                                                        <Label htmlFor={`${subSlug}-write`}>Write</Label>
                                                    </div>
                                                     <div className="flex items-center gap-2">
                                                        <Checkbox 
                                                            id={`${subSlug}-delete`}
                                                            checked={getSubmodulePermission(moduleSlug, subSlug, 'delete')}
                                                            onCheckedChange={(checked) => handleSubmodulePermissionChange(moduleSlug, subSlug, 'delete', !!checked)}
                                                        />
                                                        <Label htmlFor={`${subSlug}-delete`}>Delete</Label>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No user-defined submodules. Access is granted to the main module.</p>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                )
            })}
          </Accordion>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveChanges}>Save Permissions</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
