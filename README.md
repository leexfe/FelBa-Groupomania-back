## PROJET  7 : GROUPOMANIA

Dossier du backend pour le projet 7 Groupomania

## Technologies utilisées 

- Node.js( v17.6.0), Express, JWT, Multer
- MySQL hébergé par Planetscale pour créer une nouvelle base de donnée
- Prisma interface(ORM) pour communiquer avec MySQL 

## Comment utiliser 

1. `git clone` ce repo .

2. Dans votre terminal, sélectionner le dossier enfant front du projet: Bacon_Felix_P7_code_Groupomania_092022:
- cd front
- npm install 
- npm run dev
- cliquer sur -> Local:   http://localhost:5173/ pour être dirigeé vers la page du site

3. Dans votre terminal, sélectionner le dossier enfant back du projet: Bacon_Felix_P7_code_Groupomania_092022:
- cd back
- npm run dev pour lancer nodemon et assurer la connexion avec la Database.

4. Renommer le fichier `.env.development` en `.env`et remplissez-le avec vos variables personnelles d'environnement.

6. Ce repo a été testé avec une database MySQL en ligne sur Planetscale

## Comment utiliser Prisma pour interagir avec la base de donnée

1. La base de donnée a été intégrée au préalable dans le fichier `schema.prisma` qui configure : 
- les générateurs.
- les sources de données.
- les modèles de données.

2. On envoie la base de donnée créée avec Prisma dans la table MySQL de Planetscale avec la commande : 
- `npx prisma db push`