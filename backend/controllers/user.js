//imports:
const User = require("../models/users");
const bcrypt = require("bcrypt");//package de cryptage 
//Les tokens d'authentification permettent aux utilisateurs de se connecter une seule fois à leur compte. Au moment de se connecter, ils recevront leur token
// et le renverront automatiquement à chaque requête par la suite. Ceci permettra au back-end de vérifier que la requête est authentifiée.
const jwt = require("jsonwebtoken");

//`Dans cette fonction :
//nous appelons la fonction de hachage de bcrypt dans notre mot de passe et lui demandons de « saler » le mot de passe 10 fois. 
//Plus la valeur est élevée, plus l'exécution de la fonction sera longue, et plus le hachage sera sécurisé.
//il s'agit d'une fonction asynchrone qui renvoie une Promise dans laquelle nous recevons le hash généré ;
//dans notre bloc then , nous créons un utilisateur et l'enregistrons dans la base de données
exports.signup = (req, res, next) => {
  //on brouille le mot de passe entré par le user 10 fois
  bcrypt
    .hash(req.body.password, 10)
    //puis on créée un nouvel objet user avec le mail du user et le mot de passe brouillé
    .then((hash) => {
      const user = new User({
        email: req.body.email,
        password: hash,
      });
      user
        .save()
        .then(() => res.status(201).json({ message: "Utilisateur créé !" }))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};

exports.login = (req, res, next) => {
  // Nous utilisons notre modèle Mongoose pour vérifier que l'e-mail entré par l'utilisateur correspond à
  // un utilisateur existant de la base de données:
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (!user) {
        return res.status(404).json({ error: "Utilisateur non trouvé !" });
      }
      //   Nous utilisons la fonction compare de bcrypt pour comparer le mot de passe entré par l'utilisateur
      //  avec le hash enregistré dans la base de données.bcrypt peut savoir si 2 hash proviennent du même mdp.
      bcrypt
        .compare(req.body.password, user.password)
        .then((valid) => {
          if (!valid) {
            return res.status(401).json({ error: "Mot de passe incorrect, vous n'êtes pas autorisé à vous connecter." });
          }
        //   S'ils correspondent, les informations d'identification de notre utilisateur sont valides.
        //    Dans ce cas, nous renvoyons une réponse 200 contenant l'ID utilisateur et un token:
          res.status(200).json({
            userId: user._id,
            //Nous utilisons la fonction sign de jsonwebtoken (jwt) pour chiffrer un nouveau token:
            token: jwt.sign({ userId: user._id }, 
                //Nous utilisons une chaîne secrète de développement temporaire RANDOM_SECRET_KEY pour crypter notre token:
                "RANDOM_TOKEN_SECRET", {
              expiresIn: "72h",
            }),
          });
        })
        .catch((error) => res.status(500).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};
