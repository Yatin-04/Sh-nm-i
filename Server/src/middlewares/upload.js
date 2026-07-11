import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { CloudinaryStorage } = require('multer-storage-cloudinary');
import dotenv from 'dotenv';
dotenv.config();

// Cloudinary will automatically use CLOUDINARY_URL from env variables

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine folder and resource_type based on mimetype
    let resource_type = 'auto';
    
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
        resource_type = 'raw';
    }

    return {
      folder: 'study-buddy-assets',
      public_id: file.fieldname + '-' + Date.now(),
      resource_type: resource_type
      // Don't set format for raw files — it can break the download URL
    };
  },
});

export const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB — Cloudinary free tier limit
    fileFilter: (req, file, cb) => {
        if (
            file.mimetype === 'application/pdf' || 
            file.mimetype === 'text/plain' || 
            file.mimetype.startsWith('image/')
        ) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, TXT, and Images are allowed.'));
        }
    }
});
