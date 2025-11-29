'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function OrdersPage() {
  const { user } = useUser();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders');
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
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
              Back to Home
            </Button>
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          My Orders
        </h1>

        {orders.length === 0 ? (
          <Card className="bg-gradient-to-br from-purple-950/50 to-blue-950/50 border-purple-500/30">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Package className="w-16 h-16 text-purple-400 mb-4" />
              <p className="text-xl text-gray-400 mb-4">No orders yet</p>
              <Link href="/">
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  Start Shopping
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card
                key={order.id}
                className="bg-gradient-to-br from-purple-950/50 to-blue-950/50 border-purple-500/30 hover:border-purple-500 transition-all"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-purple-300">Order #{order.id.substring(0, 8)}</CardTitle>
                      <p className="text-sm text-gray-400 mt-1">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-purple-500 text-purple-400 bg-purple-500/10"
                    >
                      {order.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {order.order_items?.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-300">
                            {item.product_name} x {item.quantity}
                          </span>
                          <span className="text-purple-400">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-purple-500/30 pt-4">
                      <div className="flex justify-between">
                        <span className="font-semibold">Total</span>
                        <span className="text-xl font-bold text-purple-400">
                          ${parseFloat(order.total_amount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      <p><span className="text-purple-300">Shipping to:</span> {order.shipping_address}</p>
                      <p><span className="text-purple-300">Phone:</span> {order.phone}</p>
                      <p><span className="text-purple-300">Payment:</span> Cash on Delivery</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}