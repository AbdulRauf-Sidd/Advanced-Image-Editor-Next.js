"use client";

import React, { useRef, useState, useEffect } from "react";
import styles from './ImageEditor.module.css';

// Use in JSX:
<div className={styles.cameraFullscreen}></div>

interface Point {
  x: number;
  y: number;
}

interface Line {
  points: Point[];
  color: string;
  size: number;
  type: 'draw' | 'arrow';
  id: number; // Add unique ID for each line
  // Arrow-specific properties
  rotation?: number; // Rotation angle in radians
  scale?: number; // Scale factor for resizing
  center?: Point; // Center point for rotation and scaling
}

interface CropAction {
  type: 'crop';
  previousImage: HTMLImageElement;
  previousLines: Line[];
  previousActionHistory: any[];
  cropFrame: CropFrame;
  id: number;
}

type Action = Line | CropAction;

interface CropFrame {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ImageEditorProps {
  activeMode: 'none' | 'crop' | 'arrow';
  onCropStateChange: (hasFrame: boolean) => void;
  onUndo: () => void;
  onRedo: () => void;
  onImageChange?: (img: HTMLImageElement | null) => void;
  onEditedFile?: (file: File | null) => void;
  videoRef?: React.RefObject<HTMLVideoElement>;
  setIsCameraOpen: (val: boolean) => void;
  isCameraOpen: boolean;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ 
  activeMode, 
  onCropStateChange, 
  onUndo, 
  onRedo,
  onImageChange, 
  onEditedFile,
  videoRef,
  setIsCameraOpen,
  isCameraOpen
}) => {

  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // const videoRef = useRef<HTMLVideoElement>(null);
  
  const cameraCanvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [currentLine, setCurrentLine] = useState<Point[] | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingColor, setDrawingColor] = useState('#FF0000');
  const [brushSize, setBrushSize] = useState(3);
  
  // Camera state
  // const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  // Crop state
  const [cropFrame, setCropFrame] = useState<CropFrame | null>(null);
  const [isDraggingCrop, setIsDraggingCrop] = useState(false);
  const [dragCropOffset, setDragCropOffset] = useState({ x: 0, y: 0 });
  const [resizingCropHandle, setResizingCropHandle] = useState<string | null>(null);

  // Arrow interaction state - simplified without visible handles
  const [selectedArrowId, setSelectedArrowId] = useState<number | null>(null);
  const [hoveredArrowId, setHoveredArrowId] = useState<number | null>(null);
  const [isDraggingArrow, setIsDraggingArrow] = useState(false);
  const [isRotatingArrow, setIsRotatingArrow] = useState(false);
  const [isResizingArrow, setIsResizingArrow] = useState(false);
  const [dragArrowOffset, setDragArrowOffset] = useState({ x: 0, y: 0 });
  const [interactionMode, setInteractionMode] = useState<'move' | 'rotate' | 'resize' | null>(null);

  // Touch gesture state - simplified for better UX
  const [touchStartAngle, setTouchStartAngle] = useState<number | null>(null);
  const [touchStartArrowRotation, setTouchStartArrowRotation] = useState<number | null>(null);
  const [isTwoFingerTouch, setIsTwoFingerTouch] = useState(false);
  const [rotationCenter, setRotationCenter] = useState<Point | null>(null);
  const [lastTapTime, setLastTapTime] = useState<number>(0);

  // History for undo/redo - track individual actions
  const [actionHistory, setActionHistory] = useState<Action[]>([]);
  const [redoHistory, setRedoHistory] = useState<Action[]>([]);
  const [lineIdCounter, setLineIdCounter] = useState(0);

  const [isCameraFullscreen, setIsCameraFullscreen] = useState(false);
  // Add event listener for arrow color change
  useEffect(() => {
    const handleArrowColorChange = (e: CustomEvent) => {
      setDrawingColor(e.detail);
    };

    window.addEventListener('setArrowColor', handleArrowColorChange as EventListener);
    return () => {
      window.removeEventListener('setArrowColor', handleArrowColorChange as EventListener);
    };
  }, []);

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    
    if (e.touches.length === 2) {
      // Two-finger touch - simplified rotation gesture
      setIsTwoFingerTouch(true);
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      const angle = getAngle(touch1, touch2);
      const center = getTouchCenter(touch1, touch2, rect);
      
      setTouchStartAngle(angle);
      setRotationCenter(center);
      
      // If there's a selected arrow, enable rotation immediately
      if (selectedArrowId !== null) {
        const selectedArrow = lines.find(line => line.id === selectedArrowId);
        if (selectedArrow) {
          setTouchStartArrowRotation(selectedArrow.rotation || 0);
          setIsRotatingArrow(true);
        }
      }
    } else if (e.touches.length === 1) {
      // Single touch - simplified interaction
      const touch = e.touches[0];
      const mouseX = touch.clientX - rect.left;
      const mouseY = touch.clientY - rect.top;
      
      // Check for double-tap rotation (much easier for users)
      const currentTime = Date.now();
      const timeDiff = currentTime - lastTapTime;
      
      if (timeDiff < 300 && selectedArrowId !== null) { // Double tap within 300ms
        const clickedArrow = lines.find(line => 
          line.type === 'arrow' && line.id === selectedArrowId && isPointInArrow(line, { x: mouseX, y: mouseY })
        );
        
        if (clickedArrow) {
          // Rotate arrow by 15 degrees on double-tap
          const center = getArrowCenter(clickedArrow);
          const rotationAngle = Math.PI / 12; // 15 degrees
          
          setLines(prev => prev.map(line => 
            line.id === selectedArrowId 
              ? {
                  ...line,
                  rotation: (line.rotation || 0) + rotationAngle,
                  points: line.points.map(point => rotatePoint(point, center, rotationAngle))
                }
              : line
          ));
          setLastTapTime(0); // Reset to prevent triple-tap
          return;
        }
      }
      
      setLastTapTime(currentTime);
    
      // Create a mock mouse event for compatibility
      const mockEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        preventDefault: () => e.preventDefault(),
        // Add other required properties as needed
      } as unknown as React.MouseEvent<HTMLCanvasElement>;
      
      handleMouseDown(mockEvent);
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    
    if (e.touches.length === 2 && isTwoFingerTouch && isRotatingArrow && selectedArrowId !== null) {
      // Simplified two-finger rotation - much more responsive
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      const currentAngle = getAngle(touch1, touch2);
      
      if (touchStartAngle !== null && touchStartArrowRotation !== null && rotationCenter) {
        const angleDelta = currentAngle - touchStartAngle;
        
        // Update the selected arrow's rotation with smoother calculation
        setLines(prev => prev.map(line => 
          line.id === selectedArrowId 
            ? {
                ...line,
                rotation: (line.rotation || 0) + angleDelta * 0.5, // Reduce sensitivity for smoother rotation
                points: line.points.map(point => rotatePoint(point, rotationCenter, angleDelta * 0.5))
              }
            : line
        ));
        
        // Update the start angle for continuous rotation
        setTouchStartAngle(currentAngle);
      }
    } else if (e.touches.length === 1) {
      // Single touch - handle as mouse event
      const touch = e.touches[0];
      const mouseX = touch.clientX - rect.left;
      const mouseY = touch.clientY - rect.top;
    
      const mockEvent = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        preventDefault: () => e.preventDefault(),
      } as unknown as React.MouseEvent<HTMLCanvasElement>;
      
      handleMouseMove(mockEvent);
    }
  };
  
  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    // Reset simplified touch gesture states
    setIsTwoFingerTouch(false);
    setTouchStartAngle(null);
    setTouchStartArrowRotation(null);
    setRotationCenter(null);
    
    handleMouseUp();
  };

  const exportEditedFile = (): File | null => {
    let canvas = canvasRef.current;
    console.log(canvas);
    if (!canvas) {
      console.log('hi');
      if (!image) return null; // Need an image to create canvas
      
      console.log('Creating temporary canvas for export');
      canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      // Draw the image on the temporary canvas
      ctx.drawImage(image, 0, 0, image.width, image.height);
    } else {
      console.log('Using existing canvas for export');
    }
  
    const dataUrl = canvas.toDataURL("image/png"); // sync
    const byteString = atob(dataUrl.split(",")[1]);
    const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
  
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
  
    return new File([ab], "edited.png", { type: mimeString });
  };

  useEffect(() => {
    const file = exportEditedFile();
    onEditedFile?.(file);
  }, [image]);

  

  // Save current drawing action to history
  const saveAction = (action: Action) => {
    setActionHistory(prev => [...prev, action]);
    setRedoHistory([]); // Clear redo history when new action is performed
  };

  // Undo function - remove the last action
  const handleUndo = () => {
    if (actionHistory.length === 0) return;
    
    const lastAction = actionHistory[actionHistory.length - 1];
    
    // Move action to redo history
    setRedoHistory(prev => [...prev, lastAction]);
    
    if (lastAction.type === 'crop') {
      // Handle crop undo - restore previous image and lines
      setImage(lastAction.previousImage);
      setLines(lastAction.previousLines);
      setActionHistory(lastAction.previousActionHistory);
      onCropStateChange(false);
      if (onImageChange) onImageChange(lastAction.previousImage);
    } else {
      // Handle drawing undo - remove action from current lines
      setLines(prev => prev.filter(line => line.id !== lastAction.id));
    }
    
    // Remove from action history
    setActionHistory(prev => prev.slice(0, -1));
  };

  // Redo function - add back the last undone action
  const handleRedo = () => {
    if (redoHistory.length === 0) return;
    
    const lastRedoAction = redoHistory[redoHistory.length - 1];
    
    if (lastRedoAction.type === 'crop') {
      // Handle crop redo - reapply the crop
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx && lastRedoAction.previousImage && lastRedoAction.cropFrame && canvasRef.current) {
        // Reapply the crop operation using stored crop frame
        const imgAspect = lastRedoAction.previousImage.width / lastRedoAction.previousImage.height;
        const canvasWidth = canvasRef.current.width;
        const canvasHeight = canvasRef.current.height;
        const canvasAspect = canvasWidth / canvasHeight;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (imgAspect > canvasAspect) {
          drawWidth = canvasWidth;
          drawHeight = canvasWidth / imgAspect;
          offsetX = 0;
          offsetY = (canvasHeight - drawHeight) / 2;
        } else {
          drawHeight = canvasHeight;
          drawWidth = canvasHeight * imgAspect;
          offsetX = (canvasWidth - drawWidth) / 2;
          offsetY = 0;
        }
        
        // Calculate crop coordinates in original image space
        const scaleX = lastRedoAction.previousImage.width / drawWidth;
        const scaleY = lastRedoAction.previousImage.height / drawHeight;
        
        const cropX = (lastRedoAction.cropFrame.x - offsetX) * scaleX;
        const cropY = (lastRedoAction.cropFrame.y - offsetY) * scaleY;
        const cropW = lastRedoAction.cropFrame.w * scaleX;
        const cropH = lastRedoAction.cropFrame.h * scaleY;
        
        // Ensure crop coordinates are within image bounds
        const finalCropX = Math.max(0, Math.min(cropX, lastRedoAction.previousImage.width));
        const finalCropY = Math.max(0, Math.min(cropY, lastRedoAction.previousImage.height));
        const finalCropW = Math.min(cropW, lastRedoAction.previousImage.width - finalCropX);
        const finalCropH = Math.min(cropH, lastRedoAction.previousImage.height - finalCropY);
        
        // Create new canvas with cropped dimensions
        canvas.width = finalCropW;
        canvas.height = finalCropH;
        
        // Draw cropped portion
        ctx.drawImage(
          lastRedoAction.previousImage,
          finalCropX, finalCropY, finalCropW, finalCropH,
          0, 0, finalCropW, finalCropH
        );
        
        // Create new image from cropped canvas
        const croppedImage = new Image();
        croppedImage.onload = () => {
          setImage(croppedImage);
          setCropFrame(null);
          setLines([]);
          onCropStateChange(false);
          if (onImageChange) onImageChange(croppedImage);
        };
        croppedImage.src = canvas.toDataURL();
      }
    } else {
      // Handle drawing redo - add action back to current lines
      setLines(prev => [...prev, lastRedoAction]);
    }
    
    // Move action back to action history
    setActionHistory(prev => [...prev, lastRedoAction]);
    
    // Remove from redo history
    setRedoHistory(prev => prev.slice(0, -1));
  };

  // Apply crop function
  const applyCrop = () => {
    if (!cropFrame || !image || !canvasRef.current) return;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Get actual canvas dimensions
    const canvasWidth = canvasRef.current.width;
    const canvasHeight = canvasRef.current.height;
    
    // Calculate the actual crop dimensions based on image scaling
    const imgAspect = image.width / image.height;
    const canvasAspect = canvasWidth / canvasHeight;
    
    let drawWidth, drawHeight, offsetX, offsetY;
    
    if (imgAspect > canvasAspect) {
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / imgAspect;
      offsetX = 0;
      offsetY = (canvasHeight - drawHeight) / 2;
    } else {
      drawHeight = canvasHeight;
      drawWidth = canvasHeight * imgAspect;
      offsetX = (canvasWidth - drawWidth) / 2;
      offsetY = 0;
    }
    
    // Calculate crop coordinates in original image space
    const scaleX = image.width / drawWidth;
    const scaleY = image.height / drawHeight;
    
    const cropX = (cropFrame.x - offsetX) * scaleX;
    const cropY = (cropFrame.y - offsetY) * scaleY;
    const cropW = cropFrame.w * scaleX;
    const cropH = cropFrame.h * scaleY;
    
    // Ensure crop coordinates are within image bounds
    const finalCropX = Math.max(0, Math.min(cropX, image.width));
    const finalCropY = Math.max(0, Math.min(cropY, image.height));
    const finalCropW = Math.min(cropW, image.width - finalCropX);
    const finalCropH = Math.min(cropH, image.height - finalCropY);
    
    // Create new canvas with cropped dimensions
    canvas.width = finalCropW;
    canvas.height = finalCropH;
    
    // Draw cropped portion
    ctx.drawImage(
      image,
      finalCropX, finalCropY, finalCropW, finalCropH,
      0, 0, finalCropW, finalCropH
    );
    
    // Create new image from cropped canvas
    const croppedImage = new Image();
    croppedImage.onload = () => {
      // Save current state for undo
      const cropAction: CropAction = {
        type: 'crop',
        previousImage: image,
        previousLines: [...lines],
        previousActionHistory: [...actionHistory],
        cropFrame: cropFrame, // Store the crop frame for redo
        id: lineIdCounter
      };
      
      // Increment ID counter
      setLineIdCounter(prev => prev + 1);
      
      // Save to action history
      setActionHistory(prev => [...prev, cropAction]);
      setRedoHistory([]); // Clear redo history when new action is performed
      
      // Update image and clear drawing history
      setImage(croppedImage);
      setCropFrame(null);
      setLines([]);
      onCropStateChange(false);

      const file = exportEditedFile();
      onEditedFile?.(file);
      onImageChange?.(croppedImage);
    };
    croppedImage.src = canvas.toDataURL();
  };

  // Load uploaded image
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      
      img.onload = () => {
        setImage(img);
        // Clear all drawing history when new image is uploaded
        setLines([]);
        setCurrentLine(null);
        setCropFrame(null);
        setActionHistory([]);
        setRedoHistory([]);
        onCropStateChange(false);

        // const file = exportEditedFile();
        // onEditedFile?.(file);
      };
      img.src = event.target?.result as string;
      onImageChange?.(img);
    };
    reader.readAsDataURL(file);
  };

  // Camera functions
  const startCamera = async () => {
    try {
      // Stop any existing stream first
      // if (cameraStream) {
      //   cameraStream.getTracks().forEach(track => track.stop());
      // }

      // if (!videoRef?.current) {
      //   console.error('Video element not ready yet');
      //   return;
      // }

      setIsCameraFullscreen(true); // Enter fullscreen mode      

      console.log('Video ref:', videoRef?.current); // This should now work

      // const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
        // video: true
      });


      console.log(videoRef);
      
      
      if (videoRef?.current) {
        console.log('hello');
        videoRef.current.srcObject = stream;
        setCameraStream(stream);
        setIsCameraOpen(true);
        // setIsCameraFullscreen(true); // Enter fullscreen mode
        
        // Wait for video to be ready and play it
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(error => {
            console.error('Error playing video:', error);
          });
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please make sure you have granted camera permissions.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    if (videoRef?.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
    setIsCameraFullscreen(false); // Exit fullscreen mode
  };

  const captureImage = () => {
    if (videoRef?.current && cameraCanvasRef.current) {
      const video = videoRef.current;
      const canvas = cameraCanvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context && video.videoWidth > 0 && video.videoHeight > 0) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw the current video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Create image from canvas
        const img = new Image();
        img.onload = () => {
          setImage(img);
          setLines([]);
          setCurrentLine(null);
          setCropFrame(null);
          setActionHistory([]);
          setRedoHistory([]);
          onCropStateChange(false);
          
          if (onImageChange) onImageChange(img);
          
          // Stop camera after capturing
          stopCamera();
          
          // Export the file
          // const file = exportEditedFile();
          // onEditedFile?.(file);
        };
        img.src = canvas.toDataURL('image/jpeg', 0.9);
      }
    }
  };

  // Initialize crop frame when crop mode is activated
  useEffect(() => {
    if (activeMode === 'crop' && !cropFrame) {
      setCropFrame(null);
      onCropStateChange(false);
    } else if (activeMode !== 'crop') {
      setCropFrame(null);
      onCropStateChange(false);
    }
  }, [activeMode, cropFrame, onCropStateChange]);

  // Listen for custom events from action bar
  useEffect(() => {
    const handleUndoAction = () => {
      handleUndo();
    };

    const handleRedoAction = () => {
      handleRedo();
    };

    const handleApplyCrop = () => {
      if (cropFrame) {
        applyCrop();
      }
    };

    window.addEventListener('undoAction', handleUndoAction);
    window.addEventListener('redoAction', handleRedoAction);
    window.addEventListener('applyCrop', handleApplyCrop);

    return () => {
      window.removeEventListener('undoAction', handleUndoAction);
      window.removeEventListener('redoAction', handleRedoAction);
      window.removeEventListener('applyCrop', handleApplyCrop);
    };
  }, [actionHistory, redoHistory, cropFrame]);

  // Handle color change while preserving active mode
  const handleColorChange = (newColor: string) => {
    setDrawingColor(newColor);
  };

  // Mouse down handler
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (activeMode === 'crop') {
      if (cropFrame) {
        // Handle existing crop frame interaction
        const handle = getHandles(cropFrame).find(
          (h) => Math.abs(h.x - mouseX) < 6 && Math.abs(h.y - mouseY) < 6
        );
        if (handle) {
          setResizingCropHandle(handle.name);
          return;
        }
        if (
          mouseX > cropFrame.x &&
          mouseX < cropFrame.x + cropFrame.w &&
          mouseY > cropFrame.y &&
          mouseY < cropFrame.y + cropFrame.h
        ) {
          setIsDraggingCrop(true);
          setDragCropOffset({ x: mouseX - cropFrame.x, y: mouseY - cropFrame.y });
          return;
        }
      }
      // Start drawing new crop frame
      setCropFrame({ x: mouseX, y: mouseY, w: 0, h: 0 });
      setIsDrawing(true);
      return;
    } else if (activeMode === 'arrow') {
      // Check if clicking on an existing arrow
      const clickedArrow = lines.find(line => 
        line.type === 'arrow' && isPointInArrow(line, { x: mouseX, y: mouseY })
      );
      
      if (clickedArrow) {
        // Simply select the arrow and start moving it
        setSelectedArrowId(clickedArrow.id);
        setIsDraggingArrow(true);
        const center = getArrowCenter(clickedArrow);
        setDragArrowOffset({ x: mouseX - center.x, y: mouseY - center.y });
        setInteractionMode('move');
        return;
      } else {
        // Clicked on empty space - deselect arrow and start drawing new one
        setSelectedArrowId(null);
        setInteractionMode(null);
        setIsDrawing(true);
        setCurrentLine([{ x: mouseX, y: mouseY }]);
      }
    }
    // If activeMode is 'none', do nothing - no drawing allowed
  };

  // Mouse move handler
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (activeMode === 'crop' && cropFrame) {
      if (resizingCropHandle) {
        setCropFrame(prev => resizeObj(prev!, resizingCropHandle, mouseX, mouseY));
        return;
      }
      if (isDraggingCrop) {
        setCropFrame(prev => ({
          ...prev!,
          x: mouseX - dragCropOffset.x,
          y: mouseY - dragCropOffset.y,
        }));
        return;
      }
      // Update crop frame size while drawing
      if (isDrawing) {
        setCropFrame(prev => ({
          ...prev!,
          w: mouseX - prev!.x,
          h: mouseY - prev!.y,
        }));
        return;
      }
    } else if (activeMode === 'arrow') {
      if (isDraggingArrow && selectedArrowId !== null) {
        const selectedArrow = lines.find(line => line.id === selectedArrowId);
        if (selectedArrow) {
          // Check if user is trying to rotate (holding Shift key or moving in circular motion)
          const center = getArrowCenter(selectedArrow);
          const distanceFromCenter = Math.sqrt(
            Math.pow(mouseX - center.x, 2) + Math.pow(mouseY - center.y, 2)
          );
          
          // If mouse is far from center, switch to rotation mode
          if (distanceFromCenter > 50 && interactionMode === 'move') {
            setInteractionMode('rotate');
            setIsRotatingArrow(true);
            setIsDraggingArrow(false);
          }
          
          if (interactionMode === 'move') {
            // Move the selected arrow
            const newCenter = { x: mouseX - dragArrowOffset.x, y: mouseY - dragArrowOffset.y };
            const oldCenter = getArrowCenter(selectedArrow);
            const deltaX = newCenter.x - oldCenter.x;
            const deltaY = newCenter.y - oldCenter.y;
            
            setLines(prev => prev.map(line => 
              line.id === selectedArrowId 
                ? {
                    ...line,
                    points: line.points.map(point => ({
                      x: point.x + deltaX,
                      y: point.y + deltaY
                    }))
                  }
                : line
            ));
          } else if (interactionMode === 'rotate') {
            // Rotate the selected arrow
            const angle = Math.atan2(mouseY - center.y, mouseX - center.x);
            setLines(prev => prev.map(line => 
              line.id === selectedArrowId 
                ? {
                    ...line,
                    rotation: angle,
                    points: line.points.map(point => rotatePoint(point, center, angle))
                  }
                : line
            ));
          }
        }
        return;
      }
      
      if (isDrawing) {
        // Only allow drawing when arrow mode is active
        setCurrentLine(prev => [...prev!, { x: mouseX, y: mouseY }]);
      } else {
        // Check for hover effects on arrows
        const hoveredArrow = lines.find(line => 
          line.type === 'arrow' && isPointInArrow(line, { x: mouseX, y: mouseY })
        );
        setHoveredArrowId(hoveredArrow ? hoveredArrow.id : null);
      }
    }
  };

  // Mouse up handler
  const handleMouseUp = () => {
    if (activeMode === 'crop' && isDrawing && cropFrame) {
      // Finalize crop frame
      if (cropFrame.w < 0) {
        setCropFrame(prev => ({
          ...prev!,
          x: prev!.x + prev!.w,
          w: Math.abs(prev!.w),
        }));
      }
      if (cropFrame.h < 0) {
        setCropFrame(prev => ({
          ...prev!,
          y: prev!.y + prev!.h,
          h: Math.abs(prev!.h),
        }));
      }
      setIsDrawing(false);
      onCropStateChange(true);
      return;
    }
    
    if (activeMode === 'arrow' && isDrawing && currentLine && currentLine.length > 1) {
      // Only process drawing when arrow mode is active
      // Create the line object with unique ID
      const lineType = 'arrow'; // Always arrow when in arrow mode
      const newLine: Line = {
        points: [...currentLine],
        color: drawingColor,
        size: brushSize,
        type: lineType,
        id: lineIdCounter,
        rotation: 0,
        scale: 1,
        center: getArrowCenter({ points: currentLine, color: drawingColor, size: brushSize, type: 'arrow', id: lineIdCounter })
      };
      
      // Increment ID counter
      setLineIdCounter(prev => prev + 1);
      
      // Add to lines array
      setLines(prev => [...prev, newLine]);
      
      // Automatically select the newly drawn arrow so user can immediately rotate/resize it
      setSelectedArrowId(newLine.id);
      
      // Save to action history
      saveAction(newLine);
      setCurrentLine(null);
      const file = exportEditedFile();
      onEditedFile?.(file);
    }
    
    // Reset all interaction states
    setIsDrawing(false);
    setIsDraggingCrop(false);
    setResizingCropHandle(null);
    setIsDraggingArrow(false);
    setIsRotatingArrow(false);
    setIsResizingArrow(false);
    setInteractionMode(null);
  };

  // Get resize handles for crop frame
  const getHandles = (obj: CropFrame) => {
    const { x, y, w, h } = obj;
    return [
      { name: "nw", x, y },
      { name: "n", x: x + w / 2, y },
      { name: "ne", x: x + w, y },
      { name: "e", x: x + w, y: y + h / 2 },
      { name: "se", x: x + w, y: y + h },
      { name: "s", x: x + w / 2, y: y + h },
      { name: "sw", x, y: y + h },
      { name: "w", x, y: y + h / 2 },
    ];
  };

  // Resize crop frame helper
  const resizeObj = (obj: CropFrame, handle: string, mx: number, my: number) => {
    let { x, y, w, h } = obj;
    switch (handle) {
      case "nw":
        w = w + (x - mx);
        h = h + (y - my);
        x = mx;
        y = my;
        break;
      case "n":
        h = h + (y - my);
        y = my;
        break;
      case "ne":
        w = mx - x;
        h = h + (y - my);
        y = my;
        break;
      case "e":
        w = mx - x;
        break;
      case "se":
        w = mx - x;
        h = my - y;
        break;
      case "s":
        h = my - y;
        break;
      case "sw":
        w = w + (x - mx);
        h = my - y;
        x = mx;
        break;
      case "w":
        w = w + (x - mx);
        x = mx;
        break;
    }
    return { ...obj, x, y, w, h };
  };

  // Arrow interaction helpers
  // These functions enable moveable, rotatable, and resizable arrows
  // - Click on an arrow to select it (shows handles)
  // - Drag the center handle to move the arrow
  // - Drag the green rotation handle to rotate the arrow
  // - Drag the yellow resize handles to change arrow size
  const getArrowBounds = (line: Line) => {
    if (line.points.length < 2) return null;
    const from = line.points[0];
    const to = line.points[line.points.length - 1];
    const minX = Math.min(from.x, to.x);
    const maxX = Math.max(from.x, to.x);
    const minY = Math.min(from.y, to.y);
    const maxY = Math.max(from.y, to.y);
    return { minX, maxX, minY, maxY, width: maxX - minX, height: maxY - minY };
  };

  const getArrowCenter = (line: Line) => {
    if (line.points.length < 2) return { x: 0, y: 0 };
    const from = line.points[0];
    const to = line.points[line.points.length - 1];
    return {
      x: (from.x + to.x) / 2,
      y: (from.y + to.y) / 2
    };
  };

  const isPointInArrow = (line: Line, point: Point) => {
    if (line.points.length < 2) return false;
    const from = line.points[0];
    const to = line.points[line.points.length - 1];
    
    // Calculate distance from point to line
    const A = point.x - from.x;
    const B = point.y - from.y;
    const C = to.x - from.x;
    const D = to.y - from.y;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    
    let xx, yy;
    if (param < 0) {
      xx = from.x;
      yy = from.y;
    } else if (param > 1) {
      xx = to.x;
      yy = to.y;
    } else {
      xx = from.x + param * C;
      yy = from.y + param * D;
    }
    
    const dx = point.x - xx;
    const dy = point.y - yy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Check if point is within arrow thickness
    const arrowThickness = Math.max(line.size * 4, 12);
    return distance <= arrowThickness + 10; // Add some padding for easier selection
  };

  const getArrowHandles = (line: Line) => {
    const bounds = getArrowBounds(line);
    if (!bounds) return [];
    
    const center = getArrowCenter(line);
    const handleSize = 8;
    
    return [
      { name: 'move', x: center.x, y: center.y, type: 'move' },
      { name: 'rotate', x: center.x, y: center.y - 40, type: 'rotate' }, // Made rotation handle bigger and further away
      { name: 'resize-start', x: bounds.minX, y: bounds.minY, type: 'resize' },
      { name: 'resize-end', x: bounds.maxX, y: bounds.maxY, type: 'resize' }
    ];
  };

  const rotatePoint = (point: Point, center: Point, angle: number) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    return {
      x: center.x + dx * cos - dy * sin,
      y: center.y + dx * sin + dy * cos
    };
  };

  const scalePoint = (point: Point, center: Point, scale: number) => {
    return {
      x: center.x + (point.x - center.x) * scale,
      y: center.y + (point.y - center.y) * scale
    };
  };

  // Touch gesture helpers
  const getDistance = (touch1: Touch, touch2: Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getAngle = (touch1: Touch, touch2: Touch) => {
    return Math.atan2(touch2.clientY - touch1.clientY, touch2.clientX - touch1.clientX);
  };

  const getTouchCenter = (touch1: Touch, touch2: Touch, rect: DOMRect) => {
    return {
      x: ((touch1.clientX + touch2.clientX) / 2) - rect.left,
      y: ((touch1.clientY + touch2.clientY) / 2) - rect.top
    };
  };

  // Draw arrow function
  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
    // Extra thick arrow dimensions
    const arrowThickness = Math.max(brushSize * 4, 12); // Much thicker - 4x brush size, minimum 12px
    const headlen = Math.max(arrowThickness * 2.5, 25); // Well-proportioned arrowhead for thick shaft
    const angle = Math.atan2(toY - fromY, toX - fromX);
    
    // Professional drawing settings
    ctx.strokeStyle = drawingColor;
    ctx.fillStyle = drawingColor;
    ctx.lineWidth = arrowThickness;
    ctx.lineCap = 'square'; // Clean, sharp line ends
    ctx.lineJoin = 'miter'; // Sharp, clean joins
    ctx.setLineDash([]); // Solid lines
    
    // Draw main arrow shaft with clean lines - stop well before the tip
    const shaftEndX = toX - headlen * 0.6 * Math.cos(angle);
    const shaftEndY = toY - headlen * 0.6 * Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(shaftEndX, shaftEndY);
    ctx.stroke();
    
    // Draw professional arrowhead - sharp corners, extending to the very tip
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 8), toY - headlen * Math.sin(angle - Math.PI / 8));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 8), toY - headlen * Math.sin(angle + Math.PI / 8));
    ctx.closePath();
    ctx.fill();
    
    // Add subtle outline for professional look
    ctx.strokeStyle = drawingColor;
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  

  // Draw everything on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (image) {
      // Fill the entire canvas with the image, maintaining aspect ratio
      const imgAspect = image.width / image.height;
      const canvasAspect = canvas.width / canvas.height;
      
      let drawWidth, drawHeight, offsetX, offsetY;
      
      if (imgAspect > canvasAspect) {
        // Image is wider than canvas - fit to width
        drawWidth = canvas.width;
        drawHeight = canvas.width / imgAspect;
        offsetX = 0;
        offsetY = (canvas.height - drawHeight) / 2;
      } else {
        // Image is taller than canvas - fit to height
        drawHeight = canvas.height;
        drawWidth = canvas.height * imgAspect;
        offsetX = (canvas.width - drawWidth) / 2;
        offsetY = 0;
      }
      
      // Fill background with light grey
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw the image
      ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    } else {
      // Show upload placeholder
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#666666';
      ctx.textAlign = 'center';
      ctx.font = '24px Arial';
      ctx.fillText('Upload Image here', canvas.width/2, canvas.height/2);
    }

    // Draw existing lines
    lines.forEach(line => {
      ctx.strokeStyle = line.color;
      ctx.lineWidth = line.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.fillStyle = line.color;
      
      if (line.type === 'draw') {
        ctx.beginPath();
        line.points.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
      } else if (line.type === 'arrow' && line.points.length >= 2) {
        const from = line.points[0];
        const to = line.points[line.points.length - 1];
        
        // Draw hover effect if this arrow is hovered
        if (hoveredArrowId === line.id && selectedArrowId !== line.id) {
          ctx.strokeStyle = line.color;
          ctx.lineWidth = line.size + 4;
          ctx.globalAlpha = 0.3;
          drawArrow(ctx, from.x, from.y, to.x, to.y);
          ctx.globalAlpha = 1.0;
        }
        
        // Draw the main arrow
        drawArrow(ctx, from.x, from.y, to.x, to.y);
        
        // Show subtle selection indicator (no handles, just a slight highlight)
        if (selectedArrowId === line.id) {
          // Draw a subtle outline around the selected arrow
          ctx.strokeStyle = 'rgba(0, 123, 255, 0.5)';
          ctx.lineWidth = line.size + 2;
          ctx.globalAlpha = 0.3;
          drawArrow(ctx, from.x, from.y, to.x, to.y);
          ctx.globalAlpha = 1.0;
          
          // Show two-finger rotation indicator
          if (isTwoFingerTouch && isRotatingArrow) {
            const center = getArrowCenter(line);
            ctx.fillStyle = 'rgba(40, 167, 69, 0.3)';
            ctx.strokeStyle = '#28a745';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(center.x, center.y, 30, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
            
            // Draw rotation arrows
            ctx.fillStyle = '#28a745';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('↻', center.x, center.y + 5);
          }
        }
      }
    });

    // Draw current line if drawing
    if (isDrawing && currentLine && currentLine.length > 0) {
      ctx.strokeStyle = drawingColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.fillStyle = drawingColor;
      
      // Always check the current activeMode for drawing current line
      if (activeMode === 'arrow' && currentLine.length >= 2) {
        const from = currentLine[0];
        const to = currentLine[currentLine.length - 1];
        drawArrow(ctx, from.x, from.y, to.x, to.y);
      } else {
        ctx.beginPath();
        currentLine.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
      }
    }

    // Draw crop frame
    if (activeMode === 'crop' && cropFrame) {
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 2;
      ctx.strokeRect(cropFrame.x, cropFrame.y, cropFrame.w, cropFrame.h);

      const handles = getHandles(cropFrame);
      ctx.fillStyle = '#FF0000';
      handles.forEach((h) => {
        ctx.beginPath();
        ctx.arc(h.x, h.y, 5, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  }, [image, lines, currentLine, isDrawing, drawingColor, brushSize, activeMode, cropFrame, selectedArrowId, hoveredArrowId, isDraggingArrow, isRotatingArrow, isResizingArrow, isTwoFingerTouch, rotationCenter, interactionMode]);

  const getCursor = () => {
    if (activeMode === 'crop') {
      return 'crosshair';
    } else if (activeMode === 'arrow') {
      if (interactionMode === 'move') return 'grabbing';
      if (interactionMode === 'rotate') return 'grab';
      if (hoveredArrowId !== null) return 'pointer';
      return 'default';
    } else if (activeMode === 'none') {
      return 'default';
    }
    return 'default';
  };

  // if (isCameraOpen) {
  //   <div className="flex flex-col items-center space-y-2">
  //         <video ref={videoRef} className="rounded-lg border" playsInline />
  //         <button
  //           // onClick={takePicture}
  //           className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-md"
  //         >
  //           Take Picture
  //         </button>
  //   </div>
  // }

  return (
    <div className={styles.imageEditorSimple}>
      {/* Fullscreen Camera Overlay */}
      {isCameraFullscreen && (
      <div className={styles.cameraFullscreen}>
        {/* Video element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={styles.cameraVideo}
        />

        {/* Controls overlay - positioned absolutely on top of video */}
        <div className={styles.cameraControlsOverlay}>
          <button className={styles.captureBtnFullscreen} onClick={captureImage}>
            <div className={styles.captureCircle}></div>
          </button>
          <button className={styles.closeCameraBtn} onClick={stopCamera}>
            <i className="fas fa-times"></i>
          </button>

          {/* Camera flip button for mobile */}
          {/* <button className={styles.flipCameraBtn} onClick={toggleCamera}>
            <i className="fas fa-sync-alt"></i>
          </button> */}
        </div>
      </div>
    )}

      {/* Main Content */}
      <div className={styles.uploadContainer}>
        {!image && !isCameraFullscreen ? (
          <>
            <div className={styles.uploadInstructions}>
              Drag & drop your image here or click to browse
            </div>
            <div className={styles.buttonContainer}>
              <button className={styles.chooseImageBtn} onClick={() => fileInputRef.current?.click()}>
                Choose Image
              </button>
              <button className={styles.cameraBtn} onClick={startCamera}>
                <i className="fas fa-camera"></i> Take a Picture
              </button>
            </div>
          </>
        ) : image && !isCameraFullscreen ? (
          <div className={styles.imageDisplayArea}>
            <canvas
              ref={canvasRef}
              width={300}
              height={400}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ 
                cursor: getCursor(),
                // width: "500px",   // fills parent
                // height: "100%",  // fills parent
                // display: "block" 
              }}
            />
          </div>
        ) : null}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          style={{ display: 'none' }}
        />
        
        {/* Hidden canvas for camera capture */}
        <canvas ref={cameraCanvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default ImageEditor;