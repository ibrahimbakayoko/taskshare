// src/screens/main/SettingsScreen.js
import React, { useContext, useState, useEffect, useCallback } from "react";
// AJOUT: Pressable pour les choix de couleur
import { View, StyleSheet, ScrollView, Alert, Pressable } from "react-native";
import {
  Text,
  Appbar,
  useTheme,
  Switch,
  List,
  Divider,
  ActivityIndicator,
  Button,
  // Snackbar, // Optionnel
  // AJOUT: pour l'icône check sur la couleur sélectionnée
  Icon,
} from "react-native-paper";
// Contexte pour le thème (contient maintenant les fonctions de MAJ couleur)
import { ThemeContext } from "../../context/ThemeContext";
// Contexte pour l'authentification
import { AuthContext } from "../../context/AuthContext";
import apiClient from "../../api/apiClient"; // Client API
import { useNavigation, useFocusEffect } from "@react-navigation/native"; // Hooks de navigation

// --- Définir les palettes de couleurs prédéfinies ---
// Chaque objet contient les couleurs primaires et secondaires pour une palette
// null pour les couleurs signifie utiliser les couleurs par défaut du thème Paper (clair/sombre)
const COLOR_PALETTES = [
  { name: "Défaut", primary: null, secondary: null }, // Pour réinitialiser
  { name: "Océan", primary: "#0077cc", secondary: "#66aabb" }, // Bleu/Cyan
  { name: "Forêt", primary: "#228B22", secondary: "#8FBC8F" }, // Vert/Vert pâle
  { name: "Aurore", primary: "#9400D3", secondary: "#BA55D3" }, // Violet/Orchidée
  { name: "Agrume", primary: "#FF8C00", secondary: "#FFA500" }, // Orange Foncé/Orange
  // Ajoutez d'autres palettes si vous le souhaitez
];
// --- Fin Palettes ---

