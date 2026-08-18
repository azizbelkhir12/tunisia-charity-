// utils/combinedUpload.js
const multer = require('multer');
const uploadImage = require('./uploadImage');
const upload = require('./upload');

const combinedUpload = multer({
  storage: multer.memoryStorage(),

  fileFilter: (req, file, cb) => {
    // Images
    if (file.mimetype.startsWith('image/')) {
      return uploadImage.fileFilter(req, file, cb);
    }

    // Other authorized documents: PDF, etc.
    return upload.fileFilter(req, file, cb);
  },

  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB per file
  }
}).array('documents', 20); // Maximum 20 files

module.exports = combinedUpload;