import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { TransferQueue } from '../components/TransferQueue';
import { usePermissions } from '../../../hooks/usePermissions';
import { Modal } from '../../../components/ui/Modal';

export const Transfers: React.FC = () => {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [showRequestModal, setShowRequestModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-display">Transfer Requests</h1>
        </div>
        {can('hms:transfer:create') && (
          <Button
            variant="primary"
            onClick={() => setShowRequestModal(true)}
          >
            <Plus size={16} className="mr-2" />
            Request Transfer
          </Button>
        )}
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-6">
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            options={[
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ]}
            className="w-40"
          />
          <span className="text-sm text-gray-500">
            {filter === 'pending' ? 'Awaiting approval' :
             filter === 'approved' ? 'Approved transfers' :
             'Rejected transfers'}
          </span>
        </div>

        <TransferQueue status={filter} />
      </Card>

      {/* Request Transfer Modal */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title="Request Bed Transfer"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Select the bed you want to transfer to. Your current allocation will be reviewed by the warden.
          </p>
          {/* Transfer request form */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="ghost"
              onClick={() => setShowRequestModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                // Submit transfer request
                setShowRequestModal(false);
              }}
            >
              Submit Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};