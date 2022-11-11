// Invoque la bibliothèque qui permet l'échange sécurisé de jetons(tokens d'authentification)
const jwt = require("jsonwebtoken");
// Invoque prisma qui représent pour la nouvelle instance PrismaClient
const { prisma } = require("../db/db.js"); // on prend le prisma.user
// Invoque la bibliothèque de hachage de mot de passe
const bcrypt = require("bcrypt");

// Inscrit un nouvel utilisateur dans la bdd:
async function signupUser(req, res) {
  //  const { email, password, confirmPassword, isAdmin } = req.body;
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const isAdmin = req.body.email;

  try {
    if (confirmPassword == null)
      return res.status(400).send({ error: " Veuillez confirmer le password" });
    if (password !== confirmPassword)
      return res.status(400).send({ error: "Le password ne correspond pas" });
    //attend de trouver  dans la bdd l'email identique à celui  de l'utilisateur:
    const userDbPrisma = await getUser(email);
    if (userDbPrisma != null)
      return res.status(400).send({ error: "L'utilisateur existe déjà" });
    console.log("userDbPrisma", userDbPrisma);
    //attend de hasher le mot de passe
    const hashedPassword = await hashPassword(password);
    //attend de sauvegarder le nouveau user en lui attribuant un email un mot de passe hashé et un email attribué à l'Admin avant d'envoyer la réponse:
    const user = await saveUser({
      email: email,
      password: hashedPassword,
      isAdmin: isAdmin === 'admin@admin.com' ? true : false,
    });
    console.log(" res user in signupUser:", user);
    res.send({ user: user, message: "L'utilisateur a bien été ajouté" });
  } catch (error) {
    res.status(500).send({ error });
  }
}
// Cherche dans la bdd et obtiens l'utilisateur identique à l'email(qui vaut pour req.body.email):
function getUser(email) {
  return prisma.user.findUnique({ where: { email } });
}

// function getUserById(id) {
//   return prisma.user.findUnique({ where: { id } });
// }

//Sauvegarde le user dans la bdd Prisma:
function saveUser(user) {
  return prisma.user.create({ data: user }); //retourne à saveUser avant le .then pour la reponse(res.send)
}
//hashe le mot de passe:
function hashPassword(password) {
  const SALT_ROUNDS = 10;
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Connecte un utilisateur connu (vérifie s'il existe bien dans la bdd , avec bon le mot de passe):
async function logUser(req, res) {
  const { email, password } = req.body; 
  try {
    //attend getUser avant de stocker ds la variable user l'email recupéré ds la bdd:
    const user = await getUser(email);
    //s'il n'existe pas:
    if (user == null)
      return res.status(404).send({ error: "Utilisateur non trouvé" });
    //attend de check si  le mot de passe est correct puis stocke dans isPasswordCorrect:
    const isPasswordCorrect = await checkPassword(user, password);
    // si mauvais mot de passe:
    if (!isPasswordCorrect)
      return res.status(401).send({ error: "Mauvais password" });
    //stocke ds la variable token, le token fabriqué et signé sur l'email:
    const token = makeToken(email,user.id);
    
    //renvoie l'objet réponse avec token et user:
    res.send({ token: token, user: user });
  } catch (error) {
    res.status(500).send({ error });
  }
}

// Fabrique un jeton d'authentification(qui expire après 24h) pour l'utilisateur qui a fourni un email valide:
function makeToken(email,id) {
  // attribue à jwtPassword le MDP du JWT caché dans le fichier .env:
  const jwtPassword = process.env.MDP;
  return jwt.sign({ email: email , id : id }, jwtPassword, { expiresIn: "24h" });
}

// //checkPassword est une promesse retournée à isPasswordCorrect qui compare le password et le user.password  avec son hash:
function checkPassword(user, password) {
  return bcrypt.compare(password, user.password);
}

module.exports = { logUser, signupUser };
