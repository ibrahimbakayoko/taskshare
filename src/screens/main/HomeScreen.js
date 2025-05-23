// src/screens/main/HomeScreen.js
import React, { useState, useEffect, useContext, useCallback } from "react";
import { View, StyleSheet, FlatList, Alert } from "react-native";
// Assurez-vous que Appbar est bien importé
import {
  Text,
  Button,
  ActivityIndicator,
  List,
  Divider,
  useTheme,
  IconButton,
  FAB,
  Appbar, // Vérifiez cet import
} from "react-native-paper";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { AuthContext } from "../../context/AuthContext";
import { ThemeContext } from "../../context/ThemeContext";
import apiClient from "../../api/apiClient";
import moment from "moment";
import "moment/locale/fr";

moment.locale("fr");

export default function HomeScreen() {
  const { logout, userInfo } = useContext(AuthContext);
  const { toggleTheme, isDarkMode } = useContext(ThemeContext);
  const theme = useTheme();
  const navigation = useNavigation();

  const [tasks, setTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true); // Commencer en chargement
  const [error, setError] = useState(null);

  // Fonction pour récupérer les tâches (mémoïsée avec useCallback)
  const fetchTasks = useCallback(async () => {
    // Vérifier userInfo et son id avant de faire l'appel
    if (!userInfo?.id) {
      console.log("HomeScreen: userInfo non disponible, arrêt fetchTasks.");
      // Important: Mettre fin au chargement et vider les tâches si l'utilisateur n'est pas prêt
      setIsLoadingTasks(false);
      setTasks([]);
      setError(null); // Pas une erreur applicative
      return;
    }

    console.log("HomeScreen: Appel fetchTasks pour user ID:", userInfo.id);
    setIsLoadingTasks(true);
    setError(null);
    try {
      const response = await apiClient.get("/tasks"); // Récupère les tâches de l'user connecté (via token)
      console.log("Tâches reçues dans HomeScreen: ", response.data);
      // Trier par date de création, la plus récente en premier
      const sortedTasks = response.data.sort((a, b) =>
        moment(b.created_at).diff(moment(a.created_at))
      );
      setTasks(sortedTasks);
    } catch (err) {
      console.error(
        "Erreur tâches HomeScreen:",
        err.response?.data || err.message
      );
      if (err.response && err.response.status === 401) {
        setError("Session invalide. Déconnexion...");
        // Déconnexion automatique après un court délai
        setTimeout(logout, 1500);
      } else {
        setError("Impossible de charger les tâches.");
      }
      setTasks([]); // Vider les tâches en cas d'erreur
    } finally {
      setIsLoadingTasks(false); // Arrêter l'indicateur de chargement
    }
  }, [userInfo?.id, logout]); // Dépend de userInfo.id et logout

  // Utilisation corrigée de useFocusEffect pour rafraîchir les tâches
  useFocusEffect(
    useCallback(() => {
      // Appeler la fonction async fetchTasks ici
      fetchTasks();

      // Optionnel: Fonction de nettoyage si nécessaire
      // return () => { console.log("HomeScreen unfocused"); };
    }, [fetchTasks]) // La dépendance est fetchTasks elle-même (qui est mémoïsée)
  );

  // Rendu d'un item de la liste de tâches
  const renderTaskItem = ({ item }) => (
    <List.Item
      title={item.title}
      description={
        item.description ||
        (item.due_date
          ? `Échéance: ${moment(item.due_date).format("DD/MM/YY HH:mm")}`
          : "Pas de description ni d'échéance")
      }
      descriptionNumberOfLines={2} // Limiter le nombre de lignes pour la description
      left={(props) => (
        <List.Icon
          {...props}
          icon={item.status === "completed" ? "check-circle" : "circle-outline"} // Icône différente si complétée
          color={item.status === "completed" ? theme.colors.primary : undefined} // Couleur différente si complétée
        />
      )}
      right={(props) => (
        // Optionnel: Bouton pour partager directement depuis la liste
        <IconButton
          {...props}
          icon="share-variant"
          onPress={(e) => {
            e.stopPropagation(); // Empêche le déclenchement du onPress de List.Item
            handleShareTask(item.id);
          }}
        />
      )}
      style={styles.listItem}
      // Naviguer vers l'écran de détail quand on clique sur l'item
      onPress={() => navigation.navigate("TaskDetail", { taskId: item.id })}
    />
  );

  // Fonction pour gérer le partage (affiche une boîte de dialogue)
  const handleShareTask = (taskId) => {
    console.log("Partager la tâche ID:", taskId);
    Alert.prompt(
      "Partager la Tâche",
      "Entrez l'ID de l'utilisateur avec qui partager :",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Partager",
          onPress: async (userId) => {
            if (userId && !isNaN(parseInt(userId))) {
              try {
                // TODO: Mettre un indicateur de chargement spécifique au partage?
                await apiClient.post(`/tasks/${taskId}/share`, {
                  sharedWith: parseInt(userId),
                });
                Alert.alert("Succès", "Tâche partagée !");
              } catch (err) {
                console.error(
                  "Erreur partage tâche:",
                  err.response?.data || err.message
                );
                Alert.alert(
                  "Erreur",
                  err.response?.data?.message || "Impossible de partager."
                );
              }
            } else {
              Alert.alert("Erreur", "ID utilisateur invalide.");
            }
          },
        },
      ],
      "plain-text" // Type de champ de saisie
    );
  };

  // Rendu du composant HomeScreen
  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Barre d'application en haut */}
      <Appbar.Header>
        <Appbar.Content
          title={`Bonjour, ${userInfo?.username || "Utilisateur"}`} // Affiche le nom d'utilisateur
        />
        {/* Bouton pour changer le thème */}
        <IconButton
          icon={isDarkMode ? "weather-night" : "white-balance-sunny"}
          onPress={toggleTheme}
        />
        {/* Bouton de déconnexion */}
        <Appbar.Action icon="logout" onPress={logout} />
      </Appbar.Header>

      {/* Titre de la section des tâches */}
      <Text variant="titleLarge" style={styles.subtitle}>
        Vos Tâches :
      </Text>

      {/* Affichage conditionnel pendant le chargement initial */}
      {isLoadingTasks && tasks.length === 0 && (
        <ActivityIndicator
          animating={true}
          size="large"
          style={styles.activityIndicator}
        />
      )}
      {/* Affichage en cas d'erreur */}
      {error && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}
      {/* Affichage si la liste est vide (après chargement sans erreur) */}
      {!isLoadingTasks && !error && tasks.length === 0 && (
        <Text style={styles.emptyText}>
          Aucune tâche pour le moment. Ajoutez-en une !
        </Text>
      )}

      {/* Affichage de la liste des tâches (si pas d'erreur) */}
      {!error && (
        <FlatList
          data={tasks}
          // Utiliser _id si présent (MongoDB?), sinon id standard (MySQL)
          keyExtractor={(item) => (item._id || item.id).toString()}
          renderItem={renderTaskItem}
          ItemSeparatorComponent={Divider} // Ajoute un séparateur entre les items
          style={styles.list}
          refreshing={isLoadingTasks} // Indicateur pour le "pull-to-refresh"
          onRefresh={fetchTasks} // Fonction appelée par "pull-to-refresh"
        />
      )}

      {/* Bouton flottant (FAB) pour ajouter une nouvelle tâche */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate("CreateTask")} // Navigue vers l'écran de création
      />
    </View>
  );
}

