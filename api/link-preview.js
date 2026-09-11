// Fonction serverless Vercel — reçoit un lien, va chercher la page correspondante,
// et en extrait le titre et la photo de la recette. Essaie plusieurs sources dans
// cet ordre (du plus fiable au moins fiable pour un site de recettes) :
//   1. Les données structurées "schema.org/Recipe" (ce que Google utilise aussi
//      pour afficher les recettes dans ses résultats de recherche — presque tous
//      les sites de recettes sérieux les incluent)
//   2. Les balises "og:title" / "og:image" (aperçu de lien standard)
//   3. Les balises "twitter:title" / "twitter:image"
//   4. La balise <title> toute simple, en dernier recours
// Aucune IA nécessaire ici, donc aucun coût — juste une lecture de page.

function decodeEntities(str) {
  if (!str) return str;
  return String(str)
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

function extractImageUrl(image) {
  if (!image) return null;
  if (typeof image === "string") return image;
  if (Array.isArray(image)) return extractImageUrl(image[0]);
  if (typeof image === "object") return image.url || null;
  return null;
}

function extractRecipeJsonLd(html) {
  var scripts = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  for (var i = 0; i < scripts.length; i++) {
    var inner = scripts[i].replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "");
    try {
      var data = JSON.parse(inner.trim());
      var candidates = Array.isArray(data) ? data : (data["@graph"] ? data["@graph"] : [data]);
      for (var j = 0; j < candidates.length; j++) {
        var item = candidates[j];
        if (!item || !item["@type"]) continue;
        var types = Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]];
        if (types.indexOf("Recipe") !== -1) {
          return { title: item.name || null, image: extractImageUrl(item.image) };
        }
      }
    } catch (e) {
      // JSON malformé — on ignore et on essaie le prochain script
    }
  }
  return null;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  try {
    const { url } = req.body || {};
    if (!url || !/^https?:\/\//i.test(url)) {
      return res.status(400).json({ error: "Lien invalide." });
    }

    const pageResponse = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml"
      }
    });

    if (!pageResponse.ok) {
      return res.status(200).json({ title: null, image: null });
    }

    const html = await pageResponse.text();

    var title = null;
    var image = null;

    var recipeData = extractRecipeJsonLd(html);
    if (recipeData) {
      title = recipeData.title;
      image = recipeData.image;
    }

    if (!title) title = getMeta(html, "og:title") || getMeta(html, "twitter:title");
    if (!image) image = getMeta(html, "og:image") || getMeta(html, "twitter:image");

    if (!title) {
      var titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      title = titleMatch ? titleMatch[1].trim() : null;
    }

    return res.status(200).json({
      title: decodeEntities(title),
      image: image || null
    });
  } catch (err) {
    return res.status(200).json({ title: null, image: null });
  }
}
