// Fonction serverless Vercel — reçoit une photo, demande à l'IA d'en extraire
// une recette structurée (titre, ingrédients, étapes...), et renvoie le résultat.
// La clé secrète ANTHROPIC_API_KEY ne quitte jamais ce serveur — jamais visible
// par les visiteurs du site.

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { imageBase64, mediaType } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ error: "Aucune image reçue." });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Clé API manquante côté serveur (ANTHROPIC_API_KEY)." });
    }

    const prompt =
      "Voici une photo d'une carte ou d'une page de recette (peut-être manuscrite ou d'un vieux livre de cuisine). " +
      "Extrait les informations et réponds UNIQUEMENT avec un objet JSON valide, sans aucun texte avant ou après, exactement dans ce format :\n" +
      '{"title": "...", "servings": nombre_ou_null, "prep_min": nombre_ou_null, "cook_min": nombre_ou_null, ' +
      '"ingredients": ["...", "..."], "steps": ["...", "..."]}\n' +
      "Chaque ingrédient doit être une ligne complète (quantité + unité + nom). Chaque étape doit être une phrase complète. " +
      "Si l'écriture est difficile à lire, fais de ton mieux et reste raisonnable. Ne mets rien d'autre que le JSON dans ta réponse.";

    const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType || "image/jpeg", data: imageBase64 } },
              { type: "text", text: prompt }
            ]
          }
        ]
      })
    });

    const data = await aiResponse.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message || "Erreur de l'API IA." });
    }

    const textBlock = (data.content || []).find(function (b) { return b.type === "text"; });
    if (!textBlock) {
      return res.status(500).json({ error: "Réponse inattendue de l'IA." });
    }

    var cleaned = textBlock.text.replace(/```json/g, "").replace(/```/g, "").trim();
    var parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      return res.status(500).json({ error: "Impossible de lire la recette extraite. Réessaie avec une photo plus claire." });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message || "Erreur inconnue." });
  }
}
