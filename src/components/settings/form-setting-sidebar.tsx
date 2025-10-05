'use client';
import { cn } from "@/lib/utils";
import { Settings, FileText, FileUp, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

const navItems = [
    { name: 'Basic', icon: Settings, href: 'basic' },
    { name: 'Header', icon: FileText, href: 'header' },
    { name: 'Details', icon: FileText, href: 'details' },
    { name: 'Report', icon: FileUp, href: 'report' },
    { name: 'Approval', icon: ShieldCheck, href: 'approval' }
];

export function FormSettingSidebar() {
    const params = useParams();
    // This is a placeholder for active tab logic.
    // In a real app, you would likely use a sub-route or query param.
    const activeTab = 'basic'; 

    return (
        <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
                <Link
                    key={item.name}
                    href="#" // In a real app, this would be `/form-setting/${params.submoduleId}/${item.href}`
                    className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                        activeTab === item.href.toLowerCase() && "bg-primary/10 text-primary font-semibold"
                    )}
                >
                    <item.icon className="h-5 w-5" />
                    <span>{item.name}</span>
                </Link>
            ))}
        </nav>
    );
}
