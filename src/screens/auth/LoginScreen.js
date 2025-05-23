import React, { useState, useContext } from "react";
import {
  View,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  ImageBackground,
  useWindowDimensions,
} from "react-native";
import {
  TextInput,
  Button,
  Text,
  ActivityIndicator,
  useTheme,
  Appbar,
} from "react-native-paper";
import { AuthContext } from "../../context/AuthContext";
import { useNavigation } from "@react-navigation/native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const theme = useTheme();
  const navigation = useNavigation();

  const { height } = useWindowDimensions();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erreur", "Veuillez remplir l'email et le mot de passe.");
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
      console.log("Connexion réussie depuis LoginScreen");
    } catch (error) {
      console.error("Erreur de connexion:", error);
      Alert.alert(
        "Erreur de connexion",
        error.message || "Email ou mot de passe incorrect."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const goToRegister = () => {
    navigation.navigate("Register");
  };

  const backgroundStyle = {
    position: "absolute",
    top: -0.4 * height,
    left: 0,
    right: 0,
    height: height * 1.1,
    width: "100%",
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require("../../../assets/images/hero-bg.svg")}
        style={backgroundStyle}
        resizeMode="cover"
      />

      <View style={styles.overlay}>
        <Appbar.Header style={styles.header}>
          <Appbar.Content title="TaskShare" color="#fff" />
        </Appbar.Header>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.presentationContainer}>
            <Image
              source={require("../../../assets/images/imgScheduleGroupe.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.appName}>TaskShare</Text>
            <Text style={styles.appDescription}>
              Gérer et partager vos tâches efficacement.
            </Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.loginTitle}>Connectez-vous</Text>

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              mode="outlined"
              textColor="#EEE"
              theme={{
                colors: {
                  primary: "#B4BAFF",
                  outline: "#B4BAFF",
                  placeholder: "#D6D8FF",
                  text: "#EEE",
                  background: "rgba(180, 186, 255, 0.1)",
                },
              }}
            />

            <TextInput
              label="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              mode="outlined"
              textColor="#EEE"
              theme={{
                colors: {
                  primary: "#B4BAFF",
                  outline: "#B4BAFF",
                  placeholder: "#D6D8FF",
                  text: "#EEE",
                  background: "rgba(180, 186, 255, 0.1)",
                },
              }}
            />

            <View style={styles.buttonContainer}>
              {isLoading ? (
                <ActivityIndicator animating={true} color="#B4BAFF" />
              ) : (
                <Button
                  mode="contained"
                  onPress={handleLogin}
                  style={styles.loginButton}
                  labelStyle={{ fontWeight: "bold", color: "#222" }}
                >
                  Se connecter
                </Button>
              )}
            </View>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Pas encore de compte ?</Text>
              <Button
                mode="text"
                onPress={goToRegister}
                textColor="#B4BAFF"
                labelStyle={{ fontWeight: "600" }}
              >
                Créer un compte
              </Button>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} TaskShare
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  overlay: {
    flex: 1,
    // backgroundColor: "rgba(0,0,0,0.25)",
  },
  header: {
    backgroundColor: "transparent",
    elevation: 0,
  },
  content: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  presentationContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logoImage: {
    width: 180,
    height: 140,
    marginBottom: 10,
  },
  appName: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  appDescription: {
    color: "#e0e0e0",
    textAlign: "center",
    paddingHorizontal: 20,
    fontSize: 14,
  },
  formCard: {
    width: "100%",
    maxWidth: 400,
    padding: 24,
    borderRadius: 20,
    backgroundColor: "rgba(180, 186, 255, 0.15)", // violet clair transparent
    borderWidth: 1,
    borderColor: "#B4BAFF",
    marginBottom: 30,
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#EEE",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    marginBottom: 12,
    backgroundColor: "rgba(180, 186, 255, 0.1)",
  },
  buttonContainer: {
    marginTop: 10,
    alignItems: "flex-end",
  },
  loginButton: {
    backgroundColor: "#B4BAFF",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  registerContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  registerText: {
    color: "#ccc",
    marginBottom: 4,
  },
  footer: {
    marginTop: 20,
  },
  footerText: {
    color: "#aaa",
    fontSize: 12,
    textAlign: "center",
  },
});
