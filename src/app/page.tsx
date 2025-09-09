"use client";

import { useRouter } from 'next/navigation';
import ImageEditor from 'components/ImageEditor';
import { useState, useRef, useEffect } from 'react';
import { useAnalysisStore } from '@/lib/store';


export default function Home() {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [activeMode, setActiveMode] = useState<'none' | 'crop' | 'arrow' | 'circle' | 'square'>('none');
  const [hasCropFrame, setHasCropFrame] = useState(false);
  const [showDrawingDropdown, setShowDrawingDropdown] = useState(false);
  const [showCircleDropdown, setShowCircleDropdown] = useState(false);
  const [showSquareDropdown, setShowSquareDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [showSubLocationDropdown, setShowSubLocationDropdown] = useState(false);
  const [subLocationSearch, setSubLocationSearch] = useState('');
  const [selectedSubLocation, setSelectedSubLocation] = useState<string>('');
  const [showTestDropdown, setShowTestDropdown] = useState(false);
  const [testSearch, setTestSearch] = useState('');
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');
  const drawingDropdownRef = useRef<HTMLDivElement>(null);
  const circleDropdownRef = useRef<HTMLDivElement>(null);
  const squareDropdownRef = useRef<HTMLDivElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const subLocationDropdownRef = useRef<HTMLDivElement>(null);
  const testDropdownRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const [currentImage, setCurrentImage] = useState<HTMLImageElement | null>(null);
  const [editedFile, setEditedFile] = useState<File | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // const router = useRouter();
  const setAnalysisData = useAnalysisStore(state => state.setAnalysisData);

  // Location data
  const locations = [
    'Wall & Ceiling Surfaces (Interior)',
    'Wall & Ceiling Surfaces (Exterior)',
    'Flooring',
    'Trim & Molding',
    'Doors & Windows',
    'Roofing (from exterior photos or attic views)',
    'Fixtures & Built-ins',
    'Visible Plumbing & HVAC (when exposed)',
    'Exterior Site Materials (from outdoor photos)'
  ];

  // Test data
  const testValues = ['V1', 'V2', 'V3', 'V4', 'V5', 'V6'];

  // Sub-location data
  const subLocations: { [key: string]: string[] } = {
    'Wall & Ceiling Surfaces (Interior)': [
      'Acoustic ceiling tiles',
      'Drywall',
      'Drop ceiling grid (T-bar)',
      'Exposed framing (after demo or in garages/attics)',
      'Plaster',
      'Shiplap / tongue-and-groove boards',
      'Tile (ceramic, porcelain, stone)',
      'Wood paneling'
    ],
    'Wall & Ceiling Surfaces (Exterior)': [
      'Brick veneer',
      'EIFS (synthetic stucco)',
      'Fiber cement siding (e.g., HardiePlank)',
      'Stone veneer',
      'Stucco',
      'Vinyl siding',
      'Wood siding (lap, shingle, T&G)'
    ],
    'Flooring': [
      'Carpet',
      'Concrete (finished or unfinished)',
      'Engineered wood',
      'Laminate',
      'Luxury vinyl plank (LVP)',
      'Porcelain / ceramic tile',
      'Sheet vinyl',
      'Solid hardwood',
      'Stone (travertine, marble, etc.)'
    ],
    'Trim & Molding': [
      'Baseboard (MDF, wood, PVC)',
      'Beadboard panels',
      'Casing (door/window trim)',
      'Chair rail / wainscoting',
      'Crown molding',
      'Quarter round / shoe molding'
    ],
    'Doors & Windows': [
      'Exterior doors (fiberglass, steel, wood)',
      'Glass (single or double-pane)',
      'Interior doors (hollow-core, solid wood)',
      'Window frames (vinyl, aluminum, wood)',
      'Window screens',
      'Window sills'
    ],
    'Roofing (from exterior photos or attic views)': [
      'Asphalt shingles',
      'Flat roofing (TPO, EPDM, torch-down)',
      'Metal roofing',
      'Roof vents / flashing',
      'Tile roofing (clay or concrete)'
    ],
    'Fixtures & Built-ins': [
      'Bathroom fixtures (toilet, tub, shower, sink)',
      'Cabinetry (wood, laminate)',
      'Countertops (stone, laminate, solid surface)',
      'Fireplace surrounds (brick, stone, tile, drywall)',
      'Light fixtures'
    ],
    'Visible Plumbing & HVAC (when exposed)': [
      'Ductwork (in attics, basements, crawlspaces)',
      'Exposed PEX or copper piping (under sinks, in walls)',
      'Grilles, diffusers, and return vents'
    ],
    'Exterior Site Materials (from outdoor photos)': [
      'Concrete flatwork (driveways, patios, walkways)',
      'Decking (wood, composite)',
      'Fencing (wood, vinyl, chain-link)',
      'Garage doors',
      'Retaining walls (block, wood, concrete)',
      'Soffit, fascia, and gutters'
    ]
  };

  
  // Filtered locations based on search
  const filteredLocations = locations.filter(location =>
    location.toLowerCase().includes(locationSearch.toLowerCase())
  );

  // Get current sub-locations based on selected location
  const currentSubLocations = selectedLocation ? subLocations[selectedLocation] || [] : [];
  
  // Filtered sub-locations based on search
  const filteredSubLocations = currentSubLocations.filter(subLocation =>
    subLocation.toLowerCase().includes(subLocationSearch.toLowerCase())
  );

  // Filtered test values based on search
  const filteredTestValues = testValues.filter(testValue =>
    testValue.toLowerCase().includes(testSearch.toLowerCase())
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
      const target = event.target as Node;
      
      if (drawingDropdownRef.current && !drawingDropdownRef.current.contains(target)) {
        setShowDrawingDropdown(false);
      }
      
      if (circleDropdownRef.current && !circleDropdownRef.current.contains(target)) {
        setShowCircleDropdown(false);
      }
      
      if (squareDropdownRef.current && !squareDropdownRef.current.contains(target)) {
        setShowSquareDropdown(false);
      }
      
      // Check if click is on location button or its dropdown
      const isLocationButtonClick = (event.target as Element)?.closest('.location-btn');
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(target) && !isLocationButtonClick) {
        setShowLocationDropdown(false);
      }
      
      // Check if click is on sub-location button or its dropdown
      const isSubLocationButtonClick = (event.target as Element)?.closest('.sub-location-btn');
      if (subLocationDropdownRef.current && !subLocationDropdownRef.current.contains(target) && !isSubLocationButtonClick) {
        setShowSubLocationDropdown(false);
      }
      
      // Check if click is on test button or its dropdown
      const isTestButtonClick = (event.target as Element)?.closest('.test-btn');
      if (testDropdownRef.current && !testDropdownRef.current.contains(target) && !isTestButtonClick) {
        setShowTestDropdown(false);
      }
    };

    document.addEventListener('mouseup', handleClickOutside);
    return () => {
      document.removeEventListener('mouseup', handleClickOutside);
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
    
    // Console log the selected location, sub-location, and test value
    console.log('=== FORM SUBMISSION ===');
    console.log('Selected Location:', selectedLocation);
    console.log('Selected Sub-Location:', selectedSubLocation);
    console.log('Selected Test:', selectedTest);
    console.log('Description:', description);
    console.log('=======================');
    
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
        formData.append('description', `${description} | Location: ${selectedLocation} - ${selectedSubLocation}`);
        formData.append('location', selectedLocation);
        if (selectedSubLocation) {
          formData.append('subLocation', selectedSubLocation);
        }
        if (selectedTest) {
          formData.append('version', selectedTest);
        }
    
      // ✅ Send to API endpoint as multipart/form-data
      const response = await fetch('/api/llm/analyze-image2', {
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
        location: `${selectedLocation} - ${selectedSubLocation}`,
        analysisResult: result
      });
      
      // ✅ Navigate to results page
      router.push('/property-report2');
      
    } catch (error: any) {
      console.error('Submission error:', error);
      setSubmitStatus(`Error: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActionClick = (mode: 'none' | 'crop' | 'arrow' | 'circle' | 'square') => {
    if (mode === 'arrow') {
      setShowDrawingDropdown(!showDrawingDropdown);
      setShowCircleDropdown(false);
      setShowSquareDropdown(false);
      setActiveMode(activeMode === 'arrow' ? 'none' : 'arrow');
    } else if (mode === 'circle') {
      setShowCircleDropdown(!showCircleDropdown);
      setShowDrawingDropdown(false);
      setShowSquareDropdown(false);
      setActiveMode(activeMode === 'circle' ? 'none' : 'circle');
    } else if (mode === 'square') {
      setShowSquareDropdown(!showSquareDropdown);
      setShowDrawingDropdown(false);
      setShowCircleDropdown(false);
      setActiveMode(activeMode === 'square' ? 'none' : 'square');
    } else {
      setShowDrawingDropdown(false);
      setShowCircleDropdown(false);
      setShowSquareDropdown(false);
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

  // Color options for all tools (arrow, circle, square)
  const arrowColors = ['#d63636', '#FF8C00', '#0066CC', '#800080']; // red, orange, blue, purple

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
              {/* <div className="arrow-dropdown-header">
                <span>Select Drawing Color</span>
              </div> */}
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

        {/* Circle button with dropdown */}
        <div className="circle-button-container" ref={circleDropdownRef}>
          <button 
            className={`action-btn circle-btn ${activeMode === 'circle' ? 'active' : ''}`}
            onClick={() => handleActionClick('circle')}
          >
            <i className="fas fa-circle"></i>
            <span className="btn-text">{activeMode === 'circle' ? '' : ''}</span>
          </button>
          
          {showCircleDropdown && (
            <div className="circle-dropdown">
              <div className="circle-color-options">
                {arrowColors.map(color => (
                  <div 
                    key={color}
                    className="circle-color-option"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      // Set the circle color in the ImageEditor
                      const event = new CustomEvent('setCircleColor', { detail: color });
                      window.dispatchEvent(event);
                      setShowCircleDropdown(false);
                    }}
                  ></div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Square button with dropdown */}
        <div className="square-button-container" ref={squareDropdownRef}>
          <button 
            className={`action-btn square-btn ${activeMode === 'square' ? 'active' : ''}`}
            onClick={() => handleActionClick('square')}
          >
            <i className="fas fa-square"></i>
            <span className="btn-text">{activeMode === 'square' ? '' : ''}</span>
          </button>
          
          {showSquareDropdown && (
            <div className="square-dropdown">
              <div className="square-color-options">
                {arrowColors.map(color => (
                  <div 
                    key={color}
                    className="square-color-option"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      // Set the square color in the ImageEditor
                      const event = new CustomEvent('setSquareColor', { detail: color });
                      window.dispatchEvent(event);
                      setShowSquareDropdown(false);
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
         
         {/* Voice Button in Description Box */}
         <div className="mic-container description-mic">
           <button 
             className={`mic-btn ${isListening ? 'listening' : ''}`}
             onClick={toggleMicrophone}
             title={isListening ? 'Click to stop recording' : 'Click to start voice recording'}
           >
             <i className={`fas ${isListening ? 'fa-stop' : 'fa-microphone'}`}></i>
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
              <div className="btn-content">
              <i className="fas fa-map-marker-alt"></i>
              <span>{selectedLocation || 'Location'}</span>
              </div>
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
                        setSelectedSubLocation(''); // Reset sub-location when main location changes
                        setSubLocationSearch(''); // Reset sub-location search
                        setShowSubLocationDropdown(false); // Hide sub-location dropdown initially
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

          {/* Sub-Location Dropdown */}
          <div className="location-button-container">
            <button 
              className={`location-btn sub-location-btn ${!selectedLocation ? 'disabled' : ''}`}
              onClick={() => selectedLocation && setShowSubLocationDropdown(!showSubLocationDropdown)}
              disabled={!selectedLocation}
            >
              <div className="btn-content">
                <i className="fas fa-layer-group"></i>
                <span>{selectedSubLocation || 'Sub-Location'}</span>
              </div>
              <i className={`fas fa-chevron-down ${showSubLocationDropdown ? 'rotate' : ''}`}></i>
            </button>
            
            {showSubLocationDropdown && selectedLocation && (
              <div className="location-dropdown sub-location-dropdown" ref={subLocationDropdownRef}>
                <div className="location-search-container">
                  <input
                    type="text"
                    placeholder="Search sub-location..."
                    value={subLocationSearch}
                    onChange={(e) => setSubLocationSearch(e.target.value)}
                    className="location-search-input"
                  />
                </div>
                <div className="location-options">
                  {filteredSubLocations.map(subLocation => (
                    <div 
                      key={subLocation}
                      className={`location-option ${selectedSubLocation === subLocation ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedSubLocation(subLocation);
                        setShowSubLocationDropdown(false);
                        setSubLocationSearch('');
                      }}
                    >
                      <i className="fas fa-layer-group"></i>
                      <span>{subLocation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Test Button with Dropdown */}
          <div className="location-button-container">
            <button 
              className="location-btn test-btn"
              onClick={() => setShowTestDropdown(!showTestDropdown)}
            >
              <div className="btn-content">
                <i className="fas fa-vial"></i>
                <span>{selectedTest || 'Test'}</span>
              </div>
              <i className={`fas fa-chevron-down ${showTestDropdown ? 'rotate' : ''}`}></i>
            </button>
            
            {showTestDropdown && (
              <div className="location-dropdown test-dropdown" ref={testDropdownRef}>
                <div className="location-search-container">
                  <input
                    type="text"
                    placeholder="Search test value..."
                    value={testSearch}
                    onChange={(e) => setTestSearch(e.target.value)}
                    className="location-search-input"
                  />
                </div>
                <div className="location-options">
                  {filteredTestValues.map(testValue => (
                    <div 
                      key={testValue}
                      className={`location-option ${selectedTest === testValue ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedTest(testValue);
                        setShowTestDropdown(false);
                        setTestSearch('');
                      }}
                    >
                      <i className="fas fa-vial"></i>
                      <span>{testValue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button className="submit-btn" onClick={handleSubmit}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
