import type { Customer, Product, Sale, RequisitionEntry, TransactionEntry } from '@/lib/types';

export const recentSales: Sale[] = [
  {
    name: 'Olivia Martin',
    email: 'olivia.martin@email.com',
    amount: '+$1,999.00',
  },
  {
    name: 'Jackson Lee',
    email: 'jackson.lee@email.com',
    amount: '+$39.00',
  },
  {
    name: 'Isabella Nguyen',
    email: 'isabella.nguyen@email.com',
    amount: '+$299.00',
  },
  {
    name: 'William Kim',
    email: 'will@email.com',
    amount: '+$99.00',
  },
  {
    name: 'Sofia Davis',
    email: 'sofia.davis@email.com',
    amount: '+$39.00',
  },
];

export const salesData = [
  { name: 'Jan', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Feb', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Mar', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Apr', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'May', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Jun', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Jul', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Aug', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Sep', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Oct', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Nov', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'Dec', total: Math.floor(Math.random() * 5000) + 1000 },
];

export const customers: Customer[] = [
  {
    id: 'CUST-001',
    name: 'Innovate Inc.',
    email: 'contact@innovate.com',
    company: 'Innovate Inc.',
    phone: '123-456-7890',
    status: 'active',
    dateAdded: '2023-01-15',
  },
  {
    id: 'CUST-002',
    name: 'Solutions LLC',
    email: 'support@solutions.io',
    company: 'Solutions LLC',
    phone: '234-567-8901',
    status: 'active',
    dateAdded: '2023-02-20',
  },
  {
    id: 'CUST-003',
    name: 'Quantum Corp',
    email: 'admin@quantum.co',
    company: 'Quantum Corp',
    phone: '345-678-9012',
    status: 'inactive',
    dateAdded: '2023-03-10',
  },
];

export const products: Product[] = [
  {
    id: 'PROD-001',
    name: 'Quantum-Grade CPU',
    category: 'Processors',
    stock: 150,
    price: 499.99,
    status: 'in-stock',
  },
  {
    id: 'PROD-002',
    name: 'Cryo-Cooling System',
    category: 'Cooling',
    stock: 45,
    price: 1299.99,
    status: 'low-stock',
  },
  {
    id: 'PROD-003',
    name: 'Superfluid Helium Canister',
    category: 'Consumables',
    stock: 0,
    price: 75.5,
    status: 'out-of-stock',
  },
  {
    id: 'PROD-004',
    name: 'Flux Capacitor Unit',
    category: 'Exotic Components',
    stock: 12,
    price: 18999.0,
    status: 'low-stock',
  },
];

// This is now empty, as we'll be fetching data from Firestore.
export const requisitionEntries: RequisitionEntry[] = [];
export const transactionEntries: TransactionEntry[] = [];
