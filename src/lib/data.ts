import type { Customer, Product, Sale, RequisitionEntry, TransactionEntry, User } from '@/lib/types';

// This file contains placeholder/static data.
// In a real application, this data would be fetched from a database.

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
