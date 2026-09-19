import { redirect } from 'next/navigation';
import { supabaseServer } from './supabaseServer';

// Call at the top of any admin Server Component page. Redirects non-admins away.
export async function requireAdmin() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile, error } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();

  if (error) {
    // A genuine database/permission error — surface it instead of silently
    // bouncing to /account like a normal "you're not an admin" case, so a
    // real bug doesn't look identical to correctly-denied access.
    throw new Error(`Could not verify admin status for ${user.email}: ${error.message} (code: ${error.code})`);
  }

  if (!profile?.is_admin) redirect('/account');

  return { supabase, user };
}
