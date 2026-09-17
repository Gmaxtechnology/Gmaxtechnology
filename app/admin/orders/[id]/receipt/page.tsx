import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/adminGuard';
import PrintButton from './PrintButton';

export default async function ReceiptPage({ params }: { params: { id: string } }) {
  const { supabase } = await requireAdmin();
  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', params.id)
    .single();

  if (!order) notFound();

  const siteName = 'GMAX Technologies Ltd';

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="flex justify-end mb-4 no-print">
        <PrintButton />
      </div>

      <div className="border border-navy/20 rounded-lg p-8 bg-white" id="receipt">
        <div className="flex items-center justify-between border-b border-navy/10 pb-6 mb-6">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt={siteName} className="w-14 h-14 rounded" />
            <div>
              <p className="font-display text-lg text-navy">{siteName}</p>
              <p className="text-xs text-charcoal/50">providing Quality IT Services</p>
              <p className="text-xs text-charcoal/50">10, Oremeji Street, Off Simbiat Abiola Street, Ikeja, Lagos, Nigeria.</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-display text-xl text-navy">RECEIPT</p>
            <p className="text-sm text-charcoal/60">#{order.order_number}</p>
            <p className="text-sm text-charcoal/60">{new Date(order.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p className="text-charcoal/50 mb-1">Billed to</p>
            <p className="text-charcoal">{order.buyer_name}</p>
            <p className="text-charcoal">{order.buyer_phone}</p>
            <p className="text-charcoal">{order.buyer_email}</p>
            {order.buyer_address && <p className="text-charcoal">{order.buyer_address}</p>}
          </div>
          <div className="text-right">
            <p className="text-charcoal/50 mb-1">Status</p>
            <p className="text-charcoal uppercase">{order.status}</p>
          </div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b border-navy/10 text-left text-charcoal/50">
              <th className="py-2">Item</th>
              <th className="py-2 text-center">Qty</th>
              <th className="py-2 text-right">Unit Price</th>
              <th className="py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.order_items.map((it: any) => (
              <tr key={it.id} className="border-b border-navy/5">
                <td className="py-2 text-charcoal">{it.product_name}</td>
                <td className="py-2 text-center text-charcoal">{it.quantity}</td>
                <td className="py-2 text-right text-charcoal">₦{Number(it.unit_price).toLocaleString()}</td>
                <td className="py-2 text-right text-charcoal">₦{Number(it.subtotal).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-48">
            <div className="flex justify-between text-charcoal/70 text-sm mb-1">
              <span>Total</span>
              <span className="font-medium text-navy">₦{Number(order.total).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-charcoal/40 mt-10">Thank you for shopping with GMAX Technologies.</p>
      </div>
    </div>
  );
}
