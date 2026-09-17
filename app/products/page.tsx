import { supabaseServer } from '@/lib/supabaseServer';
import ProductCard, { Product } from '@/components/ProductCard';

export const revalidate = 60;

const categories = ['Laptops', 'Phones & Tablets', 'Office Equipment', 'Home Appliances', 'Networking Gadgets'];

export default async function ProductsPage({ searchParams }: { searchParams: { category?: string } }) {
  const supabase = supabaseServer();
  let query = supabase.from('products').select('*').order('created_at', { ascending: false });
  if (searchParams.category) {
    query = query.eq('category', searchParams.category);
  }
  const { data: products } = await query;

  return (
    <div className="max-w-6xl mx-auto px-5 py-14">
      <h1 className="font-display text-3xl text-navy mb-6">Our Products</h1>

      <div className="flex flex-wrap gap-2 mb-10">
        <a
          href="/products"
          className={`text-sm px-3 py-1.5 rounded-full border ${!searchParams.category ? 'bg-navy text-cream border-navy' : 'border-navy/20 text-charcoal hover:border-navy'}`}
        >
          All
        </a>
        {categories.map((c) => (
          <a
            key={c}
            href={`/products?category=${encodeURIComponent(c)}`}
            className={`text-sm px-3 py-1.5 rounded-full border ${searchParams.category === c ? 'bg-navy text-cream border-navy' : 'border-navy/20 text-charcoal hover:border-navy'}`}
          >
            {c}
          </a>
        ))}
      </div>

      {products && products.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p: Product) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p className="text-charcoal/60">
          No products in this category yet. Add some from <code>/admin/products</code>.
        </p>
      )}
    </div>
  );
}
