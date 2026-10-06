const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const { upload } = require('../config/cloudinary');

// Upload a single image
router.post('/upload', upload.single('image'), imageController.uploadImage);

// Upload multiple images (max 10)
router.post('/upload-multiple', upload.array('images', 10), imageController.uploadMultipleImages);

// Delete an image
router.delete('/delete', imageController.deleteImage);

module.exports = router; 