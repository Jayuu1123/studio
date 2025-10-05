'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { format } from 'date-fns';
import type { Order } from '@/lib/types';

interface OverviewProps {
    data: Order[] | null;
}

export function Overview({ data }: OverviewProps) {
  
  const processDataForChart = (orders: Order[] | null) => {
    if (!orders) return [];
    
    // Aggregate sales by month
    const monthlySales: { [key: string]: number } = {};

    orders.forEach(order => {
      const month = format(new Date(order.orderDate.seconds * 1000), 'MMM');
      monthlySales[month] = (monthlySales[month] || 0) + order.totalAmount;
    });

    // Create a list of all months to ensure we have data for each one
    const allMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const chartData = allMonths.map(month => ({
      name: month,
      total: monthlySales[month] || 0,
    }));
    
    return chartData;
  }

  const chartData = processDataForChart(data);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData}>
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
