const express = require('express');
const router = express.Router();
const volunteerController = require('../controllers/volunteerController');
const uploadImage = require('../utils/uploadImage');
const imgurUpload = require('../utils/imgurUpload');

const {auth} = require('../utils/auth'); 
 

router.get('/volunteers', volunteerController.getAllVolunteers);
router.get('/getvolunteers/:id', volunteerController.getVolunteerById);
router.put('/:id/status', volunteerController.changeVolunteerStatus);
router.put('/update/:id/', volunteerController.updateVolunteer); 
router.put('/admin-volunteer/:id', volunteerController.updateVolunteerByAdmin);
router.put(
    '/photo/:id',
    uploadImage.single('photo'), // handles file upload
    imgurUpload,                 // uploads to Imgur
    volunteerController.updatePhoto // updates DB
  );
module.exports = router;