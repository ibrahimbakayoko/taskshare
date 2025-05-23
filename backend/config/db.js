import mysql from 'mysql2/promise'; // mysql2 promise module
import dotenv from 'dotenv'; // dotenv module

dotenv.config(); // Configuration de dotenv

const pool = mysql.createPool({ // Création d'un pool de connexion
    host: process.env.DB_HOST || 'localhost', // Hôte de la base de données
    user: process.env.DB_USER || 'user', // Utilisateur de la base de données
    password: process.env.DB_PASSWORD || 'password', // Mot de passe de la base de données
    database: process.env.DB_NAME || 'taskmanager', // Nom de la base de données
    waitForConnections: true, // Attendre une connexion disponible
    connectionLimit: 10, // Limde de connexions
    queueLimit: 0 // Limite de la file d'attente

});

export default pool; // Exportation du pool de connexion