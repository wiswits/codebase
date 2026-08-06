import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, FileText, QrCode } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';
import { LeaveRequestForm } from '../components/LeaveRequestForm';
import { LeaveQueue } from '../components/LeaveQueue';
import { GatePassScanner } from '../components/GatePassScanner';
import { useHostels } from '../../hierarchy/hooks/useHostels';
import { usePermissions } from '../../../hooks/usePermissions';

export const LeaveManagement: React.FC = () => {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { hostels } = useHostels();
  const [selectedHostelId, setSelectedHostelId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'pending_parent' | 'pending_warden' | 'approved' | 'rejected'>('pending_warden');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [view, setView] = useState<'queue' | 'scanner'>('queue');

  const hostelOptions = hostels?.map(h => ({
    value: h.id,
    label: `${h.name} (${h.code})`,
  })) || [];

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
          <h1 className="text-2xl font-display">Leave Management</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === 'queue' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setView('queue')}
          >
            <FileText size={14} className="mr-1" />
            Queue
          </Button>
          {can('hms:leave:approve:hostel') && (
            <Button
              variant={view === 'scanner' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setView('scanner')}
            >
              <QrCode size={14} className="mr-1" />
              Gate Scanner
            </Button>
          )}
          {can('hms:leave:create') && (
            <Button
              variant="primary"
              onClick={() => setShowRequestModal(true)}
            >
              <Plus size={14} className="mr-2" />
              Request Leave
            </Button>
          )}
        </div>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Hostel
            </label>
            <Select
              value={selectedHostelId}
              onChange={(e) => setSelectedHostelId(e.target.value)}
              options={[
                { value: '', label: 'Select a hostel...' },
                ...hostelOptions,
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status Filter
            </label>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              options={[
                { value: 'pending_parent', label: 'Awaiting Parent' },
                { value: 'pending_warden', label: 'Awaiting Warden' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
              ]}
            />
          </div>
        </div>
      </Card>

      {selectedHostelId && view === 'queue' && (
        <LeaveQueue 
          status={statusFilter}
          hostelId={selectedHostelId}
        />
      )}

      {selectedHostelId && view === 'scanner' && (
        <GatePassScanner
          onScanSuccess={() => {
            // Refresh queue after scan
          }}
        />
      )}

      {!selectedHostelId && (
        <Card className="p-12">
          <div className="text-center text-gray-500">
            <FileText size={48} className="mx-auto mb-4 opacity-30" />
            <p>Select a hostel to manage leave requests</p>
            <p className="text-sm">Choose a hostel from the dropdown above</p>
          </div>
        </Card>
      )}

      {/* Request Leave Modal */}
      <Modal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title="Request Leave"
      >
        <LeaveRequestForm
          onSuccess={() => {
            setShowRequestModal(false);
          }}
          onCancel={() => setShowRequestModal(false)}
        />
      </Modal>
    </div>
  );
};