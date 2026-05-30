import cloudinary from '../config/cloudinary.js';

export const uploadToCloudinary = async (fileData, folder = "inventory") => {
  if (!fileData) return null;
  try {
    // fileData can be a local file path, a remote URL, or a base64 data URI string
    const result = await cloudinary.uploader.upload(fileData, {
      folder: folder,
    });
    console.log(`Successfully uploaded image to Cloudinary: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return null;
  }
};

export const deleteImageFromCloudinary = async (imageUrl) => {
  if (!imageUrl) return null;
  try {
    // Regex to extract the public_id from a Cloudinary URL
    // It handles URLs with or without the version number (e.g. /v1234567/)
    const regex = /\/upload\/(?:v\d+\/)?([^\.]+)/;
    const match = imageUrl.match(regex);
    
    if (match && match[1]) {
      const publicId = match[1];
      const result = await cloudinary.uploader.destroy(publicId);
      console.log(`Successfully deleted image from Cloudinary: ${publicId}`);
      return result;
    } else {
      console.warn(`Could not extract public_id from Cloudinary URL: ${imageUrl}`);
      return null;
    }
  } catch (error) {
    console.error("Cloudinary deletion error:", error);
    return null;
  }
};
