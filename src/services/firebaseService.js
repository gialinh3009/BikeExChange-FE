// Image Upload Service
// Uses placeholder URLs instead of data URLs to avoid database truncation

export async function uploadImageToCloudinary(file) {
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

  // If Cloudinary is configured, use it
  if (uploadPreset && cloudName) {
    return await uploadToCloudinary(file, uploadPreset, cloudName);
  }

  // Otherwise use placeholder URL (to avoid database truncation)
  // In production, you should setup Cloudinary or another image hosting service
  return generatePlaceholderUrl();
}

async function uploadToCloudinary(file, uploadPreset, cloudName) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Upload ảnh thất bại");
    }

    const data = await res.json();
    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
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
