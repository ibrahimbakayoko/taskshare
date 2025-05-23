// backend/routes/appointmentRoutes.js
import express from "express"; // Importer le module express
import { authenticateToken } from "../middleware/authMiddleware.js"; // Importer le middleware authenticateToken
// Importer toutes les fonctions nécessaires du controller
import {
  getAllAppointments,
  getAppointmentsByDate,
  getAppointmentsById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  shareAppointment,
  getShareWithMe, // Correction nom probable: getSharedWithMe
  getSharedByMe,
  confirmAttendance,
  declineAttendance,
} from "../controllers/appointmentController.js";

const router = express.Router(); // Créer un router

// --- Routes Générales ---

// GET /appointments : Récupérer tous les rendez-vous de l'utilisateur connecté
router.get("/", authenticateToken, getAllAppointments);

// POST /appointments : Créer un nouveau rendez-vous
router.post("/", authenticateToken, createAppointment);

// --- Routes Spécifiques aux Partages (préfixées /shared/ ou /share/) ---

// GET /appointments/shared/with-me : Récupérer les rendez-vous partagés AVEC l'utilisateur
// Correction du chemin pour cohérence: /share/ -> /shared/
router.get("/shared/with-me", authenticateToken, getShareWithMe); // Assurez-vous que le nom de la fonction controller est correct aussi

// GET /appointments/shared/by-me : Récupérer les rendez-vous que l'utilisateur a partagé
router.get("/shared/by-me", authenticateToken, getSharedByMe);

// PATCH /appointments/shared/:id/confirm : Confirmer la participation (pour l'utilisateur connecté)
// Ajout de (\\d+) pour s'assurer que :id est numérique
router.patch("/shared/:id(\\d+)/confirm", authenticateToken, confirmAttendance);

// PATCH /appointments/shared/:id/decline : Décliner la participation (pour l'utilisateur connecté)
// Ajout de (\\d+)
router.patch("/shared/:id(\\d+)/decline", authenticateToken, declineAttendance);

// --- Routes Spécifiques par ID (AVANT les routes génériques comme /date/:date) ---

// GET /appointments/:id : Récupérer un rendez-vous spécifique par son ID numérique
// Doit venir AVANT /date/:date pour éviter les conflits si date ressemble à un nombre
// Ajout de (\\d+) pour forcer l'ID à être numérique
router.get("/:id(\\d+)", authenticateToken, getAppointmentsById);

// PUT /appointments/:id : Mettre à jour un rendez-vous existant
// Ajout de (\\d+)
router.put("/:id(\\d+)", authenticateToken, updateAppointment);

// DELETE /appointments/:id : Supprimer un rendez-vous
// Ajout de (\\d+)
router.delete("/:id(\\d+)", authenticateToken, deleteAppointment);

// POST /appointments/:id/share : Partager un rendez-vous avec un autre utilisateur
// Ajout de (\\d+)
router.post("/:id(\\d+)/share", authenticateToken, shareAppointment);

// --- Routes Spécifiques par Date (MAINTENANT APRES /:id) ---

// GET /appointments/date/:date : Récupérer les rendez-vous par date
// Cette route ne sera atteinte que si le paramètre ne correspond pas à /:id(\\d+)
router.get("/date/:date", authenticateToken, getAppointmentsByDate);

export default router; // Exporter le routeur configuré
