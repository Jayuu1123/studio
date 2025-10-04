export type Sale = {
  name: string;
  email: string;
  amount: string;
};

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
  name: string;
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
