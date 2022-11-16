const { prisma } = require("../db/db");
 // importe librairie filesystem pour supprimer image stockeé localement dans uploads
const fs = require("fs"); 

// Récupérer tout les posts et leurs commentaires associés :
async function getPosts(req, res) {
  const email = req.email;
  //Pour chaque post , passe les comments et le user, ne select que l'email
  const posts = await prisma.post.findMany({
    include: {
      usersLiker: {},
      comments: {
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
      },
      user: {
        select: {
          email: true,
          id: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  res.send({ posts: posts, email: email });
}

//  Créer un Post associé à l'utilisateur:
async function createPosts(req, res) {
  // récupère le body sur la requete
  const content = req.body.content;
  const email = req.email;
  try {
    // Retrouve le user à partir de son email dans bdd:
    const userPosting = await prisma.user.findUnique({ where: { email } });
    //stocke dans userPostingId l'id du user qui a posté:
    const userIdPosting = userPosting.id;
    //Créer objet post avec attributs attendus:
    const post = {
      content,
      userIdPosting: userIdPosting,
    };
    //appelle la fonction makeImageUrlToPost avec req et post en argument:
    makeImageUrlToPost(req, post);
    //stocke dans resolve la data que l'on renvoie dans la réponse:
    const resolve = await prisma.post.create({ data: post });
    console.log("resolve", resolve);
    res.send({ post: resolve });
  } catch (err) {
    res.status(500).send({ error: "Erreur serveur" });
  }
}
// Fabrique l'url de l'image à afficher dans le post:
function makeImageUrlToPost(req, post) {
  const hasImage = req.file != null;
  if (!hasImage) return;
  let pathToImage = req.file.path.replace("\\", "/");
  const protocol = req.protocol;
  const host = req.get("host");
  const url = `${protocol}://${host}/${pathToImage}`;
  //stocke l'url dans la variable post.imageUrl:
  post.imageUrl = url;
}

// Supprime le post sélectionné d'après l'identifiant du post récupéré en param dans l'url:
async function deletePostById(req, res) {
  const postId = Number(req.params.id);

  try {
    const userId = req.userId;
    const checkAdmin = await prisma.user.findUnique({ where: { id: userId } });
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });
    if (userId === post.userIdPosting || checkAdmin.isAdmin === true) {
      if (post.imageUrl) {
        const filename = post.imageUrl.split("/").pop();
        fs.unlink(`uploads/${filename}`, () => {
          prisma.post.delete({ where: { id: postId } });
        });
      }
    }
    if (post === null) {
      return res.status(404).send({ error: "Post non trouvé" });
    }
    // Supprime de la BDD les comments dans le tableau comment raccordé à l'id du post dans BDD:
    await prisma.comment.deleteMany({ where: { postId } });
    // Supprime de la BDD le post qui match avec l'id du post qu'on a cliqué (sendTodelete):
    await prisma.post.delete({ where: { id: postId } });
    res.send({ message: "Post supprimé" });
  } catch (err) {
    res.status(500).send({ error: "Erreur serveur" });
  }
}
//Met à jour le contenu textuel et/ou la nouvelle image selectionnée du postId sélectionné:
async function updatePostById(req, res) {
  const postId = Number(req.params.id);
  try {
    const userId = req.userId;
    const checkAdmin = await prisma.user.findUnique({ where: { id: userId } });
    //retrouve l'id du Post d'origine:
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });
    if (userId === post.userIdPosting || checkAdmin.isAdmin === true) {
      if (req.file) {
        if (post.imageUrl) {
          const filename = post.imageUrl.split("/").pop();
          fs.unlink(`uploads/${filename}`, () => {
            prisma.post.delete({ where: { id: postId } });
          });
          // Appelle fonction  makeImageUrlToPost avec req et post en argument:
          makeImageUrlToPost(req, post);
        }
      }
    // Si contenu dans req.body.content existe, attribue la nouvelle valeur du req.body.content à post.content:
    if (req.body.content) {
      post.content = req.body.content;
      console.log("content: ", post.content);
    }
  }
    //Attend de mettre à jour le nouveau contenu textuel et/ou la nouvelle image puis stocke la data dans la variable resolve :
    const resolve = await prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        id: postId,
        content: post.content,
        imageUrl: post.imageUrl,
      },
    });
    // renvoie la réponse:
    res.send({ data: resolve });
    // res.send({ id: postId, content: post.content, imageUrl: post.imageUrl });
  } catch {
    res.status(500).send({ error: "Erreur serveur" });
  }
}

// Créer un commentaire associé à l'utilisateur :
async function createComment(req, res) {
  const email = req.email;
  // récupère l'id du post dans les params de la requete qu'on assigne à postId:
  const postId = Number(req.params.id);
  // recupère dans bdd via prisma l'id du post identique à celui du params:
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      user: {
        select: {
          id: true,
        },
      },
    },
  });

  if (post == null) {
    return res.status(404).send({ error: "Post not found" });
  }
  // On retouve dans la BDD d'après l'email du user qui a commenté le même email et on stocke dans userComenting
  const userComenting = await prisma.user.findUnique({
    where: { email: req.email },
  });
  //On passe à userId l'id du userComenting:
  const userId = userComenting.id;
  //stocke dans variable commentToSend la data que l'on veut transmettre à la BDD:
  const commentToSend = { userId, postId, content: req.body.comment };
  // envoie la data dans BDD et stocke dans variable comment:
  const comment = await prisma.comment.create({ data: commentToSend });
  //réponse envoyé dans l'objet {comment}:
  res.send({ comment });
}

// Notifie like ou unlike le Post cliqué par l'utilisateur :
async function likePost(req, res) {
  try {
    // récupère le userId et le postId sur la requète:
    const userLiker = Number(req.userId);
    const postId = Number(req.params.id);
    // retrouve le même user dans la bdd qui a liké le même Post:
    const user = await prisma.userliker.findFirst({
      where: { userIdLiked: userLiker, postIdLiked: postId },
    });
    // si le même user existe dans la bdd alors on le supprime :
    if (user) {
      const deleteUser = await prisma.userliker.deleteMany({
        where: { userIdLiked: userLiker, postIdLiked: postId },
      });
      res.status(200).send({ message: "vous n'aimez plus ce post" });
    }
    //sinon on créer le user dans la bdd:
    else {
      const createLiker = await prisma.userliker.create({
        data: {
          user: {
            connect: { id: Number(userLiker) },
          },
          post: {
            connect: { id: Number(postId) },
          },
        },
      });
      res.status(200).json({ message: "vous aimez ce post" });
    }
  } catch (error) {
    return res.status(500).send({ error: "Erreur serveur" });
  }
}

module.exports = {
  getPosts,
  createPosts,
  createComment,
  deletePostById,
  updatePostById,
  likePost,
};
