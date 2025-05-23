// src/screens/main/MessageScreen.js
import React, { useState, useContext, useCallback, useEffect } from "react"; // Assurer les imports React nécessaires
import { View, StyleSheet, FlatList, Keyboard } from "react-native"; // Importer Keyboard
import {
  Text,
  Appbar,
  useTheme,
  List,
  Divider,
  ActivityIndicator,
  Searchbar, // Importer Searchbar
  // TouchableRipple, // Non utilisé ici
} from "react-native-paper";
import { useNavigation, useFocusEffect } from "@react-navigation/native"; // Importer useFocusEffect
import { AuthContext } from "../../context/AuthContext"; // Importer contexte d'authentification
import apiClient from "../../api/apiClient"; // Importer client API
import debounce from "lodash.debounce"; // Importer debounce (npm install lodash.debounce)

const DEBOUNCE_DELAY = 400; // Délai en ms avant de lancer la recherche

export default function MessageScreen() {
  // --- Hooks ---
  const theme = useTheme(); // Accès au thème
  const navigation = useNavigation(); // Pour la navigation
  const { userToken, logout, userInfo } = useContext(AuthContext); // Infos utilisateur et fonction logout

  // --- États locaux ---
  // Pour les conversations existantes
  const [conversations, setConversations] = useState([]); // Liste des conversations
  const [isLoading, setIsLoading] = useState(false); // Chargement des conversations
  const [error, setError] = useState(null); // Erreur chargement conversations

  // Pour la recherche d'utilisateurs
  const [searchQuery, setSearchQuery] = useState(""); // Texte dans la barre de recherche
  const [searchResults, setSearchResults] = useState([]); // Résultats de la recherche
  const [isSearching, setIsSearching] = useState(false); // Indicateur de recherche en cours
  const [searchError, setSearchError] = useState(null); // Erreur pendant la recherche
  // Détermine si on affiche les résultats (quand la recherche n'est pas vide)
  const showSearchResults = searchQuery.trim().length > 0;

  // --- Fonctions ---

  // Fonction pour récupérer les conversations existantes
  const fetchConversations = useCallback(async () => {
    if (!userToken) return; // Ne rien faire si pas connecté
    console.log("MessageScreen: Appel fetchConversations");
    setIsLoading(true); // Démarrer le chargement
    setError(null); // Reset erreur
    try {
      const response = await apiClient.get("/messages/conversations"); // Appel API
      console.log("Conversations reçues:", response.data);
      setConversations(response.data); // Mettre à jour l'état
    } catch (err) {
      console.error(
        "Erreur chargement conversations:",
        err.response?.data || err.message
      );
      if (err.response && err.response.status === 401) {
        setError("Session invalide.");
        setTimeout(logout, 1500);
      } else {
        setError("Impossible de charger les conversations.");
      }
      setConversations([]); // Vider en cas d'erreur
    } finally {
      setIsLoading(false); // Arrêter le chargement
    }
  }, [userToken, logout]); // Dépendances

  // *** CORRECTION useFocusEffect ICI ***
  // Recharger les conversations quand l'écran revient au premier plan
  useFocusEffect(
    useCallback(() => {
      fetchConversations(); // Appeler la fonction async ici
    }, [fetchConversations]) // Dépendance = la fonction fetchConversations elle-même
  );

  // Fonction pour exécuter la recherche d'utilisateurs via l'API
  const performSearch = async (query) => {
    const trimmedQuery = query.trim();
    // Ne chercher que si la requête a au moins 2 caractères
    if (!trimmedQuery || trimmedQuery.length < 2) {
      setSearchResults([]);
      setSearchError(null);
      setIsSearching(false);
      return; // Arrêter si trop court
    }
    console.log(`MessageScreen: Recherche utilisateurs pour "${trimmedQuery}"`);
    setIsSearching(true);
    setSearchError(null);
    try {
      // Appel API GET /messages/users/search
      const response = await apiClient.get("/messages/users/search", {
        params: { q: trimmedQuery },
      });
      // Exclure l'utilisateur actuel des résultats
      const filteredResults = response.data.filter(
        (user) => user.id !== userInfo?.id
      );
      setSearchResults(filteredResults);
    } catch (err) {
      console.error(
        "[MessageScreen] Erreur recherche:",
        err.response?.data || err.message
      );
      setSearchError("Erreur lors de la recherche.");
      setSearchResults([]);
    } finally {
      setIsSearching(false); // Arrêter l'indicateur de recherche
    }
  };

  // Créer une version "debounced" (avec délai) de la fonction de recherche
  const debouncedSearch = useCallback(debounce(performSearch, DEBOUNCE_DELAY), [
    userInfo?.id,
  ]); // userInfo.id est nécessaire pour le filtre

  // Lancer la recherche (via debounce) quand le texte dans la barre change
  useEffect(() => {
    debouncedSearch(searchQuery); // Appelle performSearch après le délai
    // Nettoyer le debounce si le composant se démonte ou si searchQuery change avant la fin du délai
    return () => debouncedSearch.cancel();
  }, [searchQuery, debouncedSearch]);

  // Fonction appelée quand on clique sur un utilisateur dans les résultats de recherche
  const handleSelectUserFromSearch = (user) => {
    console.log(
      `Navigation vers conversation avec ${user.username} (ID: ${user.id})`
    );
    Keyboard.dismiss(); // Fermer le clavier
    setSearchQuery(""); // Vider la barre de recherche
    setSearchResults([]); // Vider les résultats
    // Naviguer vers l'écran Conversation en passant les infos de l'utilisateur
    navigation.navigate("Conversation", {
      userId: user.id,
      userName: user.username,
    });
  };

  // Fonction pour afficher un item de résultat de recherche
  const renderSearchResultItem = ({ item }) => (
    <List.Item
      title={item.username}
      description={item.email} // Afficher l'email aussi peut être utile
      left={(props) => <List.Icon {...props} icon="account-plus-outline" />} // Icône différente pour recherche
      onPress={() => handleSelectUserFromSearch(item)} // Navigue au clic
    />
  );

  // Fonction pour afficher un item de conversation existante
  const renderConversationItem = ({ item }) => (
    <List.Item
      title={item.username} // Nom de l'interlocuteur
      // description="Dernier message..." // Pourrait être ajouté si l'API le renvoyait
      left={(props) => <List.Icon {...props} icon="account-circle-outline" />} // Icône standard
      onPress={() =>
        // Navigue au clic vers la conversation
        navigation.navigate("Conversation", {
          userId: item.id,
          userName: item.username,
        })
      }
    />
  );

  // --- Rendu JSX ---
  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* En-tête */}
      <Appbar.Header>
        <Appbar.Content title="Messages" />
      </Appbar.Header>

      {/* Barre de recherche */}
      <Searchbar
        placeholder="Rechercher ou démarrer une conversation"
        onChangeText={setSearchQuery} // Met à jour l'état de la recherche
        value={searchQuery} // Texte actuel dans la barre
        style={styles.searchbar}
        // Affiche l'indicateur si recherche en cours ET query assez longue
        loading={isSearching && searchQuery.trim().length >= 2}
        onClearIconPress={() => setSearchQuery("")} // Action de la croix
      />

      {/* Conteneur pour afficher soit la recherche, soit les conversations */}
      <View style={styles.listContainer}>
        {/* Condition : si showSearchResults est vrai (query non vide), afficher la partie recherche */}
        {showSearchResults ? (
          <>
            {/* Indicateur pendant la recherche */}
            {isSearching && (
              <ActivityIndicator
                animating={true}
                style={styles.activityIndicator}
              />
            )}
            {/* Message d'erreur de recherche */}
            {searchError && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {searchError}
              </Text>
            )}
            {/* Message si aucun résultat */}
            {!isSearching &&
              !searchError &&
              searchQuery.trim().length >= 2 &&
              searchResults.length === 0 && (
                <Text style={styles.emptyText}>Aucun utilisateur trouvé.</Text>
              )}
            {/* Message si recherche trop courte */}
            {!isSearching && !searchError && searchQuery.trim().length < 2 && (
              <Text style={styles.emptyText}>
                Entrez au moins 2 caractères.
              </Text>
            )}
            {/* Affichage de la liste des résultats */}
            {!searchError && searchResults.length > 0 && (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => `search-${item.id.toString()}`} // Préfixer pour éviter conflit de clés
                renderItem={renderSearchResultItem}
                ItemSeparatorComponent={Divider}
                keyboardShouldPersistTaps="handled" // Permet de cliquer sur un item
              />
            )}
          </>
        ) : (
          // Sinon (si recherche vide), afficher les conversations existantes
          <>
            {/* Indicateur si chargement des conversations ET liste vide */}
            {isLoading && conversations.length === 0 && (
              <ActivityIndicator
                animating={true}
                size="large"
                style={styles.activityIndicator}
              />
            )}
            {/* Erreur chargement conversations */}
            {error && (
              <Text style={[styles.errorText, { color: theme.colors.error }]}>
                {error}
              </Text>
            )}
            {/* Message si aucune conversation */}
            {!isLoading && !error && conversations.length === 0 && (
              <Text style={styles.emptyText}>Aucune conversation active.</Text>
            )}
            {/* Liste des conversations */}
            {!error && conversations.length > 0 && (
              <FlatList
                data={conversations}
                keyExtractor={(item) => `conv-${item.id.toString()}`} // Préfixer les clés
                renderItem={renderConversationItem}
                ItemSeparatorComponent={Divider}
                refreshing={isLoading} // Pour le pull-to-refresh
                onRefresh={fetchConversations} // Action du pull-to-refresh
              />
            )}
          </>
        )}
      </View>
      {/* Pas de FAB nécessaire ici */}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1 },
  searchbar: { marginHorizontal: 8, marginTop: 8, marginBottom: 4 },
  listContainer: { flex: 1 }, // Conteneur prend l'espace restant
  activityIndicator: { marginTop: 50 },
  errorText: { margin: 20, textAlign: "center" },
  emptyText: {
    margin: 20,
    textAlign: "center",
    fontStyle: "italic",
    color: "grey",
  }, // Un peu plus discret
});
