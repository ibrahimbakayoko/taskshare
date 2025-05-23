// src/screens/main/CreateAppointmentScreen.js
import React, { useState, useCallback, useContext } from "react"; // Ajout de useContext et useCallback
// Platform n'est plus nécessaire ici
import { View, StyleSheet, Alert, ScrollView } from "react-native";
import {
  TextInput,
  Button, // Gardé pour le bouton principal "Créer"
  Appbar,
  useTheme,
  ActivityIndicator,
  HelperText,
  Text,
  List, // Nécessaire pour List.Icon dans l'affichage date/heure
  TouchableRipple, // Pour rendre date/heure cliquables
} from "react-native-paper";
// Importer les modals de react-native-paper-dates
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
  hour: "Heure",
  minute: "Minute",
  hours: "Heures",
  minutes: "Minutes",
});

moment.locale("fr");

export default function CreateAppointmentScreen() {
  // --- Hooks ---
  const theme = useTheme();
  const navigation = useNavigation();
  const { showSnackbar } = useContext(SnackbarContext); // <-- RÉCUPÉRER showSnackbar

  // --- États locaux ---
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState(new Date()); // Date/heure début (objet Date)
  const [endTime, setEndTime] = useState(moment().add(1, "hour").toDate()); // Date/heure fin (objet Date)
  // États pour la visibilité des modals
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
  // (Inchangées par rapport à la version précédente avec les modals)
  const onDismissPickers = useCallback(() => {
    setIsStartDatePickerVisible(false);
    setIsStartTimePickerVisible(false);
    setIsEndDatePickerVisible(false);
    setIsEndTimePickerVisible(false);
  }, []);
  const onConfirmStartDatePicker = useCallback(
    ({ date }) => {
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

  // --- Validation et Création ---
  // Validation du formulaire (inchangée)
  const validateForm = () => {
    const newErrors = {};
    if (!title.trim()) newErrors.title = "Le titre est requis.";
    if (moment(endTime).isSameOrBefore(moment(startTime))) {
      newErrors.endTime = "La date/heure de fin doit être après le début.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fonction appelée lors du clic sur "Créer le Rendez-vous"
  const handleCreateAppointment = async () => {
    // 1. Valider
    if (!validateForm()) return;
    // 2. Démarrer chargement & reset erreurs
    setIsLoading(true);
    setErrors({});
    try {
      // 3. Préparer données
      const appointmentData = {
        title: title.trim(),
        description: description.trim(),
        location: location.trim() || null,
        start_time: moment(startTime).format("YYYY-MM-DD HH:mm:ss"),
        end_time: moment(endTime).format("YYYY-MM-DD HH:mm:ss"),
      };
      console.log(
        "[CreateAppointmentScreen] Envoi des données RDV:",
        appointmentData
      );
      // 4. Appel API POST
      await apiClient.post("/appointments", appointmentData);

      // --- MODIFICATION ICI: Utiliser Snackbar ---
      // Ancienne méthode: Alert.alert("Succès", "Rendez-vous créé avec succès !");
      showSnackbar("Rendez-vous créé avec succès !"); // Nouvelle méthode

      // 5. Naviguer en arrière après délai
      setTimeout(() => {
        navigation.goBack();
      }, 1000);
    } catch (error) {
      // 6. Gérer erreurs API
      console.error(
        "[CreateAppointmentScreen] Erreur création RDV:",
        error.response?.data || error.message
      );
      Alert.alert(
        // Garder Alert pour erreurs serveur
        "Erreur",
        error.response?.data?.message || "Impossible de créer le rendez-vous."
      );
      setIsLoading(false); // Arrêter chargement en cas d'erreur
    }
    // Pas de finally pour setIsLoading ici car le succès navigue après délai
  };

  // --- Rendu JSX ---
  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* En-tête */}
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Nouveau Rendez-vous" />
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
        {/* Pas d'erreur spécifique à startTime */}

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

        {/* Bouton Créer / Indicateur de chargement */}
        {isLoading ? (
          <ActivityIndicator
            animating={true}
            style={styles.activityIndicator}
          />
        ) : (
          <Button
            mode="contained"
            onPress={handleCreateAppointment}
            style={styles.button}
            disabled={isLoading}
          >
            Créer le Rendez-vous
          </Button>
        )}
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
  button: { marginTop: 16, paddingVertical: 8 },
  activityIndicator: { marginTop: 20 },
});
