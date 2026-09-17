import { redirect } from 'next/navigation';
import Link from 'next/link';
import { supabaseServer } from '@/lib/supabaseServer';

export default async function AccountPage() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  async function signOut() {
    'use server';
    const supabase = supabaseServer();
    await supabase.auth.signOut();
    redirect('/');
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-14">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl text-navy">My Account</h1>
          <p className="text-charcoal/60 text-sm">{profile?.full_name || user.email}</p>
        </div>
        <div className="flex gap-3">
          {profile?.is_admin && (
            <Link href="/admin" className="text-sm bg-gold text-navy-dark px-4 py-2 rounded font-medium hover:bg-gold-light">
              Admin Dashboard
            </Link>
          )}
          <form action={signOut}>
            <button className="text-sm border border-navy/20 px-4 py-2 rounded hover:border-navy">Sign out</button>
          </form>
        </div>
      </div>

      <h2 className="font-display text-xl text-navy mb-4">Order history</h2>
      {orders && orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((o: any) => (
            <div key={o.id} className="border border-navy/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-charcoal">#{o.order_number}</span>
                <span className="text-xs uppercase tracking-wide px-2 py-1 rounded bg-cream text-navy">{o.status}</span>
              </div>
              <p className="text-sm text-charcoal/60">{new Date(o.created_at).toLocaleDateString()}</p>
              <ul className="text-sm text-charcoal/70 mt-2 list-disc list-inside">
                {o.order_items.map((it: any) => (
                  <li key={it.id}>{it.product_name} x{it.quantity} — ₦{Number(it.subtotal).toLocaleString()}</li>
                ))}
              </ul>
              <p className="text-right font-medium text-navy mt-2">Total: ₦{Number(o.total).toLocaleString()}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-charcoal/60 text-sm">No orders yet.</p>
      )}
    </div>
  );
}
