"use client";

import { useState, useEffect } from 'react';

interface Defect {
  _id: string;
  inspection_id: string;
  image: string;
  location: string;
  section: string;
  subsection: string;
  defect_description: string;
  material_names: string[];
  material_total_cost: number;
  labor_type: string;
  labor_rate: number;
  hours_required: number;
  recommendation: string;
  selectedArrowColor?: string;
}

interface DefectEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspectionId: string;
  inspectionName: string;
}

export default function DefectEditModal({ isOpen, onClose, inspectionId, inspectionName }: DefectEditModalProps) {
  const [defects, setDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Fetch defects when modal opens
  useEffect(() => {
    if (isOpen && inspectionId) {
      fetchDefects();
    }
  }, [isOpen, inspectionId]);

  const fetchDefects = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/defects/${inspectionId}`);
      if (response.ok) {
        const data = await response.json();
        // Ensure data is an array and has proper structure
        const safeData = Array.isArray(data) ? data : [];
        setDefects(safeData);
      } else {
        console.error('Failed to fetch defects');
        setDefects([]);
      }
    } catch (error) {
      console.error('Error fetching defects:', error);
      setDefects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDefect = async (defectId: string) => {
    if (!confirm('Are you sure you want to delete this defect?')) {
      return;
    }

    console.log(defectId)

    try {
      setDeleting(defectId);
      const response = await fetch(`/api/defects/${defectId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDefects(prev => prev.filter(defect => defect._id !== defectId));
      } else {
        alert('Failed to delete defect. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting defect:', error);
      alert('Error deleting defect. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const calculateTotalCost = (defect: Defect) => {
    const materialCost = defect.material_total_cost || 0;
    const laborRate = defect.labor_rate || 0;
    const hours = defect.hours_required || 0;
    const laborCost = laborRate * hours;
    return materialCost + laborCost;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content defect-edit-modal">
        <div className="modal-header">
          <h2>Edit Defects - {inspectionName}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading defects...</p>
            </div>
          ) : defects.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-exclamation-triangle empty-icon"></i>
              <h3>No Defects Found</h3>
              <p>This inspection has no defects recorded.</p>
            </div>
          ) : (
            <div className="defects-list">
              {defects.map((defect, index) => (
                <div key={defect._id} className="defect-card">
                  <div className="defect-header">
                    <h3>Defect #{index + 1}</h3>
                    <button
                      className="delete-defect-btn"
                      onClick={() => handleDeleteDefect(defect._id)}
                      disabled={deleting === defect._id}
                    >
                      {deleting === defect._id ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fas fa-trash"></i>
                      )}
                    </button>
                  </div>

                  <div className="defect-content">
                    <div className="defect-image">
                      <img src={defect.image || '/placeholder-image.jpg'} alt="Defect" />
                    </div>

                    <div className="defect-details">
                      <div className="detail-row">
                        <strong>Location:</strong> {defect.location || 'Not specified'}
                      </div>
                      <div className="detail-row">
                        <strong>Section:</strong> {defect.section || 'Not specified'}
                      </div>
                      <div className="detail-row">
                        <strong>Subsection:</strong> {defect.subsection || 'Not specified'}
                      </div>
                      <div className="detail-row">
                        <strong>Description:</strong> {defect.defect_description || 'No description available'}
                      </div>
                      <div className="detail-row">
                        <strong>Materials:</strong> {defect.material_names?.join(', ') || 'No materials specified'}
                      </div>
                      <div className="detail-row">
                        <strong>Material Cost:</strong> {formatCurrency(defect.material_total_cost || 0)}
                      </div>
                      <div className="detail-row">
                        <strong>Labor:</strong> {defect.labor_type || 'Not specified'} at {formatCurrency(defect.labor_rate || 0)}/hr
                      </div>
                      <div className="detail-row">
                        <strong>Hours:</strong> {defect.hours_required || 0}
                      </div>
                      <div className="detail-row">
                        <strong>Recommendation:</strong> {defect.recommendation || 'No recommendation available'}
                      </div>
                      <div className="detail-row total-cost">
                        <strong>Total Cost:</strong> {formatCurrency(calculateTotalCost(defect))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="modal-btn secondary-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
