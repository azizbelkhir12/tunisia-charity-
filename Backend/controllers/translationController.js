const axios = require('axios');

// Cache pour améliorer les performances
const translationCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 heures

function getCacheKey(text, source, target) {
  return `${text}-${source}-${target}`.toLowerCase();
}

exports.translate = async (req, res) => {
  try {
    const { q, source, target } = req.body;

    // Validation
    if (!q || !target) {
      return res.status(400).json({ 
        error: "Paramètres manquants: 'q' (texte) et 'target' (langue cible) sont requis",
        success: false
      });
    }

    // Vérifier le cache d'abord
    const cacheKey = getCacheKey(q, source, target);
    const cached = translationCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('📦 Retour traduction cache:', q.substring(0, 30));
      return res.json({
        ...cached.data,
        cached: true
      });
    }

    console.log(`🌍 Traduction: "${q.substring(0, 50)}..." de ${source} vers ${target}`);

    // MyMemory Translation API
    const response = await axios.get('https://api.mymemory.translated.net/get', {
      params: {
        q: q,
        langpair: `${source === 'auto' ? 'en' : source}|${target}`,
        de: 'contact@tunisiacharity.org' // Email pour plus de quota
      },
      timeout: 10000 // Timeout de 10 secondes
    });

    console.log('📨 Réponse MyMemory:', response.data.responseStatus);

    if (response.data.responseStatus === 200) {
      const translatedText = response.data.responseData.translatedText;
      
      // Nettoyer la traduction (MyMemory retourne parfois des balises HTML)
      const cleanTranslation = translatedText
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .trim();

      const translationResult = {
        translatedText: cleanTranslation,
        originalText: q,
        fromLanguage: response.data.responseData.langpair.split('|')[0],
        success: true,
        cached: false
      };

      // Mettre en cache
      translationCache.set(cacheKey, {
        data: translationResult,
        timestamp: Date.now()
      });

      // Limiter la taille du cache à 500 entrées
      if (translationCache.size > 500) {
        const firstKey = translationCache.keys().next().value;
        translationCache.delete(firstKey);
      }

      res.json(translationResult);
      
    } else if (response.data.responseStatus === 429) {
      // Rate limiting
      res.status(429).json({
        error: "Limite de requêtes dépassée",
        message: "Trop de requêtes de traduction. Veuillez réessayer plus tard.",
        success: false
      });
    } else {
      throw new Error(response.data.responseDetails || `Erreur API: ${response.data.responseStatus}`);
    }

  } catch (error) {
    console.error("❌ Erreur traduction:", error.message);
    
    // Gestion d'erreurs spécifiques
    if (error.code === 'ECONNABORTED') {
      res.status(408).json({ 
        error: "Timeout de traduction",
        message: "La traduction a pris trop de temps. Veuillez réessayer.",
        success: false
      });
    } else if (error.response?.status === 429) {
      res.status(429).json({
        error: "Limite de requêtes dépassée",
        message: "Trop de requêtes de traduction. Veuillez réessayer dans quelques minutes.",
        success: false
      });
    } else {
      res.status(500).json({ 
        error: "Échec de traduction",
        details: error.message,
        success: false
      });
    }
  }
};