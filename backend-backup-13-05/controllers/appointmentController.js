// backend/controllers/appointmentController.js
import pool from "../config/db.js"; // Importer la connexion à la base de données
import moment from "moment"; // Importer moment pour la gestion des dates (utilisé dans createAppointment)

// Helper pour vérifier si un ID appartient bien à l'utilisateur connecté
// NOTE: Cette fonction est toujours utilisée par updateAppointment et deleteAppointment.
// On pourrait intégrer la logique de vérification directement dans ces fonctions comme on le fait pour getAppointmentsById.
async function checkAppointmentOwnership(appointmentId, userId) {
  const [appointment] = await pool.query(
    "SELECT user_id FROM appointments WHERE id = ?",
    [appointmentId]
  );
  // Vérifie si le RDV existe ET si l'user ID correspond
  if (!appointment.length || appointment[0].user_id !== userId) {
    return false; // Non trouvé ou pas le propriétaire
  }
  return true; // C'est le propriétaire
}

// Fonction pour récupérer tous les rendez-vous de l'utilisateur connecté (inchangée)
export const getAllAppointments = async (req, res) => {
  try {
    // Sélectionner et trier par date de début (le plus récent en premier)
    const [appointments] = await pool.query(
      "SELECT * FROM appointments WHERE user_id = ? ORDER BY start_time DESC", // Ajout du tri
      [req.user.id] // Utilise l'ID de l'utilisateur authentifié
    );
    res.status(200).json(appointments); // Renvoie la liste
  } catch (error) {
    console.error("Erreur getAllAppointments:", error); // Log spécifique
    res.status(500).json({
      message: "Erreur serveur lors de la récupération des rendez-vous.",
    }); // Message spécifique
  }
};

// Fonction pour récupérer les rendez-vous par date (inchangée)
export const getAppointmentsByDate = async (req, res) => {
  try {
    const date = req.params.date; // Format attendu: 'YYYY-MM-DD'
    // Vérifier le format de la date
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res
        .status(400)
        .json({ message: "Format de date invalide (YYYY-MM-DD attendu)." });
    }
    // Utiliser DATE() en SQL pour comparer juste la partie date
    const [appointments] = await pool.query(
      "SELECT * FROM appointments WHERE DATE(start_time) = ? AND user_id = ? ORDER BY start_time ASC", // Tri par heure de début
      [date, req.user.id]
    );
    res.status(200).json(appointments);
  } catch (error) {
    console.error("Erreur getAppointmentsByDate:", error); // Log spécifique
    res
      .status(500)
      .json({ message: "Erreur serveur lors de la récupération par date." }); // Message spécifique
  }
};

