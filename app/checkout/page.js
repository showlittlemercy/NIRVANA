'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const { user } = useUser();
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (user) {
      fetchCart();
      setFormData(prev => ({
        ...prev,
        name: user.fullName || '',
      }));
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart');
      const data = await response.json();
      if (data.success) {
        setCartItems(data.items);
        if (data.items.length === 0) {
          router.push('/cart');
        }
      }
    } catch (error) {
      toast.error('Failed to load cart');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.address) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems,
          shippingAddress: formData.address,
          phone: formData.phone,
          userName: formData.name,
          userEmail: user.emailAddresses[0].emailAddress,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Order placed successfully! 🎉');
        router.push('/orders');
      } else {
        toast.error(data.error || 'Failed to place order');
      }
    } catch (error) {
      toast.error('Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const total = cartItems.reduce(
    (sum, item) => sum + (item.products?.price || 0) * item.quantity,
    0
  );

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link href="/cart">
            <Button variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-500/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cart
            </Button>
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="bg-gradient-to-br from-purple-950/50 to-blue-950/50 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-300">Shipping Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-black/30 border-purple-500/30 focus:border-purple-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="bg-black/30 border-purple-500/30 focus:border-purple-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Shipping Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="bg-black/30 border-purple-500/30 focus:border-purple-500 min-h-[100px]"
                      required
                    />
                  </div>

                  <div className="pt-4">
                    <h3 className="font-semibold mb-2 text-purple-300">Payment Method</h3>
                    <div className="p-4 bg-black/30 rounded-lg border border-purple-500/30">
                      <p className="text-green-400">✓ Cash on Delivery</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Pay when you receive your order
                      </p>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {loading ? 'Placing Order...' : 'Place Order'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="bg-gradient-to-br from-purple-950/50 to-blue-950/50 border-purple-500/30 sticky top-4">
              <CardHeader>
                <CardTitle className="text-purple-300">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm text-gray-400">
                      <span>
                        {item.products?.name} x {item.quantity}
                      </span>
                      <span>${((item.products?.price || 0) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-purple-500/30 pt-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-purple-400">${total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}