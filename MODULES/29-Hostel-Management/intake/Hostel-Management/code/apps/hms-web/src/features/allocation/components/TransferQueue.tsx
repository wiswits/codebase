import React, { useState } from 'react';
import { Check, X, Clock, User, Bed, ArrowRight, AlertCircle } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { useTransfer } from '../hooks/useTransfer';
import { usePermissions } from '../../../hooks/usePermissions';
import type { Transfer } from '@shared/schemas/allocation';

interface TransferQueueProps {
  status?: 'pending' | 'approved' | 'rejected';
}

export const TransferQueue: React.FC<TransferQueueProps> = ({ status = 'pending' }) => {
  const { can } = usePermissions();
  const { transfers, approveTransfer, rejectTransfer, isLoading } = useTransfer();
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showBedSelector, setShowBedSelector] = useState(false);

  const filteredTransfers = transfers?.filter(t => t.status === status);

  const handleApprove = async (transferId: string, newBedId?: string) => {
    await approveTransfer({ id: transferId, newBedId });
    setSelectedTransfer(null);
    setShowBedSelector(false);
  };

  const handleReject = async () => {
    if (!selectedTransfer || !rejectReason) return;
    await rejectTransfer({ id: selectedTransfer.id, reason: rejectReason });
    setShowRejectModal(false);
    setSelectedTransfer(null);
    setRejectReason('');
  };

  const getStatusBadge = (status: Transfer['status']) => {
    switch (status) {
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">Pending</span>;
      case 'approved':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Approved</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">Rejected</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-apex-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredTransfers?.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <ArrowRight size={48} className="mx-auto mb-4 opacity-30" />
          <p>No transfer requests</p>
          <p className="text-sm">
            {status === 'pending' ? 'All transfers have been processed' : 'No transfers with this status'}
          </p>
        </div>
      )}

      {filteredTransfers?.map((transfer) => (
        <Card key={transfer.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  <span className="font-medium">Student ID: {transfer.studentId}</span>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
                <div className="flex items-center gap-2">
                  <Bed size={16} className="text-gray-400" />
                  <span>Current Bed</span>
                </div>
                <span className="text-gray-400">→</span>
                <div className="flex items-center gap-2">
                  <Bed size={16} className="text-apex-gold" />
                  <span>Requested Bed: {transfer.requestedBedId}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>
                  <Clock size={14} className="inline mr-1" />
                  {new Date(transfer.createdAt).toLocaleDateString()}
                </span>
                <span>•</span>
                <span>Reason: {transfer.reason || 'No reason provided'}</span>
              </div>

              <div>
                {getStatusBadge(transfer.status)}
              </div>
            </div>

            {transfer.status === 'pending' && can('hms:transfer:approve') && (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedTransfer(transfer);
                    setShowBedSelector(true);
                  }}
                >
                  <Check size={14} className="mr-1" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setSelectedTransfer(transfer);
                    setShowRejectModal(true);
                  }}
                >
                  <X size={14} className="mr-1" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        </Card>
      ))}

      {/* Approve with bed selection modal */}
      <Modal
        isOpen={showBedSelector && !!selectedTransfer}
        onClose={() => {
          setShowBedSelector(false);
          setSelectedTransfer(null);
        }}
        title="Select New Bed (Optional)"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            You can approve the transfer to the requested bed, or select a different bed.
          </p>
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={() => handleApprove(selectedTransfer!.id)}
            >
              Approve to Requested Bed
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Show bed picker
              }}
            >
              Choose Different Bed
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject modal */}
      <Modal
        isOpen={showRejectModal && !!selectedTransfer}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedTransfer(null);
          setRejectReason('');
        }}
        title="Reject Transfer Request"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Rejection *
            </label>
            <textarea
              className="w-full rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-apex-gold focus:border-transparent"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Please provide a reason..."
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setShowRejectModal(false);
                setSelectedTransfer(null);
                setRejectReason('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleReject}
              disabled={!rejectReason.trim()}
            >
              Reject Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};