//imports:
const User = require("../models/users");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.signup = (req, res, next) => {
  bcrypt
    .hash(req.body.password, 10)
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
        return res.status(401).json({ error: "Utilisateur non trouvé !" });
      }
      //   Nous utilisons la fonction compare de bcrypt pour comparer le mot de passe entré par l'utilisateur
      //  avec le hash enregistré dans la base de données:
      bcrypt
        .compare(req.body.password, user.password)
        .then((valid) => {
          if (!valid) {
            return res.status(401).json({ error: "Mot de passe incorrect !" });
          }
        //   S'ils correspondent, les informations d'identification de notre utilisateur sont valides.
        //    Dans ce cas, nous renvoyons une réponse 200 contenant l'ID utilisateur et un token:
          res.status(200).json({
            userId: user._id,
            //Nous utilisons la fonction sign de jsonwebtoken pour chiffrer un nouveau token:
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
