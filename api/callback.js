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
      return res.redirect('/?auth_error=token_exchange_failed');
    }

    // Redirige vers l'app avec les tokens dans l'URL (stockés en localStorage par le frontend)
    const params = new URLSearchParams({
      access_token:  data.access_token,
      refresh_token: data.refresh_token,
      expires_at:    data.expires_at,
    });

    res.redirect(`/?${params.toString()}`);
  } catch (err) {
    console.error('Callback error:', err);
    res.redirect('/?auth_error=server_error');
  }
}
