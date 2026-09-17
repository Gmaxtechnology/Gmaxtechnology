'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseClient';
import ImageUploader from '@/components/ImageUploader';

export default function ProductRow({ product }: { product: any }) {
  const router = useRouter();
  const [editingPhoto, setEditingPhoto] = useState(false);

  async function handleDelete() {
    if (!confirm('Delete this product?')) return;
    const supabase = supabaseBrowser();
    await supabase.from('products').delete().eq('id', product.id);
    router.refresh();
  }

  async function handleImageUpdate(url: string) {
    const supabase = supabaseBrowser();
    await supabase.from('products').update({ image_url: url }).eq('id', product.id);
    setEditingPhoto(false);
    router.refresh();
  }

  return (
    <div className="border border-navy/10 rounded-lg p-3 bg-white">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded bg-cream border border-navy/10 flex items-center justify-center overflow-hidden shrink-0">
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-navy/30 text-[10px]">No photo</span>
            )}
          </div>
          <div>
            <p className="text-charcoal">{product.name}</p>
            <p className="text-xs text-charcoal/50">
              {product.category} · ₦{Number(product.price).toLocaleString()} · {product.in_stock ? 'In stock' : 'Out of stock'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={() => setEditingPhoto(!editingPhoto)} className="text-sm text-navy hover:underline">
            {editingPhoto ? 'Cancel' : 'Change photo'}
          </button>
          <button onClick={handleDelete} className="text-sm text-red-600 hover:underline">
            Delete
          </button>
        </div>
      </div>
      {editingPhoto && (
        <div className="mt-3 pt-3 border-t border-navy/10">
          <ImageUploader value={product.image_url} onUploaded={handleImageUpdate} />
        </div>
      )}
    </div>
  );
}
