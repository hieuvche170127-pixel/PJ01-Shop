const fileUploadService = require('../services/fileUploadService');

/**
 * Upload a single image
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }
    
    // Multer with Cloudinary storage already uploads the file
    // We can access the result from req.file
    const result = {
      public_id: req.file.filename,
      url: req.file.path,
      secure_url: req.file.path,
      format: req.file.format,
      width: req.file.width,
      height: req.file.height
    };
    
    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in uploadImage controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message
    });
  }
};

/**
 * Upload multiple images
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const results = req.files.map(file => ({
      public_id: file.filename,
      url: file.path,
      secure_url: file.path,
      format: file.format,
      width: file.width,
      height: file.height
    }));

    return res.status(200).json({
      success: true,
      message: 'Files uploaded successfully',
      data: results
    });
  } catch (error) {
    console.error('Error in uploadMultipleImages controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload images',
      error: error.message
    });
  }
};

/**
 * Delete an image from Cloudinary
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteImage = async (req, res) => {
  try {
    const { public_id } = req.body;
    
    if (!public_id) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required'
      });
    }

    const result = await fileUploadService.deleteFile(public_id);
    
    if (result.result === 'ok') {
      return res.status(200).json({
        success: true,
        message: 'Image deleted successfully'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Failed to delete image',
        data: result
      });
    }
  } catch (error) {
    console.error('Error in deleteImage controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete image',
      error: error.message
    });
  }
};

module.exports = {
  uploadImage,
  uploadMultipleImages,
  deleteImage
}; 