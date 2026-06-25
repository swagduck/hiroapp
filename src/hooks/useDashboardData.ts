import useSWR from 'swr';
import { Session, Package, MenuItem, Order, Ingredient } from '@/types';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useDashboardData() {
  const { data: sessions, mutate: mutateSessions } = useSWR<Session[]>('/api/sessions', fetcher, { 
    refreshInterval: 30000,
    revalidateOnFocus: true
  });
  
  const { data: packages, mutate: mutatePackages } = useSWR<Package[]>('/api/packages', fetcher);
  
  const { data: menuItems, mutate: mutateMenu } = useSWR<MenuItem[]>('/api/menu', fetcher);
  
  const { data: orders, mutate: mutateOrders } = useSWR<Order[]>('/api/orders', fetcher, { 
    refreshInterval: 30000,
    revalidateOnFocus: true
  });

  const { data: ingredients, mutate: mutateIngredients } = useSWR<Ingredient[]>('/api/inventory', fetcher, {
    refreshInterval: 60000,
  });

  const loading = !sessions || !packages || !menuItems || !orders || !ingredients;
  
  const pendingOrdersCount = orders ? orders.filter(o => o.status === 'PENDING').length : 0;
  
  const lowStockCount = ingredients ? ingredients.filter(i => i.currentStock <= i.minStock).length : 0;

  const refreshData = () => {
    mutateSessions();
    mutateOrders();
    mutatePackages();
    mutateMenu();
    mutateIngredients();
  };

  return {
    sessions: sessions || [],
    packages: packages || [],
    menuItems: menuItems || [],
    orders: orders || [],
    ingredients: ingredients || [],
    pendingOrdersCount,
    lowStockCount,
    loading,
    refreshData
  };
}
