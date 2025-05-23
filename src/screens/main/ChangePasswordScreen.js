// src/screens/main/ChangePasswordScreen.js
import React, { useState, useContext } from "react"; // Ajout de useContext
import { View, StyleSheet, Alert, ScrollView } from "react-native";
import {
  TextInput,
  Button, // Import Button non utilisé car bouton dans Appbar
  Appbar,
  useTheme,
  ActivityIndicator,
  HelperText,
} from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { SnackbarContext } from "../../context/SnackbarContext"; // <-- AJOUT: Importer le contexte Snackbar
import apiClient from "../../api/apiClient";

export default function ChangePasswordScreen() {
  // --- Hooks ---
  const navigation = useNavigation(); // Hook pour la navigation
  const theme = useTheme(); // Hook pour accéder au thème
  const { showSnackbar } = useContext(SnackbarContext); // <-- AJOUT: Récupérer la fonction du Snackbar

  // --- États locaux ---
  const [oldPassword, setOldPassword] = useState(""); // Ancien mot de passe
  const [newPassword, setNewPassword] = useState(""); // Nouveau mot de passe
  const [confirmPassword, setConfirmPassword] = useState(""); // Confirmation du nouveau
  const [isLoading, setIsLoading] = useState(false); // Indicateur de chargement pendant l'appel API
  const [errors, setErrors] = useState({}); // Stockage des erreurs de validation ou API

  // --- Fonctions ---

  // Validation côté client des champs du formulaire
  const validateForm = () => {
    const newErrors = {}; // Initialiser un objet vide pour les erreurs
    if (!oldPassword)
      newErrors.oldPassword = "L'ancien mot de passe est requis.";
    if (!newPassword)
      newErrors.newPassword = "Le nouveau mot de passe est requis.";
    else if (newPassword.length < 6)
      // Validation de longueur minimale
      newErrors.newPassword = "Doit faire au moins 6 caractères.";
    if (newPassword !== confirmPassword)
      // Vérifier que les nouveaux mots de passe correspondent
      newErrors.confirmPassword =
        "Les nouveaux mots de passe ne correspondent pas.";

    setErrors(newErrors); // Mettre à jour l'état des erreurs
    return Object.keys(newErrors).length === 0; // Retourne true si aucune erreur
  };

  // Logique appelée lors du clic sur le bouton "Sauvegarder"
  const handlePasswordChange = async () => {
    // 1. Valider les champs
    if (!validateForm()) return; // Ne pas continuer si invalide

    // 2. Démarrer le chargement et nettoyer les erreurs précédentes
    setIsLoading(true);
    setErrors({}); // Important pour effacer une éventuelle erreur "Ancien mot de passe incorrect"

    try {
      // 3. Appel API PUT pour changer le mot de passe
      await apiClient.put("/settings/password", { oldPassword, newPassword });

      // --- MODIFICATION ICI: Utilisation du Snackbar ---
      // Ancienne méthode : Alert.alert("Succès", "Mot de passe changé avec succès !");
      showSnackbar("Mot de passe changé avec succès !"); // Nouvelle méthode: Affiche le Snackbar

      // 4. Revenir à l'écran précédent après un court délai (pour voir le Snackbar)
      setTimeout(() => {
        navigation.goBack(); // Retourne à l'écran des Paramètres
      }, 1000); // Délai de 1 seconde
    } catch (error) {
      // 5. Gérer les erreurs de l'API
      console.error(
        "[ChangePasswordScreen] Erreur changement MDP:",
        error.response?.data || error.message
      );
      if (error.response && error.response.status === 401) {
        // Cas spécifique : Ancien mot de passe incorrect (401 Unauthorized)
        // Afficher l'erreur directement sous le champ concerné
        setErrors({
          oldPassword:
            error.response.data.message || "Ancien mot de passe incorrect.",
        });
      } else if (error.response && error.response.status === 400) {
        // Cas spécifique : Nouveau mot de passe invalide (ex: trop court côté backend)
        setErrors({
          newPassword:
            error.response.data.message || "Nouveau mot de passe invalide.",
        });
      } else {
        // Autre erreur serveur (ex: 500) : Afficher une Alert car plus critique
        Alert.alert(
          "Erreur",
          error.response?.data?.message ||
            "Impossible de changer le mot de passe."
        );
      }
      setIsLoading(false); // Arrêter le chargement seulement si une erreur est attrapée ici
    }
    // Pas besoin de finally ici car le succès navigue en arrière après un délai
  };

  // --- Rendu JSX ---
  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* En-tête */}
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Changer Mot de Passe" />
        {/* Bouton Sauvegarder dans l'en-tête */}
        <Appbar.Action
          icon="content-save"
          onPress={handlePasswordChange}
          disabled={isLoading} // Désactivé pendant le chargement
        />
      </Appbar.Header>

      {/* Contenu du formulaire dans un ScrollView */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* Champ Ancien Mot de Passe */}
        <TextInput
          label="Ancien mot de passe *"
          value={oldPassword}
          onChangeText={setOldPassword}
          secureTextEntry // Masquer la saisie
          style={styles.input}
          mode="outlined"
          error={!!errors.oldPassword} // Indicateur visuel d'erreur
        />
        {/* Affichage du message d'erreur pour ce champ */}
        {errors.oldPassword && (
          <HelperText type="error">{errors.oldPassword}</HelperText>
        )}

        {/* Champ Nouveau Mot de Passe */}
        <TextInput
          label="Nouveau mot de passe *"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry // Masquer la saisie
          style={styles.input}
          mode="outlined"
          error={!!errors.newPassword} // Indicateur visuel d'erreur
        />
        {errors.newPassword && (
          <HelperText type="error">{errors.newPassword}</HelperText>
        )}

        {/* Champ Confirmer Nouveau Mot de Passe */}
        <TextInput
          label="Confirmer nouveau mot de passe *"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry // Masquer la saisie
          style={styles.input}
          mode="outlined"
          error={!!errors.confirmPassword} // Indicateur visuel d'erreur
        />
        {errors.confirmPassword && (
          <HelperText type="error">{errors.confirmPassword}</HelperText>
        )}

        {/* Indicateur de chargement pendant l'appel API */}
        {isLoading && (
          <ActivityIndicator
            animating={true}
            style={styles.activityIndicator}
          />
        )}
        {/* Le bouton principal de sauvegarde est dans l'Appbar */}
      </ScrollView>
      {/* Le composant Snackbar s'affichera globalement grâce au SnackbarProvider */}
    </View>
  );
}

// Styles du composant
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  input: { marginBottom: 16 },
  // Le style pour 'button' n'est pas utilisé car le bouton est dans l'Appbar
  activityIndicator: { marginTop: 20 },
});
