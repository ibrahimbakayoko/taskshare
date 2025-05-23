// src/screens/main/AppointmentScreen.js
import React, { useState, useEffect, useContext, useCallback } from "react"; // Ajouter useCallback
import { View, StyleSheet, FlatList, Alert } from "react-native";
import {
  Text,
  Button,
  IconButton, // Assurez-vous qu'il est bien importé
  Appbar,
  useTheme,
  List,
  Divider,
  ActivityIndicator,
  FAB,
} from "react-native-paper";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { AuthContext } from "../../context/AuthContext";
import apiClient from "../../api/apiClient";
import moment from "moment";
import "moment/locale/fr";

moment.locale("fr");

export default function AppointmentScreen() {
  const theme = useTheme();
  const navigation = useNavigation();
  const { userToken, logout } = useContext(AuthContext);

  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Vous pouvez mettre true si vous voulez un chargement au montage initial
  const [error, setError] = useState(null);

  const fetchAppointments = useCallback(async () => {
    // Utiliser useCallback pour mémoriser la fonction
    if (!userToken) return; // Ne rien faire si pas de token
    console.log("AppointmentScreen: Appel fetchAppointments");
    setIsLoading(true); // Début du chargement
    setError(null); // Réinitialiser les erreurs
    try {
      const response = await apiClient.get("/appointments"); // Récupérer les RDVs
      console.log("RDV reçus:", response.data);
      // Trier les RDVs par date de début, le plus récent en premier
      const sortedAppointments = response.data.sort((a, b) =>
        moment(b.start_time).diff(moment(a.start_time))
      );
      setAppointments(sortedAppointments); // Mettre à jour l'état
    } catch (err) {
      // Gérer les erreurs
      console.error(
        "Erreur chargement RDV:",
        err.response?.data || err.message
      );
      if (err.response && err.response.status === 401) {
        setError("Session invalide. Déconnexion...");
        setTimeout(logout, 1500); // Déconnexion automatique
      } else {
        setError("Impossible de charger les rendez-vous.");
      }
      setAppointments([]); // Vider les RDVs en cas d'erreur
    } finally {
      setIsLoading(false); // Fin du chargement
    }
  }, [userToken, logout]); // Dépendances de useCallback

  // Utilisation corrigée de useFocusEffect
  useFocusEffect(
    useCallback(() => {
      fetchAppointments(); // Appeler fetchAppointments quand l'écran est focus
    }, [fetchAppointments]) // Dépendance : la fonction fetchAppointments elle-même
  );

  // Fonction pour afficher un item de la liste
  const renderAppointmentItem = ({ item }) => (
    <List.Item
      title={item.title}
      description={`Le ${moment(item.start_time).format(
        "DD MMM<y_bin_46>" // Format date court
      )} de ${moment(item.start_time).format("HH:mm")} à ${moment(
        item.end_time
      ).format("HH:mm")}${item.location ? `\nLieu: ${item.location}` : ""}`} // Ajoute le lieu s'il existe
      descriptionNumberOfLines={2} // Permet deux lignes pour la description
      left={(props) => <List.Icon {...props} icon="calendar-clock" />} // Icône à gauche
      onPress={() =>
        // Navigue vers l'écran de détail en passant l'ID
        navigation.navigate("AppointmentDetail", { appointmentId: item.id })
      }
      // Bouton "Partager" à droite
      right={(props) => (
        <IconButton
          {...props}
          icon="share-variant"
          onPress={(e) => {
            e.stopPropagation(); // Empêche le clic sur l'item entier
            handleShareAppointment(item.id);
          }}
        />
      )}
    />
  );

  // Fonction pour gérer le partage (CORRIGÉE)
  const handleShareAppointment = (appointmentId) => {
    console.log("Partager le RDV ID:", appointmentId);
    Alert.prompt(
      "Partager le Rendez-vous", // Titre
      "Entrez l'ID de l'utilisateur avec qui partager :", // Message
      [
        // Tableau des boutons
        { text: "Annuler", style: "cancel" }, // Bouton 1: Annuler
        {
          // Bouton 2: Partager
          text: "Partager",
          onPress: async (userIdInput) => {
            // Fonction exécutée au clic sur Partager
            const userId = parseInt(userIdInput); // Convertir en nombre
            if (userIdInput && !isNaN(userId)) {
              // Si l'ID est un nombre valide...
              console.log(
                `Tentative de partage du RDV ${appointmentId} avec l'utilisateur ID ${userId}`
              );
              try {
                // Optionnel: Mettre un indicateur de chargement ici si besoin
                // setIsLoading(true);

                // Correction de la typo ici : /appointments/
                await apiClient.post(`/appointments/${appointmentId}/share`, {
                  sharedWith: userId,
                });
                Alert.alert("Succès", "Rendez-vous partagé !");
              } catch (err) {
                console.error(
                  "Erreur lors du partage du Rendez-vous: ",
                  err.response?.data || err.message
                );
                Alert.alert(
                  "Erreur",
                  err.response?.data?.message ||
                    "Impossible de partager le rendez-vous."
                );
              } finally {
                // setIsLoading(false); // Si vous utilisez un indicateur
              } // Fin du finally
            } else {
              // Si l'ID n'est PAS valide...
              Alert.alert("Erreur", "L'ID utilisateur entré n'est pas valide.");
            } // Fin du else
          }, // FIN de la fonction onPress (Pas de virgule après cette accolade)
        }, // FIN de l'objet du bouton "Partager" (Pas de virgule ici car c'est le dernier bouton)
      ], // FIN du tableau des boutons
      "plain-text", // Type de champ
      "", // Valeur par défaut
      "numeric" // Type de clavier
    ); // FIN de l'appel à Alert.prompt
    // L'ancien commentaire "Appel API..." est supprimé d'ici.
  }; // FIN de la fonction handleShareAppointment

  // Rendu JSX du composant
  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* Barre d'en-tête */}
      <Appbar.Header>
        <Appbar.Content title="Mes Rendez-vous" />
        {/* Bouton pour rafraîchir manuellement */}
        <Appbar.Action
          icon="refresh"
          onPress={fetchAppointments}
          disabled={isLoading} // Désactivé pendant le chargement
        />
      </Appbar.Header>

      {/* Affichage conditionnel : chargement, erreur, liste vide */}
      {isLoading && appointments.length === 0 && (
        <ActivityIndicator
          animating={true}
          size="large"
          style={styles.activityIndicator}
        />
      )}
      {error && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}
      {!isLoading && !error && appointments.length === 0 && (
        <Text style={styles.emptyText}>Aucun rendez-vous programmé.</Text>
      )}

      {/* Affichage de la liste des rendez-vous */}
      {!error && (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id.toString()} // Clé unique pour chaque item
          renderItem={renderAppointmentItem} // Fonction pour afficher chaque item
          ItemSeparatorComponent={Divider} // Séparateur entre les items
          style={styles.list}
          refreshing={isLoading} // Pour le "pull-to-refresh"
          onRefresh={fetchAppointments} // Action du "pull-to-refresh"
        />
      )}

      {/* Bouton flottant pour ajouter un RDV */}
      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate("CreateAppointment")} // Navigue vers l'écran de création
      />
    </View>
  );
}

// Styles du composant
const styles = StyleSheet.create({
  container: { flex: 1 },
  activityIndicator: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: { margin: 20, textAlign: "center" },
  emptyText: { margin: 20, textAlign: "center", fontStyle: "italic" },
  list: { flex: 1 },
  fab: { position: "absolute", margin: 16, right: 0, bottom: 0 },
});
