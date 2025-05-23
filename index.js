// index.js
import "react-native-gesture-handler"; // Doit être en haut
import { registerRootComponent } from "expo";
import React from "react";
import { Provider as PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context"; // <-- **IMPORTER ICI**
import { AuthProvider } from "./src/context/AuthContext";
import { ThemeProvider, ThemeContext } from "./src/context/ThemeContext";
import { SnackbarProvider } from "./src/context/SnackbarContext";
import RootNavigator from "./src/navigation/RootNavigator";

// Composant intermédiaire pour accéder au thème fourni par ThemeProvider
const ThemeApp = () => {
  const { theme } = React.useContext(ThemeContext); // Utiliser useContext ici
  // PaperProvider gère aussi certaines choses liées à la safe area via SafeAreaProviderCompat,
  // mais il est recommandé d'avoir un SafeAreaProvider principal englobant tout.
  return (
    <PaperProvider theme={theme}>
      <RootNavigator />
    </PaperProvider>
  );
};

// Composant racine de l'application
function AppRoot() {
  return (
    // **ENTOURER TOUTE L'APPLICATION AVEC SafeAreaProvider**
    <SafeAreaProvider>
      <AuthProvider>
        <ThemeProvider>
          <SnackbarProvider>
            {/* ThemeApp contient PaperProvider et RootNavigator */}
            <ThemeApp />
            {/* Le Snackbar global est rendu à l'intérieur de SnackbarProvider */}
          </SnackbarProvider>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider> // **FIN de SafeAreaProvider**
  );
}

// Enregistrement du composant racine
registerRootComponent(AppRoot);
