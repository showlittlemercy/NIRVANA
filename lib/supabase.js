// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Basic validation for required public envs
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL in environment');
}
if (!supabaseAnonKey) {
  console.warn('Warning: NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Client-side Supabase calls may be limited.');
}

// Public (browser-safe) client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-only admin client (null on client)
// NOTE: We create the admin client only when running on the server (no window).
let _supabaseAdmin = null;

if (typeof window === 'undefined') {
  // Running on server
  if (!supabaseServiceKey) {
    // Fail fast on server — having no admin key will cause RLS-related errors if server code expects admin access.
    // Throwing here surfaces the missing config clearly during development/deploy.
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY in server environment. Set SUPABASE_SERVICE_ROLE_KEY (service role) and restart the server.'
    );
  }
  _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Exported admin client (null on client).
 * Use getSupabaseAdminOrThrow() in server code instead of checking this variable.
 */
export const supabaseAdmin = _supabaseAdmin;

/**
 * Helper: returns server admin client or throws helpful error.
 * Use this in server routes / server components.
 */
export function getSupabaseAdminOrThrow() {
  if (!_supabaseAdmin) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not available. Ensure SUPABASE_SERVICE_ROLE_KEY is set in your server environment and that this code is running on the server (not in the browser).'
    );
  }
  return _supabaseAdmin;
}