export default function SettingsScreen() {
  // --- Hooks ---
  const theme = useTheme(); // Récupère le thème ACTUEL (qui peut déjà être personnalisé)
  const navigation = useNavigation();
  // Récupérer les états et fonctions du ThemeContext (Y COMPRIS les couleurs perso et les fonctions de MAJ)
  const {
    isDarkMode,
    toggleTheme,
    customPrimary,
    customSecondary,
    updatePrimaryColor,
    updateSecondaryColor,
    isLoadingTheme, // Pour savoir si les couleurs perso sont chargées
  } = useContext(ThemeContext);
  // Récupérer les infos/fonctions d'authentification
  const { logout, userInfo, userToken, fetchUnreadCount, updateUserInfo } =
    useContext(AuthContext);

  // --- États locaux ---
  // L'état 'settings' n'a plus besoin de stocker les couleurs, elles sont dans ThemeContext
  // On le garde pour 'notification_enabled' et potentiellement d'autres settings non liés au thème global
  const [settings, setSettings] = useState({
    username: userInfo?.username || "",
    email: userInfo?.email || "",
    notification_enabled: true, // Valeur par défaut
  });
  const [isLoading, setIsLoading] = useState(false); // Chargement des settings (username, email, notifs)
  const [isActionLoading, setIsActionLoading] = useState(false); // Actions (export, delete, MAJ couleurs)
  const [error, setError] = useState(null);

  // --- Fonctions ---

  // Charger les settings (username, email, notifs) - les couleurs sont chargées par ThemeContext
  const fetchSettings = useCallback(async () => {
    if (!userToken) return;
    console.log("[SettingsScreen] Début fetchSettings (hors couleurs)...");
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get("/settings");
      console.log("[SettingsScreen] Settings reçus:", response.data);
      // Mettre à jour seulement les settings gérés localement ici
      setSettings((prevSettings) => ({
        ...prevSettings,
        username: response.data.username || prevSettings.username,
        email: response.data.email || prevSettings.email,
        notification_enabled:
          response.data.notifications_enabled === null
            ? true
            : Boolean(response.data.notifications_enabled),
      }));
      // La mise à jour de userInfo dans AuthContext est toujours pertinente si besoin
      if (
        response.data.username !== userInfo?.username ||
        response.data.email !== userInfo?.email
      ) {
        updateUserInfo({
          username: response.data.username,
          email: response.data.email,
        });
      }
    } catch (err) {
      console.error(
        "[SettingsScreen] Erreur chargement settings:",
        err.response?.data || err.message
      );
      setError("Impossible de charger les paramètres.");
      // Garder les valeurs du contexte pour username/email
      setSettings((prev) => ({
        ...prev,
        username: userInfo?.username || "",
        email: userInfo?.email || "",
      }));
    } finally {
      setIsLoading(false);
      console.log("[SettingsScreen] Fin fetchSettings.");
    }
  }, [userToken, userInfo?.username, userInfo?.email, updateUserInfo]);

  // Recharger les settings quand l'écran est focus (CORRIGÉ)
  useFocusEffect(
    useCallback(() => {
      fetchSettings(); // Appeler la fonction async ici à l'intérieur
    }, [fetchSettings]) // La dépendance est la fonction fetchSettings elle-même
  );

  // Mettre à jour les notifications via API (inchangé)
  const handleUpdateNotificationSetting = async (isEnabled) => {
    /* ... */
  };

  // --- NOUVELLE FONCTION: Gérer le changement de couleur ---
  const handleColorChange = async (palette) => {
    console.log(`[SettingsScreen] Changement de palette vers: ${palette.name}`);
    setIsActionLoading(true); // Indiquer qu'une action est en cours
    try {
      // Appeler les fonctions du ThemeContext pour mettre à jour l'état ET l'API
      // Utiliser Promise.all pour lancer les deux mises à jour en parallèle
      await Promise.all([
        updatePrimaryColor(palette.primary), // Envoie null si palette.primary est null
        updateSecondaryColor(palette.secondary), // Envoie null si palette.secondary est null
      ]);
      console.log("[SettingsScreen] Couleurs mises à jour via contexte/API.");
      // Optionnel: Afficher un Snackbar de succès
    } catch (error) {
      // L'erreur est déjà loguée dans le contexte, on affiche une alerte ici
      Alert.alert(
        "Erreur",
        "Impossible de sauvegarder les nouvelles couleurs."
      );
    } finally {
      setIsActionLoading(false); // Arrêter l'indicateur d'action
    }
  };

  // --- Fonctions de Navigation et Actions (inchangées) ---
  const handleEditProfile = () => {
    navigation.navigate("EditProfile");
  };
  const handleChangePassword = () => {
    navigation.navigate("ChangePassword");
  };
  const handleExportData = async () => {
    /* ... (inchangé) ... */
  };
  const handleDeleteAccount = () => {
    /* ... (inchangé) ... */
  };

  // --- Rendu JSX ---
  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header>
        <Appbar.Content title="Paramètres" />
        {(isLoading || isLoadingTheme || isActionLoading) && ( // Afficher si chargement initial OU chargement thème OU action
          <ActivityIndicator
            animating={true}
            color={theme.colors.primary}
            style={{ marginRight: 8 }}
          />
        )}
      </Appbar.Header>

      {(isLoading || isLoadingTheme) && !error ? ( // Afficher pendant chargement initial OU chargement thème
        <ActivityIndicator
          animating={true}
          style={styles.centered}
          size="large"
        />
      ) : error ? ( // Afficher si erreur de chargement settings
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
          <Button onPress={fetchSettings}>Réessayer</Button>
        </View>
      ) : (
        // Afficher le contenu principal
        <ScrollView>
          {/* Section Apparence */}
          <List.Section title="Apparence">
            {/* Toggle Mode Sombre */}
            <List.Item
              title="Mode Sombre"
              left={() => (
                <List.Icon
                  icon={isDarkMode ? "weather-night" : "white-balance-sunny"}
                />
              )}
              right={() => (
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleTheme}
                  disabled={isActionLoading}
                />
              )}
            />
            <Divider />
            {/* --- NOUVEAU: Sélection des Couleurs --- */}
            <List.Subheader>Palette de Couleurs</List.Subheader>
            <View style={styles.paletteContainer}>
              {COLOR_PALETTES.map((palette) => {
                // Déterminer si cette palette est la palette active
                // Compare les couleurs de la palette avec les couleurs custom ACTUELLES du contexte
                // Si les couleurs custom sont null, c'est la palette "Défaut" qui est active
                const isActive =
                  customPrimary === palette.primary &&
                  customSecondary === palette.secondary;

                // Utiliser les couleurs par défaut du THÈME ACTUEL si la palette est "Défaut"
                const displayPrimary = palette.primary ?? theme.colors.primary;
                const displaySecondary =
                  palette.secondary ?? theme.colors.secondary;

                return (
                  <Pressable
                    key={palette.name}
                    style={[
                      styles.paletteItem,
                      isActive && styles.paletteItemActive,
                    ]}
                    onPress={() => handleColorChange(palette)} // Appelle la fonction de mise à jour
                    disabled={isActionLoading || isLoadingTheme} // Désactiver pendant chargement/action
                  >
                    {/* Afficher les deux couleurs de la palette */}
                    <View
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: displayPrimary },
                      ]}
                    />
                    <View
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: displaySecondary },
                      ]}
                    />
                    {/* Afficher un check si cette palette est active */}
                    {isActive && (
                      <Icon
                        source="check-circle"
                        size={20}
                        color={theme.colors.primary}
                        style={styles.activeIcon}
                      />
                    )}
                    <Text style={styles.paletteName}>{palette.name}</Text>
                  </Pressable>
                );
              })}
            </View>
            {/* --- Fin Sélection Couleurs --- */}
          </List.Section>
          <Divider />

          {/* Section Compte (inchangée, utilise 'settings' pour username/email) */}
          <List.Section title="Compte">
            <List.Item
              title="Nom d'utilisateur"
              description={settings.username || "..."}
              left={() => <List.Icon icon="account" />}
              onPress={handleEditProfile}
              right={() => <List.Icon icon="pencil-outline" />}
              disabled={isActionLoading}
            />
            <List.Item
              title="Email"
              description={settings.email || "..."}
              left={() => <List.Icon icon="email" />}
              onPress={handleEditProfile}
              right={() => <List.Icon icon="pencil-outline" />}
              disabled={isActionLoading}
            />
            <List.Item
              title="Changer le mot de passe"
              left={() => <List.Icon icon="lock-reset" />}
              onPress={handleChangePassword}
              disabled={isActionLoading}
            />
            <List.Item
              title="Se déconnecter"
              left={() => (
                <List.Icon color={theme.colors.error} icon="logout" />
              )}
              titleStyle={{ color: theme.colors.error }}
              onPress={logout}
              disabled={isActionLoading}
            />
          </List.Section>
          <Divider />

          {/* Section Notifications (inchangée, utilise 'settings') */}
          <List.Section title="Notifications">
            <List.Item
              title="Activer les notifications"
              left={() => <List.Icon icon="bell" />}
              right={() => (
                <Switch
                  value={settings.notification_enabled}
                  onValueChange={handleUpdateNotificationSetting}
                  disabled={isActionLoading}
                />
              )}
            />
          </List.Section>
          <Divider />

          {/* Section Données (inchangée) */}
          <List.Section title="Données">
            <List.Item
              title="Exporter mes données"
              left={() => <List.Icon icon="export" />}
              onPress={handleExportData}
              disabled={isActionLoading}
            />
            <List.Item
              title="Supprimer mon compte"
              titleStyle={{ color: theme.colors.error }}
              left={() => (
                <List.Icon color={theme.colors.error} icon="delete-forever" />
              )}
              onPress={handleDeleteAccount}
              disabled={isActionLoading}
            />
          </List.Section>
        </ScrollView>
      )}
    </View>
  );
}

// Styles (ajout de styles pour les palettes)
const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: { textAlign: "center", marginBottom: 10 },
  // Styles pour la sélection de couleur
  paletteContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center", // Centrer les palettes
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  paletteItem: {
    borderWidth: 1,
    borderColor: "grey",
    borderRadius: 8,
    padding: 6,
    margin: 6,
    alignItems: "center",
    minWidth: 80, // Largeur minimale pour chaque palette
  },
  paletteItemActive: {
    borderColor: "gold", // Mettre en évidence la palette active
    borderWidth: 2,
    elevation: 2, // Légère ombre si active
  },
  colorSwatch: {
    width: 25,
    height: 25,
    borderRadius: 12.5, // Rendre les cercles
    marginBottom: 4,
    borderWidth: 1, // Petite bordure pour les couleurs claires
    borderColor: "rgba(0,0,0,0.1)",
  },
  activeIcon: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "white", // Fond pour la visibilité
    borderRadius: 10,
  },
  paletteName: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
});
