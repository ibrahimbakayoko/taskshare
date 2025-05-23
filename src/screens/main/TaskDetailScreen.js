// src/screens/main/TaskDetailScreen.js
import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  RefreshControl,
} from "react-native";
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
} from "react-native-paper";
import {
  useRoute,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import apiClient from "../../api/apiClient";
import moment from "moment";
import "moment/locale/fr";

// Vérifiez bien ce chemin d'importation
import UserSearchModal from "../../components/sharing/UserSearchModal";
import { AuthContext } from "../../context/AuthContext";

moment.locale("fr");

export default function TaskDetailScreen() {
  // --- Hooks ---
  const route = useRoute();
  const navigation = useNavigation();
  const theme = useTheme();
  const { taskId } = route.params;
  const { userInfo } = useContext(AuthContext);

  // --- États ---
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [task, setTask] = useState(null); // État pour les détails de la tâche
  const [isLoading, setIsLoading] = useState(true); // Chargement initial
  const [isActionLoading, setIsActionLoading] = useState(false); // Chargement des actions (delete, complete, share)
  const [error, setError] = useState(null); // Erreurs de chargement

  // --- Fonctions ---

  // Récupérer les détails de la tâche (inclut sharingInfo)
  const fetchTaskDetails = useCallback(async () => {
    if (!taskId) return;
    console.log(`[TaskDetailScreen] Fetching task details for ID: ${taskId}`);
    if (!task) setIsLoading(true); // Loader seulement si pas déjà de données
    setError(null);
    try {
      const response = await apiClient.get(`/tasks/${taskId}`);
      console.log("[TaskDetailScreen] Task data received:", response.data);
      setTask(response.data);
    } catch (err) {
      console.error(
        "[TaskDetailScreen] Erreur chargement détail tâche:",
        err.response?.data || err.message
      );
      if (err.response && err.response.status === 404) {
        setError("Tâche non trouvée.");
      } else if (err.response && err.response.status === 401) {
        setError("Accès non autorisé ou session expirée.");
      } else if (err.response && err.response.status === 403) {
        setError("Accès refusé à cette tâche.");
      } else {
        setError("Impossible de charger les détails.");
      }
      setTask(null); // Vider en cas d'erreur
    } finally {
      setIsLoading(false);
    }
  }, [taskId, task]); // Dépendances

  // Recharger à chaque focus de l'écran (correction appliquée)
  useFocusEffect(
    useCallback(() => {
      fetchTaskDetails();
    }, [fetchTaskDetails])
  );

  // Gérer la suppression
  const handleDelete = () => {
    Alert.alert("Confirmation", "Supprimer cette tâche ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          setIsActionLoading(true); // Démarrer indicateur
          try {
            await apiClient.delete(`/tasks/${taskId}`); // Appel API
            Alert.alert("Succès", "Tâche supprimée."); // Message succès
            // *** CORRECTION ICI : Vider l'état AVANT de naviguer ***
            setTask(null);
            navigation.goBack(); // Naviguer en arrière
          } catch (err) {
            console.error("[TaskDetailScreen] Erreur suppression tâche:", err);
            Alert.alert("Erreur", "Impossible de supprimer la tâche.");
            setIsActionLoading(false); // Arrêter indicateur en cas d'erreur
          }
          // Pas de finally ici car la navigation se fait au succès
        },
      },
    ]);
  };

  // Gérer le changement de statut (complété/à faire)
  const handleToggleComplete = async () => {
    const currentStatus = task?.status;
    const actionVerb =
      currentStatus === "completed" ? "Marquer à faire" : "Marquer terminée";
    console.log(`[TaskDetailScreen] ${actionVerb} pour tâche ${taskId}`);
    setIsActionLoading(true);
    try {
      await apiClient.patch(`/tasks/${taskId}/complete`); // Appel API (logique toggle/complete gérée par backend)
      fetchTaskDetails(); // Recharger les données
    } catch (err) {
      console.error("[TaskDetailScreen] Erreur complete task:", err);
      Alert.alert("Erreur", "Impossible de changer le statut.");
      setIsActionLoading(false); // Arrêter sur erreur
    } finally {
      // Arrêter l'indicateur après rechargement ou erreur
      setIsActionLoading(false);
    }
  };

  // Naviguer vers l'édition
  const handleEdit = () => {
    /* ... (inchangé) ... */
  };
  // Ouvrir la modale de partage
  const handleShareTask = () => {
    /* ... (inchangé) ... */
  };
  // Appel API après sélection dans la modale
  const handleShareTaskWithUser = async (selectedUserId) => {
    /* ... (inchangé, rafraîchit avec fetchTaskDetails) ... */
  };

  // --- Rendu ---
  // Gestion affichage chargement/erreur/non trouvé (inchangé)
  if (isLoading && !task) {
    /* ... */
  }
  if (error) {
    /* ... */
  }
  if (!task) {
    /* ... */
  }

  const sharingInfo = task.sharingInfo; // Raccourci

  // Rendu principal
  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* En-tête */}
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Détails Tâche" subtitle={task.title} />
        {isActionLoading && (
          <ActivityIndicator
            animating={true}
            color={theme.colors.primary}
            style={{ marginRight: 8 }}
          />
        )}
        <Appbar.Action
          icon="share-variant"
          onPress={handleShareTask}
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
          <RefreshControl refreshing={isLoading} onRefresh={fetchTaskDetails} />
        }
      >
        <Card style={styles.card}>
          <Card.Title title={task.title} titleVariant="headlineMedium" />
          <Card.Content>
            {/* Statut */}
            <List.Item
              title="Statut"
              description={
                task.status === "completed"
                  ? "Terminée"
                  : task.status === "in_progress"
                  ? "En cours"
                  : "En attente"
              }
              left={(props) => (
                <List.Icon
                  {...props}
                  icon={
                    task.status === "completed"
                      ? "check-circle"
                      : "progress-clock"
                  }
                />
              )}
              right={() => (
                <Button
                  onPress={handleToggleComplete}
                  disabled={isActionLoading || isLoading}
                >
                  {" "}
                  {task.status === "completed"
                    ? "Marquer à faire"
                    : "Marquer terminée"}{" "}
                </Button>
              )}
            />
            <Divider />
            {/* Échéance */}
            {task.due_date && (
              <>
                <List.Item
                  title="Échéance"
                  description={moment(task.due_date).format(
                    "dddd D MMMM YYYY [à] HH:mm"
                  )}
                  left={(props) => (
                    <List.Icon {...props} icon="calendar-clock" />
                  )}
                />
                <Divider />{" "}
              </>
            )}
            {/* Description */}
            {task.description && (
              <>
                <List.Item
                  title="Description"
                  description={task.description}
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
                      {sharingInfo.recipients.map((user) => (
                        <Chip
                          key={`recipient-${user.id}`}
                          icon="account"
                          style={styles.chip}
                          selected={user.id === userInfo?.id}
                        >
                          {" "}
                          {user.username}{" "}
                        </Chip>
                      ))}
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
        </Card>
      </ScrollView>

      {/* Modale de Partage */}
      <UserSearchModal
        visible={isShareModalVisible}
        onDismiss={() => setIsShareModalVisible(false)}
        onShare={handleShareTaskWithUser}
        itemType="task"
        itemId={taskId}
        currentUserId={userInfo?.id}
      />
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: { flex: 1 }, // Donner flex: 1 pour que RefreshControl fonctionne bien
  card: { marginBottom: 16 },
  errorText: { marginBottom: 10, textAlign: "center" },
  recipientsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  chip: { marginRight: 8, marginBottom: 8 },
});
