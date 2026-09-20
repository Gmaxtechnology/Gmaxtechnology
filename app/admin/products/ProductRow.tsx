'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseClient';
import ImageUploader from '@/components/ImageUploader';
import MultiImageUploader from '@/components/MultiImageUploader';

export default function ProductRow({
  product,
  initialGallery,
}: {
  product: any;
  initialGallery: string[];
}) {
  const router = useRouter();
  const [editingPhoto, setEditingPhoto] = useState(false);
  const [editingGallery, setEditingGallery] = useState(false);
  const [gallery, setGallery] = useState<string[]>(initialGallery);
  const [savingGallery, setSavingGallery] = useState(false);
  const [galleryError, setGalleryError] = useState('');

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

  async function handleGalleryChange(newGallery: string[]) {
    setGallery(newGallery);
    setSavingGallery(true);
    setGalleryError('');
    const supabase = supabaseBrowser();

    // Simplest reliable way to keep this in sync: replace all of this
    // product's gallery rows with the current list, in order.
    const { error: deleteError } = await supabase.from('product_images').delete().eq('product_id', product.id);
    if (deleteError) {
      setSavingGallery(false);
      setGalleryError(deleteError.message);
      return;
    }

    if (newGallery.length > 0) {
      const { error: insertError } = await supabase.from('product_images').insert(
        newGallery.map((image_url, i) => ({ product_id: product.id, image_url, sort_order: i }))
      );
      if (insertError) {
        setSavingGallery(false);
        setGalleryError(insertError.message);
        return;
      }
    }

    setSavingGallery(false);
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
              {gallery.length > 0 && ` · ${gallery.length} extra photo${gallery.length > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button onClick={() => setEditingPhoto(!editingPhoto)} className="text-sm text-navy hover:underline">
            {editingPhoto ? 'Cancel' : 'Change photo'}
          </button>
          <button onClick={() => setEditingGallery(!editingGallery)} className="text-sm text-navy hover:underline">
            {editingGallery ? 'Close gallery' : 'Manage gallery'}
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

      {editingGallery && (
        <div className="mt-3 pt-3 border-t border-navy/10">
          <MultiImageUploader images={gallery} onChange={handleGalleryChange} />
          {savingGallery && <p className="text-xs text-charcoal/50 mt-1">Saving…</p>}
          {galleryError && <p className="text-xs text-red-600 mt-1">{galleryError}</p>}
        </div>
      )}
    </div>
  );
}
