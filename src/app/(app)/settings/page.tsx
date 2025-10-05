import Link from "next/link"
import { Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SettingsPage() {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-2">
      <h1 className="text-3xl font-semibold font-headline">Settings</h1>

      <main className="grid flex-1 gap-4 overflow-auto p-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="relative hidden flex-col items-start gap-8 md:flex">
          <form className="grid w-full items-start gap-6">
            <fieldset className="grid gap-6 rounded-lg border p-4">
              <legend className="-ml-1 px-1 text-sm font-medium">
                General
              </legend>
              <div className="grid gap-3">
                <Label htmlFor="company-name">Company Name</Label>
                <Input id="company-name" type="text" placeholder="SynergyFlow Inc." />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="language">Language</Label>
                 <Input id="language" type="text" placeholder="English" />
              </div>
            </fieldset>
            <fieldset className="grid gap-6 rounded-lg border p-4">
              <legend className="-ml-1 px-1 text-sm font-medium">
                Security
              </legend>
              <div className="grid gap-3">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
               <div className="flex items-center space-x-2">
                <Checkbox id="2fa" />
                <label
                  htmlFor="2fa"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Enable Two-Factor Authentication
                </label>
              </div>
            </fieldset>
          </form>
        </div>
        <div className="relative flex h-full min-h-[50vh] flex-col rounded-xl bg-muted/50 p-4 lg:col-span-2 space-y-4">
           <Card>
                <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>
                    Customize the look and feel of your workspace.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="flex flex-col gap-4">
                    <Input placeholder="Theme (e.g., 'Dark', 'Light')" defaultValue="Light" />
                    <div className="flex items-center space-x-2">
                        <Checkbox id="sync-theme" defaultChecked />
                        <Label htmlFor="sync-theme">
                        Sync theme with system preference
                        </Label>
                    </div>
                    </form>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button>Save</Button>
                </CardFooter>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>
                    Manage users, roles, and permissions.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Users className="h-12 w-12 text-muted-foreground" />
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button asChild>
                        <Link href="/settings/user-management">Manage Users</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
      </main>
    </div>
  )
}
