import apiClient from "./src/api/apiClient"; // Import de l'instance configurée d'axios
import React, { useState, useEffect, useContext } from "react"; // Ajout de useContext
import { AuthContext } from "./src/context/AuthContext"; // Import du contexte d'authentification
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from "react-native"; // Import de Platform et ActivityIndicator

import { StatusBar } from "expo-status-bar";

// Définir les URLs possibles (conservé tel quel)
const webApiUrl = "http://localhost:5000/api"; // Pour le web (et simulateur iOS)
const androidApiUrl = "http://10.0.2.2:5000/api"; // Pour l'émulateur Android
// Pour un appareil physique (iOS ou Android), vous auriez besoin de l'IP locale de votre PC sur le réseau WiFi
// const physicalDeviceApiUrl = 'http://192.168.X.X:5000/api';

// Choisir la bonne URL en fonction de la plateforme (conservé tel quel)
const backendUrl = Platform.OS === "android" ? androidApiUrl : webApiUrl;
// Note : Cette logique simple suppose web ou android emulator. Adaptez si vous ciblez des appareils physiques.
// Note 2: backendUrl n'est plus directement utilisé pour l'appel API si apiClient est configuré avec baseURL, mais gardé ici pour info ou autres usages potentiels.

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false); // État de chargement spécifique aux tâches
  const [error, setError] = useState(null);
  // Récupérer les informations d'authentification du contexte
  const { userToken, isLoading: authIsLoading } = useContext(AuthContext); // Renommé isLoading en authIsLoading pour éviter confusion

  useEffect(() => {
    // Ne fait rien si l'état d'authentification initial est encore en cours de chargement
    if (authIsLoading) {
      console.log("Vérification de l'authentification en cours...");
      return;
    }

    // Si l'utilisateur est connecté (possède un token)
    if (userToken) {
      console.log(
        `Effect exécuté sur ${Platform.OS}. Tentative de récupération des tâches (utilisateur connecté).`
      );
      setIsLoadingTasks(true); // Commencer le chargement des tâches
      setError(null); // Réinitialiser les erreurs précédentes

      // Utiliser l'instance apiClient configurée (qui ajoute le token automatiquement)
      apiClient
        .get("/tasks") // Utiliser le chemin relatif, baseURL est dans apiClient
        .then((response) => {
          console.log("Réponse tâches reçue: ", response.data);
          setTasks(response.data);
          // setError(null); // Déjà fait avant l'appel
        })
        .catch((error) => {
          console.error("Erreur lors de la récupération des tâches:", error);
          if (error.response) {
            // Requête faite, réponse reçue avec un statut d'erreur (4xx, 5xx)
            console.error("Data:", error.response.data);
            console.error("Status:", error.response.status);
            console.error("Headers:", error.response.headers);
            // Gérer spécifiquement le 401 (token invalide/expiré)
            if (error.response.status === 401) {
              setError(
                "Session expirée ou invalide. Veuillez vous reconnecter."
              );
              // Optionnel: Déclencher une déconnexion ici
              // logout(); // Si logout est récupéré du contexte
            } else {
              setError(`Erreur serveur ${error.response.status}`);
            }
          } else if (error.request) {
            // Requête faite, mais pas de réponse reçue (Network Error, CORS block, serveur offline)
            console.error("Request:", error.request);
            setError("Erreur réseau - Impossible de joindre le serveur.");
          } else {
            // Erreur lors de la configuration de la requête
            console.error("Error Message:", error.message);
            setError(`Erreur: ${error.message}`);
          }
        })
        .finally(() => {
          setIsLoadingTasks(false); // Arrêter le chargement des tâches
        });
    } else {
      // L'utilisateur n'est pas connecté
      console.log("Utilisateur non connecté, pas d'appel à /tasks.");
      setError("Veuillez vous connecter pour voir les tâches.");
      setTasks([]); // Vider la liste des tâches
      setIsLoadingTasks(false); // Assurer que le chargement est arrêté
    }
  }, [userToken, authIsLoading]); // Déclencher l'effet si userToken ou authIsLoading change

  // Affichage pendant le chargement initial de l'authentification
  if (authIsLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Vérification...</Text>
        <StatusBar style="auto" />
      </View>
    );
  }

  // Affichage principal
  return (
    <View style={styles.container}>
      {/* Affichage de l'erreur s'il y en a une */}
      {error && <Text style={styles.errorText}>Erreur : {error}</Text>}

      {/* Affichage pendant le chargement des tâches (si pas d'erreur et user connecté) */}
      {!error && isLoadingTasks && userToken && (
        <ActivityIndicator size="large" />
      )}
      {!error && isLoadingTasks && userToken && (
        <Text>Chargement des tâches...</Text>
      )}

      {/* Affichage si pas de tâches et pas en chargement (et pas d'erreur) */}
      {!error && !isLoadingTasks && tasks.length === 0 && userToken && (
        <Text>Aucune tâche trouvée.</Text>
      )}

      {/* Affichage de la liste des tâches (si pas d'erreur, pas en chargement, et des tâches existent) */}
      {!error &&
        !isLoadingTasks &&
        tasks.length > 0 &&
        tasks.map((task) => (
          // Assurez-vous que vos tâches ont bien un 'id' ou '_id' unique pour la key
          <Text key={task._id || task.id}>{task.title}</Text>
        ))}

      <StatusBar style="auto" />
    </View>
  );
}

// Styles (conservés tels quels)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20, // Ajouter un peu de padding
  },
  errorText: {
    color: "red",
    marginBottom: 10,
  },
  // Ajoutez d'autres styles si nécessaire
});
