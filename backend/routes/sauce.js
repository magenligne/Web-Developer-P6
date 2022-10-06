const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const multer = require("../middleware/multer-config");
const stuffCtrl = require("../controllers/sauce");

//route pour voir toutes les sauces:
router.get("/", auth, stuffCtrl.getAllSauces);
//route pour créer une sauce:
router.post("/", auth, multer, stuffCtrl.createSauce);

router.get("/:id", auth, stuffCtrl.getOneThing);

router.put("/:id", auth, multer, stuffCtrl.modifyThing);

//pour supprimer une sauce:
router.delete("/:id", auth, stuffCtrl.deleteSauce);

module.exports = router;
