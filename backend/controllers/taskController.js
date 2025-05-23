// backend/controllers/taskController.js
import pool from "../config/db.js"; // Importer la connexion à la base de données

// Fonction pour récupérer toutes les tâches de l'utilisateur connecté (inchangée)
export const getAllTasks = async (req, res) => {
  try {
    // Requête SQL pour récupérer toutes les tâches de l'utilisateur connecté (req.user.id vient du middleware d'authentification)
    const [tasks] = await pool.query(
      "SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    ); // Ajout d'un tri par défaut
    res.status(200).json(tasks); // Retourner les tâches avec statut 200 (OK)
  } catch (error) {
    // Gérer les erreurs
    console.error("Erreur getAllTasks:", error); // Afficher l'erreur dans la console backend
    res
      .status(500)
      .json({ message: "Erreur serveur lors de la récupération des tâches." }); // Retourner une erreur 500 (serveur)
  }
};

// Fonction pour créer une nouvelle tâche (inchangée)
export const createTask = async (req, res) => {
  try {
    const { title, description, due_date } = req.body; // Récupérer les données de la requête POST
    const userId = req.user.id; // ID de l'utilisateur connecté

    // Validation simple (peut être améliorée)
    if (!title) {
      return res
        .status(400)
        .json({ message: "Le titre de la tâche est requis." });
    }

    const [result] = await pool.query(
      // Requête SQL pour insérer une nouvelle tâche
      "INSERT INTO tasks (title, description, due_date, user_id) VALUES (?, ?, ?, ?)", // Requête SQL
      [title, description, due_date || null, userId] // Paramètres (due_date peut être null)
    );
    res
      .status(201)
      .json({ message: "Tâche créée avec succès", taskId: result.insertId }); // Retourner un statut 201 (Créé)
  } catch (error) {
    // Gérer les erreurs
    console.error("Erreur createTask:", error); // Afficher l'erreur dans la console backend
    res
      .status(500)
      .json({ message: "Erreur serveur lors de la création de la tâche." }); // Retourner une erreur 500 (serveur)
  }
};

// *** FONCTION MODIFIÉE ***
// Fonction pour récupérer une tâche par son ID (inclut sharingInfo et vérifie l'accès)
export const getTaskById = async (req, res) => {
  try {
    const taskId = req.params.id; // ID de la tâche depuis l'URL
    const userId = req.user.id; // ID de l'utilisateur connecté

    // 1. Récupérer la tâche et le nom de son propriétaire
    const taskQuery = `
            SELECT t.*, u.username as owner_username
            FROM tasks t
            JOIN users u ON t.user_id = u.id
            WHERE t.id = ?`; // Chercher la tâche par son ID
    const [taskResult] = await pool.query(taskQuery, [taskId]);

    // Si la tâche n'existe pas du tout
    if (!taskResult.length) {
      return res.status(404).json({ message: "Tâche non trouvée." });
    }
    const task = taskResult[0]; // Les détails de la tâche

    // 2. Récupérer les informations de partage pour cette tâche
    const sharesQuery = `
            SELECT si.shared_with, u.username as recipient_username
            FROM shared_items si
            JOIN users u ON si.shared_with = u.id
            WHERE si.item_type = 'task' AND si.item_id = ?`; // Chercher les partages pour cette tâche
    const [sharesResult] = await pool.query(sharesQuery, [taskId]);

    // 3. Vérifier si l'utilisateur actuel a le droit de voir cette tâche
    const isOwner = task.user_id === userId; // Est-ce le propriétaire ?
    const isRecipient = sharesResult.some(
      (share) => share.shared_with === userId
    ); // Est-il un destinataire du partage ?

    if (!isOwner && !isRecipient) {
      // Si l'utilisateur n'est ni propriétaire, ni destinataire, il n'a pas accès
      return res.status(403).json({ message: "Accès refusé à cette tâche." }); // 403 Forbidden
    }

    // 4. Construire l'objet sharingInfo à ajouter à la réponse
    const recipients = sharesResult.map((share) => ({
      id: share.shared_with,
      username: share.recipient_username,
      // NOTE : Le schéma 'shared_items' n'a pas de statut confirm/decline pour les tâches
    }));

    const sharingInfo = {
      isShared: recipients.length > 0, // Vrai si la liste des destinataires n'est pas vide
      sharedBy: {
        // Informations sur le propriétaire de la tâche
        id: task.user_id,
        username: task.owner_username, // Nom récupéré via la JOIN initiale
      },
      recipients: recipients, // Le tableau des utilisateurs avec qui c'est partagé
      myShareInfo: null, // Pas de statut applicable pour les tâches actuellement
    };

    // 5. Renvoyer la tâche avec les informations de partage
    delete task.owner_username; // Nettoyer l'objet task avant de l'envoyer
    res.status(200).json({ ...task, sharingInfo }); // Fusionner task et sharingInfo
  } catch (error) {
    // Gérer les erreurs serveur inattendues
    console.error("Erreur getTaskById:", error); // Afficher l'erreur détaillée dans la console backend
    res
      .status(500)
      .json({ message: "Erreur serveur lors de la récupération de la tâche." }); // Message générique pour le client
  }
};

// Fonction pour mettre à jour une tâche existante (Correction typo status)
export const updateTask = async (req, res) => {
  try {
    const taskId = req.params.id; // Récupérer l'ID de la tâche depuis les paramètres de la requête
    // Récupérer les données potentielles à mettre à jour depuis le corps de la requête POST/PUT
    // Le statut n'est pas géré ici, seulement via completeTask pour l'instant
    const { title, description, due_date } = req.body;

    // Construire la requête UPDATE
    // Vérifie que l'utilisateur qui met à jour est bien le propriétaire (user_id = ?)
    const [result] = await pool.query(
      "UPDATE tasks SET title = ?, description = ?, due_date = ? WHERE id = ? AND user_id = ?",
      [title, description, due_date || null, taskId, req.user.id] // Paramètres de la requête SQL
    );

    // Vérifier si une ligne a été affectée (si la tâche existait et appartenait à l'utilisateur)
    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Tâche non trouvée ou accès refusé pour la modification.",
      });
    }

    res.status(200).json({ message: "Tâche mise à jour avec succès" });
  } catch (error) {
    console.error("Erreur updateTask:", error);
    res.status(500).json({ message: "Erreur serveur lors de la mise à jour." }); // Correction typo : satatus -> status
  }
};

