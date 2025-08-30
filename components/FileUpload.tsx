import React, { useRef } from "react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  id?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileSelect, 
  accept = "image/*", 
  id = "file-upload" 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please make sure you have granted camera permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw the current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            // Create a File object from the blob
            const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
            onFileSelect(file);
            
            // Stop camera after capturing
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
      <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
      <p className="text-gray-600 mb-4">Drag & drop your image here or click to browse</p>
      
      {/* Camera Section */}
      <div className="mb-4">
        <button
          onClick={startCamera}
          className="px-4 py-2 bg-green-500 text-white rounded-lg cursor-pointer hover:bg-green-600 transition-colors inline-block mr-2"
        >
          <i className="fas fa-camera mr-2"></i>
          Take a Picture
        </button>
        
        <input 
          type="file" 
          onChange={handleFileChange} 
          id={id} 
          className="hidden" 
          accept={accept}
        />
        <label htmlFor={id} className="px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600 transition-colors inline-block">
          Choose Image
        </label>
      </div>

      {/* Camera Preview */}
      {streamRef.current && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full max-w-md mx-auto rounded-lg mb-2"
          />
          <div className="flex gap-2 justify-center">
            <button
              onClick={captureImage}
              className="px-4 py-2 bg-red-500 text-white rounded-lg cursor-pointer hover:bg-red-600 transition-colors"
            >
              <i className="fas fa-camera-retro mr-2"></i>
              Capture
            </button>
            <button
              onClick={stopCamera}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
            >
              <i className="fas fa-times mr-2"></i>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default FileUpload;