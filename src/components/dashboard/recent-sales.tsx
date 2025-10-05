'use client';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import type { Order, Customer } from "@/lib/types";
import { doc } from 'firebase/firestore';
import { Skeleton } from "@/components/ui/skeleton";

interface RecentSalesProps {
  recentOrders: Order[] | null;
  isLoading: boolean;
}

function SaleRow({ order }: { order: Order }) {
    const firestore = useFirestore();

    const customerRef = useMemoFirebase(() => {
        if (!firestore || !order.customerId) return null;
        return doc(firestore, 'customers', order.customerId);
    }, [firestore, order.customerId]);

    const { data: customer, isLoading } = useDoc<Customer>(customerRef);

    if (isLoading) {
        return <Skeleton className="h-12 w-full" />;
    }

    return (
        <div className="flex items-center">
            <Avatar className="h-9 w-9">
                <AvatarImage src={`https://i.pravatar.cc/150?u=${customer?.email}`} alt="Avatar" />
                <AvatarFallback>{customer?.name?.charAt(0) || '?'}</AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">{customer?.name || 'Unknown Customer'}</p>
                <p className="text-sm text-muted-foreground">{customer?.email || 'No email'}</p>
            </div>
            <div className="ml-auto font-medium">
                +₹{order.totalAmount.toLocaleString('en-IN')}
            </div>
        </div>
    )
}

export function RecentSales({ recentOrders, isLoading }: RecentSalesProps) {
  if (isLoading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
    );
  }

  if (!recentOrders || recentOrders.length === 0) {
      return <p className="text-sm text-muted-foreground text-center">No recent sales found.</p>
  }

  return (
    <div className="space-y-8">
        {recentOrders.map((order) => (
            <SaleRow key={order.id} order={order} />
        ))}
    </div>
  )
}
