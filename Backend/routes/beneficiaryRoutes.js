const express = require("express");
const router = express.Router();
const uploadImage = require("../utils/uploadImage");
const imgurUpload = require("../utils/imgurUpload");
const upload = require("../utils/upload");
const combinedUpload = require("../utils/combinedUpload");
const {
  uploadPersonalPhoto,
  uploadHousePhoto,
} = require("../utils/imgurUploadMultiple");
const beneficiaryController = require("../controllers/beneficiaryController");

router.post("/create", beneficiaryController.createBeneficiary);
router.get("/getAll", beneficiaryController.getAllBeneficiaries);
router.get("/get/:id", beneficiaryController.getBeneficiaryById);
router.put("/update/:id", beneficiaryController.updateBeneficiary);
router.delete("/delete/:id", beneficiaryController.deleteBeneficiary);
router.put("/:id/photo",uploadImage.single("photo"),imgurUpload,beneficiaryController.updatePhoto,);
router.put("/:id/documents",combinedUpload,beneficiaryController.submitDocuments,);
router.get("/:id/bulletin", beneficiaryController.downloadBulletin);


module.exports = router;
