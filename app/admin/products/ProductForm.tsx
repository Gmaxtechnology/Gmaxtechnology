'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseClient';
import ImageUploader from '@/components/ImageUploader';

const categories = ['Laptops', 'Phones & Tablets', 'Office Equipment', 'Home Appliances', 'Networking Gadgets'];

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function ProductForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', description: '', price: '', category: categories[0], image_url: '', in_stock: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const supabase = supabaseBrowser();
    const { error } = await supabase.from('products').insert({
      name: form.name,
      slug: slugify(form.name) + '-' + Date.now().toString(36).slice(-4),
      description: form.description,
      price: parseFloat(form.price) || 0,
      category: form.category,
      image_url: form.image_url || null,
      in_stock: form.in_stock,
    });
    setSaving(false);
    if (error) {
      setError(error.message);
    } else {
      setForm({ name: '', description: '', price: '', category: categories[0], image_url: '', in_stock: true });
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 bg-white border border-navy/10 rounded-lg p-4">
      <input required placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="w-full border border-navy/20 rounded px-3 py-2 text-sm" />
      <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="w-full border border-navy/20 rounded px-3 py-2 text-sm" rows={3} />
      <input required type="number" placeholder="Price (₦)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
        className="w-full border border-navy/20 rounded px-3 py-2 text-sm" />
      <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
        className="w-full border border-navy/20 rounded px-3 py-2 text-sm">
        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <ImageUploader value={form.image_url} onUploaded={(url) => setForm({ ...form, image_url: url })} />
      <label className="flex items-center gap-2 text-sm text-charcoal">
        <input type="checkbox" checked={form.in_stock} onChange={(e) => setForm({ ...form, in_stock: e.target.checked })} />
        In stock
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={saving} className="bg-navy text-cream px-4 py-2 rounded text-sm font-medium hover:bg-navy-light disabled:opacity-50">
        {saving ? 'Saving…' : 'Add product'}
      </button>
    </form>
  );
}
