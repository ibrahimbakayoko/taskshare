// src/context/ThemeContext.js
import React, {
  createContext,
  useState,
  useCallback,
  useMemo,
  useEffect, // Ajouter useEffect pour charger les couleurs
  useContext, // Ajouter useContext pour accéder au AuthContext
} from "react";
import { useColorScheme } from "react-native";
import {
  MD3DarkTheme,
  MD3LightTheme,
  adaptNavigationTheme,
  // Provider as PaperProvider, // L'import de PaperProvider est fait dans index.js
} from "react-native-paper";
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from "@react-navigation/native";
import { AuthContext } from "./AuthContext"; // Importer AuthContext pour le token
import apiClient from "../api/apiClient"; // Importer apiClient pour les appels API

// --- Configuration Initiale des Thèmes (inchangée) ---
// Adapter les thèmes de navigation pour react-native-paper
const { LightTheme: AdaptedNavigationLight, DarkTheme: AdaptedNavigationDark } =
  adaptNavigationTheme({
    reactNavigationLight: NavigationDefaultTheme,
    reactNavigationDark: NavigationDarkTheme,
  });

// Thèmes Paper par défaut (seront la base avant personnalisation)
const BaseLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...AdaptedNavigationLight.colors,
  },
};
const BaseDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...AdaptedNavigationDark.colors,
  },
};
// --- Fin Configuration Initiale ---

// Création du contexte de thème
export const ThemeContext = createContext({
  isDarkMode: false,
  theme: BaseLightTheme, // Utiliser le thème de base par défaut initialement
  customPrimary: null, // Nouvelle valeur exposée
  customSecondary: null, // Nouvelle valeur exposée
  toggleTheme: () => {},
  updatePrimaryColor: async (color) => {}, // Nouvelle fonction exposée
  updateSecondaryColor: async (color) => {}, // Nouvelle fonction exposée
  isLoadingTheme: true, // Nouvel état pour indiquer le chargement des couleurs perso
});

