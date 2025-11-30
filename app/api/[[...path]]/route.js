// app/api/[[...path]]/route.js
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase, supabaseAdmin, getSupabaseAdminOrThrow } from '@/lib/supabase';

/**
 * Helper: get admin supabase client or throw a clear error.
 * Use this for server-side calls that must bypass RLS.
 */
function getAdminClientOrThrow() {
  // Prefer explicit helper if exported by lib; fallback to supabaseAdmin variable.
  if (typeof getSupabaseAdminOrThrow === 'function') {
    return getSupabaseAdminOrThrow();
  }
  if (supabaseAdmin) return supabaseAdmin;
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not configured on server. Please set SUPABASE_SERVICE_ROLE_KEY and ensure admin client is created server-side.');
}

/**
 * Helper: ensure the request is from an admin user.
 * Returns: { ok: true, userId } on success OR a NextResponse (401/403) on failure.
 */
async function requireAdmin() {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized: not signed in' }, { status: 401 });
  }

  // Fast path: session claims metadata
  let role = sessionClaims?.metadata?.role ?? null;

  // If role missing, try dynamic Clerk admin lookup (server only)
  if (!role) {
    try {
      // dynamic require so bundler doesn't include clerk-sdk-node into edge/browser bundles
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { clerkClient } = require('@clerk/clerk-sdk-node');
      if (clerkClient && typeof clerkClient.users?.getUser === 'function') {
        const user = await clerkClient.users.getUser(userId);
        role = user?.publicMetadata?.role ?? user?.privateMetadata?.role ?? null;
      }
    } catch (err) {
      console.warn('requireAdmin: dynamic clerk SDK load failed:', err?.message || err);
    }
  }

  if (role !== 'admin') {
    const help = role === null
      ? 'Role not found in sessionClaims. Set role in Clerk publicMetadata or ensure server-side clerk SDK is available.'
      : `User role is "${role}", admin required.`;
    return NextResponse.json({ success: false, error: `Forbidden: ${help}` }, { status: 403 });
  }

  return { ok: true, userId };
}

/**
 * Helper: require logged-in user (non-admin)
 */
async function requireUser() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized: not signed in' }, { status: 401 });
  }
  return { ok: true, userId };
}

