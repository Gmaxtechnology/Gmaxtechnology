'use client';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseClient';

const BUCKET = 'product-images';
const MAX_SIZE_MB = 5;
const MAX_IMAGES = 5;

export default function MultiImageUploader({
  images,
  onChange,
}: {
  images: string[];
  onChange: (urls: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setError('');

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      setError(`You already have the maximum of ${MAX_IMAGES} extra photos.`);
      e.target.value = '';
      return;
    }

    const toUpload = files.slice(0, remaining);
    setUploading(true);
    const supabase = supabaseBrowser();
    const uploaded: string[] = [];

    for (const file of toUpload) {
      if (!file.type.startsWith('image/')) {
        setError('Please choose image files only.');
        continue;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`Each photo must be under ${MAX_SIZE_MB}MB.`);
        continue;
      }
      const ext = file.name.split('.').pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });
      if (uploadError) {
        setError(uploadError.message);
        continue;
      }
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }

    setUploading(false);
    e.target.value = '';
    if (uploaded.length > 0) {
      onChange([...images, ...uploaded]);
    }
  }

  function remove(url: string) {
    onChange(images.filter((u) => u !== url));
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm text-charcoal mb-1">
        Additional photos — side view, front view, etc. (up to {MAX_IMAGES})
      </label>

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url) => (
            <div key={url} className="relative w-16 h-16 rounded border border-navy/20 overflow-hidden group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => remove(url)}
                className="absolute inset-0 bg-black/60 text-white text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length < MAX_IMAGES && (
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFiles}
          disabled={uploading}
          className="text-sm w-full file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-navy file:text-cream file:text-sm hover:file:bg-navy-light disabled:opacity-50"
        />
      )}
      {uploading && <p className="text-xs text-charcoal/50">Uploading…</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
