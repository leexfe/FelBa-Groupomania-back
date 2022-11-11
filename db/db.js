// Invoque la librairie Prisma(Un constructeur de requêtes automatisé de type sécurisé pour Node.js et TypeScript)
// Prisma Client génère le client utilisé dans le code de l'application
const { PrismaClient } = require("@prisma/client");
//Fabrique une nouvelle instance PrismaClient nommé prisma:
const prisma = new PrismaClient();

module.exports = { prisma };
