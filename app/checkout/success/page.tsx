import Link from 'next/link';

export default function CheckoutSuccessPage({ searchParams }: { searchParams: { order?: string } }) {
  return (
    <div className="max-w-xl mx-auto px-5 py-20 text-center">
      <h1 className="font-display text-3xl text-navy mb-3">Order placed 🎉</h1>
      {searchParams.order && (
        <p className="text-charcoal/70 mb-2">
          Order number: <strong>{searchParams.order}</strong>
        </p>
      )}
      <p className="text-charcoal/70 mb-8">
        A confirmation email is on its way, and we've opened a WhatsApp chat with your order details for you to send.
      </p>
      <Link href="/products" className="text-navy underline">
        Continue shopping →
      </Link>
    </div>
  );
}
