import pool from '../config/db.js'; // Importer la connexion à la base de données

// Fonction pour récupérer toutes les conversations de l'utilisateur connecté
export const getCoversations = async (req, res) => {
  try {
    // Récupérer les conversations en joignant les messages avec les utilisateurs
    const [conversations] = await pool.query('SELECT DISTINCT u.id, u.username FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.receiver_id = ? UNION SELECT DISTINCT u.id, u.username FROM messages m JOIN users u ON m.receiver_id = u.id WHERE m.sender_id = ?', [req.user.id, req.user.id]);
    
    res.status(200).json(conversations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Fonction pour récupérer les messages d'une conversation spécifique
export const getMessagesByConversation = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Récupérer les messages entre l'utilisateur connecté et l'utilisateur spécifié
    const [messages] = await pool.query('SELECT * FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY created_at ASC', [req.user.id, userId, userId, req.user.id]);
    
    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Fonction pour envoyer un message à un utilisateur
export const sendMessage = async (req, res) => {
  try {
    const { content, receiverId } = req.body;
    
    // Insérer le message dans la base de données
    const [result] = await pool.query('INSERT INTO messages (content, sender_id, receiver_id) VALUES (?, ?, ?)', [content, req.user.id, receiverId]);
    
    res.status(201).json({ message: 'Message envoyé avec succès', messageId: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Fonction pour marquer un message comme lu
export const markAsRead = async (req, res) => {
  try {
    const messageId = req.params.id;
    
    // Mettre à jour le statut de lecture du message
    await pool.query('UPDATE messages SET is_read = TRUE WHERE id = ? AND receiver_id = ?', [messageId, req.user.id]);
    
    res.status(200).json({ message: 'Message marqué comme lu' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Fonction pour marquer tous les messages d'une conversation comme lus
export const markAllRead = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Mettre à jour le statut de lecture de tous les messages dans la conversation
    await pool.query('UPDATE messages SET is_read = TRUE WHERE receiver_id = ? AND (sender_id = ? OR receiver_id = ?)', [req.user.id, userId, userId]);
    
    res.status(200).json({ message: 'Tous les messages marqués comme lus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Fonction pour supprimer un message
export const deleteMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    
    // Supprimer le message de la base de données
    await pool.query('DELETE FROM messages WHERE id = ? AND (sender_id = ? OR receiver_id = ?)', [messageId, req.user.id, req.user.id]);
    
    res.status(200).json({ message: 'Message supprimé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Fonction pour récupérer les messages non lus
export const getUnreadMessages = async (req, res) => {
  try {
    // Récupérer les messages non lus pour l'utilisateur connecté
    const [messages] = await pool.query('SELECT * FROM messages WHERE receiver_id = ? AND is_read = FALSE', [req.user.id]);
    
    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Fonction pour récupérer le nombre de messages non lus
export const getUnreadCount = async (req, res) => {
  try {
    // Compter les messages non lus pour l'utilisateur connecté
    const [count] = await pool.query('SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = FALSE', [req.user.id]);
    
    res.status(200).json({ count: count[0].count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// Fonction pour rechercher des utilisateurs pour démarrer une conversation
export const searchUsers = async (req, res) => {
  try {
    const query = req.query.q; // Récupérer la chaîne de recherche
    
    // Rechercher des utilisateurs par nom ou email
    const [users] = await pool.query('SELECT id, username, email FROM users WHERE username LIKE ? OR email LIKE ?', [`%${query}%`, `%${query}%`]);
    
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
