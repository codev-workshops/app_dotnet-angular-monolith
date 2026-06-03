export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  price: number;
  inventory?: {
    quantityOnHand: number;
  } | null;
}

export interface Order {
  id: number;
  customer?: { name: string } | null;
  orderDate: string;
  status: string;
  totalAmount: number;
}

export interface InventoryItem {
  id: number;
  product?: { name: string } | null;
  quantityOnHand: number;
  reorderLevel: number;
  warehouseLocation: string;
  lastRestocked: string;
}
