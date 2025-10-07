'use client';

import Link from 'next/link';
import {
  Activity,
  ArrowUpRight,
  CreditCard,
  IndianRupee,
  Users,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Overview } from '@/components/dashboard/overview';
import { RecentSales } from '@/components/dashboard/recent-sales';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit, where } from 'firebase/firestore';
import type { Order, Customer } from '@/lib/types';
import { useMemo } from 'react';

export default function DashboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const ordersQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'orders') : null),
    [firestore, user]
  );
  
  const recentOrdersQuery = useMemoFirebase(
    () => (firestore && user ? query(collection(firestore, 'orders'), orderBy('orderDate', 'desc'), limit(5)) : null),
    [firestore, user]
  );

  const { data: orders, isLoading: isLoadingOrders } = useCollection<Order>(ordersQuery);
  const { data: recentOrders, isLoading: isLoadingRecent } = useCollection<Order>(recentOrdersQuery);
  
  // Get customer IDs from recent orders to fetch their data in one go
  const recentCustomerIds = useMemo(() => {
    if (!recentOrders || recentOrders.length === 0) return [];
    // Use a Set to get unique customer IDs
    return [...new Set(recentOrders.map(order => order.customerId))];
  }, [recentOrders]);

  const customersQuery = useMemoFirebase(() => {
    if (!firestore || !user || recentCustomerIds.length === 0) return null;
    return query(collection(firestore, 'customers'), where('__name__', 'in', recentCustomerIds));
  }, [firestore, user, recentCustomerIds]);

  const { data: customers, isLoading: isLoadingCustomers } = useCollection<Customer>(customersQuery);

  const totalRevenue = orders?.reduce((sum, order) => sum + order.totalAmount, 0) || 0;
  const totalSales = orders?.length || 0;
  
  const isLoading = isLoadingOrders || isLoadingRecent || isLoadingCustomers;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Revenue
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingOrders ? '...' : `₹${totalRevenue.toLocaleString('en-IN')}`}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on all completed orders
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingOrders ? '...' : `+${totalSales}`}
            </div>
            <p className="text-xs text-muted-foreground">
              Total number of orders
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Now</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+573</div>
            <p className="text-xs text-muted-foreground">
              +201 since last hour (static)
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Transactions Overview</CardTitle>
            <CardDescription>
              A summary of recent order values.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Overview data={orders} isLoading={isLoadingOrders} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>
              Your most recent transactions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentSales 
              recentOrders={recentOrders} 
              customers={customers}
              isLoading={isLoading} 
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
