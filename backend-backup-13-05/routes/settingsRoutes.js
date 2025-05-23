import express from'express'; // Chargement de Express
import { authenticateToken } from '../middleware/authMiddleware.js'; // Chargement du middleware d'authentification
import { getSettings, updatePrimaryColor, updateSecondaryColor, updateNotificationSettings, updateUserProfile, changePassword, exportUserData, deleteAccount } from '../controllers/settingsController.js';
 // Chargement du contrôlleur de paramètres

const router = express.Router(); // Création d'un routeur Express

// Récupérer les paramètres de l'utilisateur
router.get('/', authenticateToken, getSettings);

//Mettre à jour la couleur primaires
router.patch('/color/primary', authenticateToken, updatePrimaryColor);

// Mettre à jour la couleur secondaire
router.patch('/color/secondary', authenticateToken, updateSecondaryColor);

// Mettre à jour les préférences de notification
router.patch('/notifications', authenticateToken, updateNotificationSettings);

// Mettre à jour le profil utilisateur
router.put('/profile', authenticateToken, updateUserProfile);

// Changer le mot de passe
router.put('/password', authenticateToken, changePassword);

// Exporter les données de l'utilisateur (RGPD)
router.get('/export-data', authenticateToken, exportUserData);

// Supprimer le compte utilisateur
router.delete('/account', authenticateToken, deleteAccount);

// Exporter le routeur
export default router;
