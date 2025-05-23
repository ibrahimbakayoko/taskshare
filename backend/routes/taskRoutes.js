import express from 'express'; // Importer le module express
import { authenticateToken } from '../middleware/authMiddleware.js'; // Importer le middleware d'authentification
import { getAllTasks, getTaskById, createTask, updateTask, deleteTask, completeTask, shareTask, getSharedWithMe, getSharedByMe } from '../controllers/taskController.js';

const router = express.Router(); // Importer le module router d'express

// Récupérer toutes les tâches de l'utilisateur connecté avec la méthode GET sur la route '/'
router.get('/', authenticateToken, getAllTasks);

// Récupérer une tâche spécifique
router.get('/:id', authenticateToken, getTaskById);

// Créer une nouvelle tâche
router.post('/', authenticateToken, createTask);

// Mettre à jour une tâche
router.put('/:id', authenticateToken, updateTask);

// Supprimer une têche
router.delete('/:id', authenticateToken, deleteTask);

// Marquer une tâche comme terminée
router.patch('/:id/complete', authenticateToken, completeTask);

// Partager une tâche avec un autre utilisateur
router.post('/:id/share', authenticateToken, shareTask);

// Récupérer les tâches partagées avec l'utilisateur connecté
router.get('/shared/with-me', authenticateToken, getSharedWithMe);

// Récupérer les tâches partagées par l'utilisateur connecté
router.get('/shared/by-me', authenticateToken, getSharedByMe);

// Exporter le router
export default router;