// *** FONCTION MODIFIÉE ***
// Fonction pour récupérer un RDV par son ID (inclut sharingInfo et vérifie l'accès)
export const getAppointmentsById = async (req, res) => {
  try {
    const appointmentId = req.params.id; // ID du RDV depuis l'URL
    const userId = req.user.id; // ID de l'utilisateur connecté

    // 1. Récupérer le RDV et le nom de son propriétaire
    const appointmentQuery = `
            SELECT a.*, u.username as owner_username
            FROM appointments a
            JOIN users u ON a.user_id = u.id
            WHERE a.id = ?`; // Chercher par ID du RDV
    const [appointmentResult] = await pool.query(appointmentQuery, [
      appointmentId,
    ]);

    // Si le RDV n'existe pas
    if (!appointmentResult.length) {
      return res.status(404).json({ message: "Rendez-vous non trouvé." });
    }
    const appointment = appointmentResult[0]; // Les détails du RDV

    // 2. Récupérer les informations de partage pour ce RDV
    const sharesQuery = `
            SELECT si.shared_with, u.username as recipient_username, si.confirmed, si.declined
            FROM shared_items si
            JOIN users u ON si.shared_with = u.id
            WHERE si.item_type = 'appointment' AND si.item_id = ?`; // Chercher les partages pour ce RDV
    const [sharesResult] = await pool.query(sharesQuery, [appointmentId]);

    // 3. Vérifier si l'utilisateur actuel a le droit de voir ce RDV
    const isOwner = appointment.user_id === userId; // Est-il le propriétaire ?
    let isRecipient = false; // Est-il un destinataire ?
    let myShareInfoFromDb = null; // Quel est son statut de confirmation/refus ?

    // Parcourir les résultats du partage pour voir si l'utilisateur actuel est dedans
    for (const share of sharesResult) {
      if (share.shared_with === userId) {
        isRecipient = true;
        // Stocker le statut de l'utilisateur actuel (converti en booléen ou null)
        myShareInfoFromDb = {
          confirmed: share.confirmed === null ? null : Boolean(share.confirmed),
          declined: share.declined === null ? null : Boolean(share.declined),
        };
        break; // On a trouvé l'info, on arrête la boucle
      }
    }

    // Si l'utilisateur n'est NI propriétaire, NI destinataire, refuser l'accès
    if (!isOwner && !isRecipient) {
      return res
        .status(403)
        .json({ message: "Accès refusé à ce rendez-vous." }); // 403 Forbidden
    }

    // 4. Construire l'objet sharingInfo
    const recipients = sharesResult.map((share) => ({
      id: share.shared_with,
      username: share.recipient_username,
      // Inclure le statut de chaque destinataire (converti)
      confirmed: share.confirmed === null ? null : Boolean(share.confirmed),
      declined: share.declined === null ? null : Boolean(share.declined),
    }));

    const sharingInfo = {
      isShared: recipients.length > 0, // Vrai si la liste des destinataires n'est pas vide
      sharedBy: {
        // Infos sur le propriétaire du RDV
        id: appointment.user_id,
        username: appointment.owner_username, // Nom récupéré via la JOIN
      },
      recipients: recipients, // Liste des destinataires et leur statut
      myShareInfo: myShareInfoFromDb, // Le statut spécifique de l'utilisateur actuel (ou null)
    };

    // 5. Renvoyer le RDV avec les informations de partage ajoutées
    delete appointment.owner_username; // Enlever le champ dupliqué avant d'envoyer
    res.status(200).json({ ...appointment, sharingInfo }); // Fusionner les infos du RDV et du partage
  } catch (error) {
    console.error("Erreur getAppointmentsById:", error); // Log détaillé sur le serveur
    res.status(500).json({
      message: "Erreur serveur lors de la récupération du rendez-vous.",
    }); // Message générique au client
  }
};

