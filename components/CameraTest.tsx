"use client";

import { useRef, useState, useEffect } from "react";
import styles from './CameraTest.module.css';

export default function CameraTest() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string>("");

  // Debug info
  useEffect(() => {
    console.log('Camera state:', {
      isCameraActive,
      hasPermission,
      videoRef: videoRef.current,
      stream: cameraStream,
      error
    });
  }, [isCameraActive, hasPermission, cameraStream, error]);

  const startCamera = async () => {
    try {
      setError("");
      console.log('Starting camera...');
      
      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported in this browser');
      }

      // Stop any existing stream
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      console.log('Camera stream obtained:', stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraStream(stream);
        setIsCameraActive(true);
        setHasPermission(true);
        
        // Wait for video to load and play it
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded, playing...');
          videoRef.current?.play().catch(playError => {
            console.error('Play error:', playError);
            setError(`Play failed: ${playError.message}`);
          });
        };

        videoRef.current.onplay = () => {
          console.log('Video is playing');
        };

        videoRef.current.onerror = (e) => {
          console.error('Video error:', e);
          setError('Video playback error');
        };
      }

    } catch (err: any) {
      console.error('Camera error:', err);
      setError(`Camera error: ${err.message || 'Unknown error'}`);
      setIsCameraActive(false);
      setHasPermission(false);
    }
  };

  const stopCamera = () => {
    console.log('Stopping camera...');
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Show the captured image
        const dataUrl = canvas.toDataURL('image/jpeg');
        console.log('Photo captured:', dataUrl.substring(0, 50) + '...');
        
        // You can display this image or do something with it
        alert('Photo captured! Check console for details.');
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  return (
    <div className={styles.container}>
      <h1>Camera Test</h1>
      
      {error && (
        <div className={styles.error}>
          Error: {error}
        </div>
      )}

      <div className={styles.debug}>
        <p>Camera Active: {isCameraActive ? 'Yes' : 'No'}</p>
        <p>Has Permission: {hasPermission ? 'Yes' : 'No'}</p>
        <p>Stream Active: {cameraStream?.active ? 'Yes' : 'No'}</p>
      </div>

      {isCameraActive ? (
        <div className={styles.cameraContainer}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={styles.cameraVideo}
            style={{ 
              width: '100%', 
              maxWidth: '500px', 
              height: '375px',
              backgroundColor: '#000',
              borderRadius: '8px'
            }}
          />
          <div className={styles.controls}>
            <button onClick={capturePhoto} className={styles.captureButton}>
              📸 Capture
            </button>
            <button onClick={stopCamera} className={styles.stopButton}>
              ❌ Stop
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.startContainer}>
          <button onClick={startCamera} className={styles.startButton}>
            🎥 Start Camera
          </button>
          <p className={styles.helpText}>
            Click to start camera. Make sure to allow camera permissions.
          </p>
        </div>
      )}

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <div className={styles.tips}>
        <h3>Debug Tips:</h3>
        <ul>
          <li>Check browser console for detailed logs</li>
          <li>Ensure HTTPS (camera doesn't work on HTTP)</li>
          <li>Allow camera permissions when prompted</li>
          <li>Refresh page if camera gets stuck</li>
          <li>Test on different browsers: Chrome, Safari, Firefox</li>
        </ul>
      </div>
    </div>
  );
}