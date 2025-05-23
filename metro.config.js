// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path"); // Importer le module 'path'

const config = getDefaultConfig(__dirname);

// --- Exclusion pour le Resolver (avec RegExp plus précise) ---
const projectRoot = __dirname;
// Échapper les backslashes pour Windows dans la chaîne source de la RegExp
const escapedRoot = projectRoot.replace(/\\/g, "\\\\");

// RegExp pour correspondre à '\mysql-data\' ou '/mysql-data/' directement sous la racine du projet
const mysqlDataPattern = new RegExp(
  // ^ = début de chaîne, ${escapedRoot} = racine échappée, [\\\/] = séparateur Win ou Unix,
  // mysql-data = nom du dossier, [\\\/]? = séparateur optionnel, .* = reste du chemin
  `^${escapedRoot}[\\\/]mysql-data[\\\/]?.*`
);

// Log pour vérifier la RegExp générée au démarrage de Metro
console.log(
  "[metro.config.js] Pattern pour ignorer mysql-data:",
  mysqlDataPattern
);

const existingBlockList = config.resolver?.blockList; // Utiliser optional chaining
const newRules = [
  mysqlDataPattern, // Utiliser le nouveau pattern
];

let finalBlockList = [];
if (existingBlockList) {
  if (Array.isArray(existingBlockList)) {
    finalBlockList = finalBlockList.concat(existingBlockList);
  } else {
    finalBlockList.push(existingBlockList);
  }
}
finalBlockList = finalBlockList.concat(newRules);

// S'assurer que config.resolver existe avant d'assigner blockList
config.resolver = config.resolver || {};
config.resolver.blockList = finalBlockList;

// --- Section watcher.ignored a été SUPPRIMÉE car non supportée ---

module.exports = config;
