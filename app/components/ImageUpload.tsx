"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { storage } from '../../src/firebase';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';

interface ImageUploadProps {
  onImageSelect: (imageUrl: string, fileName: string) => void;
  onUploadStart: () => void;
  onUploadComplete: () => void;
  onUploadError: (error: string) => void;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function ImageUpload({ 
  onImageSelect, 
  onUploadStart, 
  onUploadComplete, 
  onUploadError 
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const uploadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timers on component unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (uploadTimeoutRef.current) clearTimeout(uploadTimeoutRef.current);
    };
  }, []);

  // Calculate initial crop area for 4:5 aspect ratio
  const calculateInitialCrop = useCallback((imageWidth: number, imageHeight: number): CropArea => {
    const targetRatio = 4 / 5; // 4:5 aspect ratio
    const imageRatio = imageWidth / imageHeight;

    let cropWidth, cropHeight, cropX, cropY;

    if (imageRatio > targetRatio) {
      // Image is wider than target ratio, crop width
      cropHeight = imageHeight;
      cropWidth = imageHeight * targetRatio;
      cropX = (imageWidth - cropWidth) / 2;
      cropY = 0;
    } else {
      // Image is taller than target ratio, crop height
      cropWidth = imageWidth;
      cropHeight = imageWidth / targetRatio;
      cropX = 0;
      cropY = (imageHeight - cropHeight) / 2;
    }

    return { x: cropX, y: cropY, width: cropWidth, height: cropHeight };
  }, []);

  // Crop image to canvas
  const cropImageToCanvas = useCallback((image: HTMLImageElement, cropArea: CropArea): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        reject(new Error('Canvas not available'));
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      // Set canvas dimensions to 4:5 ratio (e.g., 800x1000 for high quality)
      const outputWidth = 800;
      const outputHeight = 1000;
      canvas.width = outputWidth;
      canvas.height = outputHeight;

      // Clear canvas
      ctx.clearRect(0, 0, outputWidth, outputHeight);

      // Draw cropped image
      ctx.drawImage(
        image,
        cropArea.x, cropArea.y, cropArea.width, cropArea.height, // Source
        0, 0, outputWidth, outputHeight // Destination
      );

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      }, 'image/jpeg', 0.9);
    });
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      onUploadError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      onUploadError('Image size must be less than 5MB');
      return;
    }

    // Set selected file and show crop modal
    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Load image to calculate initial crop area
    const img = new Image();
    img.onload = () => {
      const initialCrop = calculateInitialCrop(img.naturalWidth, img.naturalHeight);
      setCropArea(initialCrop);
      setShowCropModal(true);
    };
    img.src = url;

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropConfirm = async () => {
    if (!selectedFile || !imageRef.current) return;

    try {
      setIsUploading(true);
      onUploadStart();
      setShowCropModal(false);
      setUploadProgress(10);

      console.log('Starting cropped image upload:', selectedFile.name);

      // Simulate progress for better UX
      let currentProgress = 10;
      
      const simulateProgress = () => {
        progressIntervalRef.current = setInterval(() => {
          currentProgress += Math.random() * 8;
          if (currentProgress > 85) currentProgress = 85;
          setUploadProgress(currentProgress);
        }, 300);
      };

      // Set upload timeout (30 seconds)
      uploadTimeoutRef.current = setTimeout(() => {
        console.error('Upload timeout after 30 seconds');
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        throw new Error('Upload timeout - please try again with a smaller image');
      }, 30000);

      simulateProgress();

      // Crop the image
      setUploadProgress(20);
      const croppedBlob = await cropImageToCanvas(imageRef.current, cropArea);
      setUploadProgress(30);
      
      // Create a new file from the cropped blob
      const croppedFile = new File([croppedBlob], selectedFile.name, {
        type: 'image/jpeg',
        lastModified: Date.now()
      });

      setUploadProgress(40);

      // Create a unique filename
      const timestamp = Date.now();
      const fileName = `profile-pictures/${timestamp}-${selectedFile.name}`;
      const storageRef = ref(storage, fileName);

      // Try direct upload first
      try {
        console.log('Attempting direct upload to Firebase Storage...');
        setUploadProgress(50);
        
        const snapshot = await uploadBytes(storageRef, croppedFile);
        setUploadProgress(80);
        
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log('Direct upload successful! Download URL:', downloadURL);
        
        setUploadProgress(100);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        if (uploadTimeoutRef.current) {
          clearTimeout(uploadTimeoutRef.current);
          uploadTimeoutRef.current = null;
        }
        
        // Small delay for user to see 100%
        setTimeout(() => {
          onImageSelect(downloadURL, selectedFile.name);
          onUploadComplete();
        }, 500);
        
      } catch (uploadError: any) {
        console.error('Direct upload failed:', uploadError);
        
        // Check if it's a CORS error
        const isCorsError = uploadError?.message?.includes('CORS') || 
                           uploadError?.code === 'storage/unauthorized' ||
                           uploadError?.message?.includes('Access-Control-Allow-Origin');
        
        if (isCorsError) {
          console.error('CORS error detected. Please configure Firebase Storage CORS settings.');
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          if (uploadTimeoutRef.current) {
            clearTimeout(uploadTimeoutRef.current);
            uploadTimeoutRef.current = null;
          }
          throw new Error('CORS configuration issue. Please contact support or check Firebase Storage settings.');
        }
        
        // Fallback: Use base64 as data URL
        console.log('Using base64 fallback due to upload error...');
        setUploadProgress(70);
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64String = e.target?.result as string;
          console.log('Base64 fallback successful');
          
          setUploadProgress(100);
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          if (uploadTimeoutRef.current) {
            clearTimeout(uploadTimeoutRef.current);
            uploadTimeoutRef.current = null;
          }
          
          setTimeout(() => {
            onImageSelect(base64String, selectedFile.name);
            onUploadComplete();
          }, 500);
        };
        reader.onerror = () => {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          if (uploadTimeoutRef.current) {
            clearTimeout(uploadTimeoutRef.current);
            uploadTimeoutRef.current = null;
          }
          throw new Error('Failed to process image. Please try again.');
        };
        reader.readAsDataURL(croppedFile);
      }

    } catch (error) {
      console.error('Error uploading cropped image:', error);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (uploadTimeoutRef.current) {
        clearTimeout(uploadTimeoutRef.current);
        uploadTimeoutRef.current = null;
      }
      onUploadError(`Failed to upload image: ${(error as any).message || 'Please try again.'}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      handleCropCancel();
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
    setCropArea({ x: 0, y: 0, width: 0, height: 0 });
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Mouse/touch handlers for crop area dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = imageRef.current.naturalWidth / rect.width;
    const scaleY = imageRef.current.naturalHeight / rect.height;

    const deltaX = (e.clientX - dragStart.x) * scaleX;
    const deltaY = (e.clientY - dragStart.y) * scaleY;

    setCropArea(prev => {
      const newX = Math.max(0, Math.min(prev.x + deltaX, imageRef.current!.naturalWidth - prev.width));
      const newY = Math.max(0, Math.min(prev.y + deltaY, imageRef.current!.naturalHeight - prev.height));
      return { ...prev, x: newX, y: newY };
    });

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <>
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
        
        <button
          onClick={handleButtonClick}
          disabled={isUploading}
          className="p-2 text-gray-500 hover:text-teal-500 hover:bg-gray-100 dark:hover:bg-midnight-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative"
          title="Upload image (4:5 ratio)"
        >
          {isUploading ? (
            <div className="w-5 h-5 relative flex items-center justify-center">
              {/* Circular Progress Ring */}
              <svg className="w-5 h-5 transform -rotate-90" viewBox="0 0 20 20">
                {/* Background circle */}
                <circle
                  cx="10"
                  cy="10"
                  r="8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-300 opacity-30"
                />
                {/* Progress circle */}
                <circle
                  cx="10"
                  cy="10"
                  r="8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="text-teal-500"
                  strokeDasharray={`${2 * Math.PI * 8}`}
                  strokeDashoffset={`${2 * Math.PI * 8 * (1 - uploadProgress / 100)}`}
                  style={{
                    transition: 'stroke-dashoffset 0.3s ease-in-out'
                  }}
                />
              </svg>
              {/* Percentage text */}
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-teal-500">
                {Math.round(uploadProgress)}
              </span>
            </div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
          )}
        </button>

        {/* Modern Upload Progress Modal */}
        {isUploading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-midnight-900 rounded-2xl p-8 shadow-2xl border border-gray-200 dark:border-midnight-700 max-w-sm w-full mx-4">
              <div className="text-center">
                {/* Large Circular Progress */}
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-gray-200 dark:text-midnight-700"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeLinecap="round"
                      className="text-teal-500"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - uploadProgress / 100)}`}
                      style={{
                        transition: 'stroke-dashoffset 0.5s ease-in-out'
                      }}
                    />
                  </svg>
                  {/* Percentage in center */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {Math.round(uploadProgress)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upload Status */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Uploading Image
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {uploadProgress < 50 ? 'Preparing image...' : 
                   uploadProgress < 90 ? 'Uploading to cloud...' : 'Almost done...'}
                </p>

                {/* Progress Bar (backup visual) */}
                <div className="w-full bg-gray-200 dark:bg-midnight-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-teal-500 to-teal-600 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                
                {/* Upload speed/size info */}
                <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Processing...</span>
                    <span>{Math.round(uploadProgress)}% complete</span>
                  </div>
                </div>

                {/* Cancel button */}
                <div className="mt-6">
                  <button
                    onClick={() => {
                      setIsUploading(false);
                      setUploadProgress(0);
                      handleCropCancel();
                      onUploadError('Upload cancelled by user');
                    }}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-midnight-800"
                  >
                    Cancel Upload
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Crop Modal */}
      {showCropModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-midnight-900 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Crop Image</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Adjust the crop area to 4:5 ratio (like Instagram)</p>
              </div>
              <button
                onClick={handleCropCancel}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col items-center">
              <div className="relative max-w-full max-h-full">
                <img
                  ref={imageRef}
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-full max-h-96 object-contain"
                  style={{ userSelect: 'none' }}
                />
                
                {/* Crop overlay */}
                <div
                  className="absolute border-2 border-teal-500 bg-teal-500/10 cursor-move"
                  style={{
                    left: `${(cropArea.x / (imageRef.current?.naturalWidth || 1)) * 100}%`,
                    top: `${(cropArea.y / (imageRef.current?.naturalHeight || 1)) * 100}%`,
                    width: `${(cropArea.width / (imageRef.current?.naturalWidth || 1)) * 100}%`,
                    height: `${(cropArea.height / (imageRef.current?.naturalHeight || 1)) * 100}%`,
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <div className="absolute inset-0 border border-white/50"></div>
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-6 text-xs text-teal-600 bg-white dark:bg-midnight-800 px-2 py-1 rounded">
                    4:5 Ratio
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-midnight-700">
              <button
                onClick={handleCropCancel}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-midnight-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-midnight-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCropConfirm}
                className="flex-1 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
              >
                Use Cropped Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </>
  );
}
