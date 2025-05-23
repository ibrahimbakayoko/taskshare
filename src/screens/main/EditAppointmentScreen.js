// src/screens/main/EditAppointmentScreen.js
import React, { useState, useCallback, useContext } from "react"; // Ajout de useCallback et useContext
// Platform n'est plus nécessaire
import { View, StyleSheet, Alert, ScrollView } from "react-native";
import {
  TextInput,
  Button, // Non utilisé
  Appbar,
  useTheme,
  ActivityIndicator,
  HelperText,
  Text,
  List, // Ajout pour List.Icon
  TouchableRipple, // Ajout pour zones cliquables
} from "react-native-paper";
// Importer les modals et la traduction
import {
  DatePickerModal,
  TimePickerModal,
  registerTranslation,
} from "react-native-paper-dates";
// Importer le contexte Snackbar
import { SnackbarContext } from "../../context/SnackbarContext"; // <-- AJOUT IMPORT SNACKBARCONTEXT
import moment from "moment";
import "moment/locale/fr";
import apiClient from "../../api/apiClient";
import { useRoute, useNavigation } from "@react-navigation/native";

// Configuration FR (peut être centralisée)
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
  hour: "Heure",
  minute: "Minute",
  hours: "Heures",
  minutes: "Minutes",
});

moment.locale("fr");

