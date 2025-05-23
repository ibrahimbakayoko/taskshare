// src/screens/main/EditProfileScreen.js
import React, { useState, useContext, useEffect } from "react"; // Assurez-vous que useContext est importé
import { View, StyleSheet, Alert, ScrollView } from "react-native";
import {
  TextInput,
  Button,
  Appbar,
  useTheme,
  ActivityIndicator,
  HelperText,
} from "react-native-paper";
// Retrait de useRoute car on n'utilise plus route.params ici
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../../context/AuthContext"; // Contexte pour les infos utilisateur et la MAJ
import { SnackbarContext } from "../../context/SnackbarContext"; // <-- AJOUT: Contexte pour le Snackbar
import apiClient from "../../api/apiClient";

export default function EditProfileScreen() {
  const navigation = useNavigation();
  const theme = useTheme();
  // Récupérer les infos utilisateur, la fonction de MAJ et la fonction pour afficher le Snackbar
  const { userInfo, updateUserInfo } = useContext(AuthContext);
  const { showSnackbar } = useContext(SnackbarContext); // <-- AJOUT: Récupérer showSnackbar

  // Initialiser l'état avec les infos de l'utilisateur actuel depuis le contexte
  const [username, setUsername] = useState(userInfo?.username || "");
  const [email, setEmail] = useState(userInfo?.email || "");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Optionnel: Si userInfo change (ex: après fetchSettings dans SettingsScreen), mettre à jour le form
  useEffect(() => {
    if (userInfo) {
      setUsername(userInfo.username);
      setEmail(userInfo.email);
    }
  }, [userInfo]);

  // Validation simple côté client
  const validateForm = () => {
    const newErrors = {};
    if (!username.trim())
      newErrors.username = "Le nom d'utilisateur est requis.";
    if (!email.trim()) newErrors.email = "L'email est requis.";
    else if (!/\S+@\S+\.\S+/.test(email))
      newErrors.email = "L'email est invalide."; // Format email simple
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // True si pas d'erreurs
  };

  // Fonction appelée lors du clic sur "Sauvegarder"
  const handleSaveProfile = async () => {
    if (!validateForm()) return; // Arrêter si invalide
    setIsLoading(true); // Activer chargement
    setErrors({}); // Reset erreurs
    try {
      // Préparer les données pour l'API
      const updatedData = { username: username.trim(), email: email.trim() };
      // Appel API PUT pour mettre à jour le profil
      const response = await apiClient.put("/settings/profile", updatedData);

      // Mettre à jour les informations utilisateur dans AuthContext (qui mettra aussi à jour AsyncStorage)
      if (updateUserInfo && response.data.user) {
        await updateUserInfo(response.data.user);
      }

      // --- MODIFICATION ICI: Utiliser Snackbar au lieu de Alert ---
      // Alert.alert("Succès", "Profil mis à jour !"); // Ancienne méthode
      showSnackbar("Profil mis à jour avec succès !"); // Nouvelle méthode

      // Revenir à l'écran précédent après un court délai (pour voir le snackbar)
      setTimeout(() => {
        navigation.goBack();
      }, 1000); // Délai de 1 seconde
    } catch (error) {
      // Gérer les erreurs API
      console.error(
        "[EditProfileScreen] Erreur mise à jour profil:",
        error.response?.data || error.message
      );
      if (error.response && error.response.status === 409) {
        // Erreur spécifique si username/email déjà pris (conflit)
        setErrors({ api: error.response.data.message });
      } else {
        // Autre erreur serveur
        Alert.alert(
          "Erreur",
          error.response?.data?.message ||
            "Impossible de mettre à jour le profil."
        );
      }
    } finally {
      setIsLoading(false); // Arrêter chargement
    }
  };

  // Rendu JSX
  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* En-tête */}
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Modifier le Profil" />
        {/* Bouton Sauvegarder */}
        <Appbar.Action
          icon="content-save"
          onPress={handleSaveProfile}
          disabled={isLoading}
        />
      </Appbar.Header>

      {/* Formulaire scrollable */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* Champ Nom d'utilisateur */}
        <TextInput
          label="Nom d'utilisateur *"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          mode="outlined"
          error={!!errors.username || !!errors.api} // Afficher erreur si validation locale OU API
          autoCapitalize="none"
        />
        {errors.username && (
          <HelperText type="error">{errors.username}</HelperText>
        )}

        {/* Champ Email */}
        <TextInput
          label="Email *"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          mode="outlined"
          error={!!errors.email || !!errors.api} // Afficher erreur si validation locale OU API
        />
        {errors.email && <HelperText type="error">{errors.email}</HelperText>}

        {/* Afficher l'erreur générale de l'API (ex: conflit) */}
        {errors.api && (
          <HelperText
            type="error"
            visible={!!errors.api}
            style={styles.apiError}
          >
            {errors.api}
          </HelperText>
        )}

        {/* Indicateur de chargement */}
        {isLoading && (
          <ActivityIndicator
            animating={true}
            style={styles.activityIndicator}
          />
        )}
        {/* Le bouton principal est dans l'Appbar */}
      </ScrollView>
      {/* Le composant Snackbar global est rendu via le SnackbarProvider dans index.js */}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  input: { marginBottom: 16 },
  // button: { marginTop: 16, paddingVertical: 8 }, // Style bouton plus nécessaire ici
  activityIndicator: { marginTop: 20 },
  apiError: { marginTop: 10, textAlign: "center", fontSize: 14 }, // Style pour erreur API
});
