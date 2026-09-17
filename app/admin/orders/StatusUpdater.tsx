'use client';
import { useState, useTransition } from 'react';
import { supabaseBrowser } from '@/lib/supabaseClient';

const statuses = ['pending', 'confirmed', 'fulfilled', 'cancelled'];

export default function StatusUpdater({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    setStatus(newStatus);
    startTransition(async () => {
      const supabase = supabaseBrowser();
      await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    });
  }

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={isPending}
      className="text-sm border border-navy/20 rounded px-2 py-1"
    >
      {statuses.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}