export default function EditAppointmentScreen() {
  // --- Hooks ---
  const route = useRoute();
  const navigation = useNavigation();
  const theme = useTheme();
  const { appointment } = route.params; // Récupérer le RDV à modifier
  const { showSnackbar } = useContext(SnackbarContext); // <-- RÉCUPÉRER showSnackbar

  // --- États locaux ---
  // Initialiser avec les données du RDV existant
  const [title, setTitle] = useState(appointment?.title || "");
  const [description, setDescription] = useState(
    appointment?.description || ""
  );
  const [location, setLocation] = useState(appointment?.location || "");
  const [startTime, setStartTime] = useState(
    appointment?.start_time && moment(appointment.start_time).isValid()
      ? moment(appointment.start_time).toDate()
      : new Date()
  );
  const [endTime, setEndTime] = useState(
    appointment?.end_time && moment(appointment.end_time).isValid()
      ? moment(appointment.end_time).toDate()
      : moment(startTime).add(1, "hour").toDate()
  );
  // États pour les modals
  const [isStartDatePickerVisible, setIsStartDatePickerVisible] =
    useState(false);
  const [isStartTimePickerVisible, setIsStartTimePickerVisible] =
    useState(false);
  const [isEndDatePickerVisible, setIsEndDatePickerVisible] = useState(false);
  const [isEndTimePickerVisible, setIsEndTimePickerVisible] = useState(false);
  // Autres états
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // --- Fonctions de rappel pour les Modals ---
  // (Identiques à CreateAppointmentScreen)
  const onDismissPickers = useCallback(() => {
    /* ... ferme tous les modals ... */
    setIsStartDatePickerVisible(false);
    setIsStartTimePickerVisible(false);
    setIsEndDatePickerVisible(false);
    setIsEndTimePickerVisible(false);
  }, []);
  const onConfirmStartDatePicker = useCallback(
    ({ date }) => {
      /* ... logique MAJ startTime ... */
      setIsStartDatePickerVisible(false);
      if (!date) return;
      const newStartTime = moment(date)
        .hours(moment(startTime).hours())
        .minutes(moment(startTime).minutes())
        .seconds(0)
        .toDate();
      setStartTime(newStartTime);
      if (moment(endTime).isSameOrBefore(moment(newStartTime))) {
        setEndTime(moment(newStartTime).add(1, "hour").toDate());
      }
    },
    [startTime, endTime]
  );
  const onConfirmStartTimePicker = useCallback(
    ({ hours, minutes }) => {
      /* ... logique MAJ startTime ... */
      setIsStartTimePickerVisible(false);
      const newStartTime = moment(startTime)
        .hours(hours)
        .minutes(minutes)
        .seconds(0)
        .toDate();
      setStartTime(newStartTime);
      if (moment(endTime).isSameOrBefore(moment(newStartTime))) {
        setEndTime(moment(newStartTime).add(1, "hour").toDate());
      }
    },
    [startTime, endTime]
  );
  const onConfirmEndDatePicker = useCallback(
    ({ date }) => {
      /* ... logique MAJ endTime ... */
      setIsEndDatePickerVisible(false);
      if (!date) return;
      const newEndTime = moment(date)
        .hours(moment(endTime).hours())
        .minutes(moment(endTime).minutes())
        .seconds(0)
        .toDate();
      if (moment(newEndTime).isSameOrBefore(moment(startTime))) {
        Alert.alert(
          "Erreur",
          "L'heure de fin doit être après l'heure de début."
        );
      } else {
        setEndTime(newEndTime);
      }
    },
    [startTime, endTime]
  );
  const onConfirmEndTimePicker = useCallback(
    ({ hours, minutes }) => {
      /* ... logique MAJ endTime ... */
      setIsEndTimePickerVisible(false);
      const newEndTime = moment(endTime)
        .hours(hours)
        .minutes(minutes)
        .seconds(0)
        .toDate();
      if (moment(newEndTime).isSameOrBefore(moment(startTime))) {
        Alert.alert(
          "Erreur",
          "L'heure de fin doit être après l'heure de début."
        );
      } else {
        setEndTime(newEndTime);
      }
    },
    [startTime, endTime]
  );

  // --- Validation et Mise à Jour ---
  // Validation (inchangée)
  const validateForm = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = "Le titre est requis.";
    if (moment(endTime).isSameOrBefore(moment(startTime))) {
      newErrors.endTime = "La date/heure de fin doit être après le début.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Logique de mise à jour du rendez-vous
  const handleUpdateAppointment = async () => {
    // 1. Valider
    if (!validateForm()) return;
    // 2. Démarrer loading, reset erreurs
    setIsLoading(true);
    setErrors({});
    try {
      // 3. Préparer données
      const updatedAppointmentData = {
        title: title.trim(),
        description: description.trim(),
        location: location.trim() || null,
        start_time: moment(startTime).format("YYYY-MM-DD HH:mm:ss"),
        end_time: moment(endTime).format("YYYY-MM-DD HH:mm:ss"),
      };
      console.log(
        `[EditAppointmentScreen] Mise à jour RDV ID ${appointment.id}:`,
        updatedAppointmentData
      );
      // 4. Appel API PUT
      await apiClient.put(
        `/appointments/${appointment.id}`,
        updatedAppointmentData
      );

      // --- MODIFICATION ICI: Utiliser Snackbar ---
      // Ancienne méthode: Alert.alert("Succès", "Rendez-vous mis à jour avec succès !");
      showSnackbar("Rendez-vous mis à jour avec succès !"); // Nouvelle méthode

      // 5. Naviguer en arrière après délai
      setTimeout(() => {
        navigation.goBack(); // Revenir à l'écran précédent (probablement détails)
      }, 1000); // Délai 1 seconde
    } catch (error) {
      // 6. Gérer erreurs API
      console.error(
        "[EditAppointmentScreen] Erreur mise à jour RDV:",
        error.response?.data || error.message
      );
      Alert.alert(
        // Garder Alert pour erreurs serveur
        "Erreur",
        error.response?.data?.message ||
          "Impossible de mettre à jour le rendez-vous."
      );
      setIsLoading(false); // Arrêter loading en cas d'erreur
    }
    // Pas de finally pour setIsLoading si succès navigue
  };

  // --- Rendu JSX ---
  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* En-tête */}
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Modifier Rendez-vous" />
        {/* Bouton Sauvegarder */}
        <Appbar.Action
          icon="content-save"
          onPress={handleUpdateAppointment}
          disabled={isLoading}
        />
      </Appbar.Header>

      {/* Formulaire */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* Champs Titre, Description, Lieu */}
        <TextInput
          label="Titre *"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
          mode="outlined"
          error={!!errors.title}
        />
        {errors.title && <HelperText type="error">{errors.title}</HelperText>}
        <TextInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          style={styles.input}
          mode="outlined"
          multiline
          numberOfLines={3}
        />
        <TextInput
          label="Lieu"
          value={location}
          onChangeText={setLocation}
          style={styles.input}
          mode="outlined"
        />

        {/* Section Date/Heure Début */}
        <Text style={styles.dateLabel}>Début* :</Text>
        <TouchableRipple
          onPress={() => setIsStartDatePickerVisible(true)}
          style={styles.touchableDate}
        >
          <View style={styles.dateDisplay}>
            <List.Icon icon="calendar" />
            <Text style={styles.dateText}>
              {moment(startTime).format("dddd D MMMM YYYY")}
            </Text>
          </View>
        </TouchableRipple>
        <TouchableRipple
          onPress={() => setIsStartTimePickerVisible(true)}
          style={styles.touchableTime}
        >
          <View style={styles.dateDisplay}>
            <List.Icon icon="clock-outline" />
            <Text style={styles.dateText}>
              {moment(startTime).format("HH:mm")}
            </Text>
          </View>
        </TouchableRipple>

        {/* Section Date/Heure Fin */}
        <Text style={styles.dateLabel}>Fin* :</Text>
        <TouchableRipple
          onPress={() => setIsEndDatePickerVisible(true)}
          style={styles.touchableDate}
        >
          <View style={styles.dateDisplay}>
            <List.Icon icon="calendar" />
            <Text style={styles.dateText}>
              {moment(endTime).format("dddd D MMMM YYYY")}
            </Text>
          </View>
        </TouchableRipple>
        <TouchableRipple
          onPress={() => setIsEndTimePickerVisible(true)}
          style={styles.touchableTime}
        >
          <View style={styles.dateDisplay}>
            <List.Icon icon="clock-outline" />
            <Text style={styles.dateText}>
              {moment(endTime).format("HH:mm")}
            </Text>
          </View>
        </TouchableRipple>
        {errors.endTime && (
          <HelperText type="error">{errors.endTime}</HelperText>
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

      {/* Modals Date/Heure */}
      <DatePickerModal
        locale="fr"
        mode="single"
        visible={isStartDatePickerVisible}
        onDismiss={onDismissPickers}
        date={startTime}
        onConfirm={onConfirmStartDatePicker}
        saveLabel="Confirmer"
        label="Date de début"
      />
      <TimePickerModal
        locale="fr"
        visible={isStartTimePickerVisible}
        onDismiss={onDismissPickers}
        hours={moment(startTime).hours()}
        minutes={moment(startTime).minutes()}
        onConfirm={onConfirmStartTimePicker}
        label="Heure de début"
        cancelLabel="Annuler"
        confirmLabel="Confirmer"
        use24HourClock
      />
      <DatePickerModal
        locale="fr"
        mode="single"
        visible={isEndDatePickerVisible}
        onDismiss={onDismissPickers}
        date={endTime}
        validRange={{ startDate: startTime }}
        onConfirm={onConfirmEndDatePicker}
        saveLabel="Confirmer"
        label="Date de fin"
      />
      <TimePickerModal
        locale="fr"
        visible={isEndTimePickerVisible}
        onDismiss={onDismissPickers}
        hours={moment(endTime).hours()}
        minutes={moment(endTime).minutes()}
        onConfirm={onConfirmEndTimePicker}
        label="Heure de fin"
        cancelLabel="Annuler"
        confirmLabel="Confirmer"
        use24HourClock
      />
      {/* Le Snackbar est global */}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  input: { marginBottom: 16 },
  dateLabel: { fontSize: 16, marginTop: 8, marginBottom: 4, color: "grey" },
  touchableDate: {
    paddingVertical: 12,
    paddingHorizontal: 0,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "grey",
    borderRadius: 4,
  },
  touchableTime: {
    paddingVertical: 12,
    paddingHorizontal: 0,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "grey",
    borderRadius: 4,
  },
  dateDisplay: { flexDirection: "row", alignItems: "center", paddingLeft: 12 },
  dateText: { fontSize: 16, marginLeft: 10 },
  // button style non nécessaire ici
  activityIndicator: { marginTop: 20 },
});
