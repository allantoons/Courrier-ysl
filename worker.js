// Cloudflare Worker — lecture d'étiquette colis via l'API Claude
// La clé API reste ici (secret ANTHROPIC_API_KEY), jamais dans l'app publique.
//
// Variables à définir dans Cloudflare (Settings > Variables and Secrets) :
//   ANTHROPIC_API_KEY  (secret, obligatoire)
//   ALLOWED_ORIGIN     ex. https://allantoons.github.io  (facultatif, valeur par défaut ci-dessous)
//   MODEL              facultatif, par défaut claude-haiku-4-5-20251001

const MAX_B64 = 5_000_000; // ~3,7 Mo d'image

const PROMPT = `Tu lis une photo d'étiquette de colis reçue par le service courrier d'une entreprise.
Réponds UNIQUEMENT avec un objet JSON, sans texte ni balises autour, de cette forme :
{
  "tracking": string|null,
  "transporteur": "DHL"|"FedEx"|"UPS"|"Chronopost"|"Colissimo"|"TNT"|"Autre"|null,
  "expediteur": string|null,
  "destinataire_nom": string|null,
  "destinataire_societe": string|null,
  "nb_colis": number|null,
  "champs_incertains": string[]
}
Règles :
- N'invente rien. Si une information n'est pas lisible ou absente, mets null.
- tracking : le numéro de suivi principal du transporteur, sans espaces.
- expediteur : la société ou la personne qui envoie (bloc "From", "Expéditeur", "Shipper").
- destinataire_nom : le nom de la PERSONNE destinataire (souvent après "ATTN", "A l'attention de", "c/o" ou au-dessus de l'adresse), pas le nom de la société.
- nb_colis : le nombre TOTAL de colis de l'envoi (ex. "1/3", "PKG 1 OF 3", "Colis 1 sur 3" donne 3). Si rien n'est indiqué, 1.
- champs_incertains : liste des clés dont la lecture est douteuse (texte flou, coupé, ambigu).`;

export default {
  async fetch(request, env) {
    const allowed = env.ALLOWED_ORIGIN || 'https://allantoons.github.io';
    const origin = request.headers.get('Origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': allowed,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    };
    const json = (obj, status = 200) =>
      new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);
    // Filtre basique : ne bloque que les navigateurs d'autres sites, pas un attaquant déterminé.
    if (origin !== allowed) return json({ error: 'Origine non autorisée' }, 403);
    if (!env.ANTHROPIC_API_KEY) return json({ error: 'Clé API non configurée' }, 500);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'Requête invalide' }, 400); }
    const image = body && body.image;
    const mediaType = (body && body.mediaType) || 'image/jpeg';
    if (typeof image !== 'string' || !image.length) return json({ error: 'Image manquante' }, 400);
    if (image.length > MAX_B64) return json({ error: 'Image trop lourde' }, 413);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mediaType)) return json({ error: 'Format non supporté' }, 400);

    const apiResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: env.MODEL || 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
            { type: 'text', text: PROMPT },
          ],
        }],
      }),
    });

    if (!apiResp.ok) {
      const detail = await apiResp.text();
      console.log('Erreur API', apiResp.status, detail.slice(0, 500));
      return json({ error: 'Service de lecture indisponible (' + apiResp.status + ')' }, 502);
    }

    const data = await apiResp.json();
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    const clean = text.replace(/```json|```/g, '').trim();
    let parsed;
    try {
      const start = clean.indexOf('{'), end = clean.lastIndexOf('}');
      parsed = JSON.parse(clean.slice(start, end + 1));
    } catch {
      return json({ error: 'Réponse illisible, reprenez la photo' }, 502);
    }

    // Normalisation défensive
    const str = v => (typeof v === 'string' && v.trim() ? v.trim().slice(0, 200) : null);
    const n = parseInt(parsed.nb_colis, 10);
    return json({
      tracking: str(parsed.tracking) ? str(parsed.tracking).replace(/\s/g, '') : null,
      transporteur: str(parsed.transporteur),
      expediteur: str(parsed.expediteur),
      destinataire_nom: str(parsed.destinataire_nom),
      destinataire_societe: str(parsed.destinataire_societe),
      nb_colis: Number.isFinite(n) && n > 0 && n < 1000 ? n : 1,
      champs_incertains: Array.isArray(parsed.champs_incertains) ? parsed.champs_incertains.map(String).slice(0, 10) : [],
    });
  },
};
