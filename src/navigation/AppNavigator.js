// src/navigation/AppNavigator.js
import React, { useContext } from "react";
import { View, StyleSheet } from "react-native"; // Importer View et StyleSheet pour le badge
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { useTheme, Badge } from "react-native-paper"; // Importer useTheme et Badge
import { ThemeContext } from "../context/ThemeContext";
import { AuthContext } from "../context/AuthContext"; // Importer AuthContext pour le badge

// Importer tous les écrans nécessaires
import HomeScreen from "../screens/main/HomeScreen";
import CreateTaskScreen from "../screens/main/CreateTaskScreen";
import EditTaskScreen from "../screens/main/EditTaskScreen"; // Écran d'édition de tâche
import TaskDetailScreen from "../screens/main/TaskDetailScreen"; // Écran de détail de tâche
import AppointmentScreen from "../screens/main/AppointmentScreen";
import CreateAppointmentScreen from "../screens/main/CreateAppointmentScreen";
import EditAppointmentScreen from "../screens/main/EditAppointmentScreen"; // Écran d'édition de RDV
import AppointmentDetailScreen from "../screens/main/AppointmentDetailScreen"; // Écran de détail de RDV
import MessageScreen from "../screens/main/MessageScreen";
import ConversationScreen from "../screens/main/ConversationScreen";
import SettingsScreen from "../screens/main/SettingsScreen";
import EditProfileScreen from "../screens/main/EditProfileScreen"; // Écran d'édition de profil
import ChangePasswordScreen from "../screens/main/ChangePasswordScreen"; // Écran de changement de mot de passe

// Importer les icônes
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

// Création des navigateurs
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// --- Composant pour les Onglets du Bas ---
// Contient les 4 écrans principaux accessibles via la barre d'onglets
function MainTabs() {
  const { theme } = useContext(ThemeContext); // Récupérer le thème actuel
  const { unreadCount } = useContext(AuthContext); // Récupérer le compteur de messages non lus

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // Configuration dynamique des icônes d'onglets
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          // Définir l'icône basée sur le nom de la route
          if (route.name === "Accueil")
            iconName = focused ? "home" : "home-outline";
          else if (route.name === "RendezVous")
            iconName = focused ? "calendar-check" : "calendar-blank-outline";
          else if (route.name === "Messages")
            iconName = focused ? "message-text" : "message-text-outline";
          else if (route.name === "Parametres")
            iconName = focused ? "cog" : "cog-outline";
          else iconName = "help-circle"; // Icône par défaut

          // Affichage spécial pour l'onglet Messages avec le badge
          if (route.name === "Messages") {
            return (
              <View style={styles.tabIconContainer}>
                <MaterialCommunityIcons
                  name={iconName}
                  size={size}
                  color={color}
                />
                {/* Afficher le badge seulement si unreadCount > 0 */}
                {unreadCount > 0 && (
                  <Badge style={styles.badge} size={16} visible={true}>
                    {unreadCount > 9 ? "9+" : unreadCount}{" "}
                    {/* Limiter à 9+ si trop grand */}
                  </Badge>
                )}
              </View>
            );
          }
          // Pour les autres onglets, retourner seulement l'icône
          return (
            <MaterialCommunityIcons name={iconName} size={size} color={color} />
          );
        },
        // Couleurs de la barre d'onglets selon le thème
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: "gray",
        // Style de la barre d'onglets basé sur le thème
        tabBarStyle: {
          backgroundColor:
            theme.colors.elevation?.level2 ?? theme.colors.surface, // Utilise la couleur de surface avec élévation
        },
        headerShown: false, // Masquer l'en-tête par défaut pour les écrans DANS les onglets
      })}
    >
      {/* Définition des écrans accessibles via les onglets */}
      <Tab.Screen
        name="Accueil"
        component={HomeScreen}
        options={{ title: "Accueil" }}
      />
      <Tab.Screen
        name="RendezVous"
        component={AppointmentScreen}
        options={{ title: "RDV" }}
      />
      <Tab.Screen
        name="Messages"
        component={MessageScreen}
        options={{ title: "Messages" }}
      />
      <Tab.Screen
        name="Parametres"
        component={SettingsScreen}
        options={{ title: "Paramètres" }}
      />
    </Tab.Navigator>
  );
}

// --- Navigateur Principal (Stack) ---
// Gère la navigation entre l'écran des onglets (MainTabs) et les écrans de détails/création/édition
export default function AppNavigator() {
  const theme = useTheme(); // Récupérer le thème pour styliser l'en-tête du Stack

  return (
    <Stack.Navigator
      screenOptions={{
        // Appliquer un style d'en-tête par défaut à tous les écrans du Stack
        headerStyle: { backgroundColor: theme.colors.surface }, // Couleur de fond de l'en-tête
        headerTintColor: theme.colors.onSurface, // Couleur du titre et des boutons (retour)
      }}
    >
      {/* Le premier écran est le groupe d'onglets */}
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }} // Masquer l'en-tête du Stack pour cet écran car MainTabs gère sa propre interface
      />
      {/* Écrans de Création */}
      <Stack.Screen
        name="CreateTask"
        component={CreateTaskScreen}
        options={{ title: "Nouvelle Tâche" }} // L'en-tête sera affiché
      />
      <Stack.Screen
        name="CreateAppointment"
        component={CreateAppointmentScreen}
        options={{ title: "Nouveau RDV" }} // L'en-tête sera affiché
      />
      {/* Écrans de Détail */}
      <Stack.Screen
        name="TaskDetail"
        component={TaskDetailScreen}
        options={{ title: "Détails Tâche" }} // L'en-tête sera affiché
      />
      <Stack.Screen
        name="AppointmentDetail"
        component={AppointmentDetailScreen}
        options={{ title: "Détails RDV" }} // L'en-tête sera affiché
      />
      {/* Écrans d'Édition */}
      <Stack.Screen
        name="EditTask"
        component={EditTaskScreen}
        options={{ title: "Modifier Tâche" }} // L'en-tête sera affiché
      />
      <Stack.Screen
        name="EditAppointment"
        component={EditAppointmentScreen}
        options={{ title: "Modifier RDV" }} // L'en-tête sera affiché
      />
      {/* Écrans liés aux Messages */}
      <Stack.Screen
        name="Conversation"
        component={ConversationScreen}
        // Titre dynamique basé sur le paramètre 'userName' passé lors de la navigation
        options={({ route }) => ({
          title: route.params?.userName || "Conversation",
        })}
      />
      {/* Écrans liés aux Paramètres */}
      <Stack.Screen // Correction: Stack.Screen avec S majuscule
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: "Modifier Profil" }} // L'en-tête sera affiché
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: "Changer Mot de Passe" }} // L'en-tête sera affiché
      />
      {/* Ajoutez ici d'autres écrans si nécessaire */}
    </Stack.Navigator>
  );
}

// Styles pour le badge de notification sur l'onglet Messages
const styles = StyleSheet.create({
  tabIconContainer: {
    // Conteneur pour l'icône et le badge
    position: "relative", // Permet le positionnement absolu du badge
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute", // Positionner par rapport au conteneur parent (View)
    top: -6, // Ajuster pour remonter légèrement
    right: -12, // Ajuster pour décaler vers la droite
    // backgroundColor: theme.colors.error // Couleur alternative si besoin
  },
});
