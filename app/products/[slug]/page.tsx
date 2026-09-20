import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabaseServer';
import AddToCartButton from './AddToCartButton';
import ProductGallery from './ProductGallery';

export const revalidate = 60;

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const supabase = supabaseServer();
  const { data: product } = await supabase.from('products').select('*').eq('slug', params.slug).single();

  if (!product) notFound();

  const { data: extraImages } = await supabase
    .from('product_images')
    .select('image_url')
    .eq('product_id', product.id)
    .order('sort_order');

  const galleryImages = [
    ...(product.image_url ? [product.image_url] : []),
    ...(extraImages || []).map((i: any) => i.image_url),
  ];

  return (
    <div className="max-w-4xl mx-auto px-5 py-14 grid sm:grid-cols-2 gap-10">
      <ProductGallery images={galleryImages} productName={product.name} />
      <div>
        {product.category && <span className="text-xs text-gold-dark uppercase tracking-wide">{product.category}</span>}
        <h1 className="font-display text-3xl text-navy mt-1 mb-3">{product.name}</h1>
        <p className="text-charcoal/70 mb-5">{product.description}</p>
        <p className="text-2xl font-medium text-navy mb-6">₦{Number(product.price).toLocaleString()}</p>
        <AddToCartButton product={product} />
      </div>
    </div>
  );
}
