export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  username: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  sku: string;
}

export interface OrderItem {
  productId: number;
  productName?: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
}

export interface Order {
  id: number;
  customerId: number;
  customerName?: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  items?: OrderItem[];
}

export interface InventoryItem {
  id: number;
  productId: number;
  productName?: string;
  sku: string;
  quantityOnHand: number;
  reorderLevel: number;
  warehouseLocation: string;
  lastRestocked: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role?: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
}

export interface CreateCustomerRequest {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  category: string;
  price: number;
  sku: string;
}

export interface CreateOrderRequest {
  customerId: number;
  items: { productId: number; quantity: number }[];
}

export interface RestockRequest {
  quantity: number;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: string;
}

export interface CreateRoleRequest {
  name: string;
  description: string;
}
