import nodemailer from 'nodemailer';

export function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

export async function sendOrderEmails(opts: {
  orderNumber: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerAddress?: string;
  items: { product_name: string; quantity: number; unit_price: number; subtotal: number }[];
  total: number;
}) {
  const transporter = getTransporter();
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'GMAX Technology Ltd';
  const itemsHtml = opts.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;">${i.product_name}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center;">${i.quantity}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;">₦${i.unit_price.toLocaleString()}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right;">₦${i.subtotal.toLocaleString()}</td></tr>`
    )
    .join('');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#1C1C1C;">
      <h2 style="color:#0F2942;">${siteName}</h2>
      <p>Order <strong>#${opts.orderNumber}</strong> received.</p>
      <p><strong>Buyer:</strong> ${opts.buyerName}<br/>
      <strong>Phone:</strong> ${opts.buyerPhone}<br/>
      <strong>Email:</strong> ${opts.buyerEmail}<br/>
      ${opts.buyerAddress ? `<strong>Address:</strong> ${opts.buyerAddress}<br/>` : ''}</p>
      <table style="width:100%;border-collapse:collapse;margin-top:12px;">
        <thead><tr style="background:#F0EDE6;">
          <th style="padding:6px 10px;text-align:left;">Item</th>
          <th style="padding:6px 10px;">Qty</th>
          <th style="padding:6px 10px;text-align:right;">Price</th>
          <th style="padding:6px 10px;text-align:right;">Subtotal</th>
        </tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <p style="text-align:right;font-size:16px;margin-top:10px;"><strong>Total: ₦${opts.total.toLocaleString()}</strong></p>
      <p style="margin-top:20px;color:#555;font-size:13px;">We'll reach out shortly to confirm delivery/payment details.</p>
    </div>
  `;

  // 1. Confirmation to the buyer
  await transporter.sendMail({
    from: `"${siteName}" <${process.env.GMAIL_USER}>`,
    to: opts.buyerEmail,
    subject: `Order Confirmation #${opts.orderNumber} — ${siteName}`,
    html,
  });

  // 2. Notification to the admin/sales inbox
  const notifyTo = process.env.ADMIN_NOTIFY_EMAIL || process.env.GMAIL_USER;
  await transporter.sendMail({
    from: `"${siteName} Orders" <${process.env.GMAIL_USER}>`,
    to: notifyTo,
    subject: `New Order #${opts.orderNumber} from ${opts.buyerName}`,
    html,
  });
}
