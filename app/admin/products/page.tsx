import Link from 'next/link';
import { requireAdmin } from '@/lib/adminGuard';
import ProductForm from './ProductForm';
import ProductRow from './ProductRow';

export default async function AdminProductsPage() {
  const { supabase } = await requireAdmin();
  const { data: products } = await supabase.from('products').select('*').order('created_at', { ascending: false });
  const { data: images } = await supabase.from('product_images').select('*').order('sort_order');

  const galleryByProduct = new Map<string, string[]>();
  for (const img of images || []) {
    const list = galleryByProduct.get(img.product_id) || [];
    list.push(img.image_url);
    galleryByProduct.set(img.product_id, list);
  }

  return (
    <div className="max-w-5xl mx-auto px-5 py-14">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl text-navy">Products</h1>
        <Link href="/admin" className="text-sm text-navy underline">← Dashboard</Link>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        <div>
          <h2 className="font-display text-lg text-navy mb-4">Add a product</h2>
          <ProductForm />
        </div>

        <div>
          <h2 className="font-display text-lg text-navy mb-4">Existing products</h2>
          <div className="space-y-3">
            {(products || []).map((p: any) => (
              <ProductRow key={p.id} product={p} initialGallery={galleryByProduct.get(p.id) || []} />
            ))}
            {(!products || products.length === 0) && <p className="text-charcoal/60 text-sm">No products yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
