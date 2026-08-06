import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, X, User, Calendar, Clock, AlertCircle, FileText } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useLeave } from '../hooks/useLeave';
import { useAuth } from '../../../hooks/useAuth';
import type { LeaveRequest } from '@shared/schemas/leave';

export const ParentApproval: React.FC = () => {
  const { leaveId } = useParams<{ leaveId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getLeave, approveLeave, rejectLeave, isLoading } = useLeave();
  const [leave, setLeave] = useState<LeaveRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    if (leaveId) {
      fetchLeave();
    }
  }, [leaveId]);

  const fetchLeave = async () => {
    try {
      const data = await getLeave(leaveId!);
      setLeave(data);
      
      // Check if parent is authorized
      if (!user?.parentOf?.includes(data.apexStudentId)) {
        setError('You are not authorized to approve this leave request.');
      }
    } catch (err) {
      setError('Failed to load leave request.');
    }
  };

  const handleApprove = async () => {
    if (!leave) return;
    try {
      await approveLeave({ 
        id: leave.id, 
        role: 'parent',
        decision: 'approved' 
      });
      navigate('/dashboard', { 
        state: { message: 'Leave request approved successfully!' } 
      });
    } catch (err) {
      setError('Failed to approve leave request.');
    }
  };

  const handleReject = async () => {
    if (!leave || !rejectReason) return;
    try {
      await rejectLeave({ 
        id: leave.id, 
        reason: rejectReason,
        role: 'parent'
      });
      navigate('/dashboard', { 
        state: { message: 'Leave request rejected.' } 
      });
    } catch (err) {
      setError('Failed to reject leave request.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-apex-gold"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-display text-red-600 mb-2">Access Denied</h2>
          <p className="text-gray-600">{error}</p>
          <Button 
            variant="primary" 
            className="mt-4"
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </Button>
        </div>
      </Card>
    );
  }

  if (!leave) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <FileText size={48} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Leave request not found</p>
          <Button 
            variant="primary" 
            className="mt-4"
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display">Leave Request Approval</h1>
          <p className="text-gray-600">Review and approve your child's leave request</p>
        </div>

        <div className="bg-apex-ivory p-4 rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <User size={16} className="text-apex-gold" />
            <span className="font-medium">Student ID:</span>
            <span>{leave.apexStudentId}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-apex-gold" />
            <span className="font-medium">From:</span>
            <span>{new Date(leave.fromTs).toLocaleString()}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-apex-gold" />
            <span className="font-medium">To:</span>
            <span>{new Date(leave.toTs).toLocaleString()}</span>
          </div>
          
          <div className="flex items-start gap-2">
            <FileText size={16} className="text-apex-gold flex-shrink-0 mt-1" />
            <div>
              <span className="font-medium">Reason:</span>
              <p className="mt-1 text-gray-700">{leave.reason}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-start gap-2">
          <AlertCircle size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Important</p>
            <p>By approving this request, you confirm that your child has permission to leave the hostel for the specified duration.</p>
          </div>
        </div>

        {leave.status !== 'pending_parent' ? (
          <div className="text-center py-4">
            <p className="text-gray-600">
              This request has already been {leave.status === 'approved' ? 'approved' : 'rejected'}.
            </p>
          </div>
        ) : (
          <>
            {showRejectForm ? (
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
                      setShowRejectForm(false);
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
                    Confirm Rejection
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  className="text-red-600 hover:bg-red-50"
                  onClick={() => setShowRejectForm(true)}
                >
                  <X size={16} className="mr-2" />
                  Reject
                </Button>
                <Button
                  variant="primary"
                  onClick={handleApprove}
                >
                  <Check size={16} className="mr-2" />
                  Approve Leave
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
};