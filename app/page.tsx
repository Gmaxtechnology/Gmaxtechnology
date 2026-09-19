import Link from 'next/link';
import { supabaseServer } from '@/lib/supabaseServer';
import ProductCarousel from '@/components/ProductCarousel';
import HeroCarousel from '@/components/HeroCarousel';
import { Product } from '@/components/ProductCard';
import { WHATSAPP_NUMBER_1, buildGeneralWhatsAppLink } from '@/lib/whatsapp';

export const revalidate = 60;

export default async function HomePage() {
  const supabase = supabaseServer();
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div>
      {/* Hero */}
      <section className="relative">
        <HeroCarousel />
        <div className="bg-navy">
          <div className="max-w-6xl mx-auto px-5 py-6 flex flex-wrap items-center justify-center gap-4">
            <Link href="/products" className="bg-white text-navy px-6 py-2.5 rounded font-medium hover:bg-cream">
              Shop Now
            </Link>
            <a
              href={buildGeneralWhatsAppLink(WHATSAPP_NUMBER_1, 'Hello GMAX Technologies, I have a question about your products.')}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-cream/40 text-cream px-6 py-2.5 rounded font-medium hover:border-gold hover:text-gold"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Explore products */}
      <section className="max-w-6xl mx-auto px-5 py-16 text-center">
        <h2 className="font-display text-2xl sm:text-3xl text-charcoal mb-2">
          Explore Our <span className="text-navy">Latest Products</span>
        </h2>
        <p className="text-charcoal/60 mb-10">Discover our premium tech collection from laptops to smart devices</p>

        {products && products.length > 0 ? (
          <>
            <div className="text-left">
              <ProductCarousel products={products as Product[]} />
            </div>
            <Link
              href="/products"
              className="inline-block mt-8 bg-navy text-cream px-6 py-3 rounded font-medium hover:bg-navy-light"
            >
              Shop for more Products →
            </Link>
          </>
        ) : (
          <p className="text-charcoal/60 text-sm">
            No products yet — add some from the admin panel at <code>/admin/products</code>.
          </p>
        )}
      </section>
    </div>
  );
}
