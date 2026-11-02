const cloudinary = require('cloudinary').v2;
const multer = require('multer');
cloudinary.config({ secure: true });
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5, fields: 5, fieldSize: 2048 },
  fileFilter: (req, file, cb) => {
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.mimetype)) return cb(Object.assign(new Error('Only JPEG, PNG, GIF or WebP images are allowed'), { status: 400 }));
    cb(null, true);
  }
});
module.exports = { cloudinary, upload };
