const Sauce = require("../models/sauce");
const fs = require("fs");
// const sauce = require("../models/sauce");

//CETTE FONCTION CREE UNE SAUCE. on crée une instance dU modèle sauce en lui passant un objet
//JavaScript contenant toutes les informations requises du corps de requête analysé grâce à l'opérateur thread ...
//(en ayant supprimé en amont le faux_id envoyé par le front-end)
exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  console.log(sauceObject);
  //(Le corps de la requête contient une chaîne sauce, qui est simplement un objet sauce converti en chaîne string.
  //Nous devons donc le convertir en json à l'aide de JSON.parse() pour obtenir un objet utilisable.)
  delete sauceObject._id;
  //Nous supprimons le champ_userId de la requête envoyée par le client car nous ne devons pas lui faire confiance
  delete sauceObject._userId;
  const sauce = new Sauce({
    ...sauceObject,
    //Nous remplaçons le userId supprimé par le _userId extrait du token par le middleware d’authentification:
    userId: req.auth.userId,
    //Reconstitution de l'URL de l'image:
    //Nous utilisons req.protocol pour obtenir le premier segment (dans notre cas 'http').
    //Nous ajoutons '://', puis utilisons req.get('host') pour obtenir l'hôte du serveur (ici, 'localhost:3000').
    //Nous ajoutons finalement '/images/' et le nom de fichier pour compléter notre URL.
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
  });
  sauce
    .save()
    .then(() => {
      res.status(201).json({ message: "Sauce enregistrée !" });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

//FONCTION OBTENIR UNE SAUCE
exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({
    _id: req.params.id,
  })
    .then((sauce) => {
      res.status(200).json(sauce);
    })
    .catch((error) => {
      res.status(404).json({
        message: "Sauce non trouvée.",
      });
    });
};

//FONCTION MODIFIER UNE SAUCE
exports.modifySauce = (req, res, next) => {
  // console.log("...req.body.sauce: ");
  // console.log(...req.body.sauce);

  //on crée un objet sauceObject et on demande si req.file existe ou non, ie s'il y a un fichier à télécharger ou non.
  //en fonction de la réponse à cette question, on remplit différemment sauceObject
  const sauceObject = req.file
    ? {
        //S'il existe, on traite la nouvelle image :
        //on met dans sauceObject à l'aide de ... la partie Json du body, ie tout sauf l'image:
        ...JSON.parse(req.body.sauce),

        //Nous utilisons req.protocol pour obtenir le premier segment (dans notre cas 'http').
        //Nous ajoutons '://', puis utilisons req.get('host') pour obtenir l'hôte du serveur (ici, 'localhost:3000').
        //Nous ajoutons finalement '/images/' et le nom de fichier pour compléter notre URL.
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : {
        // s'il n'existe pas, on traite simplement l'objet entrant: on met le contenu du body de la requête dans
        // sauceObject à l'aide de l'opérateur ...

        ...req.body,
      };
  console.log(" contenu de sauceObject après traitement file ou non:");
  console.log(sauceObject); //ok

  // suppression du champ _userId envoyé par le client
  delete sauceObject.userId;
  //ON VERIFIE QUE LE MODIFICATEUR EST LE CREATEUR SANS QUOI IL N EST PAS AUTORISE A MODIFIE LA SAUCE:
  Sauce.updateOne(
    { _id: req.params.id },
    { ...sauceObject, _id: req.params.id }
  )
    .then(() => res.status(200).json({ message: "Sauce modifiée !" }))
    .catch((error) => res.status(400).json({ error }));
};

//FONCTION SUPPRIMER UNE SAUCE
exports.deleteSauce = (req, res, next) => {
  //Nous utilisons l'ID que nous recevons comme paramètre pour accéder a la sauce correspondante dans la base de données.
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      //Nous vérifions si l’utilisateur qui a fait la requête de suppression est bien celui qui a créé la sauce.
      if (sauce.userId != req.auth.userId) {
        res.status(401).json({ message: "Vous n'êtes pas autorisé à supprimer cette sauce." });
      } else {
        //Nous utilisons le fait de savoir que notre URL d'image contient un segment /images/ pour séparer le nom de fichier.
        const filename = sauce.imageUrl.split("/images/")[1];
        //Nous utilisons ensuite la fonction unlink du package fs pour supprimer ce fichier du système de fichiers du serveur
        //en lui passant le fichier à supprimer et le callback à exécuter une fois ce fichier supprimé.
        fs.unlink(`images/${filename}`, () => {
          //Dans le callback, nous implémentons le code pour supprimer la sauce de la base de données:
          Sauce.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: "Sauce supprimée !" });
            })
            .catch((error) => res.status(500).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};

//RECUPERATION DE LA LISTE DES SAUCES
exports.getAllSauces = (req, res, next) => {
  Sauce.find()
    .then((sauces) => {
      res.status(200).json(sauces);
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      });
    });
};

