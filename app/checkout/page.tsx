'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/CartContext';

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [waFallbackLink, setWaFallbackLink] = useState('');

  if (items.length === 0 && !waFallbackLink) {
    return (
      <div className="max-w-xl mx-auto px-5 py-16 text-center">
        <p className="text-charcoal/70">Your cart is empty.</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    // Open a blank tab synchronously (inside the click/submit handler) so the
    // browser doesn't block it as a popup once we redirect it after the fetch.
    const waWindow = window.open('', '_blank');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer_name: form.name,
          buyer_email: form.email,
          buyer_phone: form.phone,
          buyer_address: form.address,
          notes: form.notes,
          items: items.map((i) => ({ product_id: i.id, product_name: i.name, quantity: i.quantity, unit_price: i.price })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong placing your order.');

      if (waWindow) {
        waWindow.location.href = data.whatsappLink;
      } else {
        setWaFallbackLink(data.whatsappLink);
      }
      clearCart();
      router.push(`/checkout/success?order=${data.orderNumber}`);
    } catch (err: any) {
      waWindow?.close();
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto px-5 py-14">
      <h1 className="font-display text-3xl text-navy mb-2">Checkout</h1>
      <p className="text-charcoal/60 mb-8">Total: ₦{total.toLocaleString()} — we'll email a confirmation and reach out on WhatsApp.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-charcoal mb-1">Full name</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-navy/20 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-charcoal mb-1">Email</label>
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-navy/20 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-charcoal mb-1">Phone number</label>
          <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full border border-navy/20 rounded px-3 py-2" placeholder="0803..." />
        </div>
        <div>
          <label className="block text-sm text-charcoal mb-1">Delivery address</label>
          <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full border border-navy/20 rounded px-3 py-2" rows={2} />
        </div>
        <div>
          <label className="block text-sm text-charcoal mb-1">Notes (optional)</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full border border-navy/20 rounded px-3 py-2" rows={2} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={submitting}
          className="bg-navy text-cream px-6 py-3 rounded font-medium hover:bg-navy-light disabled:opacity-50 w-full">
          {submitting ? 'Placing order…' : 'Place Order'}
        </button>
      </form>

      {waFallbackLink && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded text-sm">
          <p className="mb-2">Your order was placed! Your browser blocked the automatic WhatsApp popup — tap below to send it:</p>
          <a href={waFallbackLink} target="_blank" rel="noopener noreferrer" className="text-navy underline font-medium">
            Open WhatsApp →
          </a>
        </div>
      )}
    </div>
  );
}
