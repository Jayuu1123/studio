'use client';
import { MasterCard, MasterCardProps } from "@/components/master-card";
import { Database, Users, Building, Truck } from "lucide-react";

const masterSubmodules: MasterCardProps[] = [
    {
        title: "Products",
        description: "Manage all products and services.",
        icon: Database,
        href: "/masters/products"
    },
    {
        title: "Customers",
        description: "View and manage all customers.",
        icon: Users,
        href: "/masters/customers"
    },
    {
        title: "Suppliers",
        description: "Manage all suppliers and vendors.",
        icon: Truck,
        href: "/masters/suppliers"
    },
    {
        title: "Chart of Accounts",
        description: "Manage your company's financial accounts.",
        icon: Building,
        href: "/masters/accounts"
    }
];

export default function MastersPage() {

  return (
    <div className="space-y-8">
       <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline">Masters</h1>
          <p className="text-muted-foreground">Home > Masters</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {masterSubmodules.map((submodule) => (
            <MasterCard
                key={submodule.title}
                title={submodule.title}
                description={submodule.description}
                icon={submodule.icon}
                href={submodule.href}
            />
        ))}
      </div>
    </div>
  );
}
