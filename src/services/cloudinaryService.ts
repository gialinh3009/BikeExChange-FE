const cloudName  = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dwe8yl6xv';
const apiKey     = import.meta.env.VITE_CLOUDINARY_API_KEY     || '';
const apiSecret  = import.meta.env.VITE_CLOUDINARY_API_SECRET  || '';

/** SHA-1 hash (Web Crypto API — works in browser without Node) */
async function sha1Hex(message: string): Promise<string> {
  const msgBuffer  = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray  = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Upload a single file to Cloudinary using signed upload.
 * Signed upload không cần upload preset — dùng API key + secret.
 */
export const uploadToCloudinary = async (file: File, folder: string = 'bikes'): Promise<any> => {
  const timestamp    = Math.round(Date.now() / 1000).toString();
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature    = await sha1Hex(paramsToSign + apiSecret);

  const formData = new FormData();
  formData.append('file',      file);
  formData.append('api_key',   apiKey);
  formData.append('timestamp', timestamp);
  formData.append('folder',    folder);
  formData.append('signature', signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    const err = await response.text().catch(() => response.statusText);
    throw new Error(`Cloudinary upload failed: ${err}`);
  }

  const data = await response.json();
  return {
    url:        data.secure_url,
    publicId:   data.public_id,
    uploadedAt: new Date(),
  };
};

/**
 * Upload nhiều file cùng lúc.
 */
export const uploadMultipleToCloudinary = async (
  files: File[],
  folder: string = 'bikes'
): Promise<any[]> => {
  return Promise.all(files.map(f => uploadToCloudinary(f, folder)));
};

/**
 * Delete file từ Cloudinary (cần gọi qua backend để bảo mật).
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  const response = await fetch('/api/upload/delete', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ publicId }),
  });
  if (!response.ok) throw new Error(`Delete failed: ${response.statusText}`);
};

export const getOptimizedImageUrl = (
  publicId: string,
  width    = 400,
  height   = 400,
  quality  = 'auto'
): string => {
  const encoded = publicId.split('/').map(s => encodeURIComponent(s)).join('/');
  return `https://res.cloudinary.com/${cloudName}/image/upload/c_fill,g_auto,w_${width},h_${height},q_${quality}/${encoded}`;
};

export const getThumbnailUrl = (publicId: string): string =>
  getOptimizedImageUrl(publicId, 200, 200, 'auto');

export default {
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
  getOptimizedImageUrl,
  getThumbnailUrl,
};
