import cloudinary from '../config/cloudinary.js';

export const uploadToCloudinary = async (fileData, folder = "inventory") => {
  if (!fileData) return null;
  try {
    // fileData can be a local file path, a remote URL, or a base64 data URI string
    const result = await cloudinary.uploader.upload(fileData, {
      folder: folder,
    });
    console.log(`Successfully uploaded image to Cloudinary: ${result.secure_url}`);
    return { url: result.secure_url, publicId: result.public_id };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return null;
  }
};

export const deleteImageFromCloudinary = async (publicId) => {
  if (!publicId) return null;
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`Successfully deleted image from Cloudinary: ${publicId}`);
    return result;
  } catch (error) {
    console.error("Cloudinary deletion error:", error);
    return null;
  }
};
