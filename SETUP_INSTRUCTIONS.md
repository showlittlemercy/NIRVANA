# Nirvana E-commerce - Setup Instructions

## Database Setup (IMPORTANT - Do this first!)

### Step 1: Create Supabase Tables

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `evjdktimkpdzcqoqxadj`
3. Click on **SQL Editor** in the left sidebar
4. Copy and paste the SQL from `/app/lib/db-setup.sql` file
5. Click **Run** to execute the SQL and create all tables with sample data

This will create:
- `products` table with 8 sample products
- `orders` table
- `order_items` table
- `cart_items` table
- All necessary policies and permissions

### Step 2: Set Admin Role in Clerk

To access the admin panel, you need to set the admin role in Clerk:

1. Go to Clerk Dashboard: https://dashboard.clerk.com
2. Navigate to **Users** section
3. Click on the user you want to make admin
4. Go to **Metadata** tab
5. In **Public metadata**, add:
```json
{
  "role": "admin"
}
```
6. Save the changes

Now that user can access the admin panel at `/admin`

## Features Implemented

### User Features:
- ✅ User Registration & Login (via Clerk)
- ✅ Browse Products Dashboard
- ✅ Product Detail Page
- ✅ Add to Cart
- ✅ Shopping Cart Management (add/remove/update quantity)
- ✅ Checkout with Shipping Details
- ✅ Cash on Delivery Payment
- ✅ View My Orders
- ✅ Order Confirmation Notification

### Admin Features:
- ✅ Admin Dashboard with Statistics
- ✅ Add New Products
- ✅ View All Orders
- ✅ View All Customers
- ✅ Role-based Access Control

## Theme & Design

- Dark theme with Nirvana-inspired colors (deep purples, blues, blacks with golden accents)
- Smooth card animations on hover
- Gradient text effects
- Responsive design
- Beautiful UI with Tailwind CSS and shadcn/ui components

## Tech Stack

- **Frontend**: Next.js 14 + React
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Backend**: Next.js API Routes

## URLs

- Home/Products: `/`
- Product Detail: `/product/[id]`
- Cart: `/cart`
- Checkout: `/checkout`
- My Orders: `/orders`
- Admin Dashboard: `/admin`
- Add Product: `/admin/products/add`
- View Orders (Admin): `/admin/orders`
- View Customers (Admin): `/admin/customers`

## Creator

**Created with ❤️ by Priyanshu**

---

## Troubleshooting

If products are not showing up:
1. Make sure you ran the SQL setup in Supabase
2. Check that your Supabase credentials in `.env` are correct
3. Verify that Row Level Security policies are properly set up

If admin panel is not accessible:
1. Ensure you've added the "role": "admin" in Clerk user metadata
2. Sign out and sign in again after updating metadata
