const jwt = require('jsonwebtoken');
 
module.exports = (req, res, next) => {
   try {
    //Nous extrayons le token du header Authorization de la requête entrante. N'oubliez pas qu'il contiendra également le mot-clé Bearer. 
    //Nous utilisons donc la fonction split pour tout récupérer après l'espace dans le header. 
    //Les erreurs générées ici s'afficheront dans le bloc catch.
       const token = req.headers.authorization.split(' ')[1];  

    //Nous utilisons ensuite la fonction verify pour décoder notre token. Si celui-ci n'est pas valide, une erreur sera générée.
       const decodedToken = jwt.verify(token, 'RANDOM_TOKEN_SECRET');
    //Nous extrayons l'ID utilisateur de notre token et le rajoutons à l’objet Request afin que nos différentes routes puissent l’exploiter.
       const userId = decodedToken.userId;
       req.auth = {
           userId: userId
       };
       //tout fonctionne et notre utilisateur est authentifié. Nous passons à l'exécution à l'aide de la fonction next().
	next();
   } catch(error) {
       res.status(401).json({ error });
   }
};