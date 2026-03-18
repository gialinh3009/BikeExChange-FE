import { CldUploadWidget, CldImage } from 'next-cloudinary';
import { Cloudinary } from 'cloudinary-core';

const cloudinaryInstance = new Cloudinary({
  cloud_name: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dwe8yl6xv',
});

/**
 * Upload file to Cloudinary
 * @param file File to upload
 * @param folder Folder in Cloudinary (e.g., 'bikes', 'profiles')
 * @returns Promise with upload response
 */
export const uploadToCloudinary = async (file: File, folder: string = 'bikes'): Promise<any> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'bike_exchange');
  formData.append('folder', folder);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dwe8yl6xv'}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      publicId: data.public_id,
      uploadedAt: new Date(),
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Delete file from Cloudinary (requires backend call for security)
 * @param publicId Public ID of the file
 * @returns Promise
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    const response = await fetch('/api/upload/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publicId }),
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

/**
 * Get optimized image URL
 * @param publicId Public ID of the image
 * @param width Image width
 * @param height Image height
 * @param quality Image quality
 * @returns Optimized image URL
 */
export const getOptimizedImageUrl = (
  publicId: string,
  width: number = 400,
  height: number = 400,
  quality: string = 'auto'
): string => {
  return cloudinaryInstance.url(publicId, {
    width,
    height,
    crop: 'fill',
    gravity: 'auto',
    quality,
    secure: true,
  });
};

/**
 * Get thumbnail URL
 * @param publicId Public ID of the image
 * @returns Thumbnail URL (200x200)
 */
export const getThumbnailUrl = (publicId: string): string => {
  return getOptimizedImageUrl(publicId, 200, 200, 'auto');
};

/**
 * Upload multiple files
 * @param files Array of files
 * @param folder Folder in Cloudinary
 * @returns Promise with array of upload responses
 */
export const uploadMultipleToCloudinary = async (
  files: File[],
  folder: string = 'bikes'
): Promise<any[]> => {
  const uploadPromises = files.map((file) => uploadToCloudinary(file, folder));
  return Promise.all(uploadPromises);
};

export default {
  uploadToCloudinary,
  deleteFromCloudinary,
  getOptimizedImageUrl,
  getThumbnailUrl,
  uploadMultipleToCloudinary,
};
