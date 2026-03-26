// Backend-Proxy Image Upload Service
// Files are uploaded to backend, which uploads to Cloudinary
// More secure than frontend direct upload

export async function uploadImageToCloudinary(file) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  
  if (!apiBaseUrl) {
    throw new Error("API Base URL is not configured");
  }

  try {
    const formData = new FormData();
    formData.append("file", file);

    // Upload to backend, which will proxy to Cloudinary
    const uploadRes = await fetch(`${apiBaseUrl}/cloudinary/upload`, {
      method: "POST",
      body: formData,
    });

    if (!uploadRes.ok) {
      throw new Error(`Upload failed: ${uploadRes.statusText}`);
    }

    const uploadData = await uploadRes.json();
    
    if (!uploadData.url) {
      throw new Error("No URL in response");
    }
    
    console.log("Image uploaded to Cloudinary via backend:", uploadData.url);
    return uploadData.url;
  } catch (error) {
    console.error("Backend proxy upload error:", error);
    throw new Error("Upload image failed. Please try again.");
  }
}
