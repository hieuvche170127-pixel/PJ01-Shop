const { cloudinary } = require('../config/cloudinary');

/**
 * Upload a file to Cloudinary
 * @param {string} filePath - Path to the file
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Cloudinary upload result
 */
const uploadFile = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, options);
    return result;
  } catch (error) {
    console.error('Error uploading file to Cloudinary:', error);
    throw new Error('Failed to upload file');
  }
};

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Public ID of the file to delete
 * @returns {Promise<Object>} - Cloudinary deletion result
 */
const deleteFile = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    throw new Error('Failed to delete file');
  }
};

/**
 * Generate a signed URL for an image with optional transformations
 * @param {string} publicId - Public ID of the image
 * @param {Object} options - Transformation options
 * @returns {string} - Signed URL
 */
const getImageUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, options);
};

module.exports = {
  uploadFile,
  deleteFile,
  getImageUrl
}; 