// Fonction pour supprimer une tâche (inchangée)
export const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    // Supprime seulement si l'ID et le user_id correspondent
    const [result] = await pool.query(
      "DELETE FROM tasks WHERE id = ? AND user_id = ?",
      [taskId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Tâche non trouvée ou accès refusé pour la suppression.",
      });
    }

    res.status(200).json({ message: "Tâche supprimée avec succès" });
  } catch (error) {
    console.error("Erreur deleteTask:", error);
    res.status(500).json({ message: "Erreur serveur lors de la suppression." }); // Correction typo message
  }
};

// Fonction pour marquer une tâche comme terminée (Corrections typos SQL + variable)
export const completeTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    // Correction: WHERE et non WERE, req.user.id et non req.uer.id
    // NOTE: Ceci met juste le statut à 'completed'. Pour un vrai toggle, il faudrait une logique différente.
    const [result] = await pool.query(
      'UPDATE tasks SET status = "completed" WHERE id = ? AND user_id = ?',
      [taskId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Tâche non trouvée ou accès refusé pour la complétion.",
      });
    }

    res.status(200).json({ message: "Tâche marquée comme terminée" });
  } catch (error) {
    console.error("Erreur completeTask:", error);
    res.status(500).json({ message: "Erreur serveur lors de la complétion." }); // Correction typo message
  }
};

// Fonction pour partager une tâche avec un autre utilisateur (Correction typo SQL)
export const shareTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { sharedWith } = req.body; // Récupérer l'ID de l'utilisateur destinataire

    // Validation simple
    if (!sharedWith) {
      return res.status(400).json({
        message:
          "L'ID de l'utilisateur destinataire ('sharedWith') est requis.",
      });
    }
    // TODO: Ajouter une vérification que l'utilisateur qui partage est bien le propriétaire de la tâche
    //       Ou permettre à qqn avec qui c'est partagé de repartager ? (Moins courant)
    // const [taskOwner] = await pool.query('SELECT user_id FROM tasks WHERE id = ?', [taskId]);
    // if (!taskOwner.length || taskOwner[0].user_id !== req.user.id) {
    //     return res.status(403).json({ message: "Vous ne pouvez partager que vos propres tâches." });
    // }

    // Correction : VALUES et non VALUE
    const [result] = await pool.query(
      "INSERT INTO shared_items (item_type, item_id, shared_by, shared_with) VALUES (?, ?, ?, ?)",
      ["task", taskId, req.user.id, sharedWith]
    );
    res.status(200).json({
      message: "Tâche partagée avec succès",
      shareId: result.insertId,
    }); // Renvoyer l'ID du partage peut être utile
  } catch (error) {
    console.error("Erreur shareTask:", error);
    // Gérer les erreurs de clé étrangère (ex: sharedWith user ID n'existe pas)
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res
        .status(404)
        .json({ message: "L'utilisateur destinataire n'existe pas." });
    }
    res.status(500).json({ message: "Erreur serveur lors du partage." }); // Correction typo message
  }
};

// Fonction pour récupérer les tâches partagées AVEC l'utilisateur (inchangée)
export const getSharedWithMe = async (req, res) => {
  try {
    const [sharedTasks] = await pool.query(
      // Sélectionne les tâches où l'utilisateur actuel est le destinataire dans shared_items
      `SELECT t.*, u_sharer.username as shared_by_username
             FROM tasks t
             JOIN shared_items si ON t.id = si.item_id
             JOIN users u_sharer ON si.shared_by = u_sharer.id
             WHERE si.shared_with = ? AND si.item_type = 'task'
             ORDER BY t.created_at DESC`, // Tri par date de création de la tâche
      [req.user.id]
    );
    res.status(200).json(sharedTasks);
  } catch (error) {
    console.error("Erreur getSharedWithMe (Tasks):", error); // Log plus spécifique
    res.status(500).json({
      message:
        "Erreur serveur lors de la récupération des tâches partagées avec vous.",
    }); // Correction typo message
  }
};

// Fonction pour récupérer les tâches que l'utilisateur a partagées (Correction typo commentaire)
export const getSharedByMe = async (req, res) => {
  try {
    const [sharedTasks] = await pool.query(
      // Sélectionne les tâches où l'utilisateur actuel est l'expéditeur dans shared_items
      // Et récupère les infos du destinataire
      `SELECT t.*, u_recipient.username as shared_with_username
             FROM tasks t
             JOIN shared_items si ON t.id = si.item_id
             JOIN users u_recipient ON si.shared_with = u_recipient.id
             WHERE si.shared_by = ? AND si.item_type = 'task'
             ORDER BY t.created_at DESC`, // Tri
      [req.user.id]
    );
    res.status(200).json(sharedTasks);
  } catch (error) {
    console.error("Erreur getSharedByMe (Tasks):", error); // Log plus spécifique
    res.status(500).json({
      message:
        "Erreur serveur lors de la récupération de vos tâches partagées.",
    }); // Correction typo message
  }
};
