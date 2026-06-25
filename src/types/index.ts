export interface User {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  role: string;
  points: number;
  freeDrinkTokens: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItem: MenuItem;
  quantity: number;
  price: number;
  status?: "PENDING" | "PREPARING" | "SERVED" | "CANCELLED";
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  minStock: number;
  currentStock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Package {
  id: string;
  name: string;
  description?: string;
  price: number;
  type: string;
  duration?: number;
  includesDrink: boolean;
  isActive: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  categoryId?: string;
}

export interface Session {
  id: string;
  accessCode: string;
  status: 'PRE_BOOKED' | 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startTime: string;
  endTime?: string;
  totalAmount?: number;
  packageId: string;
  package?: Package;
  user?: User;
  paymentStatus?: 'PAID' | 'UNPAID';
  savedMinutesUsed?: number;
  extraMinutes?: number;
  orders?: Order[];
}

export interface Order {
  id: string;
  status: 'PENDING' | 'PREPARING' | 'SERVED' | 'CANCELLED';
  totalAmount: number;
  createdAt: string;
  isExtension?: boolean;
  extensionPackageId?: string;
}

export interface PosCartItem extends MenuItem {
  quantity: number;
}
