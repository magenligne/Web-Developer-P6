//APPLICATION EXPRESS

//incliusion du module dotenv pour qu'il charge les variables d'environnement dans process.env
require('dotenv').config()

//afficheur de requetes:
const morgan = require("morgan");

const express = require("express");//import Express de Node
//Pour créer une application Express, appelez simplement la méthode  express()
const app = express();
const mongoose = require("mongoose");

//on utilise notre variable d'environnement LIEN_MDB qui protège notre lien, le fichier.env étant ignoré par git
mongoose
  .connect(
   process.env.LIEN_MDB,
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log("Connexion à MongoDB réussie !"))
  .catch(() => console.log("Connexion à MongoDB échouée !"));

app.use(express.json());

app.use(morgan("dev"));//pour afficher les requête dans le terminal vscode
//un middleware est une fonction composant une app express et prenant en argument req, res et next.
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content, Accept, Content-Type, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS"
  );
  next();
});
//CORS signifie « Cross Origin Resource Sharing ». 
//Il s'agit d'un système de sécurité qui, par défaut, bloque les appels HTTP entre des serveurs différents, 
//ce qui empêche donc les requêtes malveillantes d'accéder à des ressources sensibles. 
//Dans notre cas, nous avons deux origines : localhost:3000 et localhost:4200 , et nous souhaiterions qu'elles puissent communiquer entre elles. 
//Pour cela, nous avons ajouter ci-dessus des headers à notre objet  response.
//ainsi,  le front-end pourra effectuer des appels vers votre application en toute sécurité

const path = require("path");//module chemin
const userRoutes = require("./routes/user");
const sauceRoutes = require("./routes/sauce");

//La méthode app.use() vous permet d'attribuer un middleware à une route spécifique de votre application
app.use("/api/sauces", sauceRoutes);
app.use("/api/auth", userRoutes);
app.use("/images", express.static(path.join(__dirname, "images")));

module.exports = app;
