// importe express :
const express = require("express");
// Importe les fonctions :
const {
  getPosts,
  createPosts,
  createComment,
  deletePostById,
  updatePostById,
  likePost,
} = require("../controllers/posts");

// Importe la fonction checkToken:
const { checkToken } = require("../middleware/token");

// Importe la fonction imageUpload
const { imageUpload } = require("../middleware/upload-image");

// créé un socle routeur pour gérer les routes de l'application:
const postRouter = express.Router();

// postRouter utilise la fonction checkToken avant chaque appelle de fonctions liées au CRUD:
postRouter.use(checkToken);

// postRouter représente pour "/posts":
//Routes destinées qui permet l'exécution de fonctions associée à son chemin propre pour créer et manipuler des données appelées depuis le DOM:

postRouter.get("/", getPosts);
postRouter.put("/:id", imageUpload, updatePostById); //à faire
postRouter.post("/:id", createComment);
postRouter.delete("/:id", deletePostById);

postRouter.post("/", imageUpload, createPosts);
postRouter.post("/:id/like", likePost); //à faire

module.exports = { postRouter };
