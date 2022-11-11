// Charge les paramètres d'environnement à partir du fichier .env :
require("dotenv").config();

// Importe la librairie express :
const express = require("express");
// Initialise une nouvelle instance de express :
const app = express();
// Importe la librairie cors pour la Securité de connexion Cross Origin Resource Sharing :
const cors = require("cors");
//l'application utilise la fonction middleware CORS et permet de répondre aux demandes de contrôle en amont :
app.use(cors());
// l'application utilise la fonction middleware express.json pour analyser les requete json entrantes :
app.use(express.json());

module.exports = { app, express };
