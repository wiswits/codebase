import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { HostelList } from '../components/HostelList';
import { HostelForm } from '../components/HostelForm';
import { BuildingList } from '../components/BuildingList';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import type { Hostel } from '@shared/schemas/hostel';

export const HostelManagement: React.FC = () => {
  const { hostelId } = useParams<{ hostelId: string }>();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHostel, setEditingHostel] = useState<Hostel | undefined>();

  const handleEdit = (hostel: Hostel) => {
    setEditingHostel(hostel);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    setIsModalOpen(false);
    setEditingHostel(undefined);
  };

  if (hostelId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/hostels')}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Hostels
          </Button>
          <h2 className="text-xl font-display">Hostel Details</h2>
        </div>
        <BuildingList hostelId={hostelId} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display">Hostel Management</h1>
        <Button variant="primary" onClick={() => {
          setEditingHostel(undefined);
          setIsModalOpen(true);
        }}>
          Add Hostel
        </Button>
      </div>

      <HostelList onEdit={handleEdit} />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingHostel(undefined);
        }}
        title={editingHostel ? 'Edit Hostel' : 'Create New Hostel'}
      >
        <HostelForm
          initialData={editingHostel}
          onSuccess={handleSuccess}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingHostel(undefined);
          }}
        />
      </Modal>
    </div>
  );
};