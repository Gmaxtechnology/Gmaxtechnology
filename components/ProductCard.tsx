'use client';
import Link from 'next/link';
import { useCart } from './CartContext';

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  in_stock: boolean;
};

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  return (
    <div className="border border-navy/10 rounded-lg overflow-hidden flex flex-col bg-white">
      <Link href={`/products/${product.slug}`} className="block aspect-[4/3] bg-cream flex items-center justify-center overflow-hidden">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-navy/30 text-sm">No image yet</span>
        )}
      </Link>
      <div className="p-4 flex flex-col flex-1">
        {product.category && <span className="text-xs text-gold-dark uppercase tracking-wide">{product.category}</span>}
        <Link href={`/products/${product.slug}`} className="font-display text-charcoal mt-1 hover:text-navy">
          {product.name}
        </Link>
        <p className="text-sm text-charcoal/60 mt-1 line-clamp-2 flex-1">{product.description}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="font-medium text-navy">₦{product.price.toLocaleString()}</span>
          <button
            onClick={() => addItem({ id: product.id, name: product.name, price: product.price })}
            disabled={!product.in_stock}
            className="text-sm px-3 py-1.5 rounded bg-navy text-cream hover:bg-navy-light disabled:opacity-40"
          >
            {product.in_stock ? 'Add to cart' : 'Out of stock'}
          </button>
        </div>
      </div>
    </div>
  );
}
