// frontend/src/components/EmployeeDetail.jsx
import { useState, useEffect } from 'react';
import AppraisalList from './AppraisalList';
import ExitManagement from './ExitManagement';
import SalaryStructure from './SalaryStructure';

const API_URL = 'http://localhost:5000';

function EmployeeDetail({ employeeId, onClose }) {
  const [documents, setDocuments] = useState([]);
  const [qualifications, setQualifications] = useState([]);
  const [cpdRecords, setCpdRecords] = useState([]);
  const [cpdSummary, setCpdSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('documents');

  const [docForm, setDocForm] = useState({ document_name: '', file_path: '' });
  const [qualForm, setQualForm] = useState({ qualification: '', issued_on: '', expires_on: '' });
  const [cpdForm, setCpdForm] = useState({ title: '', provider: '', activity_date: '', hours: '' });

  const currentFY = '2026-27';

  useEffect(() => {
    fetchData();
  }, [employeeId]);

  const fetchData = async () => {
    try {
      const [docsRes, qualRes, cpdRes, summaryRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/documents/employee/${employeeId}`),
        fetch(`${API_URL}/api/v1/documents/qualifications/${employeeId}`),
        fetch(`${API_URL}/api/v1/cpd/records/${employeeId}`),
        fetch(`${API_URL}/api/v1/cpd/summary/${employeeId}/${currentFY}`)
      ]);
      const docsData = await docsRes.json();
      const qualData = await qualRes.json();
      const cpdData = await cpdRes.json();
      const summaryData = await summaryRes.json();
      setDocuments(docsData.data || []);
      setQualifications(qualData.data || []);
      setCpdRecords(cpdData.data || []);
      setCpdSummary(summaryData.data || { verified_hours: 0, target: 50, progress: 0 });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/v1/documents/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          employee_id: employeeId, 
          document_name: docForm.document_name, 
          file_path: docForm.file_path || '/uploads/dummy.pdf' 
        })
      });
      if (response.ok) {
        alert('✅ Document uploaded!');
        fetchData();
        setDocForm({ document_name: '', file_path: '' });
      }
    } catch (error) {
      alert('❌ Network error');
    }
  };

  const handleQualSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/v1/documents/qualifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          employee_id: employeeId, 
          qualification: qualForm.qualification, 
          issued_on: qualForm.issued_on || new Date().toISOString().split('T')[0], 
          expires_on: qualForm.expires_on || null 
        })
      });
      if (response.ok) {
        alert('✅ Qualification added!');
        fetchData();
        setQualForm({ qualification: '', issued_on: '', expires_on: '' });
      }
    } catch (error) {
      alert('❌ Network error');
    }
  };

  const handleCpdSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/v1/cpd/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          employee_id: employeeId, 
          fy: currentFY, 
          title: cpdForm.title, 
          provider: cpdForm.provider, 
          activity_date: cpdForm.activity_date, 
          hours: parseFloat(cpdForm.hours) 
        })
      });
      if (response.ok) {
        alert('✅ CPD activity submitted!');
        fetchData();
        setCpdForm({ title: '', provider: '', activity_date: '', hours: '' });
      }
    } catch (error) {
      alert('❌ Network error');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-2xl">Loading...</div>
      </div>
    );
  }

  const progress = cpdSummary?.progress || 0;
  const verifiedHours = cpdSummary?.verified_hours || 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">👤 Employee Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>

        {/* TABS */}
        <div className="flex gap-2 mb-4 border-b overflow-x-auto">
          <button onClick={() => setActiveTab('documents')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'documents' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>📄 Documents</button>
          <button onClick={() => setActiveTab('qualifications')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'qualifications' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>🎓 Qualifications</button>
          <button onClick={() => setActiveTab('cpd')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'cpd' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>📚 CPD Tracker</button>
          <button onClick={() => setActiveTab('appraisal')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'appraisal' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>📊 Appraisal</button>
          <button onClick={() => setActiveTab('exit')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'exit' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>🚪 Exit</button>
          <button onClick={() => setActiveTab('salary')} className={`px-4 py-2 text-sm font-medium ${activeTab === 'salary' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>💰 Salary</button>
        </div>

        {/* TAB CONTENT */}
        {activeTab === 'documents' && (
          <div>
            <form onSubmit={handleDocSubmit} className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Upload Document</h3>
              <div className="grid grid-cols-1 gap-3">
                <input type="text" placeholder="Document Name (e.g. Aadhaar Card)" value={docForm.document_name} onChange={(e) => setDocForm({ ...docForm, document_name: e.target.value })} className="px-3 py-2 border rounded-lg" required />
                <input type="text" placeholder="File Path (e.g. /uploads/aadhaar.pdf)" value={docForm.file_path} onChange={(e) => setDocForm({ ...docForm, file_path: e.target.value })} className="px-3 py-2 border rounded-lg" />
              </div>
              <button type="submit" className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Upload Document</button>
            </form>
            {documents.map(doc => <div key={doc.id} className="flex justify-between items-center p-3 bg-white border rounded-lg"><span className="font-medium">{doc.document_name}</span><span className="text-xs text-gray-400">{new Date(doc.created_at).toLocaleDateString()}</span></div>)}
            {documents.length === 0 && <div className="text-center text-gray-500 py-4">No documents uploaded</div>}
          </div>
        )}

        {activeTab === 'qualifications' && (
          <div>
            <form onSubmit={handleQualSubmit} className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Add Qualification</h3>
              <div className="grid grid-cols-1 gap-3">
                <input type="text" placeholder="Qualification (e.g. B.Tech CS)" value={qualForm.qualification} onChange={(e) => setQualForm({ ...qualForm, qualification: e.target.value })} className="px-3 py-2 border rounded-lg" required />
                <input type="date" value={qualForm.issued_on} onChange={(e) => setQualForm({ ...qualForm, issued_on: e.target.value })} className="px-3 py-2 border rounded-lg" />
                <input type="date" placeholder="Expires On" value={qualForm.expires_on} onChange={(e) => setQualForm({ ...qualForm, expires_on: e.target.value })} className="px-3 py-2 border rounded-lg" />
              </div>
              <button type="submit" className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Add Qualification</button>
            </form>
            {qualifications.map(qual => <div key={qual.id} className="flex justify-between items-center p-3 bg-white border rounded-lg"><span className="font-medium">{qual.qualification}</span><span className="text-xs text-gray-400">{qual.institution}</span></div>)}
            {qualifications.length === 0 && <div className="text-center text-gray-500 py-4">No qualifications added</div>}
          </div>
        )}

        {activeTab === 'cpd' && (
          <div>
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <h3 className="font-medium text-gray-700 mb-2">📊 CPD Progress {currentFY}</h3>
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24">
                  <div className="w-24 h-24 rounded-full border-8 border-gray-200 absolute"></div>
                  <div className="w-24 h-24 rounded-full border-8 border-blue-600 absolute" style={{ clipPath: `inset(0 ${100 - Math.min(progress, 100)}% 0 0)` }}></div>
                  <div className="absolute inset-0 flex items-center justify-center"><span className="text-xl font-bold text-blue-600">{Math.round(progress)}%</span></div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">✅ Verified: <span className="font-bold">{verifiedHours}</span> / 50 hrs</p>
                  <p className="text-sm text-gray-600">📅 Remaining: <span className="font-bold">{Math.max(0, 50 - verifiedHours)}</span> hrs</p>
                  <p className="text-sm text-gray-600">📋 Activities: <span className="font-bold">{cpdRecords.length}</span></p>
                </div>
              </div>
            </div>
            <form onSubmit={handleCpdSubmit} className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">📚 Log CPD Activity</h3>
              <div className="grid grid-cols-1 gap-3">
                <input type="text" placeholder="Title *" value={cpdForm.title} onChange={(e) => setCpdForm({ ...cpdForm, title: e.target.value })} className="px-3 py-2 border rounded-lg" required />
                <input type="text" placeholder="Provider" value={cpdForm.provider} onChange={(e) => setCpdForm({ ...cpdForm, provider: e.target.value })} className="px-3 py-2 border rounded-lg" />
                <input type="date" value={cpdForm.activity_date} onChange={(e) => setCpdForm({ ...cpdForm, activity_date: e.target.value })} className="px-3 py-2 border rounded-lg" required />
                <input type="number" placeholder="Hours *" value={cpdForm.hours} onChange={(e) => setCpdForm({ ...cpdForm, hours: e.target.value })} className="px-3 py-2 border rounded-lg" required step="0.5" min="0.5" />
              </div>
              <button type="submit" className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">Submit Activity</button>
            </form>
            {cpdRecords.map(record => <div key={record.id} className="flex justify-between items-center p-3 bg-white border rounded-lg"><div><span className="font-medium">{record.title}</span><span className="text-xs text-gray-500 ml-2">{record.hours} hrs</span></div><span className={`text-xs px-2 py-1 rounded ${record.status === 'VERIFIED' ? 'bg-green-100 text-green-700' : record.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{record.status}</span></div>)}
            {cpdRecords.length === 0 && <div className="text-center text-gray-500 py-4">No CPD activities logged</div>}
          </div>
        )}

        {activeTab === 'appraisal' && <AppraisalList employeeId={employeeId} />}
        {activeTab === 'exit' && <ExitManagement employeeId={employeeId} />}
        {activeTab === 'salary' && <SalaryStructure employeeId={employeeId} onClose={() => setActiveTab('documents')} />}
      </div>
    </div>
  );
}

export default EmployeeDetail;