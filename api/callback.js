// Vercel serverless function — échange le code OAuth Strava contre des tokens
// Le client_secret reste côté serveur, jamais exposé dans le frontend

module.exports = async function handler(req, res) {
  const { code, error } = req.query;

  if (error) {
    return res.redirect('/?auth_error=' + encodeURIComponent(error));
  }
  if (!code) {
    return res.redirect('/?auth_error=no_code');
  }
  // Env vars jamais définies, ou déploiement antérieur à leur ajout (un redeploy est requis)
  if (!process.env.STRAVA_CLIENT_ID || !process.env.STRAVA_CLIENT_SECRET) {
    return res.redirect('/?auth_error=missing_server_config');
  }

  try {
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id:     process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    });

    const data = await response.json();

    if (!data.access_token) {
      console.error('Strava token error:', data);
      // Remonte le champ fautif signalé par Strava (client_id / client_secret / code)
      const firstErr = Array.isArray(data.errors) && data.errors[0] ? data.errors[0] : null;
      const detail = firstErr
        ? [firstErr.field, firstErr.code].filter(Boolean).join(' ')
        : (data.message || `http_${response.status}`);
      const qs = new URLSearchParams({
        auth_error: 'token_exchange_failed',
        auth_error_detail: String(detail).slice(0, 80),
      });
      return res.redirect(`/?${qs.toString()}`);
    }

    // Redirige vers l'app avec les tokens dans le fragment (#) : jamais envoyé au
    // serveur, donc absent des logs — le frontend les stocke en localStorage
    const params = new URLSearchParams({
      access_token:  data.access_token,
      refresh_token: data.refresh_token,
      expires_at:    data.expires_at,
    });

    res.redirect(`/#${params.toString()}`);
  } catch (err) {
    console.error('Callback error:', err);
    res.redirect('/?auth_error=server_error');
  }
}
