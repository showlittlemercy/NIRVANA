import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/product/(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/products(.*)',
]);

const isAdminRoute = createRouteMatcher([
  '/admin(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
  
  if (isAdminRoute(request)) {
    const { userId, sessionClaims } = await auth();
    
    if (!userId) {
      return Response.redirect(new URL('/sign-in', request.url));
    }
    
    // Check if user has admin role
    const isAdmin = sessionClaims?.metadata?.role === 'admin';
    
    if (!isAdmin) {
      return Response.redirect(new URL('/', request.url));
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};