import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// GET /api/products - Get all products
// GET /api/products/:id - Get single product
export async function GET(request) {
  try {
    const { pathname } = new URL(request.url);
    
    // Get all products
    if (pathname === '/api/products') {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return NextResponse.json({ success: true, products });
    }
    
    // Get single product
    if (pathname.startsWith('/api/products/')) {
      const id = pathname.split('/').pop();
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return NextResponse.json({ success: true, product });
    }
    
    // Get cart items
    if (pathname === '/api/cart') {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const { data: cartItems, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          products (*)
        `)
        .eq('user_id', userId);

      if (error) throw error;

      return NextResponse.json({ success: true, items: cartItems || [] });
    }
    
    // Get user orders
    if (pathname === '/api/orders') {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return NextResponse.json({ success: true, orders: orders || [] });
    }
    
    // Admin: Get all orders
    if (pathname === '/api/admin/orders') {
      const { userId, sessionClaims } = await auth();
      if (!userId || sessionClaims?.metadata?.role !== 'admin') {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const { data: orders, error } = await supabaseAdmin
        .from('orders')
        .select(`
          *,
          order_items (
            *
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return NextResponse.json({ success: true, orders: orders || [] });
    }
    
    // Admin: Get all customers
    if (pathname === '/api/admin/customers') {
      const { userId, sessionClaims } = await auth();
      if (!userId || sessionClaims?.metadata?.role !== 'admin') {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const { data: orders, error } = await supabaseAdmin
        .from('orders')
        .select('user_id, user_email, user_name, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get unique customers
      const customersMap = new Map();
      orders?.forEach(order => {
        if (!customersMap.has(order.user_email)) {
          customersMap.set(order.user_email, {
            user_id: order.user_id,
            email: order.user_email,
            name: order.user_name,
            first_order: order.created_at
          });
        }
      });

      const customers = Array.from(customersMap.values());
      return NextResponse.json({ success: true, customers });
    }

    return NextResponse.json({ success: false, error: 'Route not found' }, { status: 404 });
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST requests
export async function POST(request) {
  try {
    const { pathname } = new URL(request.url);
    const body = await request.json();
    
    // Add product (admin only)
    if (pathname === '/api/products') {
      const { userId, sessionClaims } = await auth();
      if (!userId || sessionClaims?.metadata?.role !== 'admin') {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const { name, description, price, image_url, category, stock } = body;

      const { data: product, error } = await supabaseAdmin
        .from('products')
        .insert([{ name, description, price, image_url, category, stock }])
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({ success: true, product });
    }
    
    // Add to cart
    if (pathname === '/api/cart') {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const { productId, quantity } = body;

      // Check if item already in cart
      const { data: existing } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .single();

      if (existing) {
        // Update quantity
        const { data, error } = await supabase
          .from('cart_items')
          .update({ quantity: existing.quantity + quantity })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return NextResponse.json({ success: true, item: data });
      } else {
        // Insert new item
        const { data, error } = await supabase
          .from('cart_items')
          .insert([{ user_id: userId, product_id: productId, quantity }])
          .select()
          .single();

        if (error) throw error;
        return NextResponse.json({ success: true, item: data });
      }
    }
    
    // Create order
    if (pathname === '/api/orders') {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const { items, shippingAddress, phone, userName, userEmail } = body;

      if (!items || items.length === 0) {
        return NextResponse.json({ success: false, error: 'Cart is empty' }, { status: 400 });
      }

      // Calculate total
      const total = items.reduce((sum, item) => sum + (item.products.price * item.quantity), 0);

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: userId,
          user_email: userEmail,
          user_name: userName,
          total_amount: total,
          shipping_address: shippingAddress,
          phone: phone,
          status: 'pending'
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.products.name,
        quantity: item.quantity,
        price: item.products.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId);

      return NextResponse.json({ success: true, order });
    }

    return NextResponse.json({ success: false, error: 'Route not found' }, { status: 404 });
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE requests
export async function DELETE(request) {
  try {
    const { pathname } = new URL(request.url);
    
    // Remove from cart
    if (pathname.startsWith('/api/cart/')) {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const id = pathname.split('/').pop();

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Route not found' }, { status: 404 });
  } catch (error) {
    console.error('DELETE Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH requests
export async function PATCH(request) {
  try {
    const { pathname } = new URL(request.url);
    const body = await request.json();
    
    // Update cart quantity
    if (pathname.startsWith('/api/cart/')) {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }

      const id = pathname.split('/').pop();
      const { quantity } = body;

      if (quantity <= 0) {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);

        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, item: data });
    }

    return NextResponse.json({ success: false, error: 'Route not found' }, { status: 404 });
  } catch (error) {
    console.error('PATCH Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}