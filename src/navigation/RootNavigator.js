// src/navigation/RootNavigator.js
import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { View, ActivityIndicator, StyleSheet } from "react-native"; // Importer View et ActivityIndicator
import { AuthContext } from "../context/AuthContext"; // Adaptez le chemin si nécessaire
import AuthNavigator from "./AuthNavigator";
import AppNavigator from "./AppNavigator";
import { StatusBar } from "expo-status-bar"; // Garder StatusBar si utile globalement

export default function RootNavigator() {
  // Récupérer l'état d'authentification depuis le contexte
  const { userToken, isLoading } = useContext(AuthContext);

  // Afficher un indicateur pendant la vérification initiale du token/état de connexion
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        {/* La barre de statut système */}
        <StatusBar style="auto" />
      </View>
    );
  }

  // Une fois le chargement initial terminé, afficher le bon navigateur
  return (
    // Le conteneur de navigation global
    <NavigationContainer>
      {/* Affiche AppNavigator si connecté (userToken existe), sinon AuthNavigator */}
      {userToken ? <AppNavigator /> : <AuthNavigator />}
      {/* Vous pouvez gérer la StatusBar globale ici ou dans chaque navigateur/écran */}
      {/* <StatusBar style="auto" /> */}
    </NavigationContainer>
  );
}

// Styles pour le conteneur de chargement
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1, // Prend tout l'écran
    justifyContent: "center", // Centre verticalement
    alignItems: "center", // Centre horizontalement
  },
});
