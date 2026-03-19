import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface CreateBikeFormData {
  title: string;
  description: string;
  brand_id: string;
  model: string;
  year: string;
  price_points: string;
  condition: string;
  bike_type: string;
  frame_size?: string;
  category_ids?: string[];
  images: File[];
}

export const CreateBikeWithImages = () => {
  const [formData, setFormData] = useState<CreateBikeFormData>({
    title: '',
    description: '',
    brand_id: '',
    model: '',
    year: new Date().getFullYear().toString(),
    price_points: '',
    condition: 'Good',
    bike_type: 'Road',
    frame_size: '',
    category_ids: [],
    images: [],
  });

  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [sellerInfo, setSellerInfo] = useState<any>(null);

  // Fetch seller info (address, shop name)
  const fetchSellerInfo = async () => {
    try {
      const response = await fetch('/api/upload/seller-info', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const result = await response.json();
      if (result.success) {
        setSellerInfo(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch seller info:', error);
    }
  };

  // Handle file selection
  const handleFileSelect = (files: FileList | File[]) => {
    const newFiles = Array.from(files);
    const validImages: File[] = [];
    const newPreviews: string[] = [];

    for (const file of newFiles) {
      if (file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) {
        validImages.push(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        toast.error(`File ${file.name} is invalid (must be image, max 5MB)`);
      }
    }

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...validImages],
    }));
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Remove image from preview
  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit form with images
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.images.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    setIsLoading(true);

    try {
      // Create FormData for multipart upload
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('brand_id', formData.brand_id);
      submitData.append('model', formData.model);
      submitData.append('year', formData.year);
      submitData.append('price_points', formData.price_points);
      submitData.append('condition', formData.condition);
      submitData.append('bike_type', formData.bike_type);
      if (formData.frame_size) submitData.append('frame_size', formData.frame_size);

      // Add images
      for (const image of formData.images) {
        submitData.append('images', image);
      }

      // Submit to backend
      const response = await fetch('/api/bikes/with-images', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: submitData,
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Bike created successfully with images and location!');
        // Reset form or redirect
        setFormData({
          title: '',
          description: '',
          brand_id: '',
          model: '',
          year: new Date().getFullYear().toString(),
          price_points: '',
          condition: 'Good',
          bike_type: 'Road',
          frame_size: '',
          category_ids: [],
          images: [],
        });
        setPreviewUrls([]);
        // Redirect to bike listing
        window.location.href = `/bikes/${result.data.id}`;
      } else {
        toast.error(result.message || 'Failed to create bike');
      }
    } catch (error) {
      console.error('Error creating bike:', error);
      toast.error('An error occurred while creating the bike');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      {/* Seller Info Display */}
      {sellerInfo && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-2">📍 Your Listing Location</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <p>
              <strong>Shop Name:</strong> {sellerInfo.seller_name}
            </p>
            <p>
              <strong>Address:</strong> {sellerInfo.seller_address}
            </p>
            <p>
              <strong>Phone:</strong> {sellerInfo.seller_phone}
            </p>
            <p className="text-xs text-blue-600 mt-2">
              ℹ️ This address will be used as the bike's location when listing
            </p>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-6">Create Bike Listing with Images</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block font-semibold mb-2">
            Title *
            <input
              type="text"
              required
              placeholder="e.g., Trek Émonda 2022"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full mt-1 p-2 border rounded"
            />
          </label>
        </div>

        {/* Description */}
        <div>
          <label className="block font-semibold mb-2">
            Description *
            <textarea
              required
              placeholder="Describe the bike's condition, features, history..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full mt-1 p-2 border rounded h-32"
            />
          </label>
        </div>

        {/* Brand & Model */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-2">
              Brand ID *
              <input
                type="number"
                required
                placeholder="1"
                value={formData.brand_id}
                onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
                className="w-full mt-1 p-2 border rounded"
              />
            </label>
          </div>
          <div>
            <label className="block font-semibold mb-2">
              Model *
              <input
                type="text"
                required
                placeholder="e.g., Émonda SL 6"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full mt-1 p-2 border rounded"
              />
            </label>
          </div>
        </div>

        {/* Year & Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-2">
              Year *
              <input
                type="number"
                required
                placeholder="2022"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full mt-1 p-2 border rounded"
              />
            </label>
          </div>
          <div>
            <label className="block font-semibold mb-2">
              Price (Points) *
              <input
                type="number"
                required
                placeholder="45000"
                value={formData.price_points}
                onChange={(e) => setFormData({ ...formData, price_points: e.target.value })}
                className="w-full mt-1 p-2 border rounded"
              />
            </label>
          </div>
        </div>

        {/* Condition & Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold mb-2">
              Condition *
              <select
                required
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="w-full mt-1 p-2 border rounded"
              >
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Excellent">Excellent</option>
              </select>
            </label>
          </div>
          <div>
            <label className="block font-semibold mb-2">
              Bike Type *
              <select
                required
                value={formData.bike_type}
                onChange={(e) => setFormData({ ...formData, bike_type: e.target.value })}
                className="w-full mt-1 p-2 border rounded"
              >
                <option value="Road">Road</option>
                <option value="Mountain">Mountain</option>
                <option value="Hybrid">Hybrid</option>
                <option value="City">City</option>
                <option value="Gravel">Gravel</option>
                <option value="BMX">BMX</option>
              </select>
            </label>
          </div>
        </div>

        {/* Frame Size */}
        <div>
          <label className="block font-semibold mb-2">
            Frame Size (optional)
            <input
              type="text"
              placeholder="e.g., 54cm, M, L"
              value={formData.frame_size || ''}
              onChange={(e) => setFormData({ ...formData, frame_size: e.target.value })}
              className="w-full mt-1 p-2 border rounded"
            />
          </label>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block font-semibold mb-2">
            Images * (At least 1 required)
          </label>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition cursor-pointer ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input
              type="file"
              id="fileInput"
              onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              accept="image/*"
              multiple
              className="hidden"
              disabled={isLoading}
            />

            <label htmlFor="fileInput" className="cursor-pointer">
              <div className="space-y-2">
                <div className="text-3xl">📷</div>
                <p className="font-semibold">Drag images here or click to select</p>
                <p className="text-sm text-gray-600">
                  JPG, PNG, WebP supported (Max 5MB each)
                </p>
              </div>
            </label>
          </div>

          {/* Image Previews */}
          {formData.images.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-3">
                Selected Images ({formData.images.length})
              </h3>
              <div className="grid grid-cols-4 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index + 1}`}
                      className="w-full aspect-square object-cover rounded border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition"
                    >
                      ✕
                    </button>
                    <p className="text-xs text-gray-600 mt-1 truncate">
                      {image.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || formData.images.length === 0}
          className={`w-full py-3 rounded font-bold transition ${
            isLoading || formData.images.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isLoading ? 'Creating bike...' : 'Create Bike Listing'}
        </button>
      </form>

      {/* Info Box */}
      <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h4 className="font-bold text-green-900 mb-2">✅ What happens next?</h4>
        <ul className="text-sm text-green-800 space-y-1">
          <li>✓ Your bike will be listed as ACTIVE</li>
          <li>✓ Images will be stored securely on Cloudinary</li>
          <li>✓ Your location ({sellerInfo?.seller_address}) will be set as the bike's location</li>
          <li>✓ Buyers can view your bike immediately</li>
          <li>✓ You can edit details anytime before it's sold</li>
        </ul>
      </div>
    </div>
  );
};

export default CreateBikeWithImages;