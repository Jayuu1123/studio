import { Timestamp } from "firebase/firestore";

export type Sale = {
  name: string;
  email: string;
  amount: string;
};

export type User = {
  id?: string;
  username: string;
  email: string;
  roles: string[];
}

export type Customer = {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  status: 'active' | 'inactive';
  dateAdded: string;
};

export type Product = {
  id: string;
  name:string;
  category: string;
  stock: number;
  price: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
};

export type RequisitionEntry = {
    status: 'A' | 'D' | 'L' | 'P'; // Approved, Denied, Locked, Pending
    user: string;
    docNo: string;
    category: string;
    date: Date;
    department: string;
    productionItem: string;
}

export type TransactionEntry = {
  id?: string;
  submodule: string;
  status: 'A' | 'D' | 'L' | 'P'; // Approved, Denied, Locked, Pending
  user: string;
  docNo?: string;
  docNo_sequential?: number;
  createdAt?: any;
  customFields?: { [key: string]: any }; // To store dynamic header field data
  lineItems?: { [key: string]: any }[]; // To store dynamic detail/grid data
  // Deprecated fields, kept for old data compatibility
  category?: string;
  date?: any;
  department?: string;
  productionItem?: string;
}

export type AppSubmodule = {
  id?: string;
  name: string;
  mainModule: string;
  createdAt: any;
  position: number;
}

export type FormField = {
  id?: string;
  formDefinitionId: string; // Corresponds to submoduleId
  name: string;
  type: string; // e.g., 'text', 'number', 'date', 'boolean', 'select'
  section: 'header' | 'detail'; // Defines where the field appears
}

export type Order = {
    id: string;
    customerId: string;
    orderDate: Timestamp;
    totalAmount: number;
    status: string;
    orderLineItemIds: string[];
}
