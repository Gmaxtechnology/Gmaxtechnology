module.exports = async function handler(req, res) {
  // Vercel sends CRON_SECRET as a Bearer token when it invokes this Cron route.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.authorization || '';
    if (auth !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(503).json({
      ok: false,
      error: 'Supabase environment variables are not configured yet.'
    });
  }

  try {
    // Tiny health check: read at most one product id.
    // With current Supabase publishable keys, send the key in the apikey header.
    const response = await fetch(
      `${supabaseUrl.replace(/\/$/, '')}/rest/v1/products?select=id&limit=1`,
      {
        method: 'GET',
        headers: {
          apikey: supabaseKey,
          Accept: 'application/json',
          'Cache-Control': 'no-store'
        },
        cache: 'no-store'
      }
    );

    const body = await response.text();

    if (!response.ok) {
      return res.status(502).json({
        ok: false,
        supabaseStatus: response.status,
        error: 'Supabase health check failed.'
      });
    }

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      ok: true,
      checkedAt: new Date().toISOString(),
      database: 'reachable',
      sampleReturned: body !== '[]'
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: 'Health check could not reach Supabase.'
    });
  }
};
