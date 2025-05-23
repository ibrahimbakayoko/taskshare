import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import client from "prom-client"; // <-- Ajout Prometheus client

// Importer les routes
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";

// Configuration
dotenv.config();
const app = express();

// --- DEBUT Configuration Prometheus ---
client.collectDefaultMetrics(); // collecte CPU, mémoire, etc.

// Créer un compteur personnalisé
const httpRequestCounter = new client.Counter({
  name: "http_requests_total",
  help: "Nombre total de requêtes HTTP",
  labelNames: ["method", "route", "status"]
});

// Middleware pour compter les requêtes
app.use((req, res, next) => {
  res.on("finish", () => {
    httpRequestCounter.inc({
      method: req.method,
      route: req.route?.path || req.path,
      status: res.statusCode
    });
  });
  next();
});

// Route /metrics pour Prometheus
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});
// --- FIN Configuration Prometheus ---

// --- DEBUT Configuration CORS ---
const corsOptions = {
  origin: ["http://localhost:8081", "http://127.0.0.1:8081", "*"],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.options("*", cors(corsOptions));
app.use(cors(corsOptions));
// --- FIN Configuration CORS ---

app.use(express.json());

// Utilisation des routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/settings", settingsRoutes);

// Route d'accueil
app.get("/", (req, res) => {
  res.send("API fonctionnelle");
});

// Port d'écoute
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});