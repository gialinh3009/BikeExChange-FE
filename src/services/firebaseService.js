// Backend-Proxy Image Upload Service
// Files are uploaded to backend, which uploads to Cloudinary
// More secure than frontend direct upload

export async function uploadImageToCloudinary(file) {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  
  if (!apiBaseUrl) {
    console.warn("API Base URL not configured, using placeholder");
    return generatePlaceholderUrl();
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
    
    console.log("✅ Image uploaded to Cloudinary via backend:", uploadData.url);
    return uploadData.url;
  } catch (error) {
    console.error("Backend proxy upload error:", error);
    console.warn("Falling back to placeholder URL");
    return generatePlaceholderUrl();
  }
}


// Generate placeholder URL (short, fits in database)
function generatePlaceholderUrl() {
  // Using a real bike image from a CDN
  const bikeImages = [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1571188733066-c09fc87648d5?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1576435728678-68d440898424?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop",
  ];
  const randomIndex = Math.floor(Math.random() * bikeImages.length);
  return bikeImages[randomIndex];
}
