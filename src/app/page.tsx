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

  // Handle edit click to edit inspection
  const handleEditClick = (inspectionId: string) => {
    console.log('Edit inspection:', inspectionId);
    // You can implement edit functionality here
    // For now, we'll just log it
  };

  // Handle delete click to delete inspection
  const handleDeleteClick = async (inspectionId: string) => {
    if (!confirm('Are you sure you want to delete this inspection?')) {
      return;
    }

    try {
      console.log('Deleting inspection:', inspectionId);
      // You can implement delete API call here
      // For now, we'll just log it
      alert('Delete functionality not implemented yet');
    } catch (error) {
      console.error('Error deleting inspection:', error);
      alert('Error deleting inspection. Please try again.');
    }
  };

  // Show table page
    return (
    <InspectionsTable 
      onRowClick={handleRowClick}
      onDocumentClick={handleDocumentClick}
      onEditClick={handleEditClick}
      onDeleteClick={handleDeleteClick}
    />
  );
}
