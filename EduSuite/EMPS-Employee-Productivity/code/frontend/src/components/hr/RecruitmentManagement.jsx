import React, { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaUserPlus, FaFileAlt, FaCalendarAlt, FaSearch } from 'react-icons/fa';
import { toast } from 'react-toastify';

const RecruitmentManagement = () => {
  const [jobs, setJobs] = useState([
    { id: 1, title: 'Senior Software Engineer', department: 'IT', status: 'open', applicants: 45, posted: '2024-01-15' },
    { id: 2, title: 'HR Manager', department: 'HR', status: 'open', applicants: 28, posted: '2024-02-01' },
    { id: 3, title: 'Marketing Specialist', department: 'Marketing', status: 'closed', applicants: 32, posted: '2023-12-10' },
    { id: 4, title: 'Financial Analyst', department: 'Finance', status: 'open', applicants: 19, posted: '2024-02-20' }
  ]);
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    description: '',
    requirements: '',
    status: 'open'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingJob) {
      setJobs(jobs.map(j => j.id === editingJob.id ? { ...j, ...formData } : j));
      toast.success('Job updated successfully');
    } else {
      const newJob = {
        id: jobs.length + 1,
        ...formData,
        applicants: 0,
        posted: new Date().toISOString().split('T')[0]
      };
      setJobs([...jobs, newJob]);
      toast.success('Job posted successfully');
    }
    setShowModal(false);
    setEditingJob(null);
    setFormData({ title: '', department: '', description: '', requirements: '', status: 'open' });
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setFormData(job);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this job posting?')) {
      setJobs(jobs.filter(j => j.id !== id));
      toast.success('Job deleted successfully');
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <FaUserPlus className="text-indigo-600 dark:text-indigo-400 text-xl" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recruitment Management</h2>
        </div>
        <button
          onClick={() => { setShowModal(true); setEditingJob(null); setFormData({ title: '', department: '', description: '', requirements: '', status: 'open' }); }}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <FaPlus />
          <span>Post New Job</span>
        </button>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Search jobs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <FaSearch className="absolute left-3 top-3 text-gray-400" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredJobs.map((job) => (
          <div key={job.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{job.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{job.department}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => handleEdit(job)} className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"><FaEdit size={14} /></button>
                <button onClick={() => handleDelete(job.id)} className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"><FaTrash size={14} /></button>
              </div>
            </div>
            <div className="mt-3 flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center space-x-1"><FaCalendarAlt /><span>Posted: {job.posted}</span></span>
              <span className="flex items-center space-x-1"><FaUserPlus /><span>{job.applicants} applicants</span></span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className={`text-xs px-2 py-1 rounded-full ${job.status === 'open' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                {job.status.toUpperCase()}
              </span>
              <button className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">View Applicants</button>
            </div>
          </div>
        ))}
      </div>

      {filteredJobs.length === 0 && <div className="text-center py-8 text-gray-500 dark:text-gray-400"><p>No jobs found</p></div>}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-screen overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingJob ? 'Edit Job' : 'Post New Job'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Job Title *</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department *</label>
                <input type="text" name="department" value={formData.department} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Requirements</label>
                <textarea name="requirements" value={formData.requirements} onChange={handleChange} rows="3" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button type="button" onClick={() => { setShowModal(false); setEditingJob(null); }} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Cancel</button>
                <button type="submit" className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  <FaSave /><span>{editingJob ? 'Update' : 'Post'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecruitmentManagement;