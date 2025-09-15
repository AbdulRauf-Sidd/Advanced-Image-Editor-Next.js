"use client";

import { useRouter } from 'next/navigation';
import InspectionsTable from '../../components/InspectionsTable';
import ImageEditorPage from '../../components/ImageEditorPage';
import { useState } from 'react';

export default function Home() {
  const router = useRouter();
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string>('');

  // Handle row click to open ImageEditor
  const handleRowClick = (inspectionId: string) => {
    setSelectedInspectionId(inspectionId);
    setShowImageEditor(true);
  };

  // Handle back to table
  const handleBackToTable = () => {
    setShowImageEditor(false);
    setSelectedInspectionId('');
  };

  // Handle document click to view inspection report
  const handleDocumentClick = (inspectionId: string) => {
    router.push(`/inspection_report/${inspectionId}`);
  };

  // Show table page by default
  if (!showImageEditor) {
  return (
      <InspectionsTable 
        onRowClick={handleRowClick}
        onDocumentClick={handleDocumentClick}
      />
    );
  }

  // Show ImageEditor when a row is clicked
  return (
    <ImageEditorPage 
      selectedInspectionId={selectedInspectionId}
      onBackToTable={handleBackToTable}
    />
  );
}