// Fournisseur du contexte
export const ThemeProvider = ({ children }) => {
  const colorScheme = useColorScheme(); // Détecte le mode système (clair/sombre)
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === "dark");

  // --- NOUVEAUX ÉTATS pour les couleurs personnalisées ---
  const [customPrimary, setCustomPrimary] = useState(null);
  const [customSecondary, setCustomSecondary] = useState(null);
  const [isLoadingTheme, setIsLoadingTheme] = useState(true); // Indique si on charge les couleurs

  // Accéder au token utilisateur pour savoir quand charger les settings
  const { userToken } = useContext(AuthContext);

  // --- EFFET pour charger les couleurs personnalisées ---
  useEffect(() => {
    const loadCustomColors = async () => {
      console.log(
        "[ThemeContext] Tentative de chargement des couleurs perso..."
      );
      setIsLoadingTheme(true); // Commencer le chargement
      try {
        // Appel API pour récupérer tous les settings utilisateur
        const response = await apiClient.get("/settings");
        const settingsData = response.data;
        console.log("[ThemeContext] Settings reçus:", settingsData);

        // Mettre à jour les états des couleurs personnalisées si elles existent
        if (settingsData?.primary_color) {
          setCustomPrimary(settingsData.primary_color);
        } else {
          setCustomPrimary(null); // Réinitialiser si pas de couleur définie
        }
        if (settingsData?.secondary_color) {
          setCustomSecondary(settingsData.secondary_color);
        } else {
          setCustomSecondary(null); // Réinitialiser si pas de couleur définie
        }
        // Optionnel: Synchroniser le mode sombre avec celui de la DB ?
        // if (settingsData?.theme && (settingsData.theme === 'dark') !== isDarkMode) {
        //    setIsDarkMode(settingsData.theme === 'dark');
        // }
      } catch (error) {
        console.error(
          "[ThemeContext] Erreur chargement couleurs perso:",
          error.response?.data || error.message
        );
        // En cas d'erreur, on garde les couleurs par défaut (null)
        setCustomPrimary(null);
        setCustomSecondary(null);
      } finally {
        setIsLoadingTheme(false); // Fin du chargement
        console.log("[ThemeContext] Fin chargement couleurs perso.");
      }
    };

    // Charger les couleurs seulement si l'utilisateur est connecté
    if (userToken) {
      loadCustomColors();
    } else {
      // Si l'utilisateur se déconnecte, réinitialiser les couleurs et arrêter le chargement
      setCustomPrimary(null);
      setCustomSecondary(null);
      setIsLoadingTheme(false);
    }
    // Cet effet dépend du userToken: il se relance si l'utilisateur se connecte/déconnecte
  }, [userToken]);

  // --- Fonction pour basculer le thème clair/sombre ---
  const toggleTheme = useCallback(() => {
    setIsDarkMode((prevMode) => !prevMode);
    // TODO: Optionnel - Sauvegarder la préférence 'light'/'dark' via une API /settings/theme ?
  }, []);

  // --- NOUVELLES FONCTIONS pour mettre à jour les couleurs ---
  const updatePrimaryColor = useCallback(
    async (newColor) => {
      const previousColor = customPrimary; // Sauvegarder l'ancienne couleur
      setCustomPrimary(newColor); // Mettre à jour l'état local immédiatement (optimiste)
      try {
        console.log("[ThemeContext] MAJ couleur primaire vers:", newColor);
        // Appel API pour sauvegarder
        await apiClient.patch("/settings/color/primary", { color: newColor });
      } catch (error) {
        console.error("[ThemeContext] Erreur MAJ couleur primaire:", error);
        setCustomPrimary(previousColor); // Revenir à l'ancienne couleur en cas d'erreur
        // Afficher une erreur à l'utilisateur (peut-être via Snackbar global ?)
        throw error; // Propager l'erreur pour que SettingsScreen puisse la gérer
      }
    },
    [customPrimary]
  ); // Dépend de customPrimary pour avoir la valeur précédente

  const updateSecondaryColor = useCallback(
    async (newColor) => {
      const previousColor = customSecondary;
      setCustomSecondary(newColor); // MAJ optimiste
      try {
        console.log("[ThemeContext] MAJ couleur secondaire vers:", newColor);
        await apiClient.patch("/settings/color/secondary", { color: newColor });
      } catch (error) {
        console.error("[ThemeContext] Erreur MAJ couleur secondaire:", error);
        setCustomSecondary(previousColor); // Revert
        throw error;
      }
    },
    [customSecondary]
  );

  // --- Génération du Thème Final (Fusion) ---
  // Utiliser useMemo pour ne recalculer le thème que si nécessaire
  const theme = useMemo(() => {
    // Choisir le thème de base (clair ou sombre)
    const baseTheme = isDarkMode ? BaseDarkTheme : BaseLightTheme;

    // Créer un objet de couleurs fusionnées
    const mergedColors = {
      ...baseTheme.colors, // Commencer avec les couleurs de base
      // Appliquer les couleurs personnalisées SI elles existent et sont valides
      ...(customPrimary && { primary: customPrimary }), // Remplace 'primary'
      ...(customSecondary && { secondary: customSecondary }), // Remplace 'secondary'
      // Note: React Native Paper MD3 utilise primary, secondary, tertiary, etc.
      // Ici, on suppose que l'utilisateur personnalise 'primary' et 'secondary'.
      // On pourrait vouloir personnaliser d'autres clés comme 'accent', 'background', etc.
    };

    // Retourner le thème de base avec les couleurs fusionnées
    return {
      ...baseTheme, // Inclure toutes les autres propriétés du thème de base (roundness, fonts, etc.)
      colors: mergedColors, // Utiliser l'objet de couleurs fusionnées
    };
    // Recalculer si le mode sombre ou les couleurs personnalisées changent
  }, [isDarkMode, customPrimary, customSecondary]);

  // Fournir les valeurs et fonctions aux composants enfants
  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        theme, // Le thème final fusionné
        customPrimary, // La couleur primaire perso actuelle (ou null)
        customSecondary, // La couleur secondaire perso actuelle (ou null)
        isLoadingTheme, // Indique si les couleurs perso sont en cours de chargement
        toggleTheme, // Fonction pour changer clair/sombre
        updatePrimaryColor, // Fonction pour changer la couleur primaire
        updateSecondaryColor, // Fonction pour changer la couleur secondaire
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
