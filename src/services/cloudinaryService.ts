const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dwe8yl6xv';
const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY || '379963537588124';
const apiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET || 'iIeQcTCr9RF7aexU6paoQdRtPIY';

async function sha1Hex(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Upload file to Cloudinary using signed upload (no upload preset required)
 */
export const uploadToCloudinary = async (file: File, folder: string = 'bikes'): Promise<any> => {
  const timestamp = Math.round(Date.now() / 1000).toString();
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = await sha1Hex(paramsToSign + apiSecret);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', apiKey);
  formData.append('timestamp', timestamp);
  formData.append('folder', folder);
  formData.append('signature', signature);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: formData }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Upload failed: ${response.statusText}`);
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
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    const response = await fetch('/api/upload/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
 */
export const getOptimizedImageUrl = (
  publicId: string,
  width: number = 400,
  height: number = 400,
  quality: string = 'auto'
): string => {
  const encodedPublicId = publicId
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  const transformations = `c_fill,g_auto,w_${width},h_${height},q_${quality}`;
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations}/${encodedPublicId}`;
};

/**
 * Get thumbnail URL (200x200)
 */
export const getThumbnailUrl = (publicId: string): string => {
  return getOptimizedImageUrl(publicId, 200, 200, 'auto');
};

/**
 * Upload multiple files to Cloudinary
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
