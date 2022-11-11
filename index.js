// Importe app et express :
const { app, express } = require("./server");
// Déclare la variable pour le port 3000 :
const port = process.env.PORT || 3000;
//Invoque la librairie body-parser pour analyser le corp de la requête entrant :
const bodyParser = require("body-parser");
//Importe logUser et signupUser :
const { logUser, signupUser } = require("./controllers/users");
// Invoque la librairie path pour interagir avec les chemins relatifs de fichiers :
const path = require("path");
// Invoque la fonction bodyParser.json(): transforme JSON textuelle en variables accessibles JS sous req.body
app.use(bodyParser.json());
// Invoque la fonction bodyParser.urlencoded : pour les requêtes encodées en URL
app.use(bodyParser.urlencoded({ extended: true }));

//----------- Base de donnée Prisma ------------------------------------
// importe prisma qui est la nouvelle instance PrismaClient 
const { prisma } = require("./db/db");
//récupère tout les users:
prisma.user.findMany().then(console.log).catch(console.log);
console.log("prisma.user in index",prisma.user);
//avec post renvoie un array vide:
//récupère tout les posts:
prisma.post.findMany().then(console.log).catch(console.log);
console.log("prisma.post in index",prisma.post);
//----------Base de donnée Prisma fin -------------------------------------

// Importe postRouter:
const { postRouter } = require("./routes/posts");

//app utilise postRrouter pour lui associer: "/posts"
app.use("/posts", postRouter);

// vérifie token et renvoie sur page home pour afficher les posts :
//va chercher dans uploads et affiche avec express.static
app.use("/uploads", express.static("uploads"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

//login côté serveur:
app.post("/auth/login", logUser);
app.post("/auth/signup", signupUser);

app.listen(port, () => console.log("Listening on port" + port));
console.log("port:", port);
