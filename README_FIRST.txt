GMAX TECHNOLOGY ONLINE STORE - START HERE

READY NOW
- Responsive technology-store homepage
- Laptops, Phones & Tablets, Office Equipment, Home Appliances, Networking categories
- Search, category and brand filters
- Product quick-view
- Shopping cart
- WhatsApp checkout
- IT Services section
- About and Contact sections
- Admin dashboard code
- Supabase setup file

IMPORTANT
The store opens immediately in DEMO MODE. Demo products and prices are visibly marked.
Do not launch publicly with demo stock/prices.

QUICKEST WAY TO PUT IT ONLINE
1. Extract this ZIP.
2. Create a NEW GitHub repository, e.g. GMAX-TECHNOLOGY-STORE.
3. Open GitHub Desktop > File > Add local repository, or create the repo and copy these files into it.
4. Commit all files.
5. Push Origin.
6. Open Vercel > Add New > Project.
7. Import the GMAX GitHub repository.
8. Framework Preset: Other.
9. Build Command: leave empty.
10. Output Directory: leave default.
11. Deploy.
12. Open the generated .vercel.app address.

MAKE ADMIN FULLY LIVE
1. Create a dedicated Supabase project for GMAX.
2. Supabase > SQL Editor > paste and run SUPABASE_SETUP.sql.
3. Supabase > Connect / Project Settings: copy Project URL and Publishable/Anon key.
4. Open assets/config.js.
5. Paste them into SUPABASE_URL and SUPABASE_ANON_KEY.
6. Supabase > Authentication > Users > create the admin user.
7. Run the final admin_users INSERT shown at the bottom of SUPABASE_SETUP.sql with the real admin email.
8. Commit and Push the config.js change.
9. Vercel redeploys automatically.
10. Visit /admin.html to sign in and add real products/photos/prices.

PAYMENT
The first version uses WhatsApp checkout. That means it can accept orders immediately without exposing payment secrets. Paystack can be added after product/admin testing.

DOMAIN
You can connect gmaxtechnology.com.ng later. The domain is not required to build or test the store now.

KEEP THE FREE SUPABASE PROJECT ACTIVE + DAILY HEALTH CHECK
----------------------------------------------------------
The website itself is hosted on Vercel. A Vercel site does not normally stop merely because nobody visited it for a week. The common 7-day inactivity pause is Supabase Free Plan behaviour.

This package now includes:
- api/keepalive.js
- a Vercel Cron schedule in vercel.json

The Cron runs once daily at 07:15 UTC (about 08:15 Nigeria time; Hobby execution may occur within that hour). It performs one tiny database health query: SELECT at most one product id.

AFTER GMAX SUPABASE IS CONNECTED, ADD THESE IN VERCEL:
1. Open the GMAX project in Vercel.
2. Open Settings > Environment Variables.
3. Add SUPABASE_URL = the GMAX Supabase Project URL.
4. Add SUPABASE_ANON_KEY = the GMAX Supabase Publishable/Anon key.
5. Add CRON_SECRET = a long random value you create (for example 32+ random characters).
6. Apply them to Production (Preview can be included too if desired).
7. Save each variable.
8. Go to Deployments and Redeploy the latest production deployment, or push a small Git commit.
9. Open Project > Cron Jobs and confirm /api/keepalive is listed.

TESTING
- Do not test /api/keepalive directly in the browser after CRON_SECRET is enabled; it should return Unauthorized because the browser does not send the secret.
- Use Vercel's Cron/Logs pages to confirm successful scheduled requests.

IMPORTANT
- This is a lightweight health check and creates genuine database/API activity.
- Supabase Free Plan pausing is based on low activity over 7 days. For a production business that requires a contractual/no-pause guarantee, use a paid Supabase plan.

KEY COMPATIBILITY NOTE
----------------------
The keep-alive endpoint is compatible with the current Supabase sb_publishable_* key format.
Use the Publishable key (recommended) or legacy anon key in SUPABASE_ANON_KEY.
Never use a Supabase secret/service_role key in assets/config.js.
