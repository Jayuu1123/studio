'use client';
import { cn } from "@/lib/utils";
import { Settings, FileText, FileUp, ShieldCheck, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import React from "react";

interface NavItem {
    name: string;
    icon: LucideIcon;
    href: string;
}

const navItems: NavItem[] = [
    { name: 'Basic', icon: Settings, href: 'design' },
    { name: 'Header', icon: FileText, href: 'header' },
    { name: 'Details', icon: FileText, href: 'details' },
    { name: 'Report', icon: FileUp, href: 'report' },
    { name: 'Approval', icon: ShieldCheck, href: 'approval' }
];

export function FormSettingSidebar() {
    const params = useParams();
    const pathname = usePathname();
    const submoduleId = params.submoduleId as string;

    return (
        <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
                const href = `/form-setting/${submoduleId}/${item.href}`;
                const isActive = pathname.endsWith(item.href);
                
                return (
                    <Link
                        key={item.name}
                        href={href}
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                            isActive && "bg-primary/10 text-primary font-semibold"
                        )}
                    >
                        <item.icon className="h-5 w-5" />
                        <span>{item.name}</span>
                    </Link>
                )
            })}
        </nav>
    );
}
