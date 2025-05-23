// src/screens/main/CreateTaskScreen.js
import React, { useState, useCallback, useContext } from "react"; // Ajout de useContext et useCallback
import { View, StyleSheet, Alert, ScrollView, Platform } from "react-native";
import {
  TextInput,
  Button,
  Appbar,
  useTheme,
  ActivityIndicator,
  HelperText,
  Text,
  TouchableRipple, // Conservé même si non utilisé directement ici, peut être utile
} from "react-native-paper";
// Importer le DatePickerModal et la fonction de traduction
import { DatePickerModal, registerTranslation } from "react-native-paper-dates";
// Importer le contexte Snackbar
import { SnackbarContext } from "../../context/SnackbarContext"; // <-- AJOUT IMPORT SNACKBARCONTEXT
import moment from "moment";
import "moment/locale/fr";
import apiClient from "../../api/apiClient";
import { useNavigation } from "@react-navigation/native";

// Configuration de la localisation FR (peut être centralisée)
registerTranslation("fr", {
  save: "Confirmer",
  selectSingle: "Sélectionner date",
  selectMultiple: "Sélectionner dates",
  selectRange: "Sélectionner période",
  notAccordingToDateFormat: (inputFormat) => `Format attendu: ${inputFormat}`,
  mustBeHigherThan: (date) => `Doit être après ${date}`,
  mustBeLowerThan: (date) => `Doit être avant ${date}`,
  mustBeBetween: (startDate, endDate) =>
    `Doit être entre ${startDate} et ${endDate}`,
  dateIsDisabled: "Jour désactivé",
  previous: "Précédent",
  next: "Suivant",
  typeInDate: "Saisir date",
  pickDateFromCalendar: "Choisir depuis calendrier",
  close: "Fermer",
});

moment.locale("fr");

export default function CreateTaskScreen() {
  // --- Hooks ---
  const theme = useTheme();
  const navigation = useNavigation();
  const { showSnackbar } = useContext(SnackbarContext); // <-- AJOUT: Récupérer showSnackbar

  // --- États locaux ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(undefined); // Date d'échéance (objet Date ou undefined)
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false); // Visibilité du modal date
  const [isLoading, setIsLoading] = useState(false); // Indicateur de chargement
  const [errors, setErrors] = useState({}); // Erreurs de validation

  // --- Fonctions DatePickerModal ---
  const onDismissDatePicker = useCallback(() => {
    setIsDatePickerVisible(false);
  }, []); // Pas de dépendance, la fonction est stable

  const onConfirmDatePicker = useCallback((params) => {
    setIsDatePickerVisible(false);
    setDueDate(params.date); // Met à jour l'état
  }, []); // Pas de dépendance, la fonction est stable

  // --- Validation et Création ---

  // Fonction de validation du formulaire
  const validateForm = () => {
    const newErrors = {};
    if (!title.trim()) {
      // Vérifie si le titre est vide
      newErrors.title = "Le titre est requis.";
    }
    setErrors(newErrors); // Met à jour les erreurs (affiche sous le champ)
    return Object.keys(newErrors).length === 0; // True si pas d'erreur
  };

  // Fonction appelée lors du clic sur "Créer la Tâche"
  const handleCreateTask = async () => {
    // 1. Valider le formulaire
    if (!validateForm()) return;

    // 2. Démarrer le chargement, reset erreurs
    setIsLoading(true);
    setErrors({});

    try {
      // 3. Préparer les données pour l'API
      const taskData = {
        title: title.trim(),
        description: description.trim(),
        // Formater la date en string YYYY-MM-DD HH:mm:ss si elle existe, sinon null
        due_date: dueDate
          ? moment(dueDate).format("YYYY-MM-DD HH:mm:ss")
          : null,
      };
      console.log("[CreateTaskScreen] Envoi des données tâche:", taskData);

      // 4. Appel API POST pour créer la tâche
      await apiClient.post("/tasks", taskData);

      // --- MODIFICATION ICI: Utiliser Snackbar ---
      // Ancienne méthode: Alert.alert("Succès", "Tâche créée avec succès !");
      showSnackbar("Tâche créée avec succès !"); // Nouvelle méthode

      // 5. Revenir à l'écran précédent après un délai pour voir le Snackbar
      setTimeout(() => {
        navigation.goBack();
      }, 1000); // Délai de 1 seconde
    } catch (error) {
      // 6. Gérer les erreurs de l'API
      console.error(
        "[CreateTaskScreen] Erreur création tâche:",
        error.response?.data || error.message
      );
      // Utiliser Alert pour les erreurs critiques
      Alert.alert(
        "Erreur",
        error.response?.data?.message || "Impossible de créer la tâche."
      );
      setIsLoading(false); // Arrêter le chargement ici en cas d'erreur
    }
    // Pas de finally pour setIsLoading(false) car le succès navigue en arrière après délai
  };

  // --- Rendu JSX ---
  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* En-tête */}
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Nouvelle Tâche" />
        {/* Optionnel: Mettre le bouton de création ici au lieu d'en bas */}
        {/* <Appbar.Action icon="check" onPress={handleCreateTask} disabled={isLoading} /> */}
      </Appbar.Header>

      {/* Contenu scrollable */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* Champ Titre */}
        <TextInput
          label="Titre *"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
          mode="outlined"
          error={!!errors.title}
        />
        {errors.title && <HelperText type="error">{errors.title}</HelperText>}

        {/* Champ Description */}
        <TextInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          style={styles.input}
          mode="outlined"
          multiline
          numberOfLines={4}
        />

        {/* Section Date d'Échéance */}
        <Text style={styles.dateLabel}>Échéance :</Text>
        <Button
          icon="calendar"
          mode="outlined"
          onPress={() => setIsDatePickerVisible(true)} // Ouvre la modale date
          style={styles.dateButtonFullWidth}
          contentStyle={styles.dateButtonContent}
          labelStyle={styles.dateButtonLabel}
          disabled={isLoading}
          textColor={theme.colors.onSurface}
        >
          {dueDate
            ? moment(dueDate).format("dddd D MMMM YYYY")
            : "Choisir une date"}
        </Button>

        {/* Bouton Créer / Indicateur de chargement */}
        {isLoading ? (
          <ActivityIndicator
            animating={true}
            style={styles.activityIndicator}
          />
        ) : (
          <Button
            mode="contained"
            onPress={handleCreateTask}
            style={styles.button}
            disabled={isLoading}
          >
            Créer la Tâche
          </Button>
        )}
      </ScrollView>

      {/* Modal DatePicker (invisible par défaut) */}
      <DatePickerModal
        locale="fr"
        mode="single"
        visible={isDatePickerVisible}
        onDismiss={onDismissDatePicker}
        date={dueDate || new Date()} // Date initiale
        onConfirm={onConfirmDatePicker}
        saveLabel="Confirmer"
        label="Sélectionner une date d'échéance" // Titre de la modale
      />
      {/* Le Snackbar est géré globalement par SnackbarProvider */}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  input: { marginBottom: 16 },
  dateLabel: { fontSize: 16, marginBottom: 4, color: "grey" },
  dateButtonFullWidth: {
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 4,
    borderColor: "grey",
  },
  dateButtonContent: { paddingVertical: 8, justifyContent: "flex-start" },
  dateButtonLabel: { fontSize: 16 },
  button: { marginTop: 16, paddingVertical: 8 },
  activityIndicator: { marginTop: 20 },
});
