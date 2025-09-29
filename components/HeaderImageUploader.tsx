"use client";

import React, { useState, useRef, useEffect } from "react";

interface HeaderImageUploaderProps {
  currentImage?: string;
  headerText?: string;
  onImageUploaded: (imageUrl: string) => void;
  onImageRemoved: () => void;
  onHeaderTextChanged: (text: string) => void;
}

const HeaderImageUploader: React.FC<HeaderImageUploaderProps> = ({ 
  currentImage, 
  headerText = '',
  onImageUploaded,
  onImageRemoved,
  onHeaderTextChanged
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [localHeaderText, setLocalHeaderText] = useState(headerText);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const tempUrl = URL.createObjectURL(file);
    setPreviewUrl(tempUrl);

    // Upload file
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      console.log("Uploading image to R2...");
      const response = await fetch("/api/r2api", {
        method: "POST",
        body: formData,
      });
      
      const data = await response.json();
      if (!response.ok) {
        console.error("Upload failed response:", data);
        throw new Error(data.error || "Failed to upload image");
      }
      
      console.log("Upload successful, URL:", data.url);
      onImageUploaded(data.url);
    } catch (error: any) {
      console.error("Upload error:", error);
      // More detailed error message
      alert(`Failed to upload image: ${error.message || "Please try again."}`);
    } finally {
      setUploading(false);
      // Clean up preview URL
      URL.revokeObjectURL(tempUrl);
      setPreviewUrl(null);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Update local state when prop changes
  useEffect(() => {
    setLocalHeaderText(headerText);
  }, [headerText]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    
    // Update local state immediately for responsive UI
    setLocalHeaderText(newText);
    
    // Debounce the API call
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    debounceTimeout.current = setTimeout(() => {
      onHeaderTextChanged(newText);
    }, 500); // Wait 500ms after typing stops before sending to API
  };

  return (
    <div className="header-image-uploader">
      <div className="header-text-input">
        <label htmlFor="header-text" className="text-input-label">
          Header Text
        </label>
        <input
          type="text"
          id="header-text"
          value={localHeaderText}
          onChange={handleTextChange}
          placeholder="Enter text to display on the header image"
          className="text-input"
        />
        <p className="text-input-hint">
          This text will be displayed centered on your header image
        </p>
      </div>
      
      {currentImage ? (
        <div className="current-header-image">
          <h4>Current Header Image</h4>
          <div className="image-with-text-preview">
            <img 
              src={currentImage} 
              alt="Current header" 
              className="header-image-preview"
            />
            {localHeaderText && (
              <div className="header-text-overlay">
                <span>{localHeaderText}</span>
              </div>
            )}
          </div>
          <button 
            onClick={onImageRemoved}
            className="btn clear-header-btn"
            disabled={uploading}
          >
            Remove Header Image
          </button>
        </div>
      ) : (
        <div className="upload-container">
          <h4>Upload Header Image</h4>
          <div className="upload-options">
            <div className="upload-buttons">
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange} 
                id="header-image-upload" 
                className="hidden" 
                accept="image/*"
                disabled={uploading}
              />
              <label 
                htmlFor="header-image-upload" 
                className={`btn upload-btn ${uploading ? 'disabled' : ''}`}
              >
                <i className="fas fa-upload mr-2"></i>
                {uploading ? 'Uploading...' : 'Upload Image'}
              </label>
            </div>
            
            <p className="upload-hint">
              For best results, use a landscape image with a 16:9 aspect ratio
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeaderImageUploader;