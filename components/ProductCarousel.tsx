'use client';
import { useState } from 'react';
import Link from 'next/link';
import type { Product } from './ProductCard';

export default function ProductCarousel({ products }: { products: Product[] }) {
  const [index, setIndex] = useState(0);
  if (!products.length) return null;
  const p = products[index % products.length];

  function prev() {
    setIndex((i) => (i - 1 + products.length) % products.length);
  }
  function next() {
    setIndex((i) => (i + 1) % products.length);
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-navy/10 overflow-hidden">
      <div className="flex items-center">
        <button onClick={prev} aria-label="Previous product" className="px-3 sm:px-5 py-10 text-navy/40 hover:text-navy text-xl">
          ‹
        </button>
        <div className="flex-1 grid sm:grid-cols-2 gap-6 items-center py-6 px-2">
          <div className="aspect-[4/3] bg-cream rounded flex items-center justify-center overflow-hidden">
            {p.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-navy/30 text-sm">No image yet</span>
            )}
          </div>
          <div>
            <h3 className="font-display text-xl text-navy mb-2">{p.name}</h3>
            <p className="text-sm text-charcoal/60 mb-3 whitespace-pre-line">{p.description}</p>
            <p className="text-lg font-medium text-navy mb-2">₦{Number(p.price).toLocaleString()}</p>
            <Link href={`/products/${p.slug}`} className="text-sm text-navy underline hover:text-gold-dark">
              View Product →
            </Link>
          </div>
        </div>
        <button onClick={next} aria-label="Next product" className="px-3 sm:px-5 py-10 text-navy/40 hover:text-navy text-xl">
          ›
        </button>
      </div>
      <div className="flex justify-center gap-1.5 pb-4">
        {products.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Go to product ${i + 1}`}
            className={`w-1.5 h-1.5 rounded-full ${i === index ? 'bg-navy' : 'bg-navy/20'}`}
          />
        ))}
      </div>
    </div>
  );
}
