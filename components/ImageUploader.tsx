'use client';
import { useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseClient';

const BUCKET = 'product-images';
const MAX_SIZE_MB = 5;

export default function ImageUploader({
  value,
  onUploaded,
}: {
  value?: string | null;
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(value || null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Image must be under ${MAX_SIZE_MB}MB.`);
      return;
    }

    setUploading(true);
    const supabase = supabaseBrowser();
    const ext = file.name.split('.').pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

    if (uploadError) {
      setUploading(false);
      setError(uploadError.message);
      return;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    setPreview(data.publicUrl);
    setUploading(false);
    onUploaded(data.publicUrl);
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm text-charcoal mb-1">Product photo</label>
      <div className="flex items-center gap-3">
        <div className="w-20 h-20 rounded border border-navy/20 bg-cream flex items-center justify-center overflow-hidden shrink-0">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <span className="text-navy/30 text-xs text-center px-1">No photo</span>
          )}
        </div>
        <div className="flex-1">
          <input
            type="file"
            accept="image/*"
            onChange={handleFile}
            disabled={uploading}
            className="text-sm w-full file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-navy file:text-cream file:text-sm hover:file:bg-navy-light disabled:opacity-50"
          />
          {uploading && <p className="text-xs text-charcoal/50 mt-1">Uploading…</p>}
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      </div>
    </div>
  );
}
