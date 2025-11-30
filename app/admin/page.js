'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ShoppingBag, Users, PlusCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
  });

  const [loadingStats, setLoadingStats] = useState(false);

  // Client-side guard: if user is loaded and not admin, redirect away
  useEffect(() => {
    if (!isLoaded) return;

    // If not signed in, send to sign-in page (Clerk handles the UI)
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }

    const role = user?.publicMetadata?.role || user?.privateMetadata?.role || null;

    if (role !== 'admin') {
      // Not an admin -> redirect to home
      router.push('/');
    } else {
      // If admin, fetch stats
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, user]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      // include credentials so cookies are sent for Clerk auth
      const [productsRes, ordersRes, customersRes] = await Promise.all([
        fetch('/api/products', { credentials: 'same-origin' }),
        fetch('/api/admin/orders', { credentials: 'same-origin' }),
        fetch('/api/admin/customers', { credentials: 'same-origin' }),
      ]);

      // If admin endpoints return 401, redirect to sign-in or home
      if (ordersRes.status === 401 || customersRes.status === 401) {
        router.push('/sign-in');
        return;
      }

      const [productsData, ordersData, customersData] = await Promise.all([
        productsRes.json(),
        ordersRes.json(),
        customersRes.json(),
      ]);

      setStats({
        totalProducts: productsData.success ? (productsData.products?.length ?? 0) : 0,
        totalOrders: ordersData.success ? (ordersData.orders?.length ?? 0) : 0,
        totalCustomers: customersData.success ? (customersData.customers?.length ?? 0) : 0,
      });
    } catch (error) {
      console.error('Failed to fetch stats', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Render a simple loading screen while Clerk user is loading or while stats load
  if (!isLoaded || loadingStats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-300">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-500/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Store
            </Button>
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-purple-950/50 to-blue-950/50 border-purple-500/30 hover:border-purple-500 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-purple-300">Total Products</CardTitle>
              <Package className="h-5 w-5 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-400">{stats.totalProducts}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-950/50 to-blue-950/50 border-purple-500/30 hover:border-purple-500 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-purple-300">Total Orders</CardTitle>
              <ShoppingBag className="h-5 w-5 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-400">{stats.totalOrders}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-950/50 to-blue-950/50 border-purple-500/30 hover:border-purple-500 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-purple-300">Total Customers</CardTitle>
              <Users className="h-5 w-5 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-400">{stats.totalCustomers}</div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin/products/add">
            <Card className="bg-gradient-to-br from-purple-950/50 to-blue-950/50 border-purple-500/30 hover:border-purple-500 transition-all cursor-pointer hover:scale-105">
              <CardContent className="flex flex-col items-center justify-center p-8">
                <PlusCircle className="w-12 h-12 text-purple-400 mb-4" />
                <h3 className="text-xl font-semibold text-purple-300">Add Product</h3>
                <p className="text-sm text-gray-400 mt-2 text-center">
                  Add new products to your store
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/orders">
            <Card className="bg-gradient-to-br from-purple-950/50 to-blue-950/50 border-purple-500/30 hover:border-purple-500 transition-all cursor-pointer hover:scale-105">
              <CardContent className="flex flex-col items-center justify-center p-8">
                <ShoppingBag className="w-12 h-12 text-purple-400 mb-4" />
                <h3 className="text-xl font-semibold text-purple-300">View Orders</h3>
                <p className="text-sm text-gray-400 mt-2 text-center">
                  Manage customer orders
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/customers">
            <Card className="bg-gradient-to-br from-purple-950/50 to-blue-950/50 border-purple-500/30 hover:border-purple-500 transition-all cursor-pointer hover:scale-105">
              <CardContent className="flex flex-col items-center justify-center p-8">
                <Users className="w-12 h-12 text-purple-400 mb-4" />
                <h3 className="text-xl font-semibold text-purple-300">View Customers</h3>
                <p className="text-sm text-gray-400 mt-2 text-center">
                  See all registered customers
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