// -------------------- GET handler --------------------
export async function GET(request) {
  try {
    const { pathname } = new URL(request.url);

    // Get all products (public)
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

    // Get cart items (for logged in user) — use admin client to bypass RLS
    if (pathname === '/api/cart') {
      const authCheck = await requireUser();
      if (!authCheck.ok) return authCheck;
      const { userId } = authCheck;

      // Use admin client so RLS won't block server-side read
      const admin = getAdminClientOrThrow();

      const { data: cartItems, error } = await admin
        .from('cart_items')
        .select(`
          *,
          products (*)
        `)
        .eq('user_id', userId);

      if (error) throw error;
      return NextResponse.json({ success: true, items: cartItems || [] });
    }

    // Get user orders (logged-in user)
    if (pathname === '/api/orders') {
      const authCheck = await requireUser();
      if (!authCheck.ok) return authCheck;

      const { userId } = authCheck;
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
      const adminCheck = await requireAdmin();
      if (!adminCheck.ok) return adminCheck;

      const admin = getAdminClientOrThrow();

      const { data: orders, error } = await admin
        .from('orders')
        .select(`
          *,
          order_items ( * )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return NextResponse.json({ success: true, orders: orders || [] });
    }

    // Admin: Get all customers
    if (pathname === '/api/admin/customers') {
      const adminCheck = await requireAdmin();
      if (!adminCheck.ok) return adminCheck;

      const admin = getAdminClientOrThrow();

      const { data: orders, error } = await admin
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

// -------------------- POST handler --------------------
export async function POST(request) {
  try {
    const { pathname } = new URL(request.url);
    const body = await request.json();

    // Add product (admin only)
    if (pathname === '/api/products') {
      const adminCheck = await requireAdmin();
      if (!adminCheck.ok) return adminCheck;

      const { name, description, price, image_url, category, stock } = body;

      const admin = getAdminClientOrThrow();
      const { data: product, error } = await admin
        .from('products')
        .insert([{ name, description, price, image_url, category, stock }])
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, product });
    }

    // Add to cart (logged-in user) — server-side using admin client to bypass RLS
    if (pathname === '/api/cart') {
      // Basic logging for easier debugging
      console.log('POST /api/cart body:', body);

      const authCheck = await requireUser();
      if (!authCheck.ok) return authCheck;

      const { userId } = authCheck;
      const { productId, quantity } = body || {};

      if (!productId) {
        return NextResponse.json({ success: false, error: 'Missing productId' }, { status: 400 });
      }

      const admin = getAdminClientOrThrow();

      // Optional: basic UUID validation (remove if your product IDs are not UUIDs)
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
      if (!uuidRegex.test(productId)) {
        console.warn('POST /api/cart: productId does not match UUID pattern:', productId);
      }

      // Check if item already in cart (server-admin)
      const { data: existing, error: existingErr } = await admin
        .from('cart_items')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .maybeSingle();

      if (existingErr) {
        console.error('Existing check error:', existingErr);
        throw existingErr;
      }

      if (existing) {
        // Update quantity with admin client
        const { data, error } = await admin
          .from('cart_items')
          .update({ quantity: existing.quantity + (quantity || 1) })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          console.error('Update existing error:', error);
          throw error;
        }
        return NextResponse.json({ success: true, item: data });
      } else {
        // Insert new item via admin client
        const { data, error } = await admin
          .from('cart_items')
          .insert([{ user_id: userId, product_id: productId, quantity: quantity || 1 }])
          .select()
          .single();

        if (error) {
          console.error('Insert new error:', error);
          throw error;
        }
        return NextResponse.json({ success: true, item: data });
      }
    }

    // Create order (logged-in user)
    if (pathname === '/api/orders') {
      const authCheck = await requireUser();
      if (!authCheck.ok) return authCheck;

      const { userId } = authCheck;
      const { items, shippingAddress, phone, userName, userEmail } = body;

      if (!items || items.length === 0) {
        return NextResponse.json({ success: false, error: 'Cart is empty' }, { status: 400 });
      }

      // Calculate total
      const total = items.reduce((sum, item) => sum + (item.products.price * item.quantity), 0);

      // Use admin client for order creation (bypass RLS)
      const admin = getAdminClientOrThrow();

      const { data: order, error: orderError } = await admin
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

      // Create order items via admin client
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.products.name,
        quantity: item.quantity,
        price: item.products.price
      }));

      const { error: itemsError } = await admin
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Clear cart (admin)
      try {
        await admin
          .from('cart_items')
          .delete()
          .eq('user_id', userId);
      } catch (e) {
        console.warn('Failed to clear cart_items after order:', e);
      }

      return NextResponse.json({ success: true, order });
    }

    return NextResponse.json({ success: false, error: 'Route not found' }, { status: 404 });
  } catch (error) {
    console.error('POST Error:', error);
    // return DB error detail in development to help debugging
    const body = { success: false, error: error.message ?? String(error) };
    if (process.env.NODE_ENV !== 'production') body.stack = error.stack;
    return NextResponse.json(body, { status: 500 });
  }
}

// -------------------- DELETE handler --------------------
export async function DELETE(request) {
  try {
    const { pathname } = new URL(request.url);

    // Remove from cart — server-side (use admin if available)
    if (pathname.startsWith('/api/cart/')) {
      const authCheck = await requireUser();
      if (!authCheck.ok) return authCheck;

      const { userId } = authCheck;
      const id = pathname.split('/').pop();

      const admin = getAdminClientOrThrow();

      const { error } = await admin
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

// -------------------- PATCH handler --------------------
export async function PATCH(request) {
  try {
    const { pathname } = new URL(request.url);
    const body = await request.json();

    // Update cart quantity — server-side
    if (pathname.startsWith('/api/cart/')) {
      const authCheck = await requireUser();
      if (!authCheck.ok) return authCheck;

      const { userId } = authCheck;
      const id = pathname.split('/').pop();
      const { quantity } = body;

      const admin = getAdminClientOrThrow();

      if (quantity <= 0) {
        const { error } = await admin
          .from('cart_items')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);

        if (error) throw error;
        return NextResponse.json({ success: true });
      }

      const { data, error } = await admin
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

//-------------------finally working hahaha----------------------