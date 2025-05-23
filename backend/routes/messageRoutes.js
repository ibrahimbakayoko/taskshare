import express from 'express'; // Charger le module express
import { authenticateToken } from '../middleware/authMiddleware.js'; // Importer le middleware d'authentification
import { getCoversations, getMessagesByConversation, sendMessage, markAsRead, markAllRead, deleteMessage, getUnreadMessages, getUnreadCount, searchUsers } from '../controllers/messageController.js'; // Importer les fonctions du contrôleur de message

const router = express.Router(); // Créer un nouveau routeur express

// Récupérer toutes les conversations de l'utilisateur connecté
router.get('/conversations', authenticateToken, getCoversations); 

// Récupérer les messages d'une conversation spécifique
router.get('/conversations/:userId', authenticateToken, getMessagesByConversation);

// Envoyer un message à un utilisateur
router.post('/', authenticateToken, sendMessage); 

// Marquer un message comme lu
router.patch('/:id/read', authenticateToken, markAsRead);

// Marquer tous les messages d'une conversation comme lus
router.patch('/conversations/:userId/read', authenticateToken, markAllRead);

// Supprimer un message
router.delete('/:id', authenticateToken, deleteMessage);

// Récupérer les messages non lus
router.get('/unread', authenticateToken, getUnreadMessages);

// Récupérer le nombre de messages non lus
router.get('/unread/count', authenticateToken, getUnreadCount); // Correction ici : ajout de 'get'

// Rechercher des utilisateurs pour démarrer une conversation
router.get('/users/search', authenticateToken, searchUsers);

// Exporter le routeur
export default router;
