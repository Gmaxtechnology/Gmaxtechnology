import Link from 'next/link';
import { requireAdmin } from '@/lib/adminGuard';

export default async function AdminDashboard() {
  const { supabase } = await requireAdmin();

  const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
  const { count: pendingCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending');
  const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
  const { data: revenueRows } = await supabase.from('orders').select('total').neq('status', 'cancelled');
  const revenue = (revenueRows || []).reduce((sum: number, r: any) => sum + Number(r.total), 0);

  const stats = [
    { label: 'Total orders', value: orderCount || 0 },
    { label: 'Pending orders', value: pendingCount || 0 },
    { label: 'Products listed', value: productCount || 0 },
    { label: 'Revenue (non-cancelled)', value: `₦${revenue.toLocaleString()}` },
  ];

  return (
    <div className="max-w-5xl mx-auto px-5 py-14">
      <h1 className="font-display text-3xl text-navy mb-8">Admin Dashboard</h1>

      <div className="grid sm:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="border border-navy/10 rounded-lg p-4 bg-white">
            <p className="text-xs text-charcoal/50 uppercase tracking-wide">{s.label}</p>
            <p className="text-xl font-display text-navy mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4">
        <Link href="/admin/orders" className="bg-navy text-cream px-5 py-3 rounded font-medium hover:bg-navy-light">
          Manage Orders & Receipts
        </Link>
        <Link href="/admin/products" className="border border-navy px-5 py-3 rounded font-medium text-navy hover:bg-navy hover:text-cream">
          Manage Products
        </Link>
      </div>
    </div>
  );
}
