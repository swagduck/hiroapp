export interface User {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  role: string;
  points: number;
  freeDrinkTokens: number;
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
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
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
