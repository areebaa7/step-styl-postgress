'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';
import { notifyAuthState } from '@/lib/authState.client';
import CustomerDashboard from './CustomerDashboard';

type Customer = {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN' | 'INFLUENCER';
  emailVerified: boolean;
  createdAt: string;
};

export default function CustomerAccountPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAccount = async () => {
    try {
      const meResponse = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!meResponse.ok) {
        router.replace('/');
        return;
      }

      const mePayload = await meResponse.json();
      if (!mePayload.user) {
        router.replace('/');
        return;
      }

      if (mePayload.user.role === 'ADMIN') {
        router.replace('/admin');
        return;
      }
      if (mePayload.user.role === 'INFLUENCER') {
        router.replace('/influencer');
        return;
      }

      // Customer authenticated successfully
      setCustomer(mePayload.user as Customer);

      // Fetch customer orders from /api/orders/my-orders and addresses in parallel
      const [ordersRes, addressesRes] = await Promise.all([
        fetch('/api/orders/my-orders', { cache: 'no-store' }),
        fetch('/api/account/addresses', { cache: 'no-store' }),
      ]);

      const ordersPayload = await ordersRes.json().catch(() => ({ success: false, data: [] }));
      const addressesPayload = await addressesRes.json().catch(() => ({ success: false, addresses: [] }));

      if (ordersRes.ok && ordersPayload.success && Array.isArray(ordersPayload.data)) {
        setOrders(ordersPayload.data);
      }
      if (addressesRes.ok && addressesPayload.addresses) {
        setAddresses(addressesPayload.addresses);
      }
    } catch (err) {
      console.error('Failed to load customer account:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    notifyAuthState('signed-out');
    router.push('/');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-32 px-4 text-center">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-base font-semibold text-gray-800">Accessing Customer Portal...</h2>
          <p className="text-xs text-gray-500 mt-1">Verifying secure credentials & loading order history</p>
        </div>
      </div>
    );
  }

  if (!customer) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <CustomerDashboard
        customer={customer}
        initialOrders={orders}
        initialAddresses={addresses}
        onLogout={logout}
      />
    </div>
  );
}
