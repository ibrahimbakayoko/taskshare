// src/screens/main/EditTaskScreen.js
import React, { useState, useEffect, useCallback } from "react"; // Ajout de useCallback
import { View, StyleSheet, Alert, ScrollView, Platform } from "react-native";
import {
  TextInput,
  Button,
  Appbar,
  useTheme,
  ActivityIndicator,
  HelperText,
  Text,
  // TouchableRipple, // Non utilisé ici
} from "react-native-paper";
// --- Imports Modifiés ---
// import DateTimePicker from "@react-native-community/datetimepicker"; // Supprimé
// Importer le sélecteur de date et la fonction de traduction depuis react-native-paper-dates
import { DatePickerModal, registerTranslation } from "react-native-paper-dates";
// --- Fin Imports Modifiés ---
import moment from "moment";
import "moment/locale/fr";
import apiClient from "../../api/apiClient";
import { useRoute, useNavigation } from "@react-navigation/native";

// Configuration de la localisation FR pour le DatePickerModal
// (Idéalement, mettre ceci dans un fichier central, ex: au démarrage de l'app dans index.js ou App.js)
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

export default function EditTaskScreen() {
  // --- Hooks ---
  const route = useRoute();
  const navigation = useNavigation();
  const theme = useTheme();
  const { task } = route.params; // Récupérer l'objet tâche complet passé en paramètre

  // --- États Locaux ---
  // Initialiser les états avec les données de la tâche existante
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  // Initialiser dueDate : Convertir la date string de la tâche en objet Date si elle existe et est valide, sinon mettre undefined
  const [dueDate, setDueDate] = useState(
    task?.due_date && moment(task.due_date).isValid()
      ? moment(task.due_date).toDate() // Convertir en objet Date JS
      : undefined // Mettre undefined si pas de date initiale ou invalide
  );
  // Nouvel état pour contrôler la visibilité du DatePickerModal
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

  // États pour le chargement et les erreurs (inchangés)
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // --- Fonctions pour le DatePickerModal ---
  // Appelée quand la modale est fermée sans confirmation
  const onDismissDatePicker = useCallback(() => {
    setIsDatePickerVisible(false); // Cache la modale
  }, [setIsDatePickerVisible]);

  // Appelée quand une date est confirmée dans la modale
  const onConfirmDatePicker = useCallback(
    (params) => {
      setIsDatePickerVisible(false); // Cache la modale
      const selectedDate = params.date; // Récupère l'objet Date sélectionné
      console.log("[EditTaskScreen] Date confirmée:", selectedDate);
      setDueDate(selectedDate); // Met à jour l'état local 'dueDate'
      // Note: Pour ajouter l'heure, il faudrait un TimePickerModal séparé
    },
    [setIsDatePickerVisible, setDueDate]
  );
  // --- Fin Fonctions DatePickerModal ---

  // Fonction de validation du formulaire (inchangée)
  const validateForm = () => {
    const newErrors = {};
    if (!title.trim()) {
      newErrors.title = "Le titre est requis.";
    }
    // Ajouter ici d'autres validations si nécessaire pour la description ou la date
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Retourne true si pas d'erreurs
  };

  // Fonction pour sauvegarder les modifications de la tâche
  const handleUpdateTask = async () => {
    if (!validateForm()) return; // Arrêter si la validation échoue
    setIsLoading(true); // Démarrer l'indicateur de chargement
    setErrors({}); // Réinitialiser les erreurs
    try {
      // Préparer les données à envoyer à l'API
      const updatedTaskData = {
        title: title.trim(),
        description: description.trim(),
        // Formater l'objet Date 'dueDate' en string 'YYYY-MM-DD HH:mm:ss' si défini, sinon envoyer null
        due_date:
          dueDate && moment(dueDate).isValid()
            ? moment(dueDate).format("YYYY-MM-DD HH:mm:ss")
            : null,
      };
      console.log(
        `[EditTaskScreen] Mise à jour tâche ID ${task.id}:`,
        updatedTaskData
      );

      // Appel API PUT pour mettre à jour la tâche
      await apiClient.put(`/tasks/${task.id}`, updatedTaskData);

      Alert.alert("Succès", "Tâche mise à jour avec succès !");
      navigation.goBack(); // Revenir à l'écran précédent après succès
    } catch (error) {
      // Gérer les erreurs de l'API
      console.error(
        "[EditTaskScreen] Erreur mise à jour tâche:",
        error.response?.data || error.message
      );
      Alert.alert(
        "Erreur",
        error.response?.data?.message || "Impossible de mettre à jour la tâche."
      );
    } finally {
      // Arrêter l'indicateur de chargement dans tous les cas
      setIsLoading(false);
    }
  };

  // --- Rendu JSX ---
  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* En-tête */}
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Modifier la Tâche" />
        {/* Bouton Sauvegarder */}
        <Appbar.Action
          icon="content-save"
          onPress={handleUpdateTask}
          disabled={isLoading} // Désactivé pendant le chargement
        />
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

        {/* --- Section Date d'Échéance (Utilisant DatePickerModal) --- */}
        <Text style={styles.dateLabel}>Échéance :</Text>
        {/* Bouton stylisé pour afficher la date et ouvrir le sélecteur */}
        <Button
          icon="calendar"
          mode="outlined"
          onPress={() => setIsDatePickerVisible(true)} // Ouvre la modale
          style={styles.dateButtonFullWidth}
          contentStyle={styles.dateButtonContent}
          labelStyle={styles.dateButtonLabel}
          disabled={isLoading} // Désactiver pendant le chargement
          textColor={theme.colors.onSurface} // Couleur du texte du thème
        >
          {/* Affiche la date formatée ou un placeholder */}
          {dueDate
            ? moment(dueDate).format("dddd D MMMM YYYY")
            : "Choisir une date"}
        </Button>
        {/* Les anciens boutons et l'ancien DateTimePicker sont supprimés */}
        {/* --- Fin Section Date d'Échéance --- */}

        {/* Indicateur de chargement (optionnel ici car bouton dans l'Appbar) */}
        {isLoading && (
          <ActivityIndicator
            animating={true}
            style={styles.activityIndicator}
          />
        )}
      </ScrollView>

      {/* --- Modal DatePicker --- */}
      {/* Le composant est toujours rendu mais sa visibilité est contrôlée par l'état */}
      <DatePickerModal
        locale="fr" // Locale française
        mode="single" // Sélection de date unique
        visible={isDatePickerVisible} // Contrôle l'affichage
        onDismiss={onDismissDatePicker} // Fonction à appeler à la fermeture
        date={dueDate || new Date()} // Date affichée initialement (celle en cours ou aujourd'hui)
        onConfirm={onConfirmDatePicker} // Fonction à appeler à la confirmation
        saveLabel="Confirmer" // Texte du bouton
        label="Sélectionner une date d'échéance" // Titre de la modale
      />
      {/* --- Fin Modal DatePicker --- */}
    </View>
  );
}

// Styles (identiques à CreateTaskScreen)
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 }, // Padding en bas pour éviter que le bouton flottant (s'il y en avait un) ne recouvre le contenu
  input: { marginBottom: 16 },
  dateLabel: { fontSize: 16, marginBottom: 4, color: "grey" },
  dateButtonFullWidth: {
    marginBottom: 16,
    borderWidth: 1,
    borderRadius: 4,
    borderColor: "grey", // Mettre une couleur de bordure par défaut ou utiliser theme.colors.outline
  },
  dateButtonContent: {
    paddingVertical: 8, // Hauteur interne du bouton
    justifyContent: "flex-start", // Aligner texte et icône à gauche
  },
  dateButtonLabel: {
    fontSize: 16, // Taille de police
    // La couleur est gérée par textColor sur le composant Button
  },
  activityIndicator: { marginTop: 20 },
});
