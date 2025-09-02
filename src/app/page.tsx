"use client";

import { useRouter } from 'next/navigation';
import ImageEditor from 'components/ImageEditor';
import { useState, useRef, useEffect } from 'react';
import { useAnalysisStore } from '@/lib/store';


export default function Home() {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [activeMode, setActiveMode] = useState<'none' | 'crop' | 'arrow'>('none');
  const [hasCropFrame, setHasCropFrame] = useState(false);
  const [showDrawingDropdown, setShowDrawingDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');
  const drawingDropdownRef = useRef<HTMLDivElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const [currentImage, setCurrentImage] = useState<HTMLImageElement | null>(null);
  const [editedFile, setEditedFile] = useState<File | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // const router = useRouter();
  const setAnalysisData = useAnalysisStore(state => state.setAnalysisData);

  // Location data
  const locations = ['USA', 'Pakistan', 'India', 'China'];

  
  // Filtered locations based on search
  const filteredLocations = locations.filter(location =>
    location.toLowerCase().includes(locationSearch.toLowerCase())
  );

  // Initialize speech recognition
  useEffect(() => {
    // Check if speech recognition is available
    const isSpeechRecognitionSupported = () => {
      return typeof window !== 'undefined' && 
             ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
    };

    setIsSpeechSupported(isSpeechRecognitionSupported());

    if (isSpeechRecognitionSupported()) {
      try {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        
        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          if (finalTranscript) {
            setTranscript(prev => prev + ' ' + finalTranscript);
            setDescription(prev => prev + ' ' + finalTranscript);
          }
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          
          // Show user-friendly error messages
          if (event.error === 'not-allowed') {
            alert('Please allow microphone access to use voice input.');
          } else if (event.error === 'no-speech') {
            alert('No speech detected. Please try speaking again.');
          } else if (event.error === 'audio-capture') {
            alert('Microphone not found. Please check your microphone connection.');
          }
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
        
        recognitionRef.current.onstart = () => {
          console.log('Speech recognition started');
        };
      } catch (error) {
        console.error('Failed to initialize speech recognition:', error);
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  

  // Toggle microphone
  const toggleMicrophone = () => {
    if (!isSpeechSupported) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }
    
    if (!recognitionRef.current) {
      // Try to initialize speech recognition if not already done
      try {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        
        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            }
          }
          if (finalTranscript) {
            setTranscript(prev => prev + ' ' + finalTranscript);
            setDescription(prev => prev + ' ' + finalTranscript);
          }
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            alert('Please allow microphone access to use voice input.');
          } else if (event.error === 'no-speech') {
            alert('No speech detected. Please try speaking again.');
          } else if (event.error === 'audio-capture') {
            alert('Microphone not found. Please check your microphone connection.');
          }
        };
        
        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
        
        recognitionRef.current.onstart = () => {
          console.log('Speech recognition started');
        };
      } catch (error) {
        console.error('Failed to initialize speech recognition:', error);
        alert('Failed to initialize speech recognition. Please try refreshing the page.');
        return;
      }
    }
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      // Add a small delay before clearing transcript to show final result
      setTimeout(() => {
        setTranscript('');
      }, 1000);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      setTranscript('');
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (drawingDropdownRef.current && !drawingDropdownRef.current.contains(event.target as Node)) {
        setShowDrawingDropdown(false);
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);



  const handleSubmit = async (e: React.FormEvent) => {

    const fileToDataURL = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    e.preventDefault();
    
    // Validate inputs
    if (!description.trim()) {
      setSubmitStatus('Please provide a description');
      return;
    }

    if (!selectedLocation) {
      setSubmitStatus('Please select a location');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('Processing image...');

    try {
      if (!editedFile) {
        throw new Error('Could not get image data from editor');
      }

      console.log(editedFile);
    
      setSubmitStatus('Sending to API...');
    
      // ✅ Prepare FormData instead of JSON
      const formData = new FormData();
      formData.append('image', editedFile); // "image" will be req.formData().get("image")
      formData.append('description', `${description} | Location: ${selectedLocation}`);
      formData.append('location', selectedLocation);
    
      // ✅ Send to API endpoint as multipart/form-data
      const response = await fetch('/api/llm/analyze-image', {
        method: 'POST',
        body: formData,
      });
    
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Server responded with ${response.status}`);
      }
    
      const result = await response.json();
      console.log(result);
      setSubmitStatus('Success! Analysis completed.');

      const imageDataUrl = await fileToDataURL(editedFile);
      
      // ✅ Store all data in global state
      setAnalysisData({
        image: imageDataUrl, // Store as data URL
        description,
        location: selectedLocation,
        analysisResult: result
      });
      
      // ✅ Navigate to results page
      router.push('/property-report');
      
    } catch (error: any) {
      console.error('Submission error:', error);
      setSubmitStatus(`Error: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActionClick = (mode: 'none' | 'crop' | 'arrow') => {
    if (mode === 'arrow') {
      setShowDrawingDropdown(!showDrawingDropdown);
      setActiveMode(activeMode === 'arrow' ? 'none' : 'arrow');
    } else {
      setShowDrawingDropdown(false);
      setActiveMode(activeMode === mode ? 'none' : mode);
    }
  };

  const handleUndo = () => {
    console.log('Undo clicked');
    // Dispatch custom event for ImageEditor to handle undo
    const event = new CustomEvent('undoAction');
    window.dispatchEvent(event);
  };

  const handleRedo = () => {
    console.log('Redo clicked');
    // Dispatch custom event for ImageEditor to handle redo
    const event = new CustomEvent('redoAction');
    window.dispatchEvent(event);
  };

  const handleCropStateChange = (hasFrame: boolean) => {
    // setCropState(newCropState);
    setHasCropFrame(hasFrame);
  };

  // Arrow color options
  const arrowColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#800080', '#000000', '#FFFFFF'];

  if (isSubmitting) {
    return (
      <div style={{ position: "relative", display: "inline-block" }}>
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "rgba(255,255,255,0.7)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 999,
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                border: "5px solid #e5e7eb",
                borderTop: "5px solid #2563eb",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            {/* Inline keyframes */}
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* First Heading */}
      <div className="heading-section">
        <div className="heading-content">
          <i className="fas fa-image heading-icon"></i>
          <h1>Advanced Image Editor</h1>
          <p>Edit your images with drawing and cropping tools</p>
        </div>
      </div>

              {/* Action Options Bar */}
        <div className="action-bar">
          <button className="action-btn back-btn" onClick={() => router.back()}>
            <i className="fas fa-arrow-left"></i>
            {/* <span className="btn-text">Back</span> */}
          </button>

          <button className="action-btn undo-btn" onClick={handleUndo}>
            <i className="fas fa-undo"></i>
            {/* <span className="btn-text">Undo</span> */}
          </button>
          <button className="action-btn redo-btn" onClick={handleRedo}>
            <i className="fas fa-redo"></i>
            {/* <span className="btn-text">Redo</span> */}
          </button>
        <button 
          className={`action-btn crop-btn ${activeMode === 'crop' ? 'active' : ''}`}
          onClick={() => {
            if (activeMode === 'crop' && hasCropFrame) {
              const event = new CustomEvent('applyCrop');
              window.dispatchEvent(event);
            } else {
              handleActionClick('crop');
            }
          }}
        >
          <i className="fas fa-crop-alt"></i>
          <span className="btn-text">
            {activeMode === 'crop' 
              ? (hasCropFrame ? 'Apply' : '') 
              : ''
            }
          </span>
        </button>
        
        {/* Arrow button with dropdown */}
        <div className="arrow-button-container" ref={drawingDropdownRef}>
          <button 
            className={`action-btn arrow-btn ${activeMode === 'arrow' ? 'active' : ''}`}
            onClick={() => handleActionClick('arrow')}
          >
            <i className="fas fa-pencil-alt"></i>
            <span className="btn-text">{activeMode === 'arrow' ? '' : ''}</span>
          </button>
          
          {showDrawingDropdown && (
            <div className="arrow-dropdown">
              <div className="arrow-dropdown-header">
                <span>Select Drawing Color</span>
              </div>
              <div className="arrow-color-options">
                {arrowColors.map(color => (
                  <div 
                    key={color}
                    className="arrow-color-option"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      // Set the arrow color in the ImageEditor
                      const event = new CustomEvent('setArrowColor', { detail: color });
                      window.dispatchEvent(event);
                      setShowDrawingDropdown(false);
                    }}
                  ></div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Upload Area */}
      <div className="image-upload-area">
        <ImageEditor 
          activeMode={activeMode} 
          onCropStateChange={handleCropStateChange}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onImageChange={setCurrentImage}
          onEditedFile={setEditedFile}
          videoRef={videoRef}
          setIsCameraOpen={setIsCameraOpen}
          isCameraOpen={isCameraOpen}
        />
      </div>

      {/* Second Heading */}
      <div className="heading-section">
        <div className="heading-content">
          <i className="fas fa-edit heading-icon"></i>
          <h2>Image Description</h2>
          <p>Add details about your edited image</p>
        </div>
      </div>

      {/* Description Box */}
      <div className="description-box">
        <textarea
          placeholder="Describe your edited image here..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Submit Section */}
      <div className="submit-section">
        <div className="submit-controls">
          {/* Location Button with Dropdown */}
          <div className="location-button-container">
            <button 
              className="location-btn"
              onClick={() => setShowLocationDropdown(!showLocationDropdown)}
            >
              <i className="fas fa-map-marker-alt"></i>
              <span>{selectedLocation || 'Location'}</span>
              <i className={`fas fa-chevron-down ${showLocationDropdown ? 'rotate' : ''}`}></i>
            </button>
            
            {showLocationDropdown && (
              <div className="location-dropdown" ref={locationDropdownRef}>
                <div className="location-search-container">
                  <input
                    type="text"
                    placeholder="Search location..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    className="location-search-input"
                  />
                </div>
                <div className="location-options">
                  {filteredLocations.map(location => (
                    <div 
                      key={location}
                      className={`location-option ${selectedLocation === location ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedLocation(location);
                        setShowLocationDropdown(false);
                        setLocationSearch('');
                      }}
                    >
                      <i className="fas fa-map-marker-alt"></i>
                      <span>{location}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Microphone Button */}
          <div className="mic-container">
            <button 
              className={`mic-btn ${isListening ? 'listening' : ''}`}
              onClick={toggleMicrophone}
              title={isListening ? 'Click to stop recording' : 'Click to start voice recording'}
            >
              <i className={`fas ${isListening ? 'fa-stop' : 'fa-microphone'}`}></i>
              <span className="mic-text">
                {isListening ? 'Stop' : 'Voice'}
              </span>
            </button>
            {isListening && (
              <div className="mic-status">
                <div className="mic-indicator">
                  <span className="mic-dot"></span>
                  <span className="mic-dot"></span>
                  <span className="mic-dot"></span>
                </div>
                <span className="mic-status-text">Listening...</span>
              </div>
            )}
            {transcript && !isListening && (
              <div className="mic-transcript">
                <span className="mic-transcript-text">"{transcript}"</span>
                <button 
                  className="mic-clear-btn"
                  onClick={() => setTranscript('')}
                  title="Clear transcript"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            )}
            {!isSpeechSupported && (
              <div className="mic-unsupported">
                <span className="mic-unsupported-text">
                  <i className="fas fa-info-circle"></i>
                  Voice input not supported in this browser
                </span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button className="submit-btn" onClick={handleSubmit}>
            Submit Image
          </button>
        </div>
      </div>
    </div>
  );
}
