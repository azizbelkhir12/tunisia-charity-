const express = require('express');
const router = express.Router();
const translationController = require('../controllers/translationController');

router.post('/translate', translationController.translate);

module.exports = router;
