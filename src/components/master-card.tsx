'use client';

import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface MasterCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    href: string;
}

export function MasterCard({ title, description, icon: Icon, href }: MasterCardProps) {
    return (
        <Card className="hover:shadow-lg transition-shadow w-full group">
            <Link href={href} className="block h-full">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                        <Icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center text-sm font-medium text-primary group-hover:translate-x-1 transition-transform">
                        <span>Manage</span>
                        <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                </CardContent>
            </Link>
        </Card>
    );
}
