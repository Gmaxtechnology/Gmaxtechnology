import Link from 'next/link';
import { requireAdmin } from '@/lib/adminGuard';
import StatusUpdater from './StatusUpdater';

export default async function AdminOrdersPage() {
  const { supabase } = await requireAdmin();
  const { data: orders } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-5xl mx-auto px-5 py-14">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-navy">Orders</h1>
        <Link href="/admin" className="text-sm text-navy underline">← Dashboard</Link>
      </div>

      <div className="space-y-4">
        {(orders || []).map((o: any) => (
          <div key={o.id} className="border border-navy/10 rounded-lg p-4 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
              <div>
                <span className="font-medium text-charcoal">#{o.order_number}</span>
                <span className="text-charcoal/50 text-sm ml-2">{new Date(o.created_at).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-3">
                <StatusUpdater orderId={o.id} currentStatus={o.status} />
                <Link
                  href={`/admin/orders/${o.id}/receipt`}
                  target="_blank"
                  className="text-sm bg-navy text-cream px-3 py-1.5 rounded hover:bg-navy-light"
                >
                  Generate Receipt
                </Link>
              </div>
            </div>
            <p className="text-sm text-charcoal/70">
              {o.buyer_name} · {o.buyer_phone} · {o.buyer_email}
            </p>
            <ul className="text-sm text-charcoal/60 mt-2 list-disc list-inside">
              {o.order_items.map((it: any) => (
                <li key={it.id}>{it.product_name} x{it.quantity} — ₦{Number(it.subtotal).toLocaleString()}</li>
              ))}
            </ul>
            <p className="text-right font-medium text-navy mt-2">Total: ₦{Number(o.total).toLocaleString()}</p>
          </div>
        ))}
        {(!orders || orders.length === 0) && <p className="text-charcoal/60 text-sm">No orders yet.</p>}
      </div>
    </div>
  );
}
