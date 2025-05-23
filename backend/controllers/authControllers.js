// backend/controllers/authControllers.js (VERSION ENTIÈREMENT CORRIGÉE)
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

// Inscription utilisateur
export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const [existingUsers] = await pool.query(
      "SELECT * FROM users WHERE email = ? OR username = ?",
      [email, username] // Utilisation de 'username' (corrigé)
    );

    if (existingUsers.length > 0) {
      return res
        .status(400)
        .json({ message: "Cet email ou nom d'utilisateur existe déjà" });
    }

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt); // Utilisation de 'password' (correct)

    // Insérer le nouvel utilisateur dans la base de données
    const [result] = await pool.query(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      // CORRECTION ICI: Utilisation de hashedPassword (avec 'ss')
      [username, email, hashedPassword]
    );

    // Créer les paramètres par défaut pour l'utilisateur
    // CORRECTION ICI: INSERT INTO et VALUES
    await pool.query("INSERT INTO user_settings (user_id) VALUES (?)", [
      result.insertId,
    ]);

    // Générer un token JWT pour l'utilisateur inscrit
    const token = jwt.sign(
      { id: result.insertId, username, email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(201).json({
      token,
      user: { id: result.insertId, username, email },
    });
  } catch (error) {
    console.error("Erreur dans register controller:", error);
    // Utilisation de 'res' (corrigé)
    res.status(500).json({ message: "Erreur serveur lors de l'inscription" });
  }
};

// Connexion utilisateur
export const login = async (req, res) => {
  try {
    // CORRECTION ICI: 'password' et non 'passeword'
    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe
    // CORRECTION ICI: 'pool' et non 'poll', 'WHERE' et non 'WEHRE'
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (users.length === 0) {
      // Utilisation de 'mot de passe' (corrigé)
      return res
        .status(400)
        .json({ message: "Email ou mot de passe incorrect" });
    }

    const user = users[0];

    // Vérifier le mot de passe (utilise 'password' de req.body, maintenant correct)
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      // CORRECTION ICI: 'mot de passe' et non 'mot de passse'
      return res
        .status(400)
        .json({ message: "Email ou mot de passe incorrect" });
    }

    // Générer un token JWT pour l'utilisateur connecté
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // CORRECTION ICI: '.' et non '/' avant json
    res.status(200).json({
      message: "Connexion réussie",
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (error) {
    console.error("Erreur dans login controller:", error);
    res.status(500).json({ message: "Erreur serveur lors de la connexion" });
  }
};
