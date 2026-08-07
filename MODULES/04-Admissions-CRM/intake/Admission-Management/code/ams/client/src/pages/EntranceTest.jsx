import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, UploadCloud } from 'lucide-react';
import { testService } from '../services/domainServices';
import { Card, Badge, LoadingBlock, EmptyState } from '../components/common/UI';
import { Modal, Pagination } from '../components/common/Modal';

const EntranceTest = () => {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [activeTest, setActiveTest] = useState(null);
  const [page, setPage] = useState(1);

  const { data: testsData, isLoading: testsLoading } = useQuery({ queryKey: ['tests'], queryFn: () => testService.list() });
  const tests = testsData?.data?.tests || [];
  const selectedTest = activeTest || tests[0];

  const { data: resultsData, isLoading: resultsLoading } = useQuery({
    queryKey: ['test-results', selectedTest?._id, page],
    queryFn: () => testService.results(selectedTest._id, { page, limit: 10 }),
    enabled: !!selectedTest,
  });
  const results = resultsData?.data?.results || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-bold text-gray-800">Entrance Test — Results &amp; Rank</h1>
        <div className="flex gap-2">
          <button onClick={() => setCreateOpen(true)} className="flex items-center gap-1.5 text-sm font-medium border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50">
            <Plus size={15} /> New Test
          </button>
          {selectedTest && (
            <button onClick={() => setUploadOpen(true)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-lg">
              <UploadCloud size={15} /> Bulk Upload Results
            </button>
          )}
        </div>
      </div>

      <Card>
        {testsLoading ? (
          <LoadingBlock />
        ) : tests.length === 0 ? (
          <EmptyState label="No tests created yet" />
        ) : (
          <div className="flex flex-wrap gap-2 mb-4">
            {tests.map((t) => (
              <button
                key={t._id}
                onClick={() => { setActiveTest(t); setPage(1); }}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
                  selectedTest?._id === t._id ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t.name} &middot; {t.classApplied}
              </button>
            ))}
          </div>
        )}

        {selectedTest && (
          resultsLoading ? (
            <LoadingBlock />
          ) : results.length === 0 ? (
            <EmptyState label="No results uploaded yet for this test" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase border-b border-gray-100">
                    <th className="py-2 pr-3">Roll No.</th>
                    <th className="py-2 pr-3">Application No.</th>
                    <th className="py-2 pr-3">Student Name</th>
                    <th className="py-2 pr-3">Marks</th>
                    <th className="py-2 pr-3">Percentile</th>
                    <th className="py-2 pr-3">Rank</th>
                    <th className="py-2 pr-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 pr-3">{r.rollNo || '-'}</td>
                      <td className="py-2.5 pr-3 font-medium text-gray-700">{r.application?.applicationNo}</td>
                      <td className="py-2.5 pr-3">{r.application?.student?.name}</td>
                      <td className="py-2.5 pr-3">{r.marksObtained}/{r.maxMarks}</td>
                      <td className="py-2.5 pr-3">{r.percentile}</td>
                      <td className="py-2.5 pr-3">{r.rankOverall}</td>
                      <td className="py-2.5 pr-3">
                        <Badge color={r.belowCutoff ? 'red' : 'green'}>{r.belowCutoff ? 'Below Cutoff' : 'Qualified'}</Badge>
                        {r.cutoffOverride && <span className="ml-1 text-[10px] text-amber-600">(overridden)</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination page={resultsData?.data?.page || 1} pages={resultsData?.data?.pages || 1} onChange={setPage} />
            </div>
          )
        )}
      </Card>

      <CreateTestModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => qc.invalidateQueries({ queryKey: ['tests'] })} />
      {selectedTest && (
        <BulkUploadModal
          test={selectedTest}
          open={uploadOpen}
          onClose={() => setUploadOpen(false)}
          onDone={() => qc.invalidateQueries({ queryKey: ['test-results'] })}
        />
      )}
    </div>
  );
};

const CreateTestModal = ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState({ name: '', classApplied: 'Class 5', maxMarks: 100, date: '', venue: '', cutoff: 0 });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await testService.create(form);
      toast.success('Test created');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Entrance Test">
      <form onSubmit={submit} className="space-y-3 text-sm">
        <div>
          <label className="block text-gray-600 mb-1">Test Name</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2" placeholder="e.g. Class 5 Scholarship Test" />
        </div>
        <div>
          <label className="block text-gray-600 mb-1">Class</label>
          <input required value={form.classApplied} onChange={(e) => setForm({ ...form, classApplied: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-gray-600 mb-1">Max Marks</label>
            <input type="number" value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: Number(e.target.value) })} className="w-full border border-gray-200 rounded-lg px-3 py-2" />
          </div>
          <div>
            <label className="block text-gray-600 mb-1">Cutoff</label>
            <input type="number" value={form.cutoff} onChange={(e) => setForm({ ...form, cutoff: Number(e.target.value) })} className="w-full border border-gray-200 rounded-lg px-3 py-2" />
          </div>
        </div>
        <div>
          <label className="block text-gray-600 mb-1">Test Date</label>
          <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="block text-gray-600 mb-1">Venue</label>
          <input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2" />
        </div>
        <button disabled={saving} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg">
          {saving ? 'Creating...' : 'Create Test'}
        </button>
      </form>
    </Modal>
  );
};

const BulkUploadModal = ({ test, open, onClose, onDone }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const submit = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await testService.bulkUpload(test._id, file);
      setResult(res.data);
      toast.success(`Processed ${res.data.processed} of ${res.data.totalRows} rows`);
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Bulk Upload Results — ${test.name}`}>
      <p className="text-xs text-gray-500 mb-3">
        CSV columns required: <code className="bg-gray-100 px-1 rounded">rollNo,applicationNo,marksObtained</code>
      </p>
      <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} className="text-sm mb-3" />
      <button disabled={!file || uploading} onClick={submit} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm">
        {uploading ? 'Processing...' : 'Upload & Process'}
      </button>

      {result && (
        <div className="mt-3 text-xs bg-gray-50 rounded-lg p-3 space-y-1">
          <p>Processed: {result.processed} / {result.totalRows}</p>
          {result.errors?.length > 0 && (
            <div className="text-red-600 max-h-24 overflow-y-auto">
              {result.errors.map((e, i) => <p key={i}>{e}</p>)}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default EntranceTest;
