const router = require('express').Router();
const controller = require('../controllers/imageController');
const { upload } = require('../config/cloudinary');
const parse = middleware => (req, res, next) => middleware(req, res, error => {
  if (!error) return next();
  res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ success: false, message: error.code === 'LIMIT_FILE_SIZE' ? 'Each image must be at most 5 MB' : 'Upload up to 5 JPEG, PNG, GIF or WebP images' });
});
router.post('/upload', parse(upload.single('image')), controller.uploadImage);
router.post('/upload-multiple', parse(upload.array('images', 5)), controller.uploadMultipleImages);
router.delete('/delete', controller.deleteImage);
module.exports = router;
