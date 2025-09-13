"use client";

import { useRouter } from 'next/navigation';
import ImageEditor from '../../components/ImageEditor';
import { useState, useRef, useEffect } from 'react';
import { useAnalysisStore } from '@/lib/store';


export default function Home() {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [activeMode, setActiveMode] = useState<'none' | 'crop' | 'arrow' | 'circle' | 'square'>('none');
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [selectedInspectionId, setSelectedInspectionId] = useState<number | null>(null);
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
  const [showLocationDropdown2, setShowLocationDropdown2] = useState(false);
  const [locationSearch2, setLocationSearch2] = useState('');
  const [selectedLocation2, setSelectedLocation2] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');
  const [showAddInspectionPopup, setShowAddInspectionPopup] = useState(false);
  const [newInspectionName, setNewInspectionName] = useState('');
  const drawingDropdownRef = useRef<HTMLDivElement>(null);
  const circleDropdownRef = useRef<HTMLDivElement>(null);
  const squareDropdownRef = useRef<HTMLDivElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);
  const subLocationDropdownRef = useRef<HTMLDivElement>(null);
  const testDropdownRef = useRef<HTMLDivElement>(null);
  const locationDropdownRef2 = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const [currentImage, setCurrentImage] = useState<HTMLImageElement | null>(null);
  const [editedFile, setEditedFile] = useState<File | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // const router = useRouter();
  const setAnalysisData = useAnalysisStore(state => state.setAnalysisData);

  // Sample inspection data
  const inspections = [
    { id: 1, inspectionName: "Kitchen Inspection", date: "2024-01-15", status: "Completed" as const },
    { id: 2, inspectionName: "Bathroom Inspection", date: "2024-01-16", status: "In Progress" as const },
    { id: 3, inspectionName: "Living Room Inspection", date: "2024-01-17", status: "Pending" as const },
    { id: 4, inspectionName: "Bedroom Inspection", date: "2024-01-18", status: "Completed" as const },
    { id: 5, inspectionName: "Basement Inspection", date: "2024-01-19", status: "Cancelled" as const },
    { id: 6, inspectionName: "Attic Inspection", date: "2024-01-20", status: "Pending" as const },
    { id: 7, inspectionName: "Garage Inspection", date: "2024-01-21", status: "In Progress" as const },
    { id: 8, inspectionName: "Exterior Inspection", date: "2024-01-22", status: "Completed" as const },
  ];

  // Handle row click to open ImageEditor
  const handleRowClick = (id: number) => {
    setSelectedInspectionId(id);
    setShowImageEditor(true);
  };

  // Handle back to table
  const handleBackToTable = () => {
    setShowImageEditor(false);
    setSelectedInspectionId(null);
  };

  // Handle add inspection popup
  const handleAddInspection = () => {
    setShowAddInspectionPopup(true);
  };

  // Handle save new inspection
  const handleSaveInspection = () => {
    if (newInspectionName.trim()) {
      // Add new inspection to the list
      const newInspection = {
        id: inspections.length + 1,
        inspectionName: newInspectionName.trim(),
        date: new Date().toISOString().split('T')[0],
        status: 'Pending' as const
      };
      
      // In a real app, you would save this to a database
      console.log('New inspection added:', newInspection);
      
      // Reset form and close popup
      setNewInspectionName('');
      setShowAddInspectionPopup(false);
      
      // You could also update the inspections array here if needed
      // setInspections([...inspections, newInspection]);
    }
  };

  // Handle cancel add inspection
  const handleCancelInspection = () => {
    setNewInspectionName('');
    setShowAddInspectionPopup(false);
  };


  // Section data (sorted alphabetically)
  const locations = [
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

  // Test data
  const testValues = ['V1', 'V2', 'V3', 'V4', 'V5', 'V6'];

  // Location data (sorted alphabetically)
  const locations2 = [
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

  // Sub-location data (hierarchical structure)
  const subLocations: { [key: string]: string[] } = {
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

  // Filtered locations2 based on search
  const filteredLocations2 = locations2.filter(location2 =>
    location2.toLowerCase().includes(locationSearch2.toLowerCase())
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
      
      // Check if click is on location2 button or its dropdown
      const isLocation2ButtonClick = (event.target as Element)?.closest('.location2-btn');
      if (locationDropdownRef2.current && !locationDropdownRef2.current.contains(target) && !isLocation2ButtonClick) {
        setShowLocationDropdown2(false);
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
    console.log('Selected Section:', selectedLocation);
    console.log('Selected Sub-Section:', selectedSubLocation);
    console.log('Selected Test:', selectedTest);
    console.log('Selected Location:', selectedLocation2);
    console.log('Description:', description);
    console.log('=======================');
    
    // Validate inputs
    if (!description.trim()) {
      setSubmitStatus('Please provide a description');
      return;
    }


    if (!selectedLocation) {
      setSubmitStatus('Please select a section');
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
        formData.append('description', `${description} | Section: ${selectedLocation} - ${selectedSubLocation} | Location: ${selectedLocation2}`);
        formData.append('location', selectedLocation);
        formData.append('location2', selectedLocation2);
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
        location: `${selectedLocation} - ${selectedSubLocation} | ${selectedLocation2}`,
        analysisResult: result
      });
      
      // ✅ Navigate to results page
      router.push('/user-report');
      
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

  // Show table page by default
  if (!showImageEditor) {
  return (
    <div className="app-container">
        {/* Header Section - Same style as ImageEditor */}
        <div className="heading-section">
          <div className="heading-content">
            <i className="fas fa-clipboard-list heading-icon"></i>
            <h1>Inspections</h1>
            <p>Manage your property inspections efficiently</p>
          </div>
        </div>

        {/* Action Bar with Add Inspection Button */}
        <div className="action-bar">
          <div className="action-bar-content">
            <div className="action-bar-left">
              {/* Empty space for future content */}
            </div>
            <div className="action-bar-right">
              <button className="add-btn" onClick={handleAddInspection}>
                <i className="fas fa-plus"></i>
                <span className="btn-text">Add Inspection</span>
              </button>
            </div>
          </div>
        </div>


        {/* Table Section */}
        <div className="table-section">
          <div className="table-container">
            <table className="inspections-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Inspection Name</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inspections.map((inspection) => (
                  <tr
                    key={inspection.id}
                    className="table-row"
                    onClick={() => handleRowClick(inspection.id)}
                  >
                    <td className="id-cell">
                      <span className="id-badge">
                        {inspection.id.toString().padStart(4, '0')}
                      </span>
                    </td>
                    <td className="name-cell">
                      <span className="inspection-name">{inspection.inspectionName}</span>
                    </td>
                    <td className="date-cell">
                      <span className="date-text">{inspection.date}</span>
                    </td>
                    <td className="status-cell">
                      <span
                        className={`status-badge status-${inspection.status.toLowerCase().replace(' ', '-')}`}
                      >
                        {inspection.status}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <div className="action-buttons">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(inspection.id);
                          }}
                          className="action-btn-small edit-btn"
                          title="Edit Inspection"
                        >
                          <i className="fas fa-pencil-alt"></i>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log("Document action for inspection:", inspection.id);
                          }}
                          className="action-btn-small document-btn"
                          title="View Document"
                        >
                          <i className="fas fa-file-alt"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Inspection Popup */}
        {showAddInspectionPopup && (
          <div className="popup-overlay">
            <div className="popup-content">
              <div className="popup-header">
                <h3>Add New Inspection</h3>
                <button 
                  className="popup-close-btn"
                  onClick={handleCancelInspection}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="popup-body">
                <div className="form-group">
                  <label htmlFor="inspectionName">Inspection Name</label>
                  <input
                    type="text"
                    id="inspectionName"
                    value={newInspectionName}
                    onChange={(e) => setNewInspectionName(e.target.value)}
                    placeholder="Enter inspection name..."
                    className="form-input"
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="popup-footer">
                <button 
                  className="popup-btn cancel-btn"
                  onClick={handleCancelInspection}
                >
                  Cancel
                </button>
                <button 
                  className="popup-btn save-btn"
                  onClick={handleSaveInspection}
                  disabled={!newInspectionName.trim()}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show ImageEditor when a row is clicked
  return (
    <div className="app-container">
      <style jsx>{`
        .location-btn, .main-location-btn, .section-btn, .sub-location-btn, .test-btn, .location2-btn {
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
        .location-btn:hover, .main-location-btn:hover, .section-btn:hover, .sub-location-btn:hover, .test-btn:hover, .location2-btn:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 8px 30px rgba(75, 108, 183, 0.4) !important;
          background: linear-gradient(135deg, rgb(106, 17, 203) 0%, rgb(75, 108, 183) 100%) !important;
        }
        .location-btn:active, .main-location-btn:active, .section-btn:active, .sub-location-btn:active, .test-btn:active, .location2-btn:active {
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
              className="location-btn location2-btn"
              onClick={() => setShowLocationDropdown2(!showLocationDropdown2)}
              style={{
                background: 'linear-gradient(135deg, rgb(75, 108, 183) 0%, rgb(106, 17, 203) 100%) !important',
                color: 'white !important',
                border: 'none !important',
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
                  {filteredLocations2.map(location2 => (
                    <div 
                      key={location2}
                      className={`location-option ${selectedLocation2 === location2 ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedLocation2(location2);
                        setShowLocationDropdown2(false);
                        setLocationSearch2('');
                      }}
                    >
                      <i className="fas fa-map-marker-alt"></i>
                      <span>{location2}</span>
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
                border: 'none !important',
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
              style={{
                background: 'linear-gradient(135deg, rgb(75, 108, 183) 0%, rgb(106, 17, 203) 100%) !important',
                color: 'white !important',
                border: 'none !important',
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
              style={{
                background: 'linear-gradient(135deg, rgb(75, 108, 183) 0%, rgb(106, 17, 203) 100%) !important',
                color: 'white !important',
                border: 'none !important',
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
