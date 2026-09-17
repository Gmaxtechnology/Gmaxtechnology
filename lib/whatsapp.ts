// Builds a wa.me click-to-chat link pre-filled with the order details.
// Note: this opens a chat with the message pre-typed — the customer/browser
// still has to hit "Send" in WhatsApp. True zero-tap sending requires the
// official WhatsApp Business Cloud API, which needs Meta business approval.

export const WHATSAPP_NUMBER_1 = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER_1 || '2348028494730';
export const WHATSAPP_NUMBER_2 = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER_2 || '2348161112912';

export function buildOrderWhatsAppLink(opts: {
  number?: string;
  orderNumber: string;
  buyerName: string;
  buyerPhone: string;
  itemsSummary: string;
  total: number;
}) {
  const number = opts.number || WHATSAPP_NUMBER_1;
  const message =
    `New order #${opts.orderNumber} from GMAX website\n` +
    `Name: ${opts.buyerName}\n` +
    `Phone: ${opts.buyerPhone}\n` +
    `Items: ${opts.itemsSummary}\n` +
    `Total: ₦${opts.total.toLocaleString()}`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function buildGeneralWhatsAppLink(number: string, presetMessage?: string) {
  const message = presetMessage || `Hello ${process.env.NEXT_PUBLIC_SITE_NAME || 'GMAX Technology'}, I'd like to enquire about...`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