//FONCTION DE GESTION DES "LIKE"
exports.likeSauce = (req, res, next) => {
  //on cherche la sauce que l'on veut liker dans l'api via son id passer dans l'url de la requête
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      // console.log("je suis dans la fonction like");

      const likes = sauce.likes; //2
      const dislikes = sauce.dislikes; //1
      const usersLiked = sauce.usersLiked; //["id1","id2"]
      const usersDisliked = sauce.usersDisliked;

      //on recupère les infos de la requête dans des variables:
      let userIdLikeur = req.body.userId;
      let like = req.body.like;

      //****************si le user likeur n'est pas enregistré dans le tableau des users likeurs de la sauce et qu'il a liker la sauce:
      //
      if (!usersLiked.includes(userIdLikeur) && like === 1) {
        //s'il avait disliké au préalable, on supprime son dislike:décrément de dislikes et supression de son Id dans usersDisliked
        if (usersDisliked.includes(userIdLikeur)) {
          Sauce.updateOne(
            { _id: req.params.id },
            {
              $inc: { dislikes: -1 },
              $pull: { usersDisliked: userIdLikeur },
            }
          )
            //201: created
            .then(() =>
              res
                .status(201)
                .json({
                  message: "Sauce mise à jour avec décrément d'un dislike.",
                })
            )
            .catch((error) =>
              res.status(400).json({ message: "Mauvaise requête." })
            );
        }
        //Dans tous les cas on enregistre son like:
        Sauce.updateOne(
          //le premier paramètre de cette méthode mongoDB updateOne(filter,update,options) est le filtre:
          { _id: req.params.id },
          //ensuite on écrit les modifications voulues: likes à 1 et mettre l'id du likeur dans le tableaux des users likeurs:
          {
            //pour cela on utilise un opérateur de mise à jour mongoDB: $inc qui incrémente un champ avec une valeur.
            //syntaxe: { $inc: { <field1>: <amount1>, <field2>: <amount2>, ... } }
            $inc: { likes: 1 },
            //$push permet d'ajouter un champ et sa valeur à un élément d'une collection ou de mettre à jour la valeur du champ s'il existe:
            $push: { usersLiked: userIdLikeur },
          }
        )
          //le résultat de la méthode updateOne est une promesse donc on doit ajouter .then et .cath pour traiter cette promesse:
          .then(() =>
            res
              .status(201)
              .json({ message: "Sauce mise à jour avec incrément d'un like!" })
          )
          .catch((error) => res.status(400).json({ error }));
      }

      //****************si le user likeur est enregistré dans le tableau des users likeurs de la sauce et qu'il ne veut plus liker:
      if (usersLiked.includes(userIdLikeur) && like === 0) {
        Sauce.updateOne(
          { _id: req.params.id },
          {
            $inc: { likes: -1 },
            //$pull permet de supprimer un champ et sa valeur d' un élément d'une collection :
            $pull: { usersLiked: userIdLikeur },
          }
        )
          .then(() =>
            res
              .status(201)
              .json({ message: "Sauce mise à jour avec décrément d'un like." })
          )
          .catch((error) =>
            res.status(400).json({ message: "Mauvaise requête." })
          );
      }

      //****************si le user likeur enregistré dans tableau des users DISlikeurs de la sauce et qu'il ne veut plus DISliker:
      if (usersDisliked.includes(userIdLikeur) && like === 0) {
        Sauce.updateOne(
          { _id: req.params.id },
          {
            $inc: { dislikes: -1 },
            $pull: { usersDisliked: userIdLikeur },
          }
        )
          .then(() =>
            res
              .status(201)
              .json({
                message: "Sauce mise à jour avec décrément d'un dislike.",
              })
          )
          .catch((error) =>
            res.status(400).json({ message: "Mauvaise requête." })
          );
      }

      //****************si le user likeur n'est pas enregistré dans le tableau des users dislikeurs de la sauce et qu'il a disliker la sauce:
      if (!usersDisliked.includes(userIdLikeur) && like === -1) {
        //s'il avait au préalable liker la sauce, on supprime son like:
        if (usersLiked.includes(userIdLikeur)) {
          Sauce.updateOne(
            { _id: req.params.id },
            {
              $inc: { likes: -1 },
              $pull: { usersLiked: userIdLikeur },
            }
          )
            .then(() =>
              res
                .status(201)
                .json({
                  message: "Sauce mise à jour avec décrément d'un like.",
                })
            )
            .catch((error) =>
              res.status(400).json({ message: "Mauvaise requête." })
            );
        }
        //Dans tous les cas, on enregistre son dislike:
        Sauce.updateOne(
          { _id: req.params.id },
          {
            $inc: { dislikes: 1 },
            $push: { usersDisliked: userIdLikeur },
          }
        )
          .then(() =>
            res
              .status(201)
              .json({
                message: "Sauce mise à jour avec incrément d'un dislike.",
              })
          )
          .catch((error) => res.status(400).json({ error }));
      }

      //**************si l'utilisateur veut refaire la même action 2 fois, aucun changement ne se produit. */
      if (
        (!usersLiked.includes(userIdLikeur) &&
          usersDisliked.includes(userIdLikeur) &&
          like == -1) ||
        (usersLiked.includes(userIdLikeur) &&
          !usersDisliked.includes(userIdLikeur) &&
          like == 1) ||
        (!usersLiked.includes(userIdLikeur) &&
          !usersDisliked.includes(userIdLikeur) &&
          like == 0)
      ) {
        res.json({ message: "Pas de changement." });
      }
      console.log("likes:",likes);
      console.log("dislikes:",dislikes);
    })
    .catch((error) => res.status(404).json({ message: "Sauce non trouvée." }));
};
