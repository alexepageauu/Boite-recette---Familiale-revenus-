// Fonction serverless Vercel — reçoit un lien, va chercher la page correspondante,
// et en extrait le titre et la photo (balises "og:title" / "og:image", comme le fait
// Facebook ou iMessage pour générer un aperçu de lien). Aucune IA nécessaire ici,
// donc aucun coût — juste une lecture de page.

function decodeEntities(str) {
  if (!str) return str;
  return str
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function getMeta(html, prop) {
  var re1 = new RegExp('<meta[^>]+(?:property|name)=["\']' + prop + '["\'][^>]+content=["\']([^"\']+)["\']', "i");
  var m1 = html.match(re1);
  if (m1) return m1[1];
  var re2 = new RegExp('<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']' + prop + '["\']', "i");
  var m2 = html.match(re2);
  return m2 ? m2[1] : null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { url } = req.body || {};
    if (!url || !/^https?:\/\//i.test(url)) {
      return res.status(400).json({ error: "Lien invalide." });
    }

    const pageResponse = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CarnetDeFamilleBot/1.0)" }
    });

    if (!pageResponse.ok) {
      return res.status(200).json({ title: null, image: null });
    }

    const html = await pageResponse.text();

    var title = getMeta(html, "og:title");
    if (!title) {
      var titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      title = titleMatch ? titleMatch[1].trim() : null;
    }

    var image = getMeta(html, "og:image");

    return res.status(200).json({
      title: decodeEntities(title),
      image: image || null
    });
  } catch (err) {
    return res.status(200).json({ title: null, image: null });
  }
}
