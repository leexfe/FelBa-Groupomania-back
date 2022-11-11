const { prisma } = require("../db/db");
// const token = require("../middleware/token");
const fs = require("fs"); // supprimer image stockeé localement dans uploads

// Récupérer tout les posts et leurs commentaires associés :
async function getPosts(req, res) {
  const email = req.email;
  //Pour chaque post , passe les comments et le user, ne select que l'email
  const posts = await prisma.post.findMany({
    include: {
      user: {
        select: {
          likes: true,
        },
      },
      usersLiker: {
      },
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
      // usersLiker: "",
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
      if (post.imageUrl) {
        const filename = post.imageUrl.split("/").pop();
        fs.unlink(`uploads/${filename}`, () => {
          prisma.post.delete({ where: { id: postId } });
        });
      }
    }  
    // Si contenu dans req.body.content existe, attribue la nouvelle valeur du req.body.content à post.content:
    if (req.body.content) {
      post.content = req.body.content;
    }
    // Appelle fonction  makeImageUrlToPost avec req et post en argument:
    makeImageUrlToPost(req, post);
   
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

// if (![0, 1].includes(likes))
// return res.status(403).send({ message: "bad request, invalid like value" });

//  const userLiker = await prisma.user.findUnique({
//    where: { email: req.email },
//  });
// console.log("userLiker",userLiker);

//  let usersLiker = [];
//   usersLiker.push(userLiker);
// console.log('usersLiker',usersLiker);
//   const userLikerToSend = {
//     userLiker, userIdLiker, postIdLiker,
//   }
//  const userLikerPrisma = await prisma.userliker.create({ data: userLikerToSend });

//  console.log("userLikerPrisma",userLikerPrisma);

//Trouve l'identifiant de l'utilisateur actuellement connecté:

// let usersLiker = [];
// usersLiker.push(userLiker);
// console.log("tableau usersLiker : ", usersLiker);
// // userLikerPrisma.push(userLiker);
// // const userLikerPrisma= await prisma.user.update({
// //   where: {
// //     id: Number(req.body.userId),
// //   },
// //   data: {
// //     usersLiker: usersLiker,
// //     // newPost,
// //   },
// // })
// // console.log("userLikerPrisma :",userLikerPrisma);

// // console.log("userLikerPrisma after :",userLikerPrisma);

// try {
//   //retrouve l'id du Post d'origine:
//   //const post = await prisma.post.update({

//--------------------------------------------

// if (usersLiker.includes(userId)) {
//   --post.likes;
//       //supprime le userId de la liste des utilisateurs qui ont likes le produit.
//       // (ne conserve que les id differents de userId dans le nouveau tableau)
//   post.usersLiker = post.usersLiker.filter((id) => id !== userId);
// }
//--------------------------------------------------

// try {
// const userId = token.getUserId(req);
// const userIdLiker = req.body.userId;
// console.log("req userIdLiker :", userIdLiker);

// // const postId = req.params.id;
// const postId = Number(req.params.id);
// console.log("req postId :", postId);

// const like = req.body.likes;
// console.log("like",like);

// const userLikerId = Number(req.params.id);

// const user = await prisma.postuserliker.findUnique({
//   where: { id }
// });
// console.log("user",user);

//     const allUsersLiker = await prisma.userliker.findMany()
//     console.log('allUsers',allUsersLiker);

// let allUsersLikerTab= [];
// allUsersLikerTab.push(allUsersLiker);

// console.log("allUsersLikerTab",allUsersLikerTab);

// if(allUsersLikerTab.includes(userIdLiker) ){
//   const addLiker = await prisma.userliker.create({
//     data: {
//       user: {
//         connect: { id: Number(userIdLiker) },
//       },
//       post: {
//         connect: { id: Number(postId) },
//       },
//     },
//   });
//   console.log("addLiker", addLiker);

// }

//     const addLiker = await prisma.userliker.create({
//   data: {
//     user: {
//       connect: { id: Number(userIdLiker) },
//     },
//     post: {
//       connect: { id: Number(postId) },
//     },
//   },
// });
// console.log("addLiker", addLiker);

// Met à jour le vote (nécessite d'avoir la reponse pour renvoyer une erreur)

// function updateVote(product, like, userId, res) {
//   if (like === 1 || like === -1) return incrementVote(product, userId, like);
//   if (like === 0) return resetVote(product, userId, res); //nécessite d'avoir la reponse pour renvoyer une erreur
// }
// Incrémente le likes

// function incrementVote(product, userId, like) {
//   const usersLiked = product.usersLiked;
//   const usersDisliked = product.usersDisliked;
//   // conditional ternary operator: si like est égale à 1 alors votersArray vaudra la valeur pour userLiked sinon pour la valeur de usersDisliked:
//   const votersArray = like === 1 ? usersLiked : usersDisliked;
//   //si l'utilisateur(voteur) liké inclus déjà le like de l'utilisateur stoppe et return product (empeche de liké plusieurs fois le meme produit)
//   if (votersArray.includes(userId)) return product;
//   votersArray.push(userId); //push le userId dans le array
//   let voteToUpdate = like === 1 ? ++product.likes : ++product.dislikes;
//   voteToUpdate++;
//   return product; // retourne product à updateVote
// }
// if (user) {
//   await prisma.userliker.destroy(
//     { where: { user: userIdLiker, post: postId } },
//     // { truncate: true, restartIdentity: true }
//   );
//   res.status(200).send({ messageRetour: "vou n'aimez plus ce post" });
// } else {
//   await prisma.userliker.create({
//     user: userIdLiker,
//     post: postId,
//   });
//   res.status(201).json({ messageRetour: "vous aimez ce post" });
// }
// }
// catch (error) {
//   return res.status(500).send({ error: "Erreur serveur" });
// }

// const addLiker = await prisma.userliker.create({
//   data: {
//     user: {
//       connect: { id: Number(userIdLiker) },
//     },
//     post: {
//       connect: { id: Number(postId) },
//     },
//   },
// });
// console.log("addLiker", addLiker);
// console.log("addLiker.id:", addLiker.id);
