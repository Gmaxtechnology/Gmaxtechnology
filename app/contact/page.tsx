import { WHATSAPP_NUMBER_1, WHATSAPP_NUMBER_2, buildGeneralWhatsAppLink } from '@/lib/whatsapp';

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-14">
      <h1 className="font-display text-3xl text-navy mb-6">Contact Us</h1>
      <div className="space-y-5 text-charcoal/80">
        <div>
          <h2 className="text-sm font-medium text-charcoal mb-1">Address</h2>
          <p>10, Oremeji Street, Off Simbiat Abiola Street, Ikeja, Lagos, Nigeria.</p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-charcoal mb-1">Opening Hours</h2>
          <p>8:00 AM – 8:00 PM (Monday – Saturday)</p>
        </div>
        <div>
          <h2 className="text-sm font-medium text-charcoal mb-2">WhatsApp</h2>
          <div className="flex flex-col gap-3">
            <a
              href={buildGeneralWhatsAppLink(WHATSAPP_NUMBER_1)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-fit bg-navy text-cream px-5 py-2.5 rounded hover:bg-navy-light"
            >
              +234 802 849 4730
            </a>
            <a
              href={buildGeneralWhatsAppLink(WHATSAPP_NUMBER_2)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-fit bg-navy text-cream px-5 py-2.5 rounded hover:bg-navy-light"
            >
              +234 803 395 8523
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
