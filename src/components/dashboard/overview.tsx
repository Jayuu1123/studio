'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import type { Order } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';
import { Card, CardContent } from '../ui/card';

interface OverviewProps {
    data: Order[] | null;
    isLoading: boolean;
}

export function Overview({ data, isLoading }: OverviewProps) {
  
  const processDataForChart = (orders: Order[] | null) => {
    if (!orders) return [];
    
    const monthlySales: { [key: string]: number } = {};

    orders.forEach(order => {
      // Ensure orderDate and seconds are available
      if (order.orderDate && typeof order.orderDate.seconds === 'number') {
        const month = format(new Date(order.orderDate.seconds * 1000), 'MMM');
        monthlySales[month] = (monthlySales[month] || 0) + order.totalAmount;
      }
    });

    const allMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const chartData = allMonths.map(month => ({
      name: month,
      total: monthlySales[month] || 0,
    }));
    
    return chartData;
  }

  const chartData = processDataForChart(data);

  if (isLoading) {
      return <Skeleton className="w-full h-[350px]" />;
  }

  if (!data || data.length === 0) {
      return (
          <div className="w-full h-[350px] flex items-center justify-center text-muted-foreground">
              No transaction data available.
          </div>
      )
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="name"
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `₹${value / 1000}k`}
        />
        <Tooltip
            contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            formatter={(value: number) => [value.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }), 'Revenue']}
        />
        <Bar
          dataKey="total"
          fill="hsl(var(--primary))"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
