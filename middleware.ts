import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Keeps the Supabase auth session cookie fresh across requests.
//
// IMPORTANT: this runs on EVERY page request. If NEXT_PUBLIC_SUPABASE_URL or
// NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or malformed in Vercel's
// environment variables, createServerClient() throws immediately — and
// because this file has no try/catch, that crash took down every single
// page on the site with "500 MIDDLEWARE_INVOCATION_FAILED". Wrapping it
// means a bad/missing env var no longer brings the whole site down; it
// just means sessions won't refresh until the real env var problem is fixed.
export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      'Middleware: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing. ' +
        'Check Vercel → Project Settings → Environment Variables, then redeploy.'
    );
    return response;
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options });
        },
      },
    });

    await supabase.auth.getUser();
  } catch (err) {
    console.error('Middleware: Supabase session refresh failed:', err);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
  runtime: 'nodejs',
};
