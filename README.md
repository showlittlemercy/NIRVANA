# 🌟 NIRVANA - E-commerce Platform

> *Your gateway to premium products* - Created with ❤️ by **Priyanshu**

A full-stack e-commerce platform built with Next.js, featuring a dark Nirvana-inspired theme with beautiful animations and smooth user experience.

## ✨ Features

### 👤 User Features
- ✅ **Authentication**: Secure sign up and login with Clerk
- ✅ **Product Browsing**: Beautiful product grid with hover animations
- ✅ **Product Details**: Detailed product view with quantity selector
- ✅ **Shopping Cart**: Add, update, and remove items with real-time updates
- ✅ **Checkout**: Simple checkout flow with shipping information
- ✅ **Cash on Delivery**: COD payment method
- ✅ **Order History**: View all past orders with details
- ✅ **Notifications**: Toast notifications for user actions

### 👨‍💼 Admin Features
- ✅ **Admin Dashboard**: Statistics and quick actions
- ✅ **Product Management**: Add new products with images
- ✅ **Order Management**: View all customer orders
- ✅ **Customer Management**: View all registered customers
- ✅ **Role-based Access**: Secure admin-only routes

## 🎨 Design & Theme

- **Dark Nirvana Theme**: Deep purples, blues, and blacks with golden accents
- **Smooth Animations**: Card hover effects and transitions
- **Gradient Effects**: Beautiful gradient text and backgrounds
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Modern UI**: Built with shadcn/ui components

## 🚀 Tech Stack

- **Frontend**: Next.js 14 + React
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Backend**: Next.js API Routes
- **Icons**: Lucide React

## 📋 Prerequisites

Before running the application, you need:

1. Clerk account and API keys
2. Supabase project with database setup
3. Node.js and Yarn installed

## 🔧 Setup Instructions

### Step 1: Database Setup (CRITICAL!)

**You MUST complete this step first before using the application!**

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `evjdktimkpdzcqoqxadj`
3. Click on **SQL Editor** in the left sidebar
4. Open the file `/app/lib/db-setup.sql` in this project
5. Copy the entire SQL content
6. Paste it in the Supabase SQL Editor
7. Click **Run** to execute

This will create:
- `products` table with 8 sample products (headphones, smartwatch, backpack, etc.)
- `orders` table for storing customer orders
- `order_items` table for order line items
- `cart_items` table for shopping cart
- All necessary Row Level Security policies

### Step 2: Admin Setup

To access the admin panel, you need to set the admin role:

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
7. **Sign out and sign in again** for the changes to take effect

### Step 3: Environment Variables

All environment variables are already configured in `.env`:
- ✅ Clerk credentials
- ✅ Supabase credentials
- ✅ Base URL

## 🎯 How to Use

### For Regular Users:

1. **Sign Up/Sign In**: Click "Sign In" button in the top-right
2. **Browse Products**: View all products on the homepage
3. **View Product Details**: Click "View Details" on any product
4. **Add to Cart**: Click "Add to Cart" button
5. **View Cart**: Click the Cart icon in navigation
6. **Checkout**: 
   - Click "Proceed to Checkout" from cart
   - Fill in shipping details
   - Place order with Cash on Delivery
7. **View Orders**: Click "My Orders" in navigation

### For Admins:

1. **Access Admin Panel**: Click "Admin Panel" in navigation (only visible to admins)
2. **Add Products**: 
   - Click "Add Product" card
   - Fill in product details
   - Add image URL from Unsplash or any public source
   - Submit
3. **View Orders**: Click "View Orders" to see all customer orders
4. **View Customers**: Click "View Customers" to see registered users

## 📱 Pages & Routes

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Product listing and browsing |
| Product Detail | `/product/[id]` | Individual product page |
| Cart | `/cart` | Shopping cart management |
| Checkout | `/checkout` | Order checkout and payment |
| My Orders | `/orders` | User's order history |
| Admin Dashboard | `/admin` | Admin overview (admin only) |
| Add Product | `/admin/products/add` | Add new products (admin only) |
| View Orders | `/admin/orders` | All orders (admin only) |
| View Customers | `/admin/customers` | All customers (admin only) |

## 🎨 Color Palette

The Nirvana theme uses:
- **Background**: `#0f0a1e` → `#1a0b2e` (gradient)
- **Primary Purple**: `#8b5cf6` (violet-500)
- **Accent Blue**: `#3b82f6` (blue-500)
- **Border**: Purple with 20-30% opacity
- **Text**: White and gray shades

## 🔐 Security Features

- Role-based access control with Clerk
- Protected API routes with authentication
- Row Level Security policies in Supabase
- Admin-only endpoints verification
- Secure middleware for route protection

## 🐛 Troubleshooting

### Products not showing?
- Make sure you ran the SQL setup in Supabase
- Check Supabase credentials in `.env`
- Verify Row Level Security policies are active

### Can't access admin panel?
- Ensure admin role is set in Clerk user metadata
- Sign out and sign in again after setting the role
- Check browser console for errors

### Cart not updating?
- Make sure you're signed in
- Check if Supabase tables were created properly
- Clear browser cache and try again

### Images not loading?
- Using Unsplash URLs? Make sure they're public
- Check if image URLs are valid
- Try different image sources

## 📝 Sample Products

The database setup includes 8 sample products:
1. Wireless Headphones - $149.99
2. Smart Watch - $299.99
3. Laptop Backpack - $79.99
4. Coffee Maker - $89.99
5. Yoga Mat - $34.99
6. Bluetooth Speaker - $69.99
7. Running Shoes - $119.99
8. Desk Lamp - $45.99

## 🎯 Project Structure

```
/app
├── app/
│   ├── page.js                    # Home page
│   ├── layout.js                  # Root layout with Clerk
│   ├── globals.css                # Global styles
│   ├── cart/page.js               # Shopping cart
│   ├── checkout/page.js           # Checkout page
│   ├── orders/page.js             # User orders
│   ├── product/[id]/page.js       # Product details
│   ├── admin/
│   │   ├── page.js                # Admin dashboard
│   │   ├── products/add/page.js   # Add product
│   │   ├── orders/page.js         # View all orders
│   │   └── customers/page.js      # View customers
│   └── api/[[...path]]/route.js   # API routes
├── components/
│   └── ui/                         # shadcn UI components
├── lib/
│   ├── supabase.js                # Supabase client
│   ├── db-setup.sql               # Database schema
│   └── utils.js                   # Utility functions
├── middleware.js                  # Auth middleware
└── .env                           # Environment variables
```

## 🚦 API Endpoints

### Public Endpoints
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product

### Authenticated Endpoints
- `GET /api/cart` - Get user cart
- `POST /api/cart` - Add to cart
- `PATCH /api/cart/:id` - Update cart item
- `DELETE /api/cart/:id` - Remove from cart
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders

### Admin Only Endpoints
- `POST /api/products` - Add product
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/customers` - Get all customers

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Verify all setup steps were completed
3. Check browser console for errors
4. Ensure database tables are created in Supabase

## 🎉 Credits

**Created by Priyanshu** with passion and dedication.

---

## 🌟 Next Steps

1. ✅ Complete database setup in Supabase
2. ✅ Set admin role in Clerk
3. 🚀 Start exploring the application
4. 🛍️ Add products and place test orders
5. 📊 Monitor orders and customers in admin panel

Enjoy your Nirvana e-commerce experience! 🎊
