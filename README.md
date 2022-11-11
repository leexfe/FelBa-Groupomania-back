## PROJET  7 : GROUPOMANIA

Dossier du backend pour le projet 7 Groupomania

## Technologies utilisées 

- Node.js( v17.6.0), Express, JWT, Multer
- MySQL hébergé par Planetscale pour créer une nouvelle base de donnée
- Prisma (ORM) pour communiquer avec MySQL sans avoir à taper du code spécifique MySQL

## Comment utiliser 

1. `git clone` ce repo 
2. npm install
3. Renommer le fichier `.env.development` en `.env`
4. Remplissez-le avec vos variables presonnelles d'environnement :
5. Ce repo a été testé avec ue database MySQL en ligne sur Planetscale

## Comment utiliser Prisma pour interagir avec la base de donnée

1. La base de donnée a été intégrée au préalable dans le fichier `schema.prisma` qui configure : 
- les générateurs
- les sources de donnée
- les modèles de données

2. On envoie la base de donnée créée avec Prisma dans la table MySQL de Planetscale avec la commande : 
- `npx prisma db push`