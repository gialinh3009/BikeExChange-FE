import { useState } from 'react';
import toast from 'react-hot-toast';
import { uploadToCloudinary, getThumbnailUrl, deleteFromCloudinary } from '@/services/cloudinaryService';

interface UploadedImage {
  url: string;
  publicId: string;
  thumbnail: string;
  uploadedAt: Date;
}

export const BikeImageUploadExample = () => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  /**
   * Handle single file upload
   */
  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setIsLoading(true);
    try {
      const result = await uploadToCloudinary(file, 'bikes');
      
      const newImage: UploadedImage = {
        url: result.url,
        publicId: result.publicId,
        thumbnail: getThumbnailUrl(result.publicId),
        uploadedAt: result.uploadedAt,
      };

      setImages([...images, newImage]);
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle file input change
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  /**
   * Handle drag and drop
   */
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  /**
   * Delete image
   */
  const handleDeleteImage = async (image: UploadedImage) => {
    setIsLoading(true);
    try {
      await deleteFromCloudinary(image.publicId);
      setImages(images.filter(img => img.publicId !== image.publicId));
      toast.success('Image deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete image');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
      >
        <input
          type="file"
          id="fileInput"
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={isLoading}
        />

        <label htmlFor="fileInput" className="cursor-pointer">
          <div className="space-y-2">
            <div className="text-3xl">📷</div>
            <p className="font-semibold text-gray-900">
              Drag and drop your image here
            </p>
            <p className="text-sm text-gray-600">
              or click to select from your computer
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Supported formats: JPG, PNG, WebP (Max 5MB)
            </p>
          </div>
        </label>

        {isLoading && (
          <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin text-3xl mb-2">⏳</div>
              <p className="text-sm font-medium">Uploading...</p>
            </div>
          </div>
        )}
      </div>

      {/* Uploaded Images Gallery */}
      {images.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Uploaded Images ({images.length})
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image) => (
              <div
                key={image.publicId}
                className="relative group bg-white rounded-lg overflow-hidden shadow hover:shadow-lg transition"
              >
                {/* Thumbnail */}
                <div className="w-full aspect-square overflow-hidden bg-gray-100">
                  <img
                    src={image.thumbnail}
                    alt="Uploaded"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>

                {/* Overlay with actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <div className="space-x-3">
                    <button
                      onClick={() => window.open(image.url, '_blank')}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                      title="Open in new tab"
                    >
                      View
                    </button>

                    <button
                      onClick={() => handleDeleteImage(image)}
                      className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                      title="Delete image"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Image info */}
                <div className="p-3 bg-gray-50 border-t">
                  <p className="text-xs text-gray-600 truncate mb-1">
                    {image.publicId}
                  </p>
                  <p className="text-xs text-gray-500">
                    {image.uploadedAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Copy URLs for easy access */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Image URLs</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {images.map((image) => (
                <div key={image.publicId} className="space-y-1">
                  <p className="text-xs font-mono text-gray-700 break-all">
                    {image.url}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && !isLoading && (
        <div className="text-center py-8 text-gray-500">
          <p>No images uploaded yet</p>
        </div>
      )}
    </div>
  );
};

export default BikeImageUploadExample;
