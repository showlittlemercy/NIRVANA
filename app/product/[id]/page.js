'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShoppingCart, Package } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function ProductDetailPage() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`);
      const data = await response.json();
      if (data.success) {
        setProduct(data.product);
      } else {
        toast.error('Product not found');
        router.push('/');
      }
    } catch (error) {
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async () => {
    if (!user) {
      toast.error('Please sign in to add items to cart');
      return;
    }

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Added to cart!');
        router.push('/cart');
      } else {
        toast.error(data.error || 'Failed to add to cart');
      }
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link href="/">
            <Button variant="outline" className="border-purple-500 text-purple-400 hover:bg-purple-500/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Button>
          </Link>
        </div>

        <Card className="bg-gradient-to-br from-purple-950/50 to-blue-950/50 border-purple-500/30">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="relative">
                <div className="aspect-square rounded-lg overflow-hidden border border-purple-500/30">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h1 className="text-4xl font-bold text-purple-300 mb-2">
                    {product.name}
                  </h1>
                  <div className="flex items-center gap-4">
                    <span className="text-3xl font-bold text-purple-400">
                      ${product.price}
                    </span>
                    <span className="text-sm text-gray-400">
                      {product.stock > 0 ? (
                        <span className="text-green-400">✓ In Stock ({product.stock} available)</span>
                      ) : (
                        <span className="text-red-400">Out of Stock</span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="border-t border-purple-500/30 pt-6">
                  <h3 className="font-semibold text-purple-300 mb-2">Description</h3>
                  <p className="text-gray-400 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <div className="border-t border-purple-500/30 pt-6">
                  <h3 className="font-semibold text-purple-300 mb-2">Details</h3>
                  <div className="space-y-2 text-sm text-gray-400">
                    <p><span className="text-purple-300">Category:</span> {product.category}</p>
                    <p><span className="text-purple-300">Product ID:</span> {product.id.substring(0, 8)}</p>
                  </div>
                </div>

                <div className="border-t border-purple-500/30 pt-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="text-purple-300 font-semibold">Quantity:</label>
                    <div className="flex items-center gap-2 bg-black/30 rounded-lg p-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="h-8 w-8 p-0 hover:bg-purple-500/20"
                      >
                        -
                      </Button>
                      <span className="w-12 text-center">{quantity}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        className="h-8 w-8 p-0 hover:bg-purple-500/20"
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={addToCart}
                    disabled={product.stock === 0}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-12 text-lg"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}