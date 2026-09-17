'use client';
import Link from 'next/link';
import { useCart } from '@/components/CartContext';

export default function CartPage() {
  const { items, removeItem, updateQty, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-16 text-center">
        <h1 className="font-display text-2xl text-navy mb-3">Your cart is empty</h1>
        <Link href="/products" className="text-navy underline">
          Browse products →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-14">
      <h1 className="font-display text-3xl text-navy mb-8">Your Cart</h1>
      <div className="divide-y divide-navy/10 border-y border-navy/10">
        {items.map((item) => (
          <div key={item.id} className="py-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-charcoal">{item.name}</p>
              <p className="text-sm text-charcoal/50">₦{item.price.toLocaleString()} each</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => updateQty(item.id, parseInt(e.target.value) || 1)}
                className="w-16 border border-navy/20 rounded px-2 py-1 text-center"
              />
              <button onClick={() => removeItem(item.id)} className="text-sm text-red-600 hover:underline">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-6">
        <span className="font-display text-lg text-navy">Total: ₦{total.toLocaleString()}</span>
        <Link href="/checkout" className="bg-navy text-cream px-6 py-3 rounded font-medium hover:bg-navy-light">
          Proceed to Checkout
        </Link>
      </div>
    </div>
  );
}
