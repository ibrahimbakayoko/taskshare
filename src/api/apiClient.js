// src/api/apiClient.js
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// --- DÉFINIR LES URLS BACKEND ---

// !!! UTILISEZ VOTRE ADRESSE IP LOCALE RÉELLE ICI !!!
// (Assurez-vous que c'est bien 192.168.1.14 et qu'il y a des points, pas de point-virgule)
const LOCAL_DEV_URL = "http://192.168.27.65/api"; // Correction du point-virgule
//const LOCAL_DEV_URL = "http://192.168.27.65:5000/api"; // Correction du point-virgule


// URL pour l'émulateur Android (moins pertinent si vous testez sur physique)
const ANDROID_EMULATOR_URL = "http://10.0.2.2:5000/api";

// URL pour le navigateur web
const WEB_URL = "http://192.168.27.65/api";

// --- CHOISIR LA BONNE URL ---
let API_URL;

// Si on est sur le web, utiliser localhost
if (Platform.OS === "web") {
  API_URL = WEB_URL;
} else {
  // Sinon (Android physique, iOS simulateur/physique), utiliser l'IP locale du PC
  API_URL = LOCAL_DEV_URL; // <--- CHANGEMENT IMPORTANT ICI
}

// Log pour vérifier l'URL utilisée (utile pour le débogage)
console.log(`[apiClient] Utilisation de l'URL API : ${API_URL}`);

const apiClient = axios.create({
  // Utiliser la variable API_URL déterminée ci-dessus
  baseURL: API_URL, // <--- CHANGEMENT IMPORTANT ICI
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur pour ajouter le token (reste inchangé)
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
