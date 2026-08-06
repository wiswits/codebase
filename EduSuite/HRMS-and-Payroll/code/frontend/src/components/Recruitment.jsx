// frontend/src/components/Recruitment.jsx
import { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';

const API_URL = 'http://localhost:5000';

function Recruitment() {
  const { showToast } = useToast();
  const [postings, setPostings] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJobForm, setShowJobForm] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const [jobForm, setJobForm] = useState({
    title: '', department: '', location: '', employment_type: 'FULL_TIME',
    description: '', requirements: '', salary_range: '', status: 'DRAFT'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [postingsRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/recruitment/postings`)
      ]);
      const postingsData = await postingsRes.json();
      setPostings(postingsData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async (jobId) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/recruitment/applications/${jobId}`);
      const data = await response.json();
      setApplications(data.data || []);
      setSelectedJob(jobId);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const handleJobSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/v1/recruitment/postings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobForm)
      });
      if (response.ok) {
        showToast('✅ Job posting created!', 'success');
        fetchData();
        setShowJobForm(false);
        setJobForm({ title: '', department: '', location: '', employment_type: 'FULL_TIME', description: '', requirements: '', salary_range: '', status: 'DRAFT' });
      }
    } catch (error) {
      showToast('❌ Failed to create job posting', 'error');
    }
  };

  const handleUpdateStatus = async (appId, status) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/recruitment/applications/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        showToast(`✅ Application ${status}`, 'success');
        if (selectedJob) fetchApplications(selectedJob);
      }
    } catch (error) {
      showToast('❌ Failed to update status', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-700',
      OPEN: 'bg-green-100 text-green-700',
      CLOSED: 'bg-red-100 text-red-700',
      ON_HOLD: 'bg-yellow-100 text-yellow-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getAppStatusBadge = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-700',
      REVIEWED: 'bg-blue-100 text-blue-700',
      SHORTLISTED: 'bg-purple-100 text-purple-700',
      INTERVIEWED: 'bg-indigo-100 text-indigo-700',
      OFFERED: 'bg-green-100 text-green-700',
      HIRED: 'bg-emerald-100 text-emerald-700',
      REJECTED: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) return <div className="text-center py-4">Loading recruitment...</div>;

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-800 dark:text-white">🎯 Recruitment / ATS</h3>
        <button
          onClick={() => setShowJobForm(!showJobForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
        >
          {showJobForm ? 'Cancel' : '+ New Job Posting'}
        </button>
      </div>

      {showJobForm && (
        <form onSubmit={handleJobSubmit} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input type="text" placeholder="Job Title" value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white" required />
            <input type="text" placeholder="Department" value={jobForm.department} onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white" required />
            <input type="text" placeholder="Location" value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white" required />
            <select value={jobForm.employment_type} onChange={(e) => setJobForm({ ...jobForm, employment_type: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white">
              <option value="FULL_TIME">Full Time</option>
              <option value="PART_TIME">Part Time</option>
              <option value="CONTRACT">Contract</option>
              <option value="INTERN">Intern</option>
            </select>
            <textarea placeholder="Description" value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white col-span-2" rows="3" required />
            <textarea placeholder="Requirements" value={jobForm.requirements} onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white col-span-2" rows="2" />
            <input type="text" placeholder="Salary Range (e.g. ₹5L-8L)" value={jobForm.salary_range} onChange={(e) => setJobForm({ ...jobForm, salary_range: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
            <select value={jobForm.status} onChange={(e) => setJobForm({ ...jobForm, status: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 dark:text-white">
              <option value="DRAFT">Draft</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
              <option value="ON_HOLD">On Hold</option>
            </select>
          </div>
          <button type="submit" className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Create Job Posting</button>
        </form>
      )}

      {/* Job Postings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {postings.map(job => (
          <div key={job.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 dark:text-white">{job.title}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{job.department} • {job.location}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{job.employment_type} • {job.salary_range || 'Salary not specified'}</p>
                <span className={`text-xs px-2 py-1 rounded ${getStatusBadge(job.status)}`}>{job.status}</span>
              </div>
              <button
                onClick={() => fetchApplications(job.id)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                View Apps
              </button>
            </div>
          </div>
        ))}
        {postings.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8 col-span-2">No job postings yet</div>
        )}
      </div>

      {/* Applications */}
      {selectedJob && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-bold text-gray-800 dark:text-white">📋 Applications</h4>
            <button onClick={() => setSelectedJob(null)} className="text-gray-500 hover:text-gray-700 text-sm">Close</button>
          </div>
          {applications.length === 0 ? (
            <div className="text-center text-gray-500 py-4">No applications yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {applications.map(app => (
                    <tr key={app.id}>
                      <td className="px-3 py-2 text-sm text-gray-800 dark:text-white">{app.applicant_name}</td>
                      <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-300">{app.applicant_email}</td>
                      <td className="px-3 py-2">
                        <span className={`text-xs px-2 py-1 rounded ${getAppStatusBadge(app.status)}`}>{app.status}</span>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={app.status}
                          onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                          className="text-xs border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="REVIEWED">Reviewed</option>
                          <option value="SHORTLISTED">Shortlisted</option>
                          <option value="INTERVIEWED">Interviewed</option>
                          <option value="OFFERED">Offered</option>
                          <option value="HIRED">Hired</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Recruitment;