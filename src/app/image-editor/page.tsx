"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import ImageEditor from '../../../components/ImageEditor';
import { useState, useRef, useEffect } from 'react';
import { useAnalysisStore } from '@/lib/store';

export default function ImageEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedInspectionId = searchParams.get('inspectionId') || '';
  
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
  const [showLocationDropdown2, setShowLocationDropdown2] = useState(false);
  const [locationSearch2, setLocationSearch2] = useState('');
  const [selectedLocation2, setSelectedLocation2] = useState<string>('');
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
  const locationDropdownRef2 = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const [currentImage, setCurrentImage] = useState<HTMLImageElement | null>(null);
  const [editedFile, setEditedFile] = useState<File | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedArrowColor, setSelectedArrowColor] = useState('#d63636'); // Default red color

  const { updateAnalysisData } = useAnalysisStore();

  const location = [
    'Addition', 'All Locations', 'Apartment', 'Attic', 'Back Porch', 'Back Room', 'Balcony',
    'Bedroom 1', 'Bedroom 2', 'Bedroom 3', 'Bedroom 4', 'Bedroom 5', 'Both Locations', 'Breakfast',
    'Carport', 'Carport Entry', 'Closet', 'Crawlspace', 'Dining', 'Downstairs', 'Downstairs Bathroom',
    'Downstairs Bathroom Closet', 'Downstairs Hallway', 'Downstairs Hall Closet', 'Driveway', 'Entry',
    'Family Room', 'Front Entry', 'Front of House', 'Front Porch', 'Front Room', 'Garage', 'Garage Entry',
    'Garage Storage Closet', 'Guest Bathroom', 'Guest Bedroom', 'Guest Bedroom Closet', 'Half Bathroom',
    'Hallway', 'Heater Operation Temp', 'HVAC Closet', 'Keeping Room', 'Kitchen', 'Kitchen Pantry',
    'Left Side of House', 'Left Wall', 'Living Room', 'Living Room Closet', 'Laundry Room',
    'Laundry Room Closet', 'Master Bathroom', 'Master Bedroom', 'Master Closet', 'Most Locations',
    'Multiple Locations', 'Office', 'Office Closet', 'Outdoor Storage', 'Patio', 'Rear Entry',
    'Rear of House', 'Rear Wall', 'Right Side of House', 'Right Wall', 'Shop', 'Side Entry', 'Staircase',
    'Sun Room', 'Top of Stairs', 'Upstairs Bathroom', 'Upstairs Bedroom 1', 'Upstairs Bedroom 1 Closet',
    'Upstairs Bedroom 2', 'Upstairs Bedroom 2 Closet', 'Upstairs Bedroom 3', 'Upstairs Bedroom 3 Closet',
    'Upstairs Bedroom 4', 'Upstairs Bedroom 4 Closet', 'Upstairs Hallway', 'Upstairs Laundry Room',
    'Utility Room', 'Water Heater Closet', 'Water Heater Output Temp'
  ];

  const section = [
    'AC / Cooling',
    'Built-In Appliances',
    'Electrical',
    'Exterior',
    'Foundation & Structure',
    'Furnace / Heater',
    'Grounds',
    'Insulation & Ventilation',
    'Interior',
    'Plumbing',
    'Roof',
    'Swimming Pool & Spa'
  ];

  const subsection: { [key: string]: string[] } = {
    'Grounds': [
      'Vegetation, Grading, & Drainage',
      'Sidewalks, Porches, Driveways'
    ],
    'Foundation & Structure': [
      'Foundation',
      'Crawlspace',
      'Floor Structure',
      'Wall Structure',
      'Ceiling Structure'
    ],
    'Roof': [
      'Coverings',
      'Flashing & Seals',
      'Roof Penetrations',
      'Roof Structure & Attic'
    ],
    'Exterior': [
      'Exterior Doors',
      'Exterior Windows',
      'Siding, Flashing, & Trim',
      'Brick/Stone Veneer',
      'Vinyl Siding',
      'Soffit & Fascia',
      'Wall Penetrations',
      'Doorbell',
      'Exterior Support Columns',
      'Steps, Stairways, & Railings'
    ],
    'Interior': [
      'Doors',
      'Windows',
      'Floors',
      'Walls',
      'Ceilings',
      'Countertops & Cabinets',
      'Trim'
    ],
    'Insulation & Ventilation': [
      'Attic Access',
      'Insulation',
      'Vapor Barrier',
      'Ventilation & Exhaust'
    ],
    'AC / Cooling': [
      'Air Conditioning',
      'Thermostats',
      'Distribution System'
    ],
    'Furnace / Heater': [
      'Forced Air Furnace'
    ],
    'Electrical': [
      'Sub Panel',
      'Service Panel',
      'Branch Wiring & Breakers',
      'Exterior Lighting',
      'Fixtures, Fans, Switches, & Receptacles',
      'GFCI & AFCI',
      '240 Volt Receptacle',
      'Smoke / Carbon Monoxide Alarms',
      'Service Entrance'
    ],
    'Plumbing': [
      'Water Heater',
      'Drain, Waste, & Vents',
      'Water Supply',
      'Water Spigot',
      'Gas Supply',
      'Vents & Flues',
      'Fixtures,Sinks, Tubs, & Toilets'
    ],
    'Built-In Appliances': [
      'Refrigerator',
      'Dishwasher',
      'Garbage Disposal',
      'Microwave',
      'Range Hood',
      'Range, Oven & Cooktop'
    ],
    'Swimming Pool & Spa': [
      'Equipment',
      'Electrical',
      'Safety Devices',
      'Coping & Decking',
      'Vessel Surface',
      'Drains',
      'Control Valves',
      'Filter',
      'Pool Plumbing',
      'Pumps',
      'Spa Controls & Equipment',
      'Heating',
      'Diving Board & Slide'
    ]
  };

  const filteredSections = section.filter(sectionItem =>
    sectionItem.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const filteredSubsections = selectedLocation && subsection[selectedLocation as keyof typeof subsection]
    ? subsection[selectedLocation as keyof typeof subsection].filter(subLocation =>
        subLocation.toLowerCase().includes(subLocationSearch.toLowerCase())
      )
    : [];

  const filteredLocations = location.filter(locationItem =>
    locationItem.toLowerCase().includes(locationSearch2.toLowerCase())
  );

  // Check for speech recognition support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      setIsSpeechSupported(!!SpeechRecognition);
    }
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (drawingDropdownRef.current && !drawingDropdownRef.current.contains(event.target as Node)) {
        setShowDrawingDropdown(false);
      }
      if (circleDropdownRef.current && !circleDropdownRef.current.contains(event.target as Node)) {
        setShowCircleDropdown(false);
      }
      if (squareDropdownRef.current && !squareDropdownRef.current.contains(event.target as Node)) {
        setShowSquareDropdown(false);
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
      if (subLocationDropdownRef.current && !subLocationDropdownRef.current.contains(event.target as Node)) {
        setShowSubLocationDropdown(false);
      }
      if (locationDropdownRef2.current && !locationDropdownRef2.current.contains(event.target as Node)) {
        setShowLocationDropdown2(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup speech recognition
  useEffect(() => {
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
          setIsListening(true);
        };
      } catch (error) {
        console.error('Error initializing speech recognition:', error);
        setIsSpeechSupported(false);
      }
    }
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
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
      setShowCircleDropdown(false);
      setShowDrawingDropdown(false);
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
    setHasCropFrame(hasFrame);
  };

  const handleBackToTable = () => {
    router.push('/');
  };

  const handleSubmit = async () => {
    if (!currentImage || !editedFile) {
      alert('Please upload and edit an image before submitting.');
      return;
    }

    if (!selectedLocation || !selectedSubLocation || !selectedLocation2) {
      alert('Please select all required location fields.');
      return;
    }

    // Store selected values in their respective variables
    const selectedSection = selectedLocation; // This is the section (AC / Cooling, Electrical, etc.)
    const selectedSubsection = selectedSubLocation; // This is the subsection (Air Conditioning, Thermostats, etc.)
    const selectedLocationValue = selectedLocation2; // This is the specific location (Kitchen, Bedroom 1, etc.)

    // Console logs to show the selected values


    setIsSubmitting(true);
    setSubmitStatus('Processing...');

    // Convert edited file to data URL (outside try-catch so it's accessible in both blocks)
    let imageDataUrl: string;
    try {
      imageDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(editedFile);
      });
      console.log('Image converted to data URL');
    } catch (conversionError) {
      console.error('Error converting image to data URL:', conversionError);
      imageDataUrl = '';
    }

    try {
      console.log('Starting submission process...');

      // Call AI analysis API
      const formData = new FormData();
      formData.append('image', editedFile);
      formData.append('description', description);
      formData.append('location', selectedLocationValue);
      formData.append('section', selectedSection);
      formData.append('subsection', selectedSubsection);



      console.log('Calling AI analysis API...');
      const response = await fetch('/api/llm/analyze-image', {
        method: 'POST',
        body: formData,
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Analysis result:', result);

      // Store analysis data in global state
      console.log('Storing analysis data with arrow color:', selectedArrowColor);
      updateAnalysisData({
        inspectionId: selectedInspectionId,
        imageFile: editedFile,
        image: imageDataUrl, // Store as data URL
        description,
        location: selectedLocationValue,
        section: selectedSection,
        subSection: selectedSubsection,
        analysisResult: result,
        selectedArrowColor: selectedArrowColor // Store the selected arrow color
      });
      
      console.log('Data stored successfully, navigating to user report...');
      
      // Navigate to results page
      router.push('/user-report');
      
    } catch (error: any) {
      console.error('Submission error:', error);
      
      // Even if API fails, still store the data and navigate to user report
      console.log('API failed, but storing data and proceeding to user report...');
      
      console.log('Storing fallback analysis data with arrow color:', selectedArrowColor);
      updateAnalysisData({
        inspectionId: selectedInspectionId,
        imageFile: editedFile,
        image: imageDataUrl,
        description,
        location: selectedLocationValue,
        section: selectedSection,
        subSection: selectedSubsection,
        analysisResult: {
          defect: 'Analysis failed - please review manually',
          recommendation: 'Manual review required due to analysis error',
          materials_names: 'To be determined',
          materials_total_cost: 0,
          labor_type: 'To be determined',
          labor_rate: 0,
          hours_required: 0,
          total_estimated_cost: 0
        },
        selectedArrowColor: selectedArrowColor // Store the selected arrow color
      });
      
      // Navigate to results page even if API failed
      router.push('/user-report');
      
    } finally {
      setIsSubmitting(false);
    }
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
      <style jsx>{`
        .location-btn, .main-location-btn, .section-btn, .sub-location-btn, .location2-btn {
          background: linear-gradient(135deg, rgb(75, 108, 183) 0%, rgb(106, 17, 203) 100%) !important;
          color: white !important;
          border: none !important;
          padding: 18px 24px !important;
          border-radius: 12px !important;
          font-size: 16px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
          box-shadow: 0 4px 20px rgba(75, 108, 183, 0.3) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-between !important;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          letter-spacing: 0.3px !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          width: 300px !important;
          height: 60px !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }
        .location-btn:hover, .main-location-btn:hover, .section-btn:hover, .sub-location-btn:hover, .location2-btn:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 8px 30px rgba(75, 108, 183, 0.4) !important;
          background: linear-gradient(135deg, rgb(106, 17, 203) 0%, rgb(75, 108, 183) 100%) !important;
        }
        .location-btn:active, .main-location-btn:active, .section-btn:active, .sub-location-btn:active, .location2-btn:active {
          transform: translateY(-1px) !important;
          box-shadow: 0 4px 20px rgba(75, 108, 183, 0.3) !important;
        }
      `}</style>
      
      {/* First Heading */}
      <div className="heading-section">
        <div className="heading-content">
          <i className="fas fa-image heading-icon"></i>
          <h1>Advanced Image Editor</h1>
          <p>Edit your images with drawing and cropping tools</p>
          {selectedInspectionId && (
            <p className="text-sm text-gray-600 mt-1">
              Inspection ID: {selectedInspectionId}
            </p>
          )}
        </div>
      </div>

      {/* Action Options Bar */}
      <div className="action-bar">
        <button className="action-btn back-btn" onClick={handleBackToTable}>
          <i className="fas fa-arrow-left"></i>
        </button>

        <button className="action-btn undo-btn" onClick={handleUndo}>
          <i className="fas fa-undo"></i>
        </button>
        <button className="action-btn redo-btn" onClick={handleRedo}>
          <i className="fas fa-redo"></i>
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
                      setSelectedArrowColor(color); // Store the selected color
                      console.log('Arrow color selected:', color);
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
              className="location-btn location2-btn"
              onClick={() => setShowLocationDropdown2(!showLocationDropdown2)}
              style={{
                background: 'linear-gradient(135deg, rgb(75, 108, 183) 0%, rgb(106, 17, 203) 100%) !important',
                color: 'white !important',
                padding: '18px 24px !important',
                borderRadius: '12px !important',
                fontSize: '16px !important',
                fontWeight: '600 !important',
                cursor: 'pointer !important',
                transition: 'all 0.3s ease !important',
                boxShadow: '0 4px 20px rgba(75, 108, 183, 0.3) !important',
                display: 'flex !important',
                alignItems: 'center !important',
                justifyContent: 'space-between !important',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif !important',
                letterSpacing: '0.3px !important',
                border: '1px solid rgba(255, 255, 255, 0.1) !important',
                width: '300px !important',
                height: '60px !important',
                whiteSpace: 'nowrap !important',
                overflow: 'hidden !important',
                textOverflow: 'ellipsis !important'
              }}
            >
              <div className="btn-content">
                <i className="fas fa-map-marker-alt"></i>
                <span>{selectedLocation2 || 'Location'}</span>
              </div>
              <i className={`fas fa-chevron-down ${showLocationDropdown2 ? 'rotate' : ''}`}></i>
            </button>
            
            {showLocationDropdown2 && (
              <div className="location-dropdown location2-dropdown" ref={locationDropdownRef2}>
                <div className="location-search-container">
                  <input
                    type="text"
                    placeholder="Search locations..."
                    value={locationSearch2}
                    onChange={(e) => setLocationSearch2(e.target.value)}
                    className="location-search-input"
                  />
                </div>
                 <div className="location-options">
                   {filteredLocations.map(locationItem => (
                     <div 
                       key={locationItem}
                       className={`location-option ${selectedLocation2 === locationItem ? 'selected' : ''}`}
                       onClick={() => {
                         setSelectedLocation2(locationItem);
                         setShowLocationDropdown2(false);
                         setLocationSearch2('');
                       }}
                     >
                       <i className="fas fa-map-marker-alt"></i>
                       <span>{locationItem}</span>
                     </div>
                   ))}
                 </div>
              </div>
            )}
          </div>

          {/* Section Button with Dropdown */}
          <div className="location-button-container">
            <button 
              className="location-btn section-btn"
              onClick={() => setShowLocationDropdown(!showLocationDropdown)}
              style={{
                background: 'linear-gradient(135deg, rgb(75, 108, 183) 0%, rgb(106, 17, 203) 100%) !important',
                color: 'white !important',
                padding: '18px 24px !important',
                borderRadius: '12px !important',
                fontSize: '16px !important',
                fontWeight: '600 !important',
                cursor: 'pointer !important',
                transition: 'all 0.3s ease !important',
                boxShadow: '0 4px 20px rgba(75, 108, 183, 0.3) !important',
                display: 'flex !important',
                alignItems: 'center !important',
                justifyContent: 'space-between !important',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif !important',
                letterSpacing: '0.3px !important',
                border: '1px solid rgba(255, 255, 255, 0.1) !important',
                width: '300px !important',
                height: '60px !important',
                whiteSpace: 'nowrap !important',
                overflow: 'hidden !important',
                textOverflow: 'ellipsis !important'
              }}
            >
              <div className="btn-content">
              <i className="fas fa-map-marker-alt"></i>
              <span>{selectedLocation || 'Section'}</span>
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
                   {filteredSections.map(sectionItem => (
                     <div 
                       key={sectionItem}
                       className={`location-option ${selectedLocation === sectionItem ? 'selected' : ''}`}
                       onClick={() => {
                         setSelectedLocation(sectionItem);
                         setShowLocationDropdown(false);
                         setLocationSearch('');
                         setSelectedSubLocation(''); // Reset sub-location when main location changes
                         setSubLocationSearch(''); // Reset sub-location search
                         setShowSubLocationDropdown(false); // Hide sub-location dropdown initially
                       }}
                     >
                       <i className="fas fa-map-marker-alt"></i>
                       <span>{sectionItem}</span>
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
              style={{
                background: 'linear-gradient(135deg, rgb(75, 108, 183) 0%, rgb(106, 17, 203) 100%) !important',
                color: 'white !important',
                padding: '18px 24px !important',
                borderRadius: '12px !important',
                fontSize: '16px !important',
                fontWeight: '600 !important',
                cursor: 'pointer !important',
                transition: 'all 0.3s ease !important',
                boxShadow: '0 4px 20px rgba(75, 108, 183, 0.3) !important',
                display: 'flex !important',
                alignItems: 'center !important',
                justifyContent: 'space-between !important',
                fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif !important',
                letterSpacing: '0.3px !important',
                border: '1px solid rgba(255, 255, 255, 0.1) !important',
                width: '300px !important',
                height: '60px !important',
                whiteSpace: 'nowrap !important',
                overflow: 'hidden !important',
                textOverflow: 'ellipsis !important',
                opacity: !selectedLocation ? '0.5 !important' : '1 !important'
              }}
            >
              <div className="btn-content">
                <i className="fas fa-layer-group"></i>
                <span>{selectedSubLocation || 'Sub Section'}</span>
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
                   {filteredSubsections.map(subLocation => (
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

          {/* Submit Button */}
          <button className="submit-btn" onClick={handleSubmit}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
