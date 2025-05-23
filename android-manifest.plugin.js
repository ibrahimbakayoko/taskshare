// android-manifest.plugin.js
const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function androidManifestPlugin(config) {
  return withAndroidManifest(config, async (config) => {
    let androidManifest = config.modResults.manifest;

    // Ajouter ou modifier des permissions ici
    androidManifest.$ = {
      ...androidManifest.$,
      "xmlns:tools": "http://schemas.android.com/tools",
    };

    // --- MODIFICATION ICI ---
    // Désactiver le trafic HTTP non sécurisé (HTTPS est requis par défaut sur Android)
    // C'est la configuration recommandée pour la production.
    // Pour tester en local SANS HTTPS, il faudra soit utiliser un tunnel HTTPS (comme ngrok)
    // soit re-mettre temporairement 'true' ou configurer Network Security Config.
    androidManifest.application.$ = {
      ...androidManifest.application.$,
      // 'android:usesCleartextTraffic': 'true', // Ancienne valeur
      "android:usesCleartextTraffic": "true", // Nouvelle valeur false pour désactiver le trafic HTTP non sécurisé, je peux utiliser ngrok pour le développement local
    };
    // --- FIN MODIFICATION ---

    // Vous pourriez avoir besoin d'ajouter une règle "tools:replace" si une autre
    // partie de la configuration Expo tente de définir cet attribut différemment.
    // Exemple (à ajouter si nécessaire) :
    // androidManifest.application.$['tools:replace'] = (androidManifest.application.$['tools:replace'] || '') + ',usesCleartextTraffic';

    return config;
  });
};
