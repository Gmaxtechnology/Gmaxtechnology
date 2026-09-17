# GMAX Technologies — gmaxtechnology.com.ng

Full rebuild of the GMAX Technologies storefront on the `.com.ng` domain, built with
Next.js + Supabase, ready to deploy on Vercel.

## What's included

- Home, Products (with category filters), Product detail, About, Contact pages — matching
  your current site's content and layout
- Cart + Checkout (guest checkout allowed)
- User registration & login (Supabase Auth, email/password) + order history in "My Account"
- On order placed:
  - Order + line items saved permanently to Supabase (`orders`, `order_items` tables)
  - Confirmation email sent automatically to the buyer, and a copy to your inbox (Gmail SMTP)
  - A WhatsApp chat pre-filled with the order details opens automatically in a new tab,
    addressed to 0802 849 4730 (see note on "automatic" below)
- Admin dashboard (`/admin`) — only visible to accounts you mark as admin:
  - Orders list with status updates (pending / confirmed / fulfilled / cancelled)
  - **Receipt generator** — printable receipt with your logo, itemised order, "Print / Save as PDF"
  - Product manager — add, list, delete products, mark in/out of stock
- Floating WhatsApp button site-wide (both numbers)

## 1. Set up Supabase

1. Open your existing Supabase project → **SQL Editor** → New query.
2. Paste the entire contents of `supabase/schema.sql` and run it. This creates all tables,
   security rules, and seeds your real product listings (Dell Latitude 5440, 5530, HP 14s).
3. Go to **Project Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret — never expose it in client code)
4. On the live site, **register your own account** first (via `/register`).
5. Back in the Supabase SQL editor, run:
   ```sql
   update profiles set is_admin = true where email = 'your-login-email@example.com';
   ```
   Now that account can see `/admin`.

## 2. Set up Storage for product photos

1. In the same **SQL Editor**, paste and run the contents of `supabase/storage-setup.sql`.
   This creates a public `product-images` bucket and locks uploads/deletes to admin
   accounts only (everyone can still *view* the photos — that's what makes them show
   up on the site).
2. That's it — no dashboard clicking needed. Once you're signed in as an admin, the
   **Products** page in `/admin` now has a real "choose photo" file picker: pick an
   image, it uploads straight to Supabase Storage, and the product's photo updates
   immediately (JPG/PNG/etc., up to 5MB). You can also swap the photo on any existing
   product with "Change photo" next to it.

## 3. Set up Gmail for sending order emails

1. Turn on 2-Step Verification on the Gmail account you want to send from:
   https://myaccount.google.com/security
2. Create an App Password: https://myaccount.google.com/apppasswords
   (choose "Mail" as the app) — copy the 16-character password.
3. Use that Gmail address as `GMAIL_USER` and the app password as `GMAIL_APP_PASSWORD`.
   Do **not** use your normal Gmail password — it won't work and isn't safe to store.

## 4. Environment variables

Copy `.env.example` to `.env.local` for local testing, and add the same variables in
**Vercel → Project Settings → Environment Variables** for the live deployment:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GMAIL_USER=
GMAIL_APP_PASSWORD=
ADMIN_NOTIFY_EMAIL=
NEXT_PUBLIC_WHATSAPP_NUMBER_1=2348028494730
NEXT_PUBLIC_WHATSAPP_NUMBER_2=2348161112912
NEXT_PUBLIC_SITE_NAME="GMAX Technologies Ltd"
NEXT_PUBLIC_SITE_URL=https://gmaxtechnology.com.ng
```

## 5. Deploy

1. Push this folder to a new GitHub repository.
2. In Vercel: **New Project → Import** that repo.
3. Add the environment variables above in Vercel's project settings.
4. Deploy. Then in Vercel → **Domains**, add `gmaxtechnology.com.ng` and point your domain's
   DNS (at your registrar) to Vercel as instructed on that screen.

## Note on "automatic" WhatsApp messages

A plain WhatsApp link (`wa.me/...`) can open a chat with the message already typed in, but
WhatsApp does not allow a website to press "Send" on the customer's behalf — the customer
(or whoever's phone opens the link) must tap Send themselves. That's what this site does:
right after checkout, it opens WhatsApp with everything pre-filled, so it's one tap, not a form
to fill out.

True zero-tap sending (the message posted straight to your business number with no tap at all)
requires the official **WhatsApp Business Cloud API** from Meta, which needs a verified Meta
Business account and its own setup outside this codebase. If you get that set up later, swap
the logic in `lib/whatsapp.ts` and `app/api/orders/route.ts` for a server-side API call instead
of the `wa.me` link — happy to help wire that up whenever you're ready.

## Replacing placeholder content

- **Product photos**: currently blank ("No image yet") for the seeded Dell/HP laptops. Go to
  `/admin/products`, hit "Change photo" on each one (or upload one when adding a new product),
  and pick an image — no manual URLs needed anymore.
- **Hero photo**: `public/hero-gadgets.jpg` was reused from your existing site's screenshot.
  Swap in a higher-resolution original photo whenever you have one, at the same filename.
- **About/Contact copy**: edit `app/about/page.tsx` and `app/contact/page.tsx` directly.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your real values
npm run dev
```
