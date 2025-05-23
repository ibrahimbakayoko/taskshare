import express from 'express'; // express module
import * as authController from '../controllers/authControllers.js'; // Authentification controller

const router = express.Router(); // Router

router.post('/register', authController.register); // Route d'inscription
router.post('/login', authController.login); // Route de connexion

export default router; // Exportation du router