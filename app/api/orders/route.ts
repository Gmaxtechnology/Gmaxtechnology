import { NextResponse } from 'next/server';
import { supabaseAdmin, supabaseServer } from '@/lib/supabaseServer';
import { sendOrderEmails } from '@/lib/email';
import { buildOrderWhatsAppLink } from '@/lib/whatsapp';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { buyer_name, buyer_email, buyer_phone, buyer_address, notes, items } = body;

    if (!buyer_name || !buyer_email || !buyer_phone || !items?.length) {
      return NextResponse.json({ error: 'Missing required order details.' }, { status: 400 });
    }

    const admin = supabaseAdmin();

    // Attach the order to a logged-in user if there's a session (guests still allowed)
    const authed = supabaseServer();
    const { data: { user } } = await authed.auth.getUser();

    const total = items.reduce((sum: number, i: any) => sum + i.unit_price * i.quantity, 0);

    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        user_id: user?.id || null,
        buyer_name,
        buyer_email,
        buyer_phone,
        buyer_address: buyer_address || null,
        notes: notes || null,
        total,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error(orderError);
      return NextResponse.json({ error: 'Could not save your order. Please try again.' }, { status: 500 });
    }

    const orderItems = items.map((i: any) => ({
      order_id: order.id,
      product_id: i.product_id || null,
      product_name: i.product_name,
      quantity: i.quantity,
      unit_price: i.unit_price,
      subtotal: i.unit_price * i.quantity,
    }));

    const { error: itemsError } = await admin.from('order_items').insert(orderItems);
    if (itemsError) {
      console.error(itemsError);
      // Order row exists but items failed — still proceed, admin can reconcile from the dashboard.
    }

    // Send confirmation + notification emails (best-effort — don't fail the order if email fails)
    try {
      await sendOrderEmails({
        orderNumber: order.order_number,
        buyerName: buyer_name,
        buyerEmail: buyer_email,
        buyerPhone: buyer_phone,
        buyerAddress: buyer_address,
        items: orderItems.map((i: any) => ({
          product_name: i.product_name,
          quantity: i.quantity,
          unit_price: i.unit_price,
          subtotal: i.subtotal,
        })),
        total,
      });
    } catch (emailErr) {
      console.error('Email sending failed:', emailErr);
    }

    const itemsSummary = orderItems.map((i: any) => `${i.product_name} x${i.quantity}`).join(', ');
    const whatsappLink = buildOrderWhatsAppLink({
      orderNumber: order.order_number,
      buyerName: buyer_name,
      buyerPhone: buyer_phone,
      itemsSummary,
      total,
    });

    return NextResponse.json({ orderNumber: order.order_number, whatsappLink });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Unexpected error placing order.' }, { status: 500 });
  }
}
