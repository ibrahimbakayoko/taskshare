// src/screens/main/AppointmentDetailScreen.js
import React, { useState, useEffect, useCallback, useContext } from "react"; // Assurer useContext/useCallback sont là
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  RefreshControl,
} from "react-native"; // Importer RefreshControl
import {
  Text,
  Appbar,
  useTheme,
  ActivityIndicator,
  Button,
  Card,
  Divider,
  IconButton,
  List,
  Chip, // Pour afficher les destinataires
  ListSection, // Pour structurer la section partage
  // Snackbar, // Optionnel pour feedback
} from "react-native-paper";
import {
  useRoute,
  useNavigation,
  useFocusEffect, // Importer useFocusEffect
} from "@react-navigation/native";
import apiClient from "../../api/apiClient";
import moment from "moment";
import "moment/locale/fr";

// Importer le modal et le contexte d'authentification
// Vérifiez bien ce chemin d'importation !
import UserSearchModal from "../../components/sharing/UserSearchModal";
import { AuthContext } from "../../context/AuthContext"; // Importer AuthContext

moment.locale("fr");

export default function AppointmentDetailScreen() {
  // --- Hooks ---
  const route = useRoute();
  const navigation = useNavigation();
  const theme = useTheme();
  const { appointmentId } = route.params;

  // Récupérer userInfo du contexte (pour l'ID de l'utilisateur actuel)
  const { userInfo } = useContext(AuthContext);
  // État pour la visibilité de la modale de partage
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);

  // États locaux
  const [appointment, setAppointment] = useState(null); // Stocke le RDV + sharingInfo
  const [isLoading, setIsLoading] = useState(true); // Chargement initial
  const [isActionLoading, setIsActionLoading] = useState(false); // Chargement des actions
  const [error, setError] = useState(null); // Erreurs

  // --- Fonctions ---

  // Récupérer les détails du RDV (backend renvoie maintenant sharingInfo)
  const fetchAppointmentDetails = useCallback(async () => {
    if (!appointmentId) return;
    console.log(`[AppointmentDetail] Fetching appointment ${appointmentId}`);
    // Afficher le loader principal seulement si on n'a pas encore de données
    if (!appointment) setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/appointments/${appointmentId}`);
      console.log("[AppointmentDetail] Data received:", response.data);
      setAppointment(response.data);
    } catch (err) {
      console.error(
        "Erreur chargement détail RDV:",
        err.response?.data || err.message
      );
      // Gérer les erreurs spécifiques
      if (err.response && err.response.status === 404) {
        setError("Rendez-vous non trouvé.");
      } else if (err.response && err.response.status === 401) {
        setError("Accès non autorisé ou session expirée.");
      } else if (err.response && err.response.status === 403) {
        setError("Accès refusé à ce rendez-vous.");
      } else {
        setError("Impossible de charger les détails.");
      }
      setAppointment(null);
    } finally {
      setIsLoading(false);
    }
    // 'appointment' ajouté aux dépendances pour la logique !appointment dans le try
  }, [appointmentId, appointment]);

  // *** CORRECTION useFocusEffect ICI ***
  // Utiliser useFocusEffect pour charger/rafraîchir les détails quand l'écran est focus
  useFocusEffect(
    useCallback(() => {
      fetchAppointmentDetails(); // Appeler la fonction async ici
    }, [fetchAppointmentDetails]) // Dépendance = fetchAppointmentDetails elle-même
  );

  // Gérer la suppression
  const handleDelete = () => {
    Alert.alert("Confirmation", "Supprimer ce rendez-vous ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          setIsActionLoading(true);
          try {
            await apiClient.delete(`/appointments/${appointmentId}`);
            Alert.alert("Succès", "Rendez-vous supprimé.");
            navigation.goBack();
          } catch (err) {
            console.error("[AppointmentDetail] Erreur suppression RDV:", err);
            Alert.alert("Erreur", "Impossible de supprimer le rendez-vous.");
            setIsActionLoading(false);
          }
        },
      },
    ]);
  };

  // Gérer la modification
  const handleEdit = () => {
    if (appointment) {
      navigation.navigate("EditAppointment", { appointment: appointment });
    } else {
      Alert.alert("Erreur", "Données non disponibles pour modification.");
    }
  };

  // Ouvrir la modale de partage
  const handleShare = () => {
    setIsShareModalVisible(true);
  };

  // Appel API après sélection dans la modale
  const handleShareAppointmentWithUser = async (selectedUserId) => {
    setIsActionLoading(true);
    try {
      await apiClient.post(`/appointments/${appointmentId}/share`, {
        sharedWith: selectedUserId,
      });
      fetchAppointmentDetails(); // Rafraîchir pour voir le nouveau participant
    } catch (err) {
      console.error(
        "[AppointmentDetail] Erreur API partage RDV:",
        err.response?.data || err.message
      );
      setIsActionLoading(false); // S'assurer d'arrêter le loader en cas d'erreur
    } finally {
      setIsActionLoading(false); // Arrêter le loader après succès+fetch ou erreur
    }
  };

  // Gérer la confirmation de participation
  const handleConfirm = async () => {
    setIsActionLoading(true);
    try {
      await apiClient.patch(`/appointments/shared/${appointmentId}/confirm`);
      fetchAppointmentDetails(); // Rafraîchir pour voir le nouveau statut
      Alert.alert("Succès", "Participation confirmée !"); // Remplacer par Snackbar si souhaité
    } catch (err) {
      console.error(
        "[AppointmentDetail] Erreur confirmation:",
        err.response?.data || err.message
      );
      Alert.alert("Erreur", "Impossible de confirmer la participation.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Gérer le refus de participation
  const handleDecline = async () => {
    setIsActionLoading(true);
    try {
      await apiClient.patch(`/appointments/shared/${appointmentId}/decline`);
      fetchAppointmentDetails(); // Rafraîchir
      Alert.alert("Info", "Participation déclinée."); // Remplacer par Snackbar si souhaité
    } catch (err) {
      console.error(
        "[AppointmentDetail] Erreur refus:",
        err.response?.data || err.message
      );
      Alert.alert("Erreur", "Impossible de décliner la participation.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // --- Rendu Conditionnel ---
  if (isLoading && !appointment) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator animating={true} size="large" />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Erreur" />
        </Appbar.Header>
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
          {error !== "Accès refusé à ce rendez-vous." && (
            <Button onPress={fetchAppointmentDetails}>Réessayer</Button>
          )}
        </View>
      </View>
    );
  }
  if (!appointment) {
    return (
      <View style={styles.container}>
        <Appbar.Header>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title="Introuvable" />
        </Appbar.Header>
        <View style={styles.centered}>
          <Text>Ce rendez-vous n'a pas été trouvé.</Text>
        </View>
      </View>
    );
  }

  // --- Rendu Principal ---
  // Raccourcis pour les infos de partage
  const sharingInfo = appointment.sharingInfo;
  const isSharedWithCurrentUser = sharingInfo?.myShareInfo !== null;
  const currentUserStatus = sharingInfo?.myShareInfo;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* En-tête */}
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content
          title="Détails RDV"
          subtitle={appointment.title}
          subtitleStyle={{ fontSize: 14 }}
        />
        {/* Indicateur d'action */}
        {isActionLoading && (
          <ActivityIndicator
            animating={true}
            color={theme.colors.primary}
            style={{ marginRight: 8 }}
          />
        )}
        {/* Boutons d'action */}
        <Appbar.Action
          icon="share-variant"
          onPress={handleShare}
          disabled={isLoading || isActionLoading}
        />
        <Appbar.Action
          icon="pencil"
          onPress={handleEdit}
          disabled={isLoading || isActionLoading}
        />
        <Appbar.Action
          icon="delete"
          onPress={handleDelete}
          disabled={isLoading || isActionLoading}
        />
      </Appbar.Header>

      {/* Contenu */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchAppointmentDetails}
          />
        }
      >
        <Card style={styles.card}>
          <Card.Title title={appointment.title} titleVariant="headlineMedium" />
          <Card.Content>
            {/* Détails */}
            <List.Item
              title="Date et Heure"
              description={`Du ${moment(appointment.start_time).format(
                "ddd D MMM, HH:mm"
              )} \nau ${moment(appointment.end_time).format(
                "ddd D MMM, HH:mm"
              )}`}
              descriptionNumberOfLines={2}
              left={(props) => <List.Icon {...props} icon="calendar-clock" />}
            />
            <Divider />
            {appointment.location && (
              <>
                <List.Item
                  title="Lieu"
                  description={appointment.location}
                  left={(props) => <List.Icon {...props} icon="map-marker" />}
                />
                <Divider />{" "}
              </>
            )}
            {appointment.description && (
              <>
                <List.Item
                  title="Description"
                  description={appointment.description}
                  descriptionNumberOfLines={10}
                  left={(props) => <List.Icon {...props} icon="text" />}
                />
                <Divider />{" "}
              </>
            )}

            {/* Section Partage */}
            {sharingInfo && (
              <List.Section title="Partage">
                <List.Item
                  title="Propriétaire"
                  description={sharingInfo.sharedBy?.username || "..."}
                  left={(props) => <List.Icon {...props} icon="account-tie" />}
                />
                {sharingInfo.isShared ? (
                  <>
                    <List.Subheader>Partagé avec :</List.Subheader>
                    <View style={styles.recipientsContainer}>
                      {sharingInfo.recipients.map((user) => {
                        let statusIcon = "help-circle-outline";
                        let statusColor = theme.colors.onSurfaceDisabled;
                        if (user.confirmed === true) {
                          statusIcon = "check-circle";
                          statusColor = "green";
                        } else if (user.declined === true) {
                          statusIcon = "close-circle";
                          statusColor = theme.colors.error;
                        }
                        return (
                          <Chip
                            key={`recipient-${user.id}`}
                            icon="account"
                            style={styles.chip}
                            selected={user.id === userInfo?.id}
                          >
                            {" "}
                            {user.username}{" "}
                            <List.Icon
                              icon={statusIcon}
                              color={statusColor}
                              style={styles.statusIcon}
                            />{" "}
                          </Chip>
                        );
                      })}
                    </View>
                  </>
                ) : (
                  <List.Item
                    description="Non partagé."
                    left={(props) => (
                      <List.Icon {...props} icon="account-multiple-outline" />
                    )}
                  />
                )}
              </List.Section>
            )}
          </Card.Content>

          {/* Actions Confirmer/Refuser */}
          {isSharedWithCurrentUser && (
            <Card.Actions style={styles.actionsContainer}>
              <Text style={styles.statusText}>
                Votre réponse :{" "}
                {currentUserStatus?.confirmed
                  ? "Confirmé"
                  : currentUserStatus?.declined
                  ? "Refusé"
                  : "En attente"}
              </Text>
              <Button
                mode="contained"
                icon="check"
                onPress={handleConfirm}
                disabled={
                  isActionLoading || currentUserStatus?.confirmed === true
                }
                style={styles.actionButton}
              >
                Confirmer
              </Button>
              <Button
                mode="outlined"
                icon="close"
                onPress={handleDecline}
                disabled={
                  isActionLoading || currentUserStatus?.declined === true
                }
                style={styles.actionButton}
                textColor={theme.colors.error}
              >
                Refuser
              </Button>
            </Card.Actions>
          )}
        </Card>
      </ScrollView>

      {/* Modale de Partage */}
      <UserSearchModal
        visible={isShareModalVisible}
        onDismiss={() => setIsShareModalVisible(false)}
        onShare={handleShareAppointmentWithUser}
        itemType="appointment"
        itemId={appointmentId}
        currentUserId={userInfo?.id}
      />
      {/* Snackbar global */}
    </View>
  );
}

// Styles (ajoutés/modifiés)
const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: { padding: 16 },
  card: { marginBottom: 16 },
  errorText: { marginBottom: 10, textAlign: "center" },
  recipientsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16, // Appliquer ici plutôt qu'au List.Section pour aligner avec les List.Item
    paddingBottom: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  statusIcon: {
    marginLeft: -6, // Rapprocher l'icône du texte
    marginRight: 4,
    height: 18, // Ajuster la taille si nécessaire
    width: 18, // Ajuster la taille si nécessaire
    // La taille se contrôle mieux via la prop size du List.Icon si besoin
  },
  actionsContainer: {
    // Conteneur pour les boutons Confirmer/Refuser
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "grey", // Ou theme.colors.outline
    paddingVertical: 8,
    paddingHorizontal: 8, // Moins de padding que le content principal
    justifyContent: "space-between", // Espace entre texte et boutons
    alignItems: "center",
    flexDirection: "row", // Afficher en ligne
    flexWrap: "wrap", // Permettre le passage à la ligne sur petits écrans
  },
  statusText: {
    // Style pour le texte "Votre réponse : ..."
    fontStyle: "italic",
    marginRight: 10, // Espace avant les boutons
    flexShrink: 1, // Permettre au texte de réduire sa largeur
    marginBottom: 8, // Marge en bas si les boutons passent à la ligne
    // textAlign: 'center', // Centrer si les boutons passent à la ligne
  },
  actionButton: {
    // Style commun pour Confirmer/Refuser
    marginHorizontal: 4, // Petit espace entre les boutons
    marginTop: 4, // Espace si passage à la ligne
  },
});
