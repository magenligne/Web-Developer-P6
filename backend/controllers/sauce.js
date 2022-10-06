const Sauce = require("../models/sauce");
const fs = require("fs");
const sauce = require("../models/sauce");

//CETTE FONCTION CREE UNE SAUCE. on crée une instance dU modèle sauce en lui passant un objet
//JavaScript contenant toutes les informations requises du corps de requête analysé grâce à l'opérateur...
//(en ayant supprimé en amont le faux_id envoyé par le front-end)
exports.createSauce = (req, res, next) => {
  const thingObject = JSON.parse(req.body.sauce);
  //(Le corps de la requête contient une chaîne sauce, qui est simplement un objet sauce converti en chaîne.
  //Nous devons donc l'analyser à l'aide de JSON.parse() pour obtenir un objet utilisable.)
  delete thingObject._id;
  //Nous supprimons le champ_userId de la requête envoyée par le client car nous ne devons pas lui faire confiance
  delete thingObject._userId;
  const sauce = new Sauce({
    ...thingObject,
    //Nous remplaçons le userId supprimé par le _userId extrait du token par le middleware d’authentification:
    userId: req.auth.userId,
    //Reconstitution de l'URL de l'image:
    //Nous utilisons req.protocol pour obtenir le premier segment (dans notre cas 'http').
    //Nous ajoutons '://', puis utilisons req.get('host') pour résoudre l'hôte du serveur (ici, 'localhost:3000').
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

exports.getOneThing = (req, res, next) => {
  Sauce.findOne({
    _id: req.params.id,
  })
    .then((thing) => {
      res.status(200).json(thing);
    })
    .catch((error) => {
      res.status(404).json({
        error: error,
      });
    });
};

exports.modifyThing = (req, res, next) => {
  const thingObject = req.file
    ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };

  delete thingObject._userId;
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (sauce.userId != req.auth.userId) {
        res.status(401).json({ message: "Not authorized" });
      } else {
        console.log("coucou");
        sauce
          .updateOne(
            { _id: req.params.id },
            { ...thingObject, _id: req.params.id }
          )
          .then(() => res.status(200).json({ message: "Objet modifié!" }))
          .catch((error) => res.status(401).json({ error }));
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.deleteSauce = (req, res, next) => {
  //Nous utilisons l'ID que nous recevons comme paramètre pour accéder a la sauce correspondante dans la base de données.
  Sauce.findOne({ _id: req.params.id })
    .then((thing) => {
      //Nous vérifions si l’utilisateur qui a fait la requête de suppression est bien celui qui a créé la sauce.
      if (thing.userId != req.auth.userId) {
        res.status(401).json({ message: "Not authorized" });
      } else {
        //Nous utilisons le fait de savoir que notre URL d'image contient un segment /images/ pour séparer le nom de fichier.
        const filename = thing.imageUrl.split("/images/")[1];
        //Nous utilisons ensuite la fonction unlink du package fs pour supprimer ce fichier,
        //en lui passant le fichier à supprimer et le callback à exécuter une fois ce fichier supprimé.
        fs.unlink(`images/${filename}`, () => {
          //Dans le callback, nous implémentons la logique d'origine en supprimant la sauce de la base de données
          Sauce.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: "Objet supprimé !" });
            })
            .catch((error) => res.status(401).json({ error }));
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
    .then((things) => {
      res.status(200).json(things);
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      });
    });
};