// Fonction pour créer un nouveau rendez-vous (inchangée)
export const createAppointment = async (req, res) => {
  try {
    // Récupérer les données du corps de la requête
    const { title, description, start_time, end_time, location } = req.body;
    const userId = req.user.id; // ID de l'utilisateur connecté

    // Validation simple des données reçues
    if (!title || !start_time || !end_time) {
      return res.status(400).json({
        message: "Titre, heure de début et heure de fin sont requis.",
      });
    }
    // Utiliser moment pour valider la chronologie des dates
    if (moment(end_time).isBefore(moment(start_time))) {
      return res.status(400).json({
        message: "L'heure de fin ne peut être avant l'heure de début.",
      });
    }

    // Requête SQL d'insertion
    const query = `
            INSERT INTO appointments (title, description, start_time, end_time, location, user_id)
            VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [
      title,
      description,
      start_time,
      end_time,
      location || null,
      userId,
    ]; // Assurer que location est null si non fourni

    // Exécuter la requête
    const [result] = await pool.query(query, values);

    // Renvoyer une réponse succès avec l'ID du nouveau RDV
    res
      .status(201)
      .json({ message: "Rendez-vous créé avec succès", id: result.insertId });
  } catch (error) {
    console.error("Erreur createAppointment:", error); // Log spécifique
    res
      .status(500)
      .json({ message: "Erreur serveur lors de la création du rendez-vous." }); // Message spécifique
  }
};

// Fonction pour mettre à jour un rendez-vous existant (inchangée)
export const updateAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id; // ID du RDV à mettre à jour
    const { title, description, start_time, end_time, location } = req.body; // Nouvelles données

    // Sécurité : Vérifier si l'utilisateur actuel est bien le propriétaire du RDV
    const isOwner = await checkAppointmentOwnership(appointmentId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({
        message:
          "Accès refusé : vous n'êtes pas propriétaire de ce rendez-vous.",
      });
    }

    // Validation des dates (optionnel mais recommandé)
    if (
      start_time &&
      end_time &&
      moment(end_time).isBefore(moment(start_time))
    ) {
      return res.status(400).json({
        message: "L'heure de fin ne peut être avant l'heure de début.",
      });
    }

    // Requête SQL UPDATE
    const query = `
            UPDATE appointments
            SET title = ?, description = ?, start_time = ?, end_time = ?, location = ?
            WHERE id = ? AND user_id = ?`; // Condition WHERE importante
    const values = [
      title,
      description,
      start_time,
      end_time,
      location || null,
      appointmentId,
      req.user.id,
    ];

    // Exécuter la requête
    const [result] = await pool.query(query, values);

    // Vérifier si une ligne a été modifiée
    if (result.affectedRows === 0) {
      return res.status(404).json({
        message:
          "Rendez-vous non trouvé ou non modifié (aucune donnée changée?).",
      });
    }

    res.status(200).json({ message: "Rendez-vous mis à jour avec succès" });
  } catch (error) {
    console.error("Erreur updateAppointment:", error); // Log spécifique
    res.status(500).json({ message: "Erreur serveur lors de la mise à jour." }); // Message spécifique
  }
};

// Fonction pour supprimer un rendez-vous (inchangée)
export const deleteAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id; // ID du RDV à supprimer

    // Sécurité : Vérifier si l'utilisateur est propriétaire
    const isOwner = await checkAppointmentOwnership(appointmentId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({ message: "Accès refusé." });
    }

    // Requête SQL DELETE
    const [result] = await pool.query(
      "DELETE FROM appointments WHERE id = ? AND user_id = ?",
      [appointmentId, req.user.id]
    );

    // Vérifier si une ligne a été supprimée
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Rendez-vous non trouvé." });
    }

    res.status(200).json({ message: "Rendez-vous supprimé avec succès" });
  } catch (error) {
    console.error("Erreur deleteAppointment:", error); // Log spécifique
    res.status(500).json({ message: "Erreur serveur lors de la suppression." }); // Message spécifique
  }
};

// Fonction pour partager un rendez-vous (inchangée)
export const shareAppointment = async (req, res) => {
  try {
    const appointmentId = req.params.id; // ID du RDV à partager
    const { sharedWith } = req.body; // ID de l'utilisateur destinataire

    // Validation de base
    if (!sharedWith) {
      return res.status(400).json({
        message:
          "L'ID de l'utilisateur destinataire est requis ('sharedWith').",
      });
    }

    // Sécurité : Vérifier que celui qui partage est le propriétaire
    const isOwner = await checkAppointmentOwnership(appointmentId, req.user.id);
    if (!isOwner) {
      return res.status(403).json({
        message: "Vous ne pouvez partager que vos propres rendez-vous.",
      });
    }

    // Optionnel mais TRES recommandé : Vérifier si le partage n'existe pas déjà
    const [existingShare] = await pool.query(
      "SELECT id FROM shared_items WHERE item_type = ? AND item_id = ? AND shared_with = ?",
      ["appointment", appointmentId, sharedWith]
    );
    if (existingShare.length > 0) {
      return res.status(409).json({
        message: "Ce rendez-vous est déjà partagé avec cet utilisateur.",
      }); // 409 Conflict
    }

    // Requête SQL INSERT pour créer le partage
    const query = `
            INSERT INTO shared_items (item_type, item_id, shared_by, shared_with)
            VALUES (?, ?, ?, ?)`; // Utiliser VALUES
    const values = ["appointment", appointmentId, req.user.id, sharedWith];

    const [result] = await pool.query(query, values);

    res.status(200).json({
      message: "Rendez-vous partagé avec succès",
      shareId: result.insertId,
    });
  } catch (error) {
    console.error("Erreur shareAppointment:", error); // Log spécifique
    // Gérer l'erreur si l'utilisateur destinataire n'existe pas (clé étrangère)
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res
        .status(404)
        .json({ message: "L'utilisateur destinataire n'existe pas." });
    }
    res.status(500).json({ message: "Erreur serveur lors du partage." }); // Message spécifique
  }
};

// Fonction pour récupérer les RDV partagés AVEC l'utilisateur (inchangée)
export const getShareWithMe = async (req, res) => {
  try {
    // Requête SQL pour trouver les RDV où l'utilisateur actuel est le destinataire du partage
    const query = `
            SELECT a.*, u_sharer.username as shared_by_username, si.confirmed, si.declined
            FROM appointments a
            JOIN shared_items si ON a.id = si.item_id
            JOIN users u_sharer ON si.shared_by = u_sharer.id
            WHERE si.shared_with = ? AND si.item_type = 'appointment'
            ORDER BY a.start_time DESC`; // Trier par date de début
    const [sharedAppointments] = await pool.query(query, [req.user.id]);

    // Convertir confirmed/declined en booléens ou null
    const formattedAppointments = sharedAppointments.map((appt) => ({
      ...appt,
      confirmed: appt.confirmed === null ? null : Boolean(appt.confirmed),
      declined: appt.declined === null ? null : Boolean(appt.declined),
    }));

    res.status(200).json(formattedAppointments);
  } catch (error) {
    console.error("Erreur getShareWithMe (Appointments):", error); // Log spécifique
    res
      .status(500)
      .json({ message: "Erreur serveur récupération partages reçus." }); // Message spécifique
  }
};

// Fonction pour récupérer les RDV partagés PAR l'utilisateur (inchangée)
export const getSharedByMe = async (req, res) => {
  try {
    // Requête SQL pour trouver les RDV où l'utilisateur actuel est celui qui a partagé
    // Et inclure les infos du destinataire et son statut
    const query = `
            SELECT a.*, u_receiver.username as shared_with_username, si.confirmed, si.declined
            FROM appointments a
            JOIN shared_items si ON a.id = si.item_id
            JOIN users u_receiver ON si.shared_with = u_receiver.id
            WHERE si.shared_by = ? AND si.item_type = 'appointment'
            ORDER BY a.start_time DESC`; // Trier
    const [sharedAppointments] = await pool.query(query, [req.user.id]);

    // Convertir confirmed/declined en booléens ou null
    const formattedAppointments = sharedAppointments.map((appt) => ({
      ...appt,
      confirmed: appt.confirmed === null ? null : Boolean(appt.confirmed),
      declined: appt.declined === null ? null : Boolean(appt.declined),
    }));

    res.status(200).json(formattedAppointments);
  } catch (error) {
    console.error("Erreur getSharedByMe (Appointments):", error); // Log spécifique
    res
      .status(500)
      .json({ message: "Erreur serveur récupération partages envoyés." }); // Message spécifique
  }
};

// Fonction pour confirmer la participation à un RDV partagé (inchangée)
export const confirmAttendance = async (req, res) => {
  try {
    const appointmentId = req.params.id; // ID du RDV (item_id)
    const userId = req.user.id; // ID de l'utilisateur qui confirme (shared_with)

    // Requête UPDATE pour mettre confirmed=TRUE, declined=FALSE pour ce partage spécifique
    const [result] = await pool.query(
      'UPDATE shared_items SET confirmed = TRUE, declined = FALSE WHERE item_id = ? AND item_type = "appointment" AND shared_with = ?',
      [appointmentId, userId]
    );

    // Vérifier si la mise à jour a fonctionné (si le partage existait pour cet user)
    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Partage non trouvé ou accès refusé pour confirmer.",
      });
    }
    res.status(200).json({ message: "Participation confirmée" });
  } catch (error) {
    console.error("Erreur confirmAttendance:", error); // Log spécifique
    res
      .status(500)
      .json({ message: "Erreur serveur lors de la confirmation." }); // Message spécifique
  }
};

// Fonction pour décliner la participation à un RDV partagé (inchangée)
export const declineAttendance = async (req, res) => {
  try {
    const appointmentId = req.params.id; // ID du RDV (item_id)
    const userId = req.user.id; // ID de l'utilisateur qui décline (shared_with)

    // Requête UPDATE pour mettre declined=TRUE, confirmed=FALSE
    const [result] = await pool.query(
      'UPDATE shared_items SET declined = TRUE, confirmed = FALSE WHERE item_id = ? AND item_type = "appointment" AND shared_with = ?',
      [appointmentId, userId]
    );

    // Vérifier si la mise à jour a fonctionné
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Partage non trouvé ou accès refusé pour décliner." });
    }
    res.status(200).json({ message: "Participation déclinée" });
  } catch (error) {
    console.error("Erreur declineAttendance:", error); // Log spécifique
    res.status(500).json({ message: "Erreur serveur lors du refus." }); // Message spécifique
  }
};
