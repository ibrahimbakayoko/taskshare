# Utiliser une image de base officielle pour Node.js
FROM node:18

# Créer et définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json et package-lock.json
COPY package.json package-lock.json ./

# Installer les dépendances
RUN npm install

# Copier le reste des fichiers du backend
COPY . .

# Exposer le port 5000 pour l'API
EXPOSE 5000

# Commande pour démarrer l'application
CMD ["npm", "start"]
