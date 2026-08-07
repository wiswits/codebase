import React, { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  Check, X, Clock, User, Calendar as CalendarIcon, 
  FileText, AlertCircle, ChevronDown, ChevronUp 
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { useLeave } from '../hooks/useLeave';
import { usePermissions } from '../../../hooks/usePermissions';
import type { LeaveRequest } from '@shared/schemas/leave';

interface LeaveQueueProps {
  status?: 'pending_parent' | 'pending_warden' | 'approved' | 'rejected';
  hostelId?: string;
}

export const LeaveQueue: React.FC<LeaveQueueProps> = ({ 
  status = 'pending_warden', 
  hostelId 
}) => {
  const { can } = usePermissions();
  const { leaves, approveLeave, rejectLeave, isLoading } = useLeave(hostelId);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredLeaves = leaves?.filter(l => l.status === status);

  const handleApprove = async (id: string, role: 'parent' | 'warden') => {
    await approveLeave({ id, role, decision: 'approved' });
    setSelectedLeave(null);
  };

  const handleReject = async () => {
    if (!selectedLeave || !rejectReason) return;
    await rejectLeave({ 
      id: selectedLeave.id, 
      reason: rejectReason,
      role: selectedLeave.status === 'pending_parent' ? 'parent' : 'warden'
    });
    setShowRejectModal(false);
    setSelectedLeave(null);
    setRejectReason('');
  };

  const getStatusBadge = (status: LeaveRequest['status']) => {
    switch (status) {
      case 'pending_parent':
        return <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">Awaiting Parent</span>;
      case 'pending_warden':
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">Awaiting Warden</span>;
      case 'approved':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Approved</span>;
      case 'rejected':
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">Rejected</span>;
    }
  };

  const canApprove = (leave: LeaveRequest) => {
    if (leave.status === 'pending_parent' && can('hms:leave:approve:parent')) return true;
    if (leave.status === 'pending_warden' && can('hms:leave:approve:hostel')) return true;
    return false;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-apex-gold"></div>
      </div>
    );
  }

  if (!filteredLeaves || filteredLeaves.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText size={48} className="mx-auto mb-4 opacity-30" />
        <p>No leave requests</p>
        <p className="text-sm">
          {status === 'pending_parent' ? 'No requests awaiting parent approval' :
           status === 'pending_warden' ? 'No requests awaiting warden approval' :
           'No requests with this status'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredLeaves.map((leave) => (
        <Card key={leave.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  <span className="font-medium">Student ID: {leave.apexStudentId}</span>
                </div>
                {getStatusBadge(leave.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <CalendarIcon size={14} />
                  <span>From: {format(new Date(leave.fromTs), 'MMM d, HH:mm')}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <CalendarIcon size={14} />
                  <span>To: {format(new Date(leave.toTs), 'MMM d, HH:mm')}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600">
                  <Clock size={14} />
                  <span>
                    {formatDistanceToNow(new Date(leave.fromTs), { addSuffix: true })}
                  </span>
                </div>
              </div>

              <div className="mt-2">
                <button
                  className="text-sm text-gray-500 hover:text-apex-navy flex items-center gap-1"
                  onClick={() => setExpandedId(expandedId === leave.id ? null : leave.id)}
                >
                  {expandedId === leave.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {expandedId === leave.id ? 'Hide details' : 'Show details'}
                </button>
                
                {expandedId === leave.id && (
                  <div className="mt-2 p-3 bg-apex-ivory rounded-lg text-sm space-y-2">
                    <p><strong>Reason:</strong> {leave.reason}</p>
                    {leave.rejectReason && (
                      <p><strong>Rejection Reason:</strong> {leave.rejectReason}</p>
                    )}
                    {leave.parentDecidedAt && (
                      <p><strong>Parent Decision:</strong> {format(new Date(leave.parentDecidedAt), 'MMM d, HH:mm')}</p>
                    )}
                    {leave.wardenDecidedAt && (
                      <p><strong>Warden Decision:</strong> {format(new Date(leave.wardenDecidedAt), 'MMM d, HH:mm')}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {(leave.status === 'pending_parent' || leave.status === 'pending_warden') && 
             canApprove(leave) && (
              <div className="flex gap-2 ml-4">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleApprove(leave.id, 
                    leave.status === 'pending_parent' ? 'parent' : 'warden'
                  )}
                >
                  <Check size={14} className="mr-1" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => {
                    setSelectedLeave(leave);
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

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal && !!selectedLeave}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedLeave(null);
          setRejectReason('');
        }}
        title="Reject Leave Request"
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
                setSelectedLeave(null);
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