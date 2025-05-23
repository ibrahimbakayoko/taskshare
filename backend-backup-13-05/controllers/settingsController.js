// backend/controllers/settingsController.js
import pool from "../config/db.js"; // Importer la connexion à la base de données
import bcrypt from "bcrypt"; // <-- AJOUT : Importer bcrypt pour hacher et comparer les mots de passe

// Fonction pour récupérer les paramètres de l'utilisateur connecté
// AMÉLIORATION : Jointure avec users pour avoir username/email et gestion des valeurs par défaut
export const getSettings = async (req, res) => {
  try {
    // Jointure LEFT JOIN pour récupérer les infos user même si user_settings n'existe pas encore
    const [settings] = await pool.query(
      `SELECT us.*, u.username, u.email
              FROM users u
              LEFT JOIN user_settings us ON u.id = us.user_id
              WHERE u.id = ?`, // Sélectionner par l'ID utilisateur
      [req.user.id] // ID de l'utilisateur authentifié via le token
    );

    // Vérifier si l'utilisateur existe
    if (!settings.length) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Construire la réponse en gérant les valeurs potentiellement NULL de user_settings
    const userSettingsData = settings[0];
    const responseSettings = {
      user_id: userSettingsData.id, // Utiliser l'ID principal de l'utilisateur
      username: userSettingsData.username, // Depuis la table users
      email: userSettingsData.email, // Depuis la table users
      theme: userSettingsData.theme || "light", // Valeur par défaut si NULL
      primary_color: userSettingsData.primary_color || "#4285F4", // Valeur par défaut si NULL
      secondary_color: userSettingsData.secondary_color || "#34A853", // Valeur par défaut si NULL
      // Gérer le cas où notifications_enabled est NULL et convertir en booléen
      notifications_enabled:
        userSettingsData.notifications_enabled === null
          ? true
          : Boolean(userSettingsData.notifications_enabled),
    };

    // Renvoyer les paramètres combinés
    res.status(200).json(responseSettings);
  } catch (error) {
    console.error("Erreur getSettings:", error); // Log plus spécifique
    res
      .status(500)
      .json({
        message: "Erreur serveur lors de la récupération des paramètres.",
      }); // Message plus spécifique
  }
};

// Fonction pour mettre à jour la couleur primaire
// AMÉLIORATION : Utilise INSERT ... ON DUPLICATE KEY UPDATE pour créer la ligne si elle manque
export const updatePrimaryColor = async (req, res) => {
  try {
    const { color } = req.body; // Récupérer la couleur depuis le corps de la requête

    // Requête SQL qui insère si l'user_id n'existe pas, ou met à jour s'il existe
    await pool.query(
      "INSERT INTO user_settings (user_id, primary_color) VALUES (?, ?) ON DUPLICATE KEY UPDATE primary_color = ?",
      [req.user.id, color, color] // user_id, valeur pour INSERT, valeur pour UPDATE
    );

    res
      .status(200)
      .json({ message: "Couleur primaire mise à jour avec succès" });
  } catch (error) {
    console.error("Erreur updatePrimaryColor:", error); // Log plus spécifique
    res
      .status(500)
      .json({
        message:
          "Erreur serveur lors de la mise à jour de la couleur primaire.",
      }); // Message plus spécifique
  }
};

// Fonction pour mettre à jour la couleur secondaire
// AMÉLIORATION : Utilise INSERT ... ON DUPLICATE KEY UPDATE
export const updateSecondaryColor = async (req, res) => {
  try {
    const { color } = req.body; // Récupérer la couleur

    // Mettre à jour ou insérer la couleur secondaire dans la base de données
    await pool.query(
      "INSERT INTO user_settings (user_id, secondary_color) VALUES (?, ?) ON DUPLICATE KEY UPDATE secondary_color = ?",
      [req.user.id, color, color]
    );

    res
      .status(200)
      .json({ message: "Couleur secondaire mise à jour avec succès" });
  } catch (error) {
    console.error("Erreur updateSecondaryColor:", error); // Log plus spécifique
    res
      .status(500)
      .json({
        message:
          "Erreur serveur lors de la mise à jour de la couleur secondaire.",
      }); // Message plus spécifique
  }
};

