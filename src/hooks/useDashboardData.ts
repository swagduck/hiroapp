import useSWR from 'swr';
import { useEffect } from 'react';
import { pusherClient } from '@/lib/pusherClient';
import { Session, Package, MenuItem, Order, Ingredient } from '@/types';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useDashboardData() {
  const { data: sessions, mutate: mutateSessions } = useSWR<Session[]>('/api/sessions', fetcher, { 
    revalidateOnFocus: true
  });
  
  const { data: packages, mutate: mutatePackages } = useSWR<Package[]>('/api/packages', fetcher);
  
  const { data: menuItems, mutate: mutateMenu } = useSWR<MenuItem[]>('/api/menu', fetcher);
  
  const { data: orders, mutate: mutateOrders } = useSWR<Order[]>('/api/orders', fetcher, { 
    revalidateOnFocus: true
  });

  const { data: ingredients, mutate: mutateIngredients } = useSWR<Ingredient[]>('/api/inventory', fetcher, {
    revalidateOnFocus: true
  });

  useEffect(() => {
    if (!pusherClient) return;

    const channel = pusherClient.subscribe('pos-channel');

    channel.bind('session-update', () => {
      mutateSessions();
    });

    channel.bind('order-update', () => {
      mutateOrders();
    });

    channel.bind('inventory-update', () => {
      mutateIngredients();
    });

    return () => {
      channel.unbind('session-update');
      channel.unbind('order-update');
      channel.unbind('inventory-update');
      // Only unsubscribe if no other components are using it (usually managed by Pusher itself)
    };
  }, [mutateSessions, mutateOrders, mutateIngredients]);

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