// Styles du composant
const styles = StyleSheet.create({
  container: {
    flex: 1, // Prend tout l'espace disponible
  },
  subtitle: {
    // Style pour le titre "Vos Tâches"
    marginTop: 10,
    marginBottom: 10,
    marginHorizontal: 16,
  },
  list: {
    flex: 1, // Permet à la liste de prendre l'espace restant
  },
  listItem: {
    // Style spécifique pour chaque item si nécessaire
    // Par exemple: backgroundColor: 'white', marginBottom: 1
  },
  errorText: {
    // Style pour le message d'erreur
    marginVertical: 20,
    textAlign: "center",
    marginHorizontal: 16,
    // La couleur est définie dynamiquement via le thème
  },
  emptyText: {
    // Style pour le message "Aucune tâche"
    marginVertical: 20,
    textAlign: "center",
    marginHorizontal: 16,
    fontStyle: "italic",
  },
  activityIndicator: {
    // Style pour l'indicateur de chargement
    marginTop: 20,
    flex: 1, // Pour centrer si c'est le seul élément
    justifyContent: "center",
    alignItems: "center",
  },
  fab: {
    // Style pour le bouton flottant
    position: "absolute", // Position fixe par rapport au conteneur
    margin: 16,
    right: 0, // En bas à droite
    bottom: 0,
  },
});
