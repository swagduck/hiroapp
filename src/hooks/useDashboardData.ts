import useSWR from 'swr';
import { Session, Package, MenuItem, Order } from '@/types';

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

  const loading = !sessions || !packages || !menuItems || !orders;
  
  const pendingOrdersCount = orders ? orders.filter(o => o.status === 'PENDING').length : 0;

  const refreshData = () => {
    mutateSessions();
    mutateOrders();
    mutatePackages();
    mutateMenu();
  };

  return {
    sessions: sessions || [],
    packages: packages || [],
    menuItems: menuItems || [],
    orders: orders || [],
    pendingOrdersCount,
    loading,
    refreshData
  };
}
