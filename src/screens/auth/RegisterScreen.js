// src/screens/auth/RegisterScreen.js
import React, { useState, useContext } from "react";
import { View, StyleSheet, Alert, ScrollView } from "react-native";
import {
  TextInput,
  Button,
  Text,
  ActivityIndicator,
  Appbar,
  useTheme,
  HelperText, // Pour afficher les erreurs de validation
} from "react-native-paper";
import { AuthContext } from "../../context/AuthContext"; // Adaptez le chemin si nécessaire

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({}); // Pour les erreurs de validation locales
  const { register } = useContext(AuthContext);
  const theme = useTheme();

  const validateForm = () => {
    const newErrors = {};
    if (!username.trim())
      newErrors.username = "Le nom d'utilisateur est requis.";
    if (!email.trim()) newErrors.email = "L'email est requis.";
    else if (!/\S+@\S+\.\S+/.test(email))
      newErrors.email = "L'email est invalide.";
    if (!password) newErrors.password = "Le mot de passe est requis.";
    else if (password.length < 6)
      newErrors.password = "Le mot de passe doit faire au moins 6 caractères.";
    if (password !== confirmPassword)
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Retourne true si pas d'erreur
  };

  const handleRegister = async () => {
    if (!validateForm()) return; // Arrêter si la validation échoue

    setIsLoading(true);
    setErrors({}); // Effacer les anciennes erreurs API
    try {
      await register(username, email, password);
      console.log("Inscription réussie depuis RegisterScreen");
      // La navigation vers AppNavigator sera gérée automatiquement par RootNavigator
    } catch (error) {
      console.error("Erreur d'inscription:", error);
      // Afficher l'erreur venant de l'API (ex: email déjà pris) ou une erreur générique
      Alert.alert(
        "Erreur d'inscription",
        error.message || "Une erreur est survenue."
      );
      // Optionnellement, mettre l'erreur dans l'état pour l'afficher près des champs
      // setErrors({ api: error.message || "Une erreur est survenue." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Inscription" />
      </Appbar.Header>
      {/* Utiliser ScrollView pour les petits écrans */}
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          Créer un compte
        </Text>

        <TextInput
          label="Nom d'utilisateur"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          mode="outlined"
          error={!!errors.username} // Affiche en erreur si clé existe
        />
        {errors.username && (
          <HelperText type="error" visible={!!errors.username}>
            {errors.username}
          </HelperText>
        )}

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          mode="outlined"
          error={!!errors.email}
        />
        {errors.email && (
          <HelperText type="error" visible={!!errors.email}>
            {errors.email}
          </HelperText>
        )}

        <TextInput
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          mode="outlined"
          error={!!errors.password}
        />
        {errors.password && (
          <HelperText type="error" visible={!!errors.password}>
            {errors.password}
          </HelperText>
        )}

        <TextInput
          label="Confirmer le mot de passe"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          style={styles.input}
          mode="outlined"
          error={!!errors.confirmPassword}
        />
        {errors.confirmPassword && (
          <HelperText type="error" visible={!!errors.confirmPassword}>
            {errors.confirmPassword}
          </HelperText>
        )}

        {isLoading ? (
          <ActivityIndicator
            animating={true}
            size="large"
            style={styles.activityIndicator}
          />
        ) : (
          <Button
            mode="contained"
            onPress={handleRegister}
            style={styles.button}
            labelStyle={styles.buttonLabel}
          >
            S'inscrire
          </Button>
        )}

        {/* Afficher l'erreur API générale si elle existe */}
        {/* {errors.api && <HelperText type="error" visible={!!errors.api} style={{marginTop: 10}}>{errors.api}</HelperText>} */}

        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          style={{ marginTop: 20 }}
        >
          Déjà un compte ? Se connecter
        </Button>
      </ScrollView>
    </View>
  );
}

// Styles similaires à LoginScreen, ajustés
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1, // Important pour ScrollView
    justifyContent: "center",
    padding: 20,
  },
  title: {
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    width: "100%",
    marginBottom: 4, // Réduire un peu pour HelperText
  },
  button: {
    width: "100%",
    paddingVertical: 8,
    marginTop: 16,
  },
  buttonLabel: {
    fontSize: 16,
  },
  activityIndicator: {
    marginTop: 24,
    marginBottom: 16,
  },
});
