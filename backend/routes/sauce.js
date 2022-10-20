const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
//nous importons le middleware auth et le passons comme argument aux routes à protéger. 
const multer = require("../middleware/multer-config");//pourquoi?
const stuffCtrl = require("../controllers/sauce");

//route pour voir toutes les sauces:
router.get("/", auth, stuffCtrl.getAllSauces);
//route pour créer une sauce:
router.post("/", auth, multer, stuffCtrl.createSauce);
//route pour voir une sauce:
router.get("/:id", auth, stuffCtrl.getOneSauce);
//route pour modifier une sauce
router.put("/:id", auth, multer, stuffCtrl.modifySauce);

//pour supprimer une sauce:
router.delete("/:id", auth, stuffCtrl.deleteSauce);

//pour liker ou disliker une sauce
router.post("/:id/like", auth, stuffCtrl.likeSauce);

module.exports = router;

