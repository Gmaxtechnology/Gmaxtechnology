'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseClient';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.name } },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto px-5 py-16 text-center">
        <h1 className="font-display text-2xl text-navy mb-3">Check your email</h1>
        <p className="text-charcoal/70">We've sent a confirmation link to {form.email}. Confirm it, then sign in.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-5 py-16">
      <h1 className="font-display text-3xl text-navy mb-8">Create an account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-charcoal mb-1">Full name</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-navy/20 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-charcoal mb-1">Email</label>
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-navy/20 rounded px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm text-charcoal mb-1">Password</label>
          <input required type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full border border-navy/20 rounded px-3 py-2" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="w-full bg-navy text-cream px-6 py-3 rounded font-medium hover:bg-navy-light disabled:opacity-50">
          {loading ? 'Creating account…' : 'Register'}
        </button>
      </form>
      <p className="text-sm text-charcoal/60 mt-5">
        Already have an account? <Link href="/login" className="text-navy underline">Sign in</Link>
      </p>
    </div>
  );
}
