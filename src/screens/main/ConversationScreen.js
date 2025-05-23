// src/screens/main/ConversationScreen.js
import React, {
  useState,
  useEffect, // Importé
  useContext,
  useCallback, // Importé
  useRef, // Importé
} from "react";
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard, // Importer Keyboard
} from "react-native";
import {
  Text,
  Appbar,
  useTheme,
  TextInput,
  IconButton,
  ActivityIndicator,
} from "react-native-paper";
import {
  useRoute,
  useNavigation,
  useFocusEffect, // Importé
} from "@react-navigation/native";
import apiClient from "../../api/apiClient";
import { AuthContext } from "../../context/AuthContext"; // Importer AuthContext
import moment from "moment";
import "moment/locale/fr"; // S'assurer que la locale est chargée

moment.locale("fr");

export default function ConversationScreen() {
  // --- Hooks ---
  const theme = useTheme();
  const route = useRoute();
  const navigation = useNavigation();
  const { userId, userName } = route.params; // Infos de l'interlocuteur
  // Récupérer infos/fonctions du contexte, y compris fetchUnreadCount
  const { userInfo, userToken, logout, fetchUnreadCount } =
    useContext(AuthContext);

  // --- États locaux ---
  const [messages, setMessages] = useState([]); // Liste des messages
  const [newMessage, setNewMessage] = useState(""); // Texte de l'input
  const [isLoading, setIsLoading] = useState(false); // Chargement des messages
  const [isSending, setIsSending] = useState(false); // Envoi en cours
  const [error, setError] = useState(null); // Erreur de chargement/envoi
  const flatListRef = useRef(null); // Référence pour la FlatList

  // --- Fonctions ---

  // Marquer les messages comme lus (inchangée)
  const markMessagesAsRead = useCallback(async () => {
    if (!userId) return;
    try {
      await apiClient.patch(`/messages/conversations/${userId}/read`);
      console.log(
        `[ConversationScreen] Messages avec ${userId} marqués comme lus (tentative).`
      );
      // Pas besoin de rafraîchir le compteur ici, ce sera fait en sortant
    } catch (readError) {
      console.error(
        "[ConversationScreen] Erreur lors du marquage comme lu:",
        readError
      );
    }
  }, [userId]);

  // Récupérer les messages de la conversation
  const fetchMessages = useCallback(async () => {
    if (!userToken || !userId) return;
    console.log(`[ConversationScreen] Fetch messages avec user ID: ${userId}`);
    // Afficher loader seulement si pas de messages déjà chargés
    if (messages.length === 0) setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/messages/conversations/${userId}`);
      console.log("[ConversationScreen] Messages reçus:", response.data);
      setMessages(response.data); // Mettre à jour les messages
      markMessagesAsRead(); // Marquer comme lus après récupération
    } catch (err) {
      console.error(
        "[ConversationScreen] Erreur chargement messages:",
        err.response?.data || err.message
      );
      if (err.response && err.response.status === 401) {
        setError("Session invalide.");
        setTimeout(logout, 1500);
      } else {
        setError("Impossible de charger les messages.");
      }
      setMessages([]); // Vider en cas d'erreur
    } finally {
      setIsLoading(false); // Arrêter le chargement
    }
    // Ajouter markMessagesAsRead aux dépendances car elle est utilisée ici
  }, [userId, userToken, logout, markMessagesAsRead, messages.length]); // messages.length ajouté pour la logique isLoading

  // --- Effets ---

  // *** CORRECTION useFocusEffect ICI ***
  // Utiliser useFocusEffect pour charger/rafraîchir les messages quand l'écran est focus (CORRIGÉ)
  useFocusEffect(
    useCallback(() => {
      fetchMessages(); // Appeler la fonction async fetchMessages ici
    }, [fetchMessages]) // La dépendance est la fonction fetchMessages elle-même
  );

  // *** AJOUT Effet pour rafraîchir le compteur ***
  // Effet pour rafraîchir le compteur de messages non lus QUAND ON QUITTE l'écran
  useEffect(() => {
    // La fonction retournée est exécutée au démontage du composant (quand on quitte)
    return () => {
      console.log(
        "[ConversationScreen] Sortie de l'écran, rafraîchissement du compteur non lus..."
      );
      if (fetchUnreadCount) {
        // Vérifier si la fonction existe (elle devrait)
        fetchUnreadCount(); // Appeler la fonction du contexte
      }
    };
  }, [fetchUnreadCount]); // La dépendance est la fonction du contexte

  // Envoyer un message (logique inchangée)
  const handleSendMessage = async () => {
    // ... (votre logique d'envoi optimiste ici, elle semble correcte) ...
    if (!newMessage.trim() || !userId || isSending) return;
    const tempMessageId = `temp_${Date.now()}`;
    const messageContent = newMessage.trim();
    setNewMessage("");
    const sentMessage = {
      id: tempMessageId,
      content: messageContent,
      sender_id: userInfo.id,
      receiver_id: userId,
      created_at: new Date().toISOString(),
      is_read: false,
      isSending: true,
    };
    // Ajouter au début car la liste est inversée
    setMessages((prevMessages) => [sentMessage, ...prevMessages]);

    setIsSending(true);
    setError(null);
    try {
      console.log("Envoi message:", {
        content: messageContent,
        receiverId: userId,
      });
      const response = await apiClient.post("/messages", {
        content: messageContent,
        receiverId: userId,
      });
      console.log("Réponse envoi:", response.data);
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === tempMessageId
            ? { ...msg, id: response.data.messageId, isSending: false }
            : msg
        )
      );
    } catch (err) {
      console.error("Erreur envoi message:", err.response?.data || err.message);
      setError("Erreur d'envoi.");
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === tempMessageId
            ? { ...msg, isSending: false, error: true }
            : msg
        )
      );
      // Optionnel: setNewMessage(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  // Afficher un message (logique inchangée)
  const renderMessageItem = ({ item }) => {
    // ... (votre logique d'affichage des bulles ici, elle semble correcte) ...
    const isMyMessage = item.sender_id === userInfo?.id;
    return (
      <View
        style={[
          styles.messageRow,
          { justifyContent: isMyMessage ? "flex-end" : "flex-start" },
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessage : styles.otherMessage,
            {
              backgroundColor: isMyMessage
                ? theme.colors.primaryContainer
                : theme.colors.surfaceVariant,
            },
            item.error ? styles.errorMessage : null,
          ]}
        >
          <Text
            style={{
              color: isMyMessage
                ? theme.colors.onPrimaryContainer
                : theme.colors.onSurfaceVariant,
            }}
          >
            {item.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              {
                color: isMyMessage
                  ? theme.colors.onPrimaryContainer
                  : theme.colors.onSurfaceVariant,
                opacity: 0.7,
              },
            ]}
          >
            {item.isSending
              ? "Envoi..."
              : moment(item.created_at).format("HH:mm")}
          </Text>
        </View>
      </View>
    );
  };

  // --- Rendu JSX ---
  return (
    // KeyboardAvoidingView pour gérer le clavier
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0} // Ajuster si besoin
    >
      {/* En-tête */}
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={userName || "Conversation"} />
      </Appbar.Header>

      {/* Affichage conditionnel (chargement, erreur, vide) */}
      {isLoading && messages.length === 0 && (
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
      {!isLoading && !error && messages.length === 0 && (
        <Text style={styles.emptyText}>
          Aucun message. Commencez la conversation !
        </Text>
      )}

      {/* Liste des messages (inversée) */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id.toString()} // S'assurer que l'ID est une string
        renderItem={renderMessageItem}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        inverted // Affiche du bas vers le haut
        // Optionnel: Pull-to-refresh
        // refreshing={isLoading}
        // onRefresh={fetchMessages}
      />

      {/* Zone de saisie */}
      <View
        style={[
          styles.inputContainer,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <TextInput
          style={styles.input}
          placeholder="Votre message..."
          value={newMessage}
          onChangeText={setNewMessage}
          mode="outlined"
          multiline
          dense
        />
        <IconButton
          icon="send"
          size={24}
          onPress={handleSendMessage}
          disabled={isSending || !newMessage.trim()}
          iconColor={theme.colors.primary}
          animated
        />
      </View>
    </KeyboardAvoidingView>
  );
}

// Styles (inchangés par rapport à votre version)
const styles = StyleSheet.create({
  container: { flex: 1 },
  activityIndicator: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: { margin: 20, textAlign: "center" },
  emptyText: {
    flex: 1,
    textAlign: "center",
    marginTop: 50,
    fontStyle: "italic",
  },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 10, paddingBottom: 10 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "grey",
  },
  input: { flex: 1, marginRight: 8, maxHeight: 100 },
  messageRow: { marginVertical: 4, flexDirection: "row" }, // Ajout flexDirection
  messageBubble: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    maxWidth: "75%",
  },
  myMessage: {
    borderBottomRightRadius: 5 /* backgroundColor défini par thème */,
  },
  otherMessage: {
    borderBottomLeftRadius: 5 /* backgroundColor défini par thème */,
  },
  messageTime: { fontSize: 10, marginTop: 4, textAlign: "right", opacity: 0.7 },
  errorMessage: { opacity: 0.7, borderColor: "red", borderWidth: 1 },
});
