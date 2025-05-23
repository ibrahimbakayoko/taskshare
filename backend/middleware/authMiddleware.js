import jwt from 'jsonwebtoken';

export const authenticateToken = async (req, res, next) => { // Fonction d'authentification
  const authHeader = req.headers['authorization']; // Récupération de l'en-tête d'authentification
  const token = authHeader && authHeader.split(' ')[1]; // Récupération du token
  

  if (!token) return res.status(401).json({ message: 'Accès refusé' }); // Si le token n'existe pas, retourner une erreur 401
  

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => { // Vérification du token
    if (err) return res.status(403).json({ message: 'Token invalide' }); // Si le token est invalide, retourner une erreur 403
    req.user = user; // Ajout de l'utilisateur dans la requête
    next(); // Poursuivre
  });
};