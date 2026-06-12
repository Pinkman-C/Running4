// Vérifie le mot de passe de l'app (comparé à la variable d'env APP_PASSWORD)
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body || {};

  if (!password) {
    return res.status(400).json({ ok: false, error: 'Password requis' });
  }

  if (password === process.env.APP_PASSWORD) {
    return res.status(200).json({ ok: true });
  }

  return res.status(401).json({ ok: false, error: 'Mot de passe incorrect' });
};
