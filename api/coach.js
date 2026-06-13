// Vercel serverless — Coach IA : génère un conseil personnalisé via l'API Claude.
// La clé ANTHROPIC_API_KEY reste côté serveur, jamais exposée au frontend.
// Pour passer à un modèle plus puissant, remplace MODEL par 'claude-opus-4-8'.
const MODEL = 'claude-sonnet-4-6';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'missing_api_key' });
  }

  const { system, prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt requis' });
  }

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
        system: system || 'Tu es un coach de course à pied expert et bienveillant.',
        messages: [{ role: 'user', content: prompt.slice(0, 6000) }],
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      console.error('Anthropic error:', data);
      return res.status(502).json({ error: 'api_error', details: data?.error?.message || `http_${r.status}` });
    }
    // Le modèle peut décliner une requête (sécurité) → réponse 200 + stop_reason refusal
    if (data.stop_reason === 'refusal') {
      return res.json({ text: "Je préfère ne pas répondre à ça. Demande-moi plutôt un conseil d'entraînement ou d'adaptation de séance." });
    }

    const text = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n')
      .trim();

    res.json({ text: text || "Je n'ai pas de réponse pour l'instant, réessaie." });
  } catch (err) {
    console.error('Coach error:', err);
    res.status(500).json({ error: 'server_error' });
  }
};
