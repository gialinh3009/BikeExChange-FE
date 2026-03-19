/**
 * Upload image to Cloudinary
 * @param {File} file - Image file to upload
 * @returns {Promise<string>} - Cloudinary URL of uploaded image
 */
export async function uploadToCloudinary(file) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

  if (!apiBaseUrl) {
    throw new Error("VITE_API_BASE_URL is missing");
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(`${apiBaseUrl}/cloudinary/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Upload failed (${response.status})`);
    }

    const data = await response.json();
    if (!data?.url) {
      throw new Error("Backend did not return uploaded URL");
    }

    return data.url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error(`Lỗi upload ảnh: ${error?.message || "Unknown error"}`);
  }
}

/**
 * Upload multiple images to Cloudinary
 * @param {File[]} files - Array of image files
 * @returns {Promise<string[]>} - Array of Cloudinary URLs
 */
export async function uploadMultipleToCloudinary(files) {
  const uploadPromises = files.map((file) => uploadToCloudinary(file));
  return Promise.all(uploadPromises);
}
