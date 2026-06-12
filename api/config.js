// Expose la config publique de l'app — notamment le domaine canonique de prod.
// VERCEL_PROJECT_PRODUCTION_URL est injectée par Vercel (hôte sans protocole) ;
// fallback sur l'hôte de la requête (dev local, autre hébergeur).
module.exports = async function handler(req, res) {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || req.headers.host || '';
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.json({ canonical_host: host });
};
