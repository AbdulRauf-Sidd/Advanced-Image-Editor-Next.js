"use client";
import { useRef, useState } from "react";

export default function CameraPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Open camera
  const openCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      console.log(videoRef);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  // Take picture
  const takePicture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (!context) return;

      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;

      context.drawImage(videoRef.current, 0, 0);
      const imageData = canvasRef.current.toDataURL("image/png");
      setCapturedImage(imageData);

      // Stop camera after capture
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setIsCameraOpen(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-6 space-y-4">
      {!isCameraOpen && !capturedImage && (
        <button
          onClick={openCamera}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md"
        >
          Open Camera
        </button>
      )}

      {isCameraOpen && (
        <div className="flex flex-col items-center space-y-2">
          <video ref={videoRef} className="rounded-lg border" playsInline />
          <button
            onClick={takePicture}
            className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-md"
          >
            Take Picture
          </button>
        </div>
      )}

      {capturedImage && (
        <div className="flex flex-col items-center space-y-2">
          <img src={capturedImage} alt="Captured" className="rounded-lg border" />
          <button
            onClick={() => setCapturedImage(null)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg shadow-md"
          >
            Retake
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
