// src/components/sharing/UserSearchModal.js
import React, { useState, useEffect, useCallback } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import {
  Modal,
  Portal,
  Searchbar,
  List,
  ActivityIndicator,
  Text,
  Button,
  Divider,
  useTheme,
  Snackbar,
  IconButton, // <-- ***** IMPORT AJOUTÉ ICI *****
} from "react-native-paper";
import apiClient from "../../api/apiClient"; // Ajustez le chemin si nécessaire
import debounce from "lodash.debounce"; // Assurez-vous d'avoir fait 'npm install lodash.debounce'

// Délai pour le debounce (en millisecondes)
const DEBOUNCE_DELAY = 500;

const UserSearchModal = ({
  visible, // Booléen pour afficher/cacher la modale
  onDismiss, // Fonction appelée quand la modale doit se fermer
  onShare, // Fonction appelée avec l'ID de l'utilisateur sélectionné après succès API
  itemType, // 'task' ou 'appointment'
  itemId, // ID de l'élément à partager
  currentUserId, // ID de l'utilisateur actuel pour l'exclure
}) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [errorSearch, setErrorSearch] = useState(null);
  const [isSharing, setIsSharing] = useState(false); // Pour l'indicateur pendant l'appel API de partage
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Fonction pour exécuter la recherche d'utilisateurs via l'API
  const performSearch = async (query) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || trimmedQuery.length < 2) {
      // Ne pas chercher si vide ou moins de 2 caractères
      setSearchResults([]);
      setErrorSearch(null);
      setIsLoadingSearch(false);
      return;
    }
    console.log(
      `[UserSearchModal] Recherche utilisateurs pour: "${trimmedQuery}"`
    );
    setIsLoadingSearch(true);
    setErrorSearch(null);
    try {
      // Appel API pour rechercher les utilisateurs
      const response = await apiClient.get("/messages/users/search", {
        params: { q: trimmedQuery },
      });
      // Exclure l'utilisateur actuel des résultats pour éviter l'auto-partage
      const filteredResults = response.data.filter(
        (user) => user.id !== currentUserId
      );
      setSearchResults(filteredResults);
    } catch (error) {
      console.error(
        "[UserSearchModal] Erreur recherche:",
        error.response?.data || error.message
      );
      setErrorSearch("Erreur lors de la recherche d'utilisateurs.");
      setSearchResults([]);
    } finally {
      setIsLoadingSearch(false);
    }
  };

  // Créer une version "debounced" de la fonction de recherche pour ne pas appeler l'API à chaque frappe
  const debouncedSearch = useCallback(debounce(performSearch, DEBOUNCE_DELAY), [
    currentUserId,
  ]); // currentUserId en dépendance pour le filtre

  // Effet pour lancer la recherche quand searchQuery change (après le délai du debounce)
  useEffect(() => {
    debouncedSearch(searchQuery);
    // Fonction de nettoyage pour annuler le debounce si le composant est démonté
    return () => debouncedSearch.cancel();
  }, [searchQuery, debouncedSearch]);

  // Fonction appelée lorsqu'un utilisateur est sélectionné dans la liste pour le partage
  const handleSelectUser = async (selectedUser) => {
    console.log(
      `[UserSearchModal] Tentative de partage de ${itemType} ID ${itemId} avec User ID ${selectedUser.id}`
    );
    setIsSharing(true); // Activer l'indicateur de partage
    try {
      // Construire l'URL de partage dynamique (/tasks/:id/share ou /appointments/:id/share)
      const shareUrl = `/${itemType}s/${itemId}/share`; // Ajoute un 's' à itemType
      // Appel API pour effectuer le partage
      await apiClient.post(shareUrl, { sharedWith: selectedUser.id });

      // Afficher un message de succès dans le Snackbar
      setSnackbarMessage(
        `${itemType === "task" ? "Tâche" : "Rendez-vous"} partagé(e) avec ${
          selectedUser.username
        } !`
      );
      setSnackbarVisible(true);

      // Appeler la fonction onShare passée en prop (si elle existe)
      if (onShare) {
        onShare(selectedUser.id);
      }
      // Fermer la modale après un court délai pour que l'utilisateur voie le Snackbar
      setTimeout(onDismiss, 1500); // Délai de 1.5 secondes
    } catch (error) {
      // Gérer les erreurs d'API lors du partage
      console.error(
        "[UserSearchModal] Erreur API partage:",
        error.response?.data || error.message
      );
      // Afficher le message d'erreur dans le Snackbar
      setSnackbarMessage(
        error.response?.data?.message || `Erreur lors du partage.`
      );
      setSnackbarVisible(true);
      setIsSharing(false); // Arrêter l'indicateur en cas d'erreur ici
    }
    // Pas besoin de finally pour setIsSharing(false) ici si onDismiss ferme la modale
  };

  // Rendu d'un utilisateur dans la liste des résultats
  const renderUserItem = ({ item }) => (
    <List.Item
      title={item.username}
      description={item.email}
      left={(props) => <List.Icon {...props} icon="account-circle-outline" />}
      // Bouton "Partager" à droite de chaque utilisateur
      right={(props) =>
        isSharing ? ( // Afficher un indicateur si un partage est déjà en cours
          <ActivityIndicator style={{ marginRight: 10 }} />
        ) : (
          <Button
            {...props}
            mode="text"
            onPress={() => handleSelectUser(item)}
            disabled={isSharing} // Désactiver si un partage est en cours
          >
            Partager
          </Button>
        )
      }
      // Si on préfère cliquer sur toute la ligne :
      // onPress={() => handleSelectUser(item)}
      // disabled={isSharing}
    />
  );

  return (
    <Portal>
      <Modal
        visible={visible} // Contrôle l'affichage
        onDismiss={onDismiss} // Fonction pour fermer (clic extérieur, bouton retour...)
        contentContainerStyle={[
          styles.modalContent,
          { backgroundColor: theme.colors.background },
        ]} // Style du conteneur
      >
        {/* En-tête de la modale */}
        <View style={styles.header}>
          <Text variant="titleLarge">
            Partager {itemType === "task" ? "la tâche" : "le RDV"}
          </Text>
          {/* Utilisation de IconButton (maintenant importé) */}
          <IconButton icon="close" onPress={onDismiss} disabled={isSharing} />
        </View>

        {/* Barre de recherche */}
        <Searchbar
          placeholder="Rechercher un utilisateur..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          loading={isLoadingSearch} // Affiche l'indicateur dans la barre si recherche en cours
          onClearIconPress={() => setSearchQuery("")} // Vider la recherche au clic sur la croix
          autoFocus={true} // Mettre le focus automatiquement à l'ouverture
        />

        {/* Zone d'affichage des résultats ou messages d'état */}
        <View style={styles.resultsContainer}>
          {/* Afficher l'indicateur si recherche en cours et pas encore de résultats */}
          {isLoadingSearch && searchResults.length === 0 && (
            <ActivityIndicator animating={true} style={styles.messageText} />
          )}
          {/* Afficher erreur de recherche */}
          {!isLoadingSearch && errorSearch && (
            <Text style={[styles.messageText, { color: theme.colors.error }]}>
              {errorSearch}
            </Text>
          )}
          {/* Afficher message si pas de résultats trouvés */}
          {!isLoadingSearch &&
            !errorSearch &&
            searchQuery.length >= 2 &&
            searchResults.length === 0 && (
              <Text style={styles.messageText}>
                Aucun utilisateur trouvé pour "{searchQuery}".
              </Text>
            )}
          {/* Afficher message si recherche trop courte */}
          {!isLoadingSearch && !errorSearch && searchQuery.length < 2 && (
            <Text style={styles.messageText}>
              Entrez au moins 2 caractères.
            </Text>
          )}

          {/* Liste des résultats (seulement si pas d'erreur et des résultats existent) */}
          {!errorSearch && searchResults.length > 0 && (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderUserItem}
              ItemSeparatorComponent={Divider}
              style={styles.list}
              keyboardShouldPersistTaps="handled" // Permet de cliquer sur un item même si le clavier est ouvert
            />
          )}
        </View>

        {/* Snackbar pour afficher les messages de succès ou d'erreur du partage */}
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={Snackbar.DURATION_MEDIUM} // Durée d'affichage
          style={styles.snackbar} // Style optionnel
        >
          {snackbarMessage}
        </Snackbar>
      </Modal>
    </Portal>
  );
};

// Styles du composant Modal
const styles = StyleSheet.create({
  modalContent: {
    margin: 20, // Marges extérieures
    padding: 20, // Padding intérieur
    borderRadius: 8, // Coins arrondis
    maxHeight: "85%", // Hauteur maximale pour ne pas prendre tout l'écran
    elevation: 5, // Ombre (Android)
    shadowOffset: { width: 0, height: 2 }, // Ombre (iOS)
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    // Style pour l'en-tête (Titre + Bouton Fermer)
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15, // Espace sous l'en-tête
  },
  searchbar: {
    marginBottom: 15, // Espace sous la barre de recherche
  },
  resultsContainer: {
    flexShrink: 1, // Permet au conteneur de réduire sa taille si besoin mais prend l'espace dispo
    minHeight: 100, // Hauteur minimale pour voir les messages d'état
  },
  list: {
    // flex: 1, // Peut-être pas nécessaire si resultsContainer gère la taille
  },
  messageText: {
    // Style pour les messages (Erreur, Aucun résultat, Trop court)
    textAlign: "center",
    paddingVertical: 20,
    fontStyle: "italic",
    color: "grey", // Couleur par défaut
  },
  snackbar: {
    // Positionnement en bas par défaut, peut être ajusté si besoin
    // Exemple: bottom: 50, marginHorizontal: 10
  },
});

export default UserSearchModal;