// Fonction pour mettre à jour les préférences de notification
// AMÉLIORATION : Utilise INSERT ... ON DUPLICATE KEY UPDATE et s'assure que la valeur est booléenne
export const updateNotificationSettings = async (req, res) => {
  try {
    // S'assurer que la valeur est booléenne (true/false) et la convertir en 0 ou 1 pour la DB si nécessaire
    const notificationsEnabled = Boolean(req.body.notificationsEnabled);

    // Mettre à jour ou insérer les préférences de notification dans la base de données
    await pool.query(
      "INSERT INTO user_settings (user_id, notifications_enabled) VALUES (?, ?) ON DUPLICATE KEY UPDATE notifications_enabled = ?",
      [req.user.id, notificationsEnabled, notificationsEnabled]
    );

    res
      .status(200)
      .json({
        message: "Préférences de notification mises à jour avec succès",
      });
  } catch (error) {
    console.error("Erreur updateNotificationSettings:", error); // Log console.error est mieux pour les erreurs
    res
      .status(500)
      .json({
        message: "Erreur serveur lors de la mise à jour des notifications.",
      }); // Message plus spécifique
  }
};

// Fonction pour mettre à jour le profil utilisateur
// CORRIGÉ : Ajout de validation pour username/email unique (sauf pour l'utilisateur actuel)
export const updateUserProfile = async (req, res) => {
  try {
    const { username, email } = req.body; // Récupérer les données de la requête POST
    const userId = req.user.id; // ID de l'utilisateur connecté

    // Validation simple des entrées
    if (!username || !email) {
      return res
        .status(400)
        .json({ message: "Le nom d'utilisateur et l'email sont requis." });
    }
    // Validation basique du format email
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ message: "Format d'email invalide." });
    }

    // AJOUT : Vérifier si le nouvel email ou username est déjà pris par un AUTRE utilisateur
    const [existingUsers] = await pool.query(
      "SELECT id FROM users WHERE (email = ? OR username = ?) AND id != ?", // id != ? exclut l'utilisateur actuel de la vérification
      [email, username, userId]
    );

    if (existingUsers.length > 0) {
      // Conflit : email ou username déjà utilisé
      return res
        .status(409)
        .json({
          message:
            "Cet email ou nom d'utilisateur est déjà utilisé par un autre compte.",
        }); // 409 Conflict
    }

    // Mettre à jour le profil utilisateur dans la table 'users'
    const [result] = await pool.query(
      "UPDATE users SET username = ?, email = ? WHERE id = ?",
      [username, email, userId]
    );

    // Vérifier si la mise à jour a affecté une ligne (si l'utilisateur existait)
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    // Renvoyer un succès avec les nouvelles données utilisateur (sans mot de passe)
    res.status(200).json({
      message: "Profil mis à jour avec succès",
      // Important de renvoyer les données mises à jour pour que le frontend puisse rafraîchir son état
      user: { id: userId, username: username, email: email },
    });
  } catch (error) {
    console.error("Erreur updateUserProfile:", error); // Log plus spécifique
    res
      .status(500)
      .json({ message: "Erreur serveur lors de la mise à jour du profil." }); // Message plus spécifique
  }
};

// Fonction pour changer le mot de passe
// CORRIGÉ : Utilisation de bcrypt pour comparer l'ancien MDP et hacher le nouveau
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body; // Récupérer les données de la requete POST
    const userId = req.user.id;

    // Validation des entrées
    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Ancien et nouveau mot de passe sont requis." });
    }
    if (newPassword.length < 6) {
      // Exemple de validation de longueur
      return res
        .status(400)
        .json({
          message: "Le nouveau mot de passe doit faire au moins 6 caractères.",
        });
    }

    // 1. Récupérer le hash actuel de l'utilisateur depuis la base de données
    const [users] = await pool.query(
      "SELECT password FROM users WHERE id = ?",
      [userId]
    );
    if (users.length === 0) {
      // Sécurité: ne pas indiquer si l'utilisateur existe, mais l'erreur ici est improbable car l'user est authentifié
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }
    const currentPasswordHash = users[0].password;

    // 2. Vérifier si l'ancien mot de passe fourni correspond au hash stocké
    // Utiliser bcrypt.compare pour comparer le texte brut avec le hash
    const isMatch = await bcrypt.compare(oldPassword, currentPasswordHash);
    if (!isMatch) {
      // Si ça ne correspond pas, renvoyer une erreur 401 (Non autorisé)
      return res
        .status(401)
        .json({ message: "Ancien mot de passe incorrect." });
    }

    // 3. Si l'ancien mot de passe est correct, hacher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    // 4. Mettre à jour le hash du mot de passe dans la base de données
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [
      newPasswordHash,
      userId,
    ]);

    // Renvoyer un succès
    res.status(200).json({ message: "Mot de passe changé avec succès." });
  } catch (error) {
    console.error("Erreur changePassword:", error); // Log plus spécifique
    res
      .status(500)
      .json({ message: "Erreur serveur lors du changement de mot de passe." }); // Message plus spécifique
  }
};

