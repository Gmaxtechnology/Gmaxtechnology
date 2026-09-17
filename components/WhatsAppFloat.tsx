'use client';
import { WHATSAPP_NUMBER_1, WHATSAPP_NUMBER_2, buildGeneralWhatsAppLink } from '@/lib/whatsapp';
import { useState } from 'react';

export default function WhatsAppFloat() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="bg-white rounded-lg shadow-xl p-3 w-56 text-sm">
          <p className="font-medium text-charcoal mb-2">Chat with GMAX on WhatsApp</p>
          <a
            href={buildGeneralWhatsAppLink(WHATSAPP_NUMBER_1)}
            target="_blank"
            rel="noopener noreferrer"
            className="block py-2 px-3 rounded bg-green-50 hover:bg-green-100 mb-2 text-charcoal"
          >
            0802 849 4730
          </a>
          <a
            href={buildGeneralWhatsAppLink(WHATSAPP_NUMBER_2)}
            target="_blank"
            rel="noopener noreferrer"
            className="block py-2 px-3 rounded bg-green-50 hover:bg-green-100 text-charcoal"
          >
            0816 111 2912
          </a>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Chat on WhatsApp"
        className="w-14 h-14 rounded-full bg-[#25D366] shadow-lg flex items-center justify-center text-white text-2xl hover:scale-105 transition-transform"
      >
        ●
      </button>
    </div>
  );
}
