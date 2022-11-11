// Invoque la librairie multer qui permet de gérer les fichiers entrants dans les requêtes pour pouvoir lire les données en Form/Data
const multer = require("multer");

//--------------- MIMETYPE  ------------------
// Permet de configurer la destination et le nom du fichier image pour les fichiers entrants:
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    console.log("imageParsing");
    const { mimetype } = file;

    console.log({ mimetype });
    const extension = mimetype.split("/")[1];
    //unique suffixe pour un nom unique sur chaque image
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + "." + extension);
  },
});
// Uploader sur le serveur à l'aide de multer pour configurer le storage dans le fichier "uploads/":
const upload = multer({ storage: storage, dest: "uploads/" });
// Configurer l'envoi d'une image unique qu'on à uploader et stocker dans imageUpload:
const imageUpload = upload.single("image");
// console.log("imageUpload dans upload-image",imageUpload);
//--------------- MIMETYPE FIN ------------------

module.exports = { imageUpload };
