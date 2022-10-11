const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const multer = require("../middleware/multer-config");
const stuffCtrl = require("../controllers/sauce");

//route pour voir toutes les sauces:
router.get("/", auth, stuffCtrl.getAllSauces);
//route pour créer une sauce:
router.post("/", auth, multer, stuffCtrl.createSauce);

router.get("/:id", auth, stuffCtrl.getOneSauce);

router.put("/:id", auth, multer, stuffCtrl.modifySauce);

//pour supprimer une sauce:
router.delete("/:id", auth, stuffCtrl.deleteSauce);

// //pour liker ou disliker une sauce
router.post("/:id/like", auth, stuffCtrl.likeSauce);

module.exports = router;
