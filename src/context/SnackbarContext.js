// src/context/SnackbarContext.js
import React, { createContext, useState, useCallback } from "react";
import { Snackbar } from "react-native-paper";

// Créer le contexte
export const SnackbarContext = createContext({
  showSnackbar: (message, duration) => {}, // Fonction exposée
});

// Créer le fournisseur (Provider)
export const SnackbarProvider = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [duration, setDuration] = useState(Snackbar.DURATION_SHORT);
  // Optionnel: Ajouter un état pour une action dans le snackbar
  // const [action, setAction] = useState(null);

  // Fonction pour fermer le Snackbar
  const onDismissSnackBar = () => setVisible(false);

  // Fonction pour afficher le Snackbar (sera appelée depuis les autres composants)
  const showSnackbar = useCallback((msg, dur = Snackbar.DURATION_SHORT) => {
    setMessage(msg);
    setDuration(dur);
    // setAction(act); // Si on veut une action
    setVisible(true); // Rend le Snackbar visible
    console.log(`[Snackbar] Affichage: "${msg}"`);
  }, []);

  // La valeur fournie par le contexte (seulement la fonction showSnackbar est nécessaire aux consommateurs)
  const value = { showSnackbar };

  return (
    <SnackbarContext.Provider value={value}>
      {/* Les composants enfants de l'application */}
      {children}

      {/* Le composant Snackbar global, toujours rendu mais visible conditionnellement */}
      {/* Il est placé ici, DANS le Provider mais HORS des children directs */}
      {/* pour être "au-dessus" de tout le reste grâce au Portal implicite de Snackbar */}
      <Snackbar
        visible={visible}
        onDismiss={onDismissSnackBar}
        duration={duration}
        // style={styles.snackbar} // Appliquer un style si besoin
        // action={action} // Ajouter si on a défini une action
      >
        {message}
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

// Optionnel: Styles pour le Snackbar
// const styles = StyleSheet.create({
//   snackbar: {
//     // Exemple: position: 'absolute', bottom: 50,
//   },
// });
