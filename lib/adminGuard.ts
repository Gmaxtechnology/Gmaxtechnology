import { redirect } from 'next/navigation';
import { supabaseServer } from './supabaseServer';

// Call at the top of any admin Server Component page. Redirects non-admins away.
export async function requireAdmin() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  if (!profile?.is_admin) redirect('/account');

  return { supabase, user };
}
