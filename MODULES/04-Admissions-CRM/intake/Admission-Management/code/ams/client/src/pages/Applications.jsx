import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Search, Download, Eye } from 'lucide-react';
import { applicationService } from '../services/applicationService';
import { documentService, testService, offerService, interviewService } from '../services/domainServices';
import { Card, Badge, LoadingBlock, EmptyState } from '../components/common/UI';
import { Modal, Pagination } from '../components/common/Modal';

const STATUSES = [
  'Submitted', 'Documents Pending', 'Documents Verified', 'Test Scheduled', 'Test Qualified',
  'Below Cutoff', 'Interview Scheduled', 'Interviewed', 'Offer Sent', 'Accepted', 'Rejected',
  'Withdrawn', 'Admitted', 'Waitlisted',
];

const Applications = () => {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['applications', status, search, page],
    queryFn: () => applicationService.list({ status: status || undefined, search: search || undefined, page, limit: 10 }),
  });

  const applications = data?.data?.applications || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <h1 className="text-lg font-bold text-gray-800">Application List</h1>
        <div className="flex flex-wrap gap-2">
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="text-sm border border-gray-200 rounded-lg px-2.5 py-2 bg-white">
            <option value="">All Status</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search application no. or name..." className="pl-7 pr-2.5 py-2 text-sm border border-gray-200 rounded-lg w-64" />
          </div>
        </div>
      </div>

      <Card>
        {isLoading ? (
          <LoadingBlock />
        ) : applications.length === 0 ? (
          <EmptyState label="No applications found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-100">
                  <th className="py-2 pr-3">App. No.</th>
                  <th className="py-2 pr-3">Student Name</th>
                  <th className="py-2 pr-3">Class</th>
                  <th className="py-2 pr-3">Source</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Applied On</th>
                  <th className="py-2 pr-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a) => (
                  <tr key={a._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 pr-3 font-medium text-gray-700">{a.applicationNo}</td>
                    <td className="py-2.5 pr-3">{a.student?.name}</td>
                    <td className="py-2.5 pr-3">{a.student?.classAppliedFor}</td>
                    <td className="py-2.5 pr-3">{a.source}</td>
                    <td className="py-2.5 pr-3"><Badge>{a.status}</Badge></td>
                    <td className="py-2.5 pr-3 text-gray-500">{new Date(a.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="py-2.5 pr-3">
                      <button onClick={() => setSelected(a._id)} className="text-blue-600 hover:text-blue-800">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={data?.data?.page || 1} pages={data?.data?.pages || 1} onChange={setPage} />
      </Card>

      <ApplicationDetailModal
        applicationId={selected}
        onClose={() => setSelected(null)}
        onUpdated={() => qc.invalidateQueries({ queryKey: ['applications'] })}
      />
    </div>
  );
};

const ApplicationDetailModal = ({ applicationId, onClose, onUpdated }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['application', applicationId],
    queryFn: () => applicationService.get(applicationId),
    enabled: !!applicationId,
  });

  const app = data?.data?.application;
  const documents = data?.data?.documents || [];

  const changeStatus = async (status) => {
    try {
      await applicationService.updateStatus(applicationId, status);
      toast.success('Status updated');
      onUpdated();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const generateOffer = async () => {
    try {
      await offerService.generate(applicationId, { tokenAmount: 10000, validDays: 10 });
      toast.success('Offer letter generated and sent');
      onUpdated();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal open={!!applicationId} onClose={onClose} title={app?.applicationNo || 'Application'} width="max-w-2xl">
      {isLoading || !app ? (
        <LoadingBlock />
      ) : (
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <Info label="Student" value={app.student?.name} />
            <Info label="Class" value={app.student?.classAppliedFor} />
            <Info label="Parent Phone" value={app.parent?.phone} />
            <Info label="Parent Email" value={app.parent?.email} />
            <Info label="Source" value={app.source} />
            <Info label="Quota Category" value={app.quotaCategory} />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-500">Status:</span>
            <Badge>{app.status}</Badge>
          </div>

          <div>
            <label className="text-xs text-gray-500">Update status</label>
            <select
              className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2"
              value={app.status}
              onChange={(e) => changeStatus(e.target.value)}
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="border-t border-gray-100 pt-3">
            <p className="font-medium text-gray-700 mb-2">Documents ({documents.filter(d=>d.status==='Verified').length}/{documents.length} verified)</p>
            <div className="space-y-1">
              {documents.map((d) => (
                <div key={d._id} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-2.5 py-1.5">
                  <span>{d.docType}</span>
                  <Badge>{d.status}</Badge>
                </div>
              ))}
            </div>
          </div>

          {app.status === 'Interviewed' && !app.offer && (
            <button onClick={generateOffer} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg">
              Generate Offer Letter
            </button>
          )}
        </div>
      )}
    </Modal>
  );
};

const Info = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-400">{label}</p>
    <p className="text-gray-700 font-medium">{value || '-'}</p>
  </div>
);

export default Applications;
