import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

const storageProvider = process.env.STORAGE_PROVIDER || 'local';
const uploadDir = process.env.UPLOAD_DIR || 'uploads';

// Ensure local uploads directory exists
if (storageProvider === 'local') {
  const localPath = path.resolve(uploadDir);
  if (!fs.existsSync(localPath)) {
    fs.mkdirSync(localPath, { recursive: true });
  }
} else if (storageProvider === 'cloudinary') {
  if (!process.env.CLOUDINARY_URL) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }
}

/**
 * Uploads a file and returns its URL/local path
 * @param {Object} file Multer file object
 * @returns {Promise<Object>} URL and publicId/filename
 */
export const uploadFile = async (file) => {
  if (storageProvider === 'cloudinary') {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        file.path,
        {
          resource_type: 'auto',
          folder: 'docsearch_documents',
        },
        (error, result) => {
          if (error) return reject(error);
          // Delete temp local file created by multer
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
          resolve({
            fileUrl: result.secure_url,
            storageKey: result.public_id,
          });
        }
      );
    });
  } else {
    // Local storage
    const destPath = path.join(uploadDir, path.basename(file.path));
    fs.renameSync(file.path, destPath);
    const relativeUrl = `/uploads/${path.basename(file.path)}`;
    return {
      fileUrl: relativeUrl,
      storageKey: destPath,
    };
  }
};

/**
 * Deletes a file from storage
 * @param {string} storageKey Path or public id
 * @param {string} fileType Document type enum ('pdf', 'docx', 'txt', 'image')
 */
export const deleteFile = async (storageKey, fileType = '') => {
  if (storageProvider === 'cloudinary') {
    try {
      let resourceType = 'image';
      const isRawType = ['pdf', 'docx', 'txt', 'raw'].includes(String(fileType).toLowerCase());
      const hasRawExt = /\.(pdf|docx|doc|txt|xls|xlsx|csv|zip|tar|gz)$/i.test(storageKey);
      if (isRawType || hasRawExt) {
        resourceType = 'raw';
      }
      await cloudinary.uploader.destroy(storageKey, { resource_type: resourceType });
    } catch (error) {
      console.log('Failed to delete file from Cloudinary:', error.message);
    }
  } else {
    // Local storage: delete the file if it exists
    if (fs.existsSync(storageKey)) {
      try {
        fs.unlinkSync(storageKey);
      } catch (error) {
        console.log('Failed to delete local file:', error.message);
      }
    }
  }
};