// Fonction pour exporter les données de l'utilisateur (RGPD)
// CORRIGÉ : Sélectionne des champs spécifiques (non sensibles)
export const exportUserData = async (req, res) => {
  try {
    // Récupérer SEULEMENT certaines données de l'utilisateur depuis la base de données
    const [userData] = await pool.query(
      "SELECT id, username, email, created_at FROM users WHERE id = ?", // Exclure le mot de passe !
      [req.user.id]
    );

    if (userData.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    // Pour une conformité RGPD complète, il faudrait aussi exporter les données associées :
    // const [tasks] = await pool.query('SELECT * FROM tasks WHERE user_id = ?', [req.user.id]);
    // const [appointments] = await pool.query('SELECT * FROM appointments WHERE user_id = ?', [req.user.id]);
    // const [settings] = await pool.query('SELECT * FROM user_settings WHERE user_id = ?', [req.user.id]);
    // etc...

    // Préparer les données à exporter
    const exportData = {
      userInfo: userData[0],
      // tasks: tasks, // Ajouter les autres données ici une fois récupérées
      // appointments: appointments,
      // settings: settings[0]
    };

    // Exporter les données sous forme de fichier JSON (pour l'instant, renvoie juste le JSON)
    // Pour un vrai téléchargement, il faudrait ajouter des en-têtes Content-Disposition
    res.status(200).json(exportData);
  } catch (error) {
    console.error("Erreur exportUserData:", error); // Log plus spécifique
    res
      .status(500)
      .json({ message: "Erreur serveur lors de l'exportation des données." }); // Message plus spécifique
  }
};

// Fonction pour supprimer le compte utilisateur
// CORRIGÉ : Ajout de la vérification du mot de passe avant suppression
export const deleteAccount = async (req, res) => {
  try {
    // Récupérer le mot de passe depuis le corps de la requête DELETE
    // Note: L'envoi de body avec DELETE n'est pas standard, mais souvent utilisé/accepté.
    // Le frontend devra s'assurer de l'envoyer correctement (ex: `axios.delete(url, { data: { password } })`)
    const { password } = req.body;
    const userId = req.user.id;

    // Vérifier si le mot de passe a été fourni
    if (!password) {
      return res
        .status(400)
        .json({
          message:
            "Le mot de passe actuel est requis pour confirmer la suppression du compte.",
        });
    }

    // 1. Récupérer le hash actuel de l'utilisateur
    const [users] = await pool.query(
      "SELECT password FROM users WHERE id = ?",
      [userId]
    );
    if (users.length === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }
    const currentPasswordHash = users[0].password;

    // 2. Vérifier si le mot de passe fourni correspond
    const isMatch = await bcrypt.compare(password, currentPasswordHash);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Mot de passe incorrect. Suppression annulée." }); // 401 Unauthorized
    }

    // 3. Si le mot de passe est correct, supprimer le compte utilisateur de la base de données
    // La contrainte "ON DELETE CASCADE" dans votre SQL devrait supprimer les données liées (tâches, rdv, etc.)
    const [result] = await pool.query("DELETE FROM users WHERE id = ?", [
      userId,
    ]);

    // Vérifier si la suppression a bien eu lieu
    if (result.affectedRows === 0) {
      // Devrait être impossible si on a trouvé l'user avant, mais sécurité
      return res
        .status(404)
        .json({
          message:
            "Utilisateur non trouvé lors de la tentative de suppression.",
        });
    }

    // Renvoyer un succès
    res.status(200).json({ message: "Compte supprimé avec succès." });
  } catch (error) {
    console.error("Erreur deleteAccount:", error); // Log plus spécifique
    res
      .status(500)
      .json({ message: "Erreur serveur lors de la suppression du compte." }); // Message plus spécifique
  }
};
