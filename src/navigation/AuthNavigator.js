// src/navigation/AuthNavigator.js
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen"; // Importer le nouvel écran

// Création du navigateur Stack (correctement avec 'S' majuscule)
const Stack = createStackNavigator();

// Composant du navigateur d'authentification
export default function AuthNavigator() {
  return (
    // Le Stack.Navigator englobe les écrans d'authentification
    // screenOptions={{ headerShown: false }} est une bonne approche ici :
    // On masque l'en-tête par défaut du navigateur Stack, car les écrans
    // LoginScreen et RegisterScreen utilisent leur propre Appbar interne.
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Écran de Connexion */}
      <Stack.Screen name="Login" component={LoginScreen} />
      {/* Écran d'Inscription */}
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
