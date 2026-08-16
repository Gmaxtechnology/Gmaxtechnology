export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb'
    }
  }
};

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || 'v26.0';

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function normalizePhone(value) {
  let p = String(value || '').replace(/\D/g, '');
  // Nigerian local format: 080... -> 23480...
  if (p.startsWith('0') && p.length === 11) p = '234' + p.slice(1);
  return p;
}

async function verifyOrder({ orderNumber, phone, amountPaid }) {
  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) throw new Error('Server order verification is not configured.');

  const query = new URLSearchParams({
    select: 'order_number,phone,total,delivery_method,delivery_status,status',
    order_number: `eq.${orderNumber}`,
    limit: '1'
  });

  const r = await fetch(`${url}/rest/v1/orders?${query.toString()}`, {
    headers: {
      apikey: secretKey
    }
  });

  if (!r.ok) throw new Error('Could not verify this order.');
  const rows = await r.json();
  const order = rows?.[0];
  if (!order) throw new Error('Order number was not found.');

  if (normalizePhone(order.phone) !== normalizePhone(phone)) {
    throw new Error('The phone number does not match this order.');
  }

  if (order.delivery_method === 'home_delivery' && order.delivery_status !== 'quoted') {
    throw new Error('The courier fee has not been confirmed yet. Please wait for GMAX before paying.');
  }

  const expected = Number(order.total || 0);
  const paid = Number(amountPaid || 0);
  if (!Number.isFinite(paid) || Math.abs(expected - paid) > 0.01) {
    throw new Error(`The amount entered does not match the confirmed order total (₦${expected.toLocaleString('en-NG')}).`);
  }

  return order;
}

async function uploadMedia(buffer, mimeType, fileName) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) throw new Error('WhatsApp Cloud API is not configured.');

  const form = new FormData();
  form.append('messaging_product', 'whatsapp');
  form.append('type', mimeType);
  form.append('file', new Blob([buffer], { type: mimeType }), fileName);

  const r = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/media`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form
    }
  );

  const data = await r.json();
  if (!r.ok || !data.id) {
    console.error('WhatsApp media upload error', data);
    throw new Error('WhatsApp could not accept the receipt file.');
  }
  return data.id;
}

async function sendText(to, text) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const r = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text }
      })
    }
  );
  const data = await r.json();
  if (!r.ok) {
    console.error('WhatsApp text error', data);
    throw new Error('WhatsApp message could not be delivered.');
  }
}

async function sendMedia(to, mediaId, mimeType, fileName, orderNumber) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const isPdf = mimeType === 'application/pdf';

  const payload = isPdf
    ? {
        messaging_product: 'whatsapp',
        to,
        type: 'document',
        document: {
          id: mediaId,
          filename: fileName,
          caption: `Payment receipt — ${orderNumber}`
        }
      }
    : {
        messaging_product: 'whatsapp',
        to,
        type: 'image',
        image: {
          id: mediaId,
          caption: `Payment receipt — ${orderNumber}`
        }
      };

  const r = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    }
  );

  const data = await r.json();
  if (!r.ok) {
    console.error('WhatsApp media send error', data);
    throw new Error('The receipt was uploaded but WhatsApp could not deliver it.');
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed.' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const {
      orderNumber,
      customerName,
      phone,
      amountPaid,
      fileName,
      mimeType,
      dataBase64
    } = body;

    if (!orderNumber || !customerName || !phone || !amountPaid || !fileName || !mimeType || !dataBase64) {
      return json(res, 400, { error: 'Please complete every receipt field.' });
    }

    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(mimeType)) {
      return json(res, 400, { error: 'Only JPG, PNG and PDF receipts are accepted.' });
    }

    const buffer = Buffer.from(dataBase64, 'base64');
    if (buffer.length > 2.5 * 1024 * 1024) {
      return json(res, 413, { error: 'Receipt must be below 2.5 MB.' });
    }

    await verifyOrder({ orderNumber, phone, amountPaid });

    const receiver = normalizePhone(process.env.WHATSAPP_RECEIVER_NUMBER);
    if (!receiver) throw new Error('Receiving WhatsApp number is not configured.');

    const mediaId = await uploadMedia(buffer, mimeType, fileName);

    const details =
      `GMAX PAYMENT RECEIPT\n\n` +
      `Order: ${orderNumber}\n` +
      `Customer: ${customerName}\n` +
      `Phone: ${phone}\n` +
      `Amount claimed: ₦${Number(amountPaid).toLocaleString('en-NG')}\n\n` +
      `Please verify the bank payment before marking this order as paid or dispatching goods.`;

    await sendText(receiver, details);
    await sendMedia(receiver, mediaId, mimeType, fileName, orderNumber);

    // The receipt is never written to Supabase Storage, the website folder, or a GMAX database table.
    // It only exists in memory during this request before being passed to WhatsApp Cloud API.
    return json(res, 200, { ok: true });
  } catch (err) {
    console.error(err);
    return json(res, 400, { error: err.message || 'Receipt could not be sent.' });
  }
}
