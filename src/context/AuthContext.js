// src/context/AuthContext.js
import React, { createContext, useState, useEffect, useCallback } from "react"; // S'assurer que useCallback est importé
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient from "../api/apiClient"; // Assurez-vous que le chemin est correct

// Création du contexte d'authentification
export const AuthContext = createContext();

// Fournisseur (Provider) du contexte
export const AuthProvider = ({ children }) => {
  // --- États du contexte ---
  const [isLoading, setIsLoading] = useState(true); // Indique si la vérification initiale (isLoggedIn) est en cours
  const [userToken, setUserToken] = useState(null); // Stocke le token JWT de l'utilisateur connecté
  const [userInfo, setUserInfo] = useState(null); // Stocke les informations de base de l'utilisateur (id, username, email)
  const [unreadCount, setUnreadCount] = useState(0); // Stocke le nombre de messages non lus

  // --- Fonctions Asynchrones ---

  // Fonction pour récupérer le nombre de messages non lus depuis l'API
  const fetchUnreadCount = useCallback(async () => {
    console.log("[AuthContext] Récupération du compteur non lus...");
    try {
      // Vérifier si un token existe avant de faire l'appel
      const currentToken = await AsyncStorage.getItem("token");
      if (!currentToken) {
        console.log("[AuthContext] Pas de token, arrêt fetchUnreadCount.");
        setUnreadCount(0); // Assurer la réinitialisation si pas de token
        return;
      }
      // Appel à l'API pour obtenir le compte
      const response = await apiClient.get("/messages/unread/count"); // L'intercepteur d'apiClient ajoutera le token
      const count = response.data?.count || 0; // Récupérer le compte ou mettre 0 par défaut
      console.log("[AuthContext] Compteur non lus reçu:", count);
      setUnreadCount(count); // Mettre à jour l'état
    } catch (error) {
      // Gérer les erreurs silencieusement pour ne pas bloquer l'utilisateur
      console.error(
        "[AuthContext] Erreur récupération compteur non lus:",
        error.response?.data || error.message
      );
      // Optionnel: on pourrait décider de laisser l'ancien compte ou de le mettre à 0
      // setUnreadCount(0);
    }
  }, []); // Le tableau de dépendances est vide car la fonction ne dépend que de `apiClient` qui est stable.

  // Fonction pour vérifier si l'utilisateur est déjà connecté au lancement de l'app
  const isLoggedIn = async () => {
    console.log(
      "AuthContext: Début vérification isLoggedIn (au chargement)..."
    );
    try {
      // Récupérer le token et les infos utilisateur depuis le stockage local
      let token = await AsyncStorage.getItem("token");
      let info = await AsyncStorage.getItem("userInfo");
      console.log("AuthContext: Token récupéré depuis AsyncStorage:", token);
      console.log("AuthContext: UserInfo récupéré depuis AsyncStorage:", info);

      // Mettre à jour les états du contexte
      setUserToken(token); // Mettre à jour le token (sera null s'il n'y en a pas)
      setUserInfo(info ? JSON.parse(info) : null); // Parser les infos si elles existent

      // Si un token a été trouvé, on tente de récupérer le nombre de messages non lus
      if (token) {
        fetchUnreadCount();
      } else {
        setUnreadCount(0); // Si pas de token, pas de messages non lus
      }
    } catch (error) {
      // En cas d'erreur de lecture du stockage
      console.error(
        "AuthContext: Erreur AsyncStorage pendant isLoggedIn:",
        error
      );
      // Réinitialiser l'état d'authentification
      setUserToken(null);
      setUserInfo(null);
      setUnreadCount(0);
    } finally {
      // Indiquer que la vérification initiale est terminée
      console.log(
        "AuthContext: Fin vérification isLoggedIn, appel de setIsLoading(false)"
      );
      setIsLoading(false); // Mettre fin à l'état de chargement initial
    }
  };

  // Effet exécuté une seule fois au montage pour vérifier la connexion
  useEffect(() => {
    isLoggedIn();
  }, []); // Le tableau vide assure l'exécution unique au montage

  // Fonction pour gérer la connexion utilisateur
  const login = async (email, password) => {
    console.log("AuthContext: Tentative de connexion pour:", email);
    try {
      // setIsLoading(true); // On peut remettre isLoading à true ici si on veut un indicateur pendant le login lui-même
      const response = await apiClient.post("/auth/login", { email, password });
      console.log("AuthContext: Réponse de /auth/login:", response.data);

      // Si l'API renvoie un token
      if (response.data.token) {
        const receivedToken = response.data.token;
        const receivedUserInfo = response.data.user;

        // Mettre à jour les états du contexte
        setUserToken(receivedToken);
        setUserInfo(receivedUserInfo);

        // Stocker dans AsyncStorage pour la persistance
        await AsyncStorage.setItem("token", receivedToken);
        await AsyncStorage.setItem(
          "userInfo",
          JSON.stringify(receivedUserInfo)
        );
        console.log("AuthContext: Token et UserInfo stockés après login.");

        // Mettre à jour le compteur de messages non lus après connexion
        fetchUnreadCount();
      } else {
        console.warn("AuthContext: Réponse de login sans token.");
      }
      return response.data; // Renvoyer les données pour l'écran de Login
    } catch (error) {
      console.error(
        "AuthContext: Erreur lors du login:",
        error.response?.data || error.message
      );
      // Renvoyer l'erreur pour que l'écran de Login puisse l'afficher
      throw (
        error.response?.data || {
          message: "Une erreur est survenue lors de la connexion",
        }
      );
    } finally {
      // setIsLoading(false); // Si on a mis à true au début du try
    }
  };

  // Fonction pour gérer l'inscription utilisateur
  const register = async (username, email, password) => {
    console.log("AuthContext: Tentative d'inscription pour:", email);
    try {
      // setIsLoading(true); // Indicateur pendant l'inscription
      const response = await apiClient.post("/auth/register", {
        username,
        email,
        password,
      });
      console.log("AuthContext: Réponse de /auth/register:", response.data);

      // Si l'API renvoie un token après inscription
      if (response.data.token) {
        const receivedToken = response.data.token;
        const receivedUserInfo = response.data.user;

        // Mettre à jour l'état
        setUserToken(receivedToken);
        setUserInfo(receivedUserInfo);

        // Stocker dans AsyncStorage
        await AsyncStorage.setItem("token", receivedToken);
        await AsyncStorage.setItem(
          "userInfo",
          JSON.stringify(receivedUserInfo)
        );
        console.log("AuthContext: Token et UserInfo stockés après register.");

        // Mettre à jour le compteur de messages (sera 0 pour un nouvel utilisateur)
        fetchUnreadCount();
      } else {
        console.warn("AuthContext: Réponse de register sans token.");
      }
      return response.data; // Renvoyer les données à l'écran Register
    } catch (error) {
      console.error(
        "AuthContext: Erreur lors de l'inscription:",
        error.response?.data || error.message
      );
      // Renvoyer l'erreur
      throw (
        error.response?.data || {
          message: "Une erreur est survenue lors de l'inscription",
        }
      );
    } finally {
      // setIsLoading(false); // Si mis à true au début
    }
  };

  // Fonction pour gérer la déconnexion
  const logout = async () => {
    console.log("AuthContext: Déconnexion...");
    // Réinitialiser les états
    setUserToken(null);
    setUserInfo(null);
    setUnreadCount(0); // Réinitialiser aussi le compteur de non lus
    try {
      // Supprimer les informations du stockage local
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("userInfo");
      console.log("AuthContext: Token et UserInfo retirés d'AsyncStorage.");
    } catch (error) {
      console.error(
        "AuthContext: Erreur lors de la suppression AsyncStorage:",
        error
      );
    }
    // Pas besoin de setIsLoading ici généralement, la transition est gérée par RootNavigator
  };

  // *** NOUVELLE FONCTION AJOUTÉE ***
  // Fonction pour mettre à jour les informations utilisateur dans le contexte et le stockage
  // Sera appelée par EditProfileScreen après une mise à jour réussie via l'API
  const updateUserInfo = async (newUserInfo) => {
    // Vérifier que les nouvelles informations sont valides
    if (newUserInfo && typeof newUserInfo === "object") {
      console.log(
        "[AuthContext] Mise à jour UserInfo demandée avec:",
        newUserInfo
      );

      // Mettre à jour l'état local 'userInfo' en fusionnant l'ancien et le nouveau
      // Utiliser une fonction de mise à jour pour garantir l'accès à la valeur la plus récente de userInfo
      setUserInfo((currentUserInfo) => {
        const updatedInfo = {
          ...currentUserInfo, // Garder les anciennes infos non modifiées (comme l'ID, le token n'est pas ici)
          ...newUserInfo, // Écraser/ajouter les nouvelles (username, email potentiellement)
        };
        console.log("[AuthContext] Nouvel état userInfo:", updatedInfo);
        return updatedInfo;
      });

      // Mettre à jour également le stockage local AsyncStorage pour la persistance
      try {
        // Récupérer l'état le plus récent pour être sûr avant de sauvegarder
        // C'est un peu redondant si l'appel API renvoie l'objet complet mis à jour
        // On suppose que newUserInfo contient l'état complet et à jour
        const infoToSave = { ...userInfo, ...newUserInfo }; // Assurer la fusion
        await AsyncStorage.setItem("userInfo", JSON.stringify(infoToSave)); // Sauvegarder la version fusionnée
        console.log("[AuthContext] UserInfo mis à jour dans AsyncStorage.");
      } catch (error) {
        console.error(
          "[AuthContext] Erreur lors de la sauvegarde UserInfo mis à jour dans AsyncStorage:",
          error
        );
      }
    } else {
      console.warn(
        "[AuthContext] updateUserInfo appelé sans nouvelles données valides."
      );
    }
  };

  // Rendre le Provider avec les états et fonctions nécessaires
  return (
    <AuthContext.Provider
      value={{
        isLoading, // État de chargement initial
        userToken, // Token JWT (ou null)
        userInfo, // Infos de l'utilisateur ({id, username, email} ou null)
        unreadCount, // Compteur de messages non lus
        login, // Fonction de connexion
        register, // Fonction d'inscription
        logout, // Fonction de déconnexion
        fetchUnreadCount, // Fonction pour rafraîchir le compteur (utilisable par ex. depuis ConversationScreen)
        updateUserInfo, // Fonction pour mettre à jour le profil après édition
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
