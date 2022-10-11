const Sauce = require("../models/sauce");
const fs = require("fs");
// const sauce = require("../models/sauce");

//CETTE FONCTION CREE UNE SAUCE. on crée une instance dU modèle sauce en lui passant un objet
//JavaScript contenant toutes les informations requises du corps de requête analysé grâce à l'opérateur...
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
        error: error,
      });
    });
};

//FONCTION MODIFIER UNE SAUCE
exports.modifySauce = (req, res, next) => {
  //on crée un objet sauceObject qui regarde si req.file existe ou non, ie s'il y a un fichier à télécharger ou non.
  const sauceObject = req.file
    ? {
        //S'il existe, on traite la nouvelle image :
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
  //suppression du champ _userId envoyé par le client
  delete sauceObject._userId;
  //on cherche dans le tableau des sauces l'id de la sauce à modifier passé dans la requete:
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      //verification que le requérant est le créateur de la sauce:
      if (sauce.userId != req.auth.userId) {
        res.status(401).json({ message: "Not authorized" });
      } else {
        console.log("coucou");
        sauce
          .updateOne(
            { _id: req.params.id },
            { ...sauceObject, _id: req.params.id }
          )
          .then(() => res.status(200).json({ message: "Sauce modifiée!" }))
          .catch((error) => res.status(401).json({ error }));
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

//FONCTION SUPPRIMER UNE SAUCE
exports.deleteSauce = (req, res, next) => {
  //Nous utilisons l'ID que nous recevons comme paramètre pour accéder a la sauce correspondante dans la base de données.
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      //Nous vérifions si l’utilisateur qui a fait la requête de suppression est bien celui qui a créé la sauce.
      if (sauce.userId != req.auth.userId) {
        res.status(401).json({ message: "Not authorized" });
      } else {
        //Nous utilisons le fait de savoir que notre URL d'image contient un segment /images/ pour séparer le nom de fichier.
        const filename = sauce.imageUrl.split("/images/")[1];
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
    .then((sauces) => {
      res.status(200).json(sauces);
    })
    .catch((error) => {
      res.status(400).json({
        error: error,
      });
    });
};

//FONCTION DE GESTION DES LIKE
exports.likeSauce=(req,res,next)=>{
  //on cherche la sauce que l'on veut liker dans l'api via son id passer dans l'url de la requête
  Sauce.findOne({ _id: req.params.id })
  .then((sauce) => {
    const likes=sauce.likes;
    const dislikes=sauce.dislikes;
    const usersLiked=sauce.usersLiked;
    const usersDisliked=sauce.usersDisliked;

    //on recupère les infos de la requête dans des variables:
    let userIdLikeur = req.body.userId;
    let like = req.body.like;

// on créer un tableau des userId:
let listUserIdBrute = Sauce().map((chaqueSauce) => {
  return chaqueSauce._userId});
//on supprime les userId en double:
let listUserId = listUserIdBrute.filter((x,i)=> listUserIdBrute.indexOf(x) === i);

//on initialise un tableau à 2 dimensions pour aceuillir la valeur de like de chaque user pour cette sauce:
let listUserIdLike=[[],[]];
for(i=0; i<= listUserId.length; i++){
listUserIdLike[i][i]=[[listUserId[i]],[0]];
}
//on cible le likeur dans le tableau des usersId:
let indice=listUserIdLike.findIndex(ligne => ligne === [[userIdLikeur],[0]]);
    //on traite chaque cas de like:
    if(like==1){
      //on attribue 1 au user dans le tableau listUserIdLike.
listUserIdLike[indice]=[[userIdLikeur],[1]];
      //on ajoute 1 à la sauce.likes et à sauce.usersLiked.
      likes ++;
      usersLiked ++;     
    }else if(like==-1){
 //on attribue -1 au user dans le tableau listUserIdLike.
 listUserIdLike[indice]=[[userIdLikeur],[-1]];
 //on ajoute 1 à la sauce.likes et à sauce.usersLiked.
 dislikes ++;
 usersDisliked ++;
    }else if(like==0){
 //on attribue 0 au user dans le tableau listUserIdLike.
 listUserIdLike[indice]=[[userIdLikeur],[0]];
 //on teste la valeur initiale dans le tableau des like, si c'était un like (1) on décrémente les like etc.
if(listUserIdLike[indice]==[[userIdLikeur],[1]]){
  likes --;
  usersLiked --;
}else if(listUserIdLike[indice]==[[userIdLikeur],[-1]]){
  dislikes --;
  usersDisliked --;
}
    }
  })
  .catch((error) => {
    res.status(400).json({ error });
  });
};