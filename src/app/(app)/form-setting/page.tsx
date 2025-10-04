import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const submodules = [
    { name: 'Production Order', mainModule: 'Transactions' },
    { name: 'Purchase Order', mainModule: 'Purchase' },
    { name: 'Customer', mainModule: 'Sales' },
];

export default function FormSettingPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold font-headline">Form Setting</h1>
      <p className="text-muted-foreground">
        Use this section to customize your ERP by adding new submodules, creating entry forms, and adding new fields.
      </p>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Create New Submodule */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Submodule</CardTitle>
            <CardDescription>Add a new submodule to an existing main module.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="main-module">Main Module</Label>
              <Select>
                <SelectTrigger id="main-module">
                  <SelectValue placeholder="Select a main module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transactions">Transactions</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                  <SelectItem value="purchase">Purchase</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="submodule-name">Submodule Name</Label>
              <Input id="submodule-name" placeholder="e.g., 'Invoices'" />
            </div>
          </CardContent>
          <CardFooter>
            <Button>Create Submodule</Button>
          </CardFooter>
        </Card>

        {/* Manage Submodules */}
        <Card>
          <CardHeader>
            <CardTitle>Manage Submodules</CardTitle>
            <CardDescription>Edit or delete existing submodules.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Submodule Name</TableHead>
                  <TableHead>Main Module</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submodules.map((sub) => (
                  <TableRow key={sub.name}>
                    <TableCell className="font-medium">{sub.name}</TableCell>
                    <TableCell>{sub.mainModule}</TableCell>
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
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Design Entry Form */}
        <Card>
          <CardHeader>
            <CardTitle>Design Entry Form</CardTitle>
            <CardDescription>Create or modify the entry form for a submodule.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="design-submodule">Submodule</Label>
            <Select>
              <SelectTrigger id="design-submodule">
                <SelectValue placeholder="Select a submodule" />
              </SelectTrigger>
              <SelectContent>
                {submodules.map(sub => <SelectItem key={sub.name} value={sub.name.toLowerCase().replace(' ', '-')}>{sub.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
          <CardFooter>
            <Button>Design Form</Button>
          </CardFooter>
        </Card>

        {/* Add Custom Fields */}
        <Card>
          <CardHeader>
            <CardTitle>Add Custom Fields</CardTitle>
            <CardDescription>Add new fields to an existing entry form.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
                <Label htmlFor="field-submodule">Submodule</Label>
                <Select>
                  <SelectTrigger id="field-submodule">
                    <SelectValue placeholder="Select a submodule" />
                  </SelectTrigger>
                  <SelectContent>
                     {submodules.map(sub => <SelectItem key={sub.name} value={sub.name.toLowerCase().replace(' ', '-')}>{sub.name}</SelectItem>)}
                  </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="field-name">Field Name</Label>
                <Input id="field-name" placeholder="e.g., 'Due Date'" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="field-type">Field Type</Label>
                <Select>
                  <SelectTrigger id="field-type">
                    <SelectValue placeholder="Select a field type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="boolean">Checkbox</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button>Add Field</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
