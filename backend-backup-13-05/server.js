import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Importer les routes
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";

// Configuration
dotenv.config();
const app = express();

// --- DEBUT Configuration CORS Explicite ---

const corsOptions = {
  // Pour le développement, '*' est souvent plus simple, mais moins sécurisé.
  // En production, mettez l'URL exacte de votre frontend.
  // Pour Expo Web local (souvent port 8081):
  origin: ["http://localhost:8081", "http://127.0.0.1:8081", "*"], // Permet localhost, 127.0.0.1 et toutes origines (*)
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Méthodes autorisées
  allowedHeaders: ["Content-Type", "Authorization"], // En-têtes autorisés (IMPORTANT pour JSON et JWT)
  credentials: true, // Si vous utilisez des cookies/sessions un jour
  optionsSuccessStatus: 204, // Pour les requêtes OPTIONS (preflight)
};

// IMPORTANT: Gérer les requêtes preflight OPTIONS *avant* les autres routes
app.options("*", cors(corsOptions));

// Appliquer CORS avec les options à toutes les requêtes suivantes
app.use(cors(corsOptions));

// --- FIN Configuration CORS Explicite ---
app.use(express.json());

// Utilisation des routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/settings", settingsRoutes);

// Définir une route pour la page d'accueil
app.get("/", (req, res) => {
  res.send("API fonctionnelle");
});

// Définir le port d'écoute du serveur
//const PORT = process.env.PORT || 5000;
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
