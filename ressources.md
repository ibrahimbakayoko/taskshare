Arborescence du projet TaskManagerApp :
Cette arborescence reflète l'état actuel du projet

TaskManagerApp/
├── backend/                     <-- Dossier du serveur Backend (Node.js/Express)
│   ├── config/                  <-- Configuration (ex: connexion BD)
│   │   └── db.js                <-- Configuration de la connexion MySQL
│   ├── controllers/             <-- Logique métier (fonctions appelées par les routes)
│   │   ├── appointmentController.js
│   │   ├── authControllers.js   <-- Contrôleur pour l'authentification
│   │   ├── messageController.js
│   │   ├── settingsController.js
│   │   └── taskController.js
│   ├── middleware/              <-- Middlewares Express (ex: authentification)
│   │   └── authMiddleware.js    <-- Vérification du token JWT
│   ├── models/                  <-- Définition de la structure de la BD
│   │   └── database.sql         <-- Script SQL pour créer les tables
│   ├── routes/                  <-- Définition des routes de l'API
│   │   ├── appointmentRoutes.js
│   │   ├── authRoutes.js
│   │   ├── messageRoutes.js
│   │   ├── settingsRoutes.js
│   │   └── taskRoutes.js
│   ├── node_modules/            <-- (Dépendances backend, généralement ignoré par Git)
│   ├── .env                     <-- (Variables d'environnement, NE PAS COMMIT)
│   ├── package-lock.json        <-- Lockfile npm pour le backend
│   ├── package.json             <-- Dépendances et scripts npm pour le backend
│   └── server.js                <-- Point d'entrée du serveur backend
│
├── assets/                      <-- Ressources statiques (images, polices)
│   ├── fonts/                   <-- (Dossier mentionné, contenu non fourni)
│   │   └── ...
│   ├── images/
│   │   └── imgScheduleGroupe.png <-- Image utilisée dans LoginScreen
│   ├── adaptive-icon.png        <-- Icône Android adaptative
│   ├── favicon.png              <-- Icône pour le web
│   ├── icon.png                 <-- Icône principale de l'app
│   └── splash-icon.png          <-- Icône pour l'écran de démarrage (Splash Screen)
│
├── node_modules/                <-- (Dépendances frontend, généralement ignoré par Git)
│
├── src/                         <-- Code source principal du Frontend (React Native)
│   ├── api/
│   │   └── apiClient.js         <-- Configuration du client Axios pour l'API
│   ├── components/              <-- Composants réutilisables
│   │   └── sharing/             <-- Composants liés au partage
│   │       └── UserSearchModal.js <-- Modale de recherche d'utilisateur
│   ├── context/                 <-- Contexte React pour l'état global
│   │   ├── AuthContext.js       <-- Contexte pour l'authentification
│   │   └── ThemeContext.js      <-- Contexte pour le thème (clair/sombre)
│   ├── navigation/              <-- Configuration de la navigation
│   │   ├── AppNavigator.js      <-- Navigateur principal après connexion (Stack + Tabs)
│   │   ├── AuthNavigator.js     <-- Navigateur pour les écrans de connexion/inscription
│   │   └── RootNavigator.js     <-- Navigateur racine (aiguillage Auth/App)
│   ├── screens/                 <-- Écrans de l'application
│   │   ├── auth/                <-- Écrans liés à l'authentification
│   │   │   ├── LoginScreen.js
│   │   │   └── RegisterScreen.js
│   │   └── main/                <-- Écrans principaux après connexion
│   │       ├── AppointmentDetailScreen.js <-- Détails d'un RDV
│   │       ├── AppointmentScreen.js     <-- Liste des RDV (Onglet)
│   │       ├── ConversationScreen.js    <-- Écran d'une conversation
│   │       ├── CreateAppointmentScreen.js <-- Création d'un RDV
│   │       ├── CreateTaskScreen.js      <-- Création d'une Tâche
│   │       ├── EditAppointmentScreen.js <-- Modification d'un RDV
│   │       ├── EditTaskScreen.js        <-- Modification d'une Tâche
│   │       ├── HomeScreen.js            <-- Écran d'accueil (Onglet)
│   │       ├── MessageScreen.js         <-- Liste des conversations (Onglet)
│   │       ├── SettingsScreen.js        <-- Écran des paramètres (Onglet)
│   │       └── TaskDetailScreen.js      <-- Détails d'une Tâche
│   ├── theme/                     <-- (Dossier mentionné, contenu non fourni)
│   │   └── ... (colors.js, etc.)
│   └── utils/                     <-- (Dossier mentionné, contenu non fourni)
│       └── ... (dateUtils.js, etc.)
│
├── .gitignore                   <-- (Fichier important pour ignorer node_modules, .env, etc.)
├── android-manifest.plugin.js   <-- Plugin Expo pour modifier AndroidManifest.xml
├── App.js                       <-- (Ancien point d'entrée ? Probablement obsolète)
├── app.json                     <-- Configuration principale Expo
├── docker-compose.yml           <-- Configuration Docker pour MySQL/PHPMyAdmin
├── index.js                     <-- Point d'entrée actuel pour Expo
├── metro.config.js              <-- Configuration du bundler Metro
├── package-lock.json            <-- Lockfile npm pour le frontend
├── package.json                 <-- Dépendances et scripts npm pour le frontend
└── ressources.md                <-- Votre fichier de planification/ressources

  # TaskManagerApp - Guide d'Installation et de Lancement Local

Ce guide décrit les étapes pour configurer et lancer l'application TaskManagerApp (Frontend Expo/React Native et Backend Node.js/Express) en environnement de développement local.

## Prérequis

Assurez-vous d'avoir les outils suivants installés sur votre machine :

1.  **Node.js:** Version 18 ou supérieure recommandée. (Vérifiez avec `node -v`)
2.  **npm:** Généralement inclus avec Node.js. (Vérifiez avec `npm -v`)
3.  **Git:** Pour cloner le dépôt. (Vérifiez avec `git --version`)
4.  **Docker & Docker Compose:** Pour exécuter la base de données MySQL et PHPMyAdmin. (Vérifiez avec `docker --version` et `docker-compose --version` ou `docker compose version`)
5.  **Expo Go App:** Installez l'application Expo Go sur votre appareil physique Android ou iOS depuis le Play Store / App Store (pour tester sur appareil physique).
6.  **(Optionnel) Émulateur/Simulateur :** Android Studio (avec un émulateur configuré) ou Xcode (avec un simulateur configuré) pour tester sans appareil physique.
7.  **(Optionnel) Client MySQL :** Un outil comme MySQL Workbench, DBeaver, ou le client MySQL en ligne de commande pour interagir directement avec la base de données.

## 1. Clonage du Dépôt

Clonez ce dépôt GitHub sur votre machine locale :

```bash
git clone <URL_DU_DEPOT_GITHUB>
cd TaskManagerApp

Remplacez <URL_DU_DEPOT_GITHUB> par l'URL réelle de votre dépôt.
2. Configuration et Lancement du Backend
Le backend est l'API Node.js/Express qui communique avec la base de données.

a. Installation des Dépendances Backend
Naviguez dans le dossier backend et installez les dépendances npm :
cd backend
npm install

b. Configuration de l'Environnement Backend (.env)
À la racine du dossier backend, créez un fichier nommé .env. Ce fichier contiendra les variables d'environnement nécessaires au backend. Copiez-y le contenu suivant et adaptez si besoin (notamment JWT_SECRET) :

# Fichier: backend/.env

# Port sur lequel le serveur backend écoutera
PORT=5000

# Configuration Base de Données (doit correspondre à docker-compose.yml)
DB_HOST=localhost # Le backend accède à MySQL via le port exposé sur localhost
DB_USER=user
DB_PASSWORD=password
DB_NAME=taskmanager

# Secret pour les JSON Web Tokens (IMPORTANT: Utilisez une chaîne longue et aléatoire)
JWT_SECRET=VOTRE_SECRET_JWT_TRES_COMPLIQUE_ET_UNIQUE_ICI

Important : Remplacez VOTRE_SECRET_JWT_TRES_COMPLIQUE_ET_UNIQUE_ICI par une chaîne de caractères longue, aléatoire et secrète. Ne committez jamais de secrets réels sur GitHub. Pour un projet partagé, envisagez des solutions de gestion de secrets.

c. Configuration de la Base de Données (Docker)
Nous utilisons Docker Compose pour lancer un conteneur MySQL et un conteneur PHPMyAdmin.

Recommandation : Pour une meilleure portabilité entre les machines, il est conseillé d'utiliser un volume nommé Docker plutôt qu'un bind mount spécifique à un chemin local. Modifiez le fichier docker-compose.yml à la racine du projet (TaskManagerApp/docker-compose.yml) comme suit :

# docker-compose.yml (Version Corrigée avec Volume Nommé)
services:
  mysql:
    image: mysql:8.0
    container_name: taskmanager-mysql
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: taskmanager
      MYSQL_USER: user
      MYSQL_PASSWORD: password
    ports:
      - "3306:3306"
    volumes:
      # Utiliser un volume nommé géré par Docker
      - mysql-data:/var/lib/mysql
    # networks: # Décommentez si vous utilisez un réseau Docker spécifique
    #   - taskmanager-net

  phpmyadmin:
    image: phpmyadmin/phpmyadmin
    container_name: taskmanager-phpmyadmin
    environment:
      PMA_HOST: mysql # Se connecte au service 'mysql' sur le réseau Docker
      PMA_PORT: 3306
    ports:
      - "8080:80" # Accès via http://localhost:8080
    depends_on:
      - mysql
    # networks: # Décommentez si vous utilisez un réseau Docker specific
    #   - taskmanager-net

# Déclarer le volume nommé
volumes:
  mysql-data:

# Déclarer le réseau (optionnel, utile si d'autres services doivent communiquer)
# networks:
#   taskmanager-net:
#     driver: bridge


Lancez les conteneurs Docker : Depuis la racine du projet (TaskManagerApp/), exécutez :
docker-compose up -d

La base de données est maintenant lancée mais vide. Il faut créer les tables.

    Connectez-vous à la base de données :
        Ouvrez PHPMyAdmin dans votre navigateur : http://localhost:8080
        Serveur : mysql (ou parfois l'IP du conteneur MySQL si PMA_HOST n'est pas utilisé, mais mysql devrait fonctionner ici)
        Utilisateur : root
        Mot de passe : rootpassword (défini dans docker-compose.yml)
        Sélectionnez la base de données taskmanager dans le panneau de gauche.
    Exécutez le SQL :
        Allez dans l'onglet "SQL".
        Copiez tout le contenu du fichier backend/models/database.sql.
        Collez-le dans la zone de texte SQL de PHPMyAdmin.
        Cliquez sur "Exécuter" (ou "Go").

Les tables (users, tasks, etc.) devraient maintenant être créées dans la base taskmanager.
e. Lancement du Serveur Backend

Toujours dans le dossier backend/, lancez le serveur Node.js :
Bash

# Pour un développement avec redémarrage automatique (recommandé)
npm run dev

# Ou pour un lancement standard
npm start

Vous devriez voir un message comme Serveur démarré sur le port 5000 dans le terminal. Laissez ce terminal ouvert.
3. Configuration et Lancement du Frontend

Le frontend est l'application React Native gérée par Expo.
a. Installation des Dépendances Frontend

Retournez à la racine du projet (TaskManagerApp/) dans un nouveau terminal (laissez le terminal du backend ouvert) et installez les dépendances :
Bash

# Si vous étiez dans backend/, retournez au dossier parent
cd ..

# Installez les dépendances
npm install

(Si vous avez exécuté npm install lodash.debounce précédemment, cette étape mettra à jour package-lock.json si nécessaire).
b. Configuration de l'URL de l'API Backend

Le frontend a besoin de savoir où se trouve le backend pour lui envoyer des requêtes.

    Trouvez l'adresse IP locale de votre ordinateur sur votre réseau Wi-Fi (cf. étape 2.c ou instructions précédentes).
    Ouvrez le fichier src/api/apiClient.js.
    Modifiez la variable LOCAL_DEV_URL en remplaçant "http://VOTRE_IP_LOCALE_ICI:5000/api" par l'URL correcte utilisant votre propre adresse IP locale. Exemple :
    JavaScript

// Ligne à modifier dans src/api/apiClient.js
const LOCAL_DEV_URL = "[http://192.168.1.](http://192.168.1.)XX:5000/api"; // Remplacez par votre IP

Assurez-vous que la logique de sélection de API_URL utilise bien LOCAL_DEV_URL pour les plateformes mobiles :
JavaScript

    if (Platform.OS === 'web') {
      API_URL = WEB_URL;
    } else {
      API_URL = LOCAL_DEV_URL; // Pour Android/iOS physique/simulateur
    }

    Enregistrez le fichier.

c. Lancement du Serveur de Développement Expo

Toujours depuis la racine du projet (TaskManagerApp/), lancez le serveur Expo :
Bash

npx expo start

Cela ouvrira probablement une page dans votre navigateur et affichera un QR code ainsi que des options dans le terminal.
4. Exécution de l'Application

Une fois le serveur backend et le serveur Expo lancés :

    Sur Appareil Physique (Android/iOS) :
        Assurez-vous que votre téléphone est sur le même réseau Wi-Fi que votre ordinateur.
        Ouvrez l'application Expo Go sur votre téléphone.
        Scannez le QR code affiché dans le terminal ou la page web Expo.
        L'application devrait se compiler et se lancer sur votre téléphone.
        (Si la connexion échoue, vérifiez le Wi-Fi, le pare-feu, et essayez le mode "Tunnel" en appuyant sur s dans le terminal Expo).
    Sur Émulateur Android :
        Assurez-vous qu'un émulateur est lancé via Android Studio.
        Appuyez sur la touche a dans le terminal où npx expo start est lancé.
    Sur Simulateur iOS (macOS uniquement) :
        Assurez-vous qu'un simulateur est lancé via Xcode.
        Appuyez sur la touche i dans le terminal où npx expo start est lancé.
    Dans le Navigateur Web :
        Appuyez sur la touche w dans le terminal où npx expo start est lancé.

Vous devriez maintenant pouvoir utiliser l'application, vous inscrire, vous connecter et tester les fonctionnalités.
Dépannage

    Erreur "Network Error" sur mobile : Vérifiez que l'adresse IP dans src/api/apiClient.js est correcte et accessible depuis votre téléphone (même Wi-Fi, pas de pare-feu bloquant le port 5000 sur le PC).
    Expo Go "tourne dans le vide" : Vérifiez le Wi-Fi, désactivez temporairement le pare-feu du PC, essayez le mode Tunnel (s dans le terminal Expo), redémarrez le serveur Expo (npx expo start -c).
    Erreurs liées à la base de données : Vérifiez que les conteneurs Docker (mysql, phpmyadmin) sont bien lancés (docker ps). Vérifiez les logs du conteneur MySQL (docker logs taskmanager-mysql). Assurez-vous que le schéma a été correctement initialisé (étape 2.d).
    Autres erreurs : Consultez les logs dans le terminal du backend et le terminal Expo / la console de débogage du mobile/navigateur.


N'hésitez pas à adapter ce texte, notamment la partie sur les secrets `JWT_SECRET` si vous mettez en place une meilleure gestion, et à ajouter des détails spécifiques à votre workflow si nécessaire.

TaskManagerApp
Icône Dossier de code
Dossier de code
