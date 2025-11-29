'use client';

import { useEffect, useState } from 'react';
import { useUser, SignInButton, UserButton } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Package, User, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function HomePage() {
  const { user, isLoaded } = useUser();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const isAdmin = user?.publicMetadata?.role === 'admin';

  useEffect(() => {
    fetchProducts();
    if (user) {
      fetchCartCount();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      const data = await response.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCartCount = async () => {
    try {
      const response = await fetch('/api/cart');
      const data = await response.json();
      if (data.success) {
        setCartCount(data.items.length);
      }
    } catch (error) {
      console.error('Failed to fetch cart count');
    }
  };

  const addToCart = async (productId) => {
    if (!user) {
      toast.error('Please sign in to add items to cart');
      return;
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Added to cart!');
        fetchCartCount();
      } else {
        toast.error(data.error || 'Failed to add to cart');
      }
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-black/30 border-b border-purple-500/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                NIRVANA
              </span>
            </Link>

            <div className="flex items-center gap-4">
              {isLoaded && user ? (
                <>
                  {isAdmin && (
                    <Link href="/admin">
                      <Button variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-500/20">
                        <User className="w-4 h-4 mr-2" />
                        Admin Panel
                      </Button>
                    </Link>
                  )}
                  <Link href="/orders">
                    <Button variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-500/20">
                      My Orders
                    </Button>
                  </Link>
                  <Link href="/cart">
                    <Button variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-500/20 relative">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Cart
                      {cartCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {cartCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                  <UserButton afterSignOutUrl="/" />
                </>
              ) : (
                <SignInButton mode="modal">
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    Sign In
                  </Button>
                </SignInButton>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
            Welcome to Nirvana
          </h1>
          <p className="text-xl text-gray-400">Discover premium products for your lifestyle</p>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card
                key={product.id}
                className="group bg-gradient-to-br from-purple-950/50 to-blue-950/50 border-purple-500/30 hover:border-purple-500 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 overflow-hidden"
              >
                <CardHeader className="p-0">
                  <div className="relative overflow-hidden h-48">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="text-lg mb-2 text-purple-300">{product.name}</CardTitle>
                  <CardDescription className="text-gray-400 text-sm mb-4">
                    {product.description?.substring(0, 80)}...
                  </CardDescription>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-purple-400">${product.price}</span>
                    <span className="text-sm text-gray-500">{product.stock} in stock</span>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex gap-2">
                  <Link href={`/product/${product.id}`} className="flex-1">
                    <Button variant="outline" className="w-full border-purple-500 text-purple-400 hover:bg-purple-500/20">
                      View Details
                    </Button>
                  </Link>
                  <Button
                    onClick={() => addToCart(product.id)}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-purple-500/20 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-400">
            <p className="text-sm">
              © 2024 Nirvana E-commerce. All rights reserved.
            </p>
            <p className="text-xs mt-2 text-purple-400">
              Created with ❤️ by <span className="font-semibold">Priyanshu</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}