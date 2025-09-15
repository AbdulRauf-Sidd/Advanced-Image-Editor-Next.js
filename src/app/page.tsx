"use client";

import { useRouter } from 'next/navigation';
import InspectionsTable from '../../components/InspectionsTable';

export default function Home() {
  const router = useRouter();

  // Handle row click to open ImageEditor
  const handleRowClick = (inspectionId: string) => {
    router.push(`/image-editor?inspectionId=${inspectionId}`);
  };

  // Handle document click to view inspection report
  const handleDocumentClick = (inspectionId: string) => {
    router.push(`/inspection_report/${inspectionId}`);
  };

  // Show table page
  return (
    <InspectionsTable 
      onRowClick={handleRowClick}
      onDocumentClick={handleDocumentClick}
    />
  );
}
