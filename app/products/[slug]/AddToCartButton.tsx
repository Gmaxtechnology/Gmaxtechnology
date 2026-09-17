'use client';
import { useCart } from '@/components/CartContext';
import { useState } from 'react';
import Link from 'next/link';
import type { Product } from '@/components/ProductCard';

export default function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => {
          addItem({ id: product.id, name: product.name, price: Number(product.price) });
          setAdded(true);
        }}
        disabled={!product.in_stock}
        className="bg-navy text-cream px-6 py-3 rounded font-medium hover:bg-navy-light disabled:opacity-40 w-fit"
      >
        {product.in_stock ? 'Add to cart' : 'Out of stock'}
      </button>
      {added && (
        <p className="text-sm text-charcoal/70">
          Added to cart. <Link href="/cart" className="text-navy underline">View cart →</Link>
        </p>
      )}
    </div>
  );
}
