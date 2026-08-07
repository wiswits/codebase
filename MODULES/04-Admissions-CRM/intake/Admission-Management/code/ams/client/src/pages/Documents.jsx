import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Check, X, Eye } from 'lucide-react';
import { documentService } from '../services/domainServices';
import { Card, Badge, LoadingBlock, EmptyState } from '../components/common/UI';
import { Modal } from '../components/common/Modal';
import { API_BASE_URL } from '../services/api';

const Documents = () => {
  const qc = useQueryClient();
  const [rejectTarget, setRejectTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['verification-queue'],
    queryFn: () => documentService.verificationQueue(),
  });

  const documents = data?.data?.documents || [];
  const serverOrigin = API_BASE_URL.replace(/\/api$/, '');

  const verify = async (docId, decision, reason) => {
    try {
      await documentService.verify(docId, decision, reason);
      toast.success(`Document ${decision.toLowerCase()}`);
      qc.invalidateQueries({ queryKey: ['verification-queue'] });
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-gray-800">Document Verification Queue</h1>
      <Card title={`Pending Verification (${documents.length})`}>
        {isLoading ? (
          <LoadingBlock />
        ) : documents.length === 0 ? (
          <EmptyState label="Nothing pending verification 🎉" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-100">
                  <th className="py-2 pr-3">Document Type</th>
                  <th className="py-2 pr-3">Application No.</th>
                  <th className="py-2 pr-3">Student</th>
                  <th className="py-2 pr-3">File</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((d) => (
                  <tr key={d._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 pr-3">{d.docType}</td>
                    <td className="py-2.5 pr-3 font-medium text-gray-700">{d.application?.applicationNo}</td>
                    <td className="py-2.5 pr-3">{d.application?.student?.name}</td>
                    <td className="py-2.5 pr-3">
                      {d.filePath ? (
                        <a href={`${serverOrigin}${d.filePath}`} target="_blank" rel="noreferrer" className="text-blue-600 flex items-center gap-1">
                          <Eye size={14} /> View
                        </a>
                      ) : (
                        <span className="text-gray-400 text-xs">Not uploaded</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-3"><Badge>{d.status}</Badge></td>
                    <td className="py-2.5 pr-3">
                      {d.filePath && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => verify(d._id, 'Verified')} className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-md">
                            <Check size={15} />
                          </button>
                          <button onClick={() => setRejectTarget(d)} className="text-red-600 hover:bg-red-50 p-1.5 rounded-md">
                            <X size={15} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <RejectModal
        doc={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={(reason) => {
          verify(rejectTarget._id, 'Rejected', reason);
          setRejectTarget(null);
        }}
      />
    </div>
  );
};

const RejectModal = ({ doc, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  if (!doc) return null;
  return (
    <Modal open={!!doc} onClose={onClose} title={`Reject ${doc.docType}`} width="max-w-sm">
      <p className="text-xs text-gray-500 mb-2">A reason is required. The applicant will be asked to re-upload.</p>
      <textarea
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        rows={3}
        placeholder="e.g. Document illegible, wrong document uploaded..."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <button
        disabled={!reason.trim()}
        onClick={() => onConfirm(reason)}
        className="mt-3 w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm"
      >
        Confirm Rejection
      </button>
    </Modal>
  );
};

export default Documents;
