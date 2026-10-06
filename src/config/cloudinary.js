const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Cloudinary configuration using CLOUDINARY_URL environment variable
// The CLOUDINARY_URL should be in format: cloudinary://api_key:api_secret@cloud_name
cloudinary.config({
  // The configuration will be automatically loaded from CLOUDINARY_URL
  secure: true
});

// Create storage engine for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'shopii',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
  }
});

// Create multer upload middleware
const upload = multer({ storage: storage });

module.exports = {
  cloudinary,
  upload
}; 