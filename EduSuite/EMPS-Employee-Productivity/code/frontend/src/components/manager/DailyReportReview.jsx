import React, { useState } from 'react';
import { FaFileAlt, FaCheck, FaTimes, FaEye, FaClock, FaUser } from 'react-icons/fa';
import { toast } from 'react-toastify';

const DailyReportReview = () => {
  const [reports, setReports] = useState([
    { id: 1, employee: 'John Doe', date: '2024-02-15', tasksCompleted: ['Feature A', 'Bug Fix'], tasksPending: ['Feature B'], challenges: 'Database connection issue', plans: 'Complete Feature B', status: 'pending' },
    { id: 2, employee: 'Jane Smith', date: '2024-02-15', tasksCompleted: ['Meeting with team', 'Documentation'], tasksPending: [], challenges: 'None', plans: 'Start new project', status: 'pending' }
  ]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleReview = (reportId, status) => {
    setReports(reports.map(r => r.id === reportId ? { ...r, status } : r));
    toast.success(`Report ${status}`);
    setShowModal(false);
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setShowModal(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <FaFileAlt className="text-indigo-600 dark:text-indigo-400 text-xl" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Daily Report Review</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((report) => (
          <div key={report.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold">
                  {report.employee.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{report.employee}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{report.date}</p>
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${report.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                {report.status.toUpperCase()}
              </span>
            </div>
            <div className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <p><span className="font-medium">Completed:</span> {report.tasksCompleted.join(', ')}</p>
              <p><span className="font-medium">Pending:</span> {report.tasksPending.join(', ') || 'None'}</p>
            </div>
            <button onClick={() => handleViewReport(report)} className="mt-3 w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <FaEye /><span>View Report</span>
            </button>
          </div>
        ))}
      </div>

      {showModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Daily Report Details</h3>
              <button onClick={() => { setShowModal(false); setSelectedReport(null); }} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedReport.employee}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedReport.date}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${selectedReport.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                  {selectedReport.status.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              <div><h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tasks Completed</h4><div className="flex flex-wrap gap-1">{selectedReport.tasksCompleted.map((task, i) => <span key={i} className="text-sm px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg">{task}</span>)}</div></div>
              <div><h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tasks Pending</h4><div className="flex flex-wrap gap-1">{selectedReport.tasksPending.map((task, i) => <span key={i} className="text-sm px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-lg">{task}</span>)}</div></div>
              <div><h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Challenges</h4><p className="text-sm text-gray-600 dark:text-gray-400">{selectedReport.challenges}</p></div>
              <div><h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plans for Tomorrow</h4><p className="text-sm text-gray-600 dark:text-gray-400">{selectedReport.plans}</p></div>
            </div>
            {selectedReport.status === 'pending' && (
              <div className="flex items-center justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button onClick={() => handleReview(selectedReport.id, 'approved')} className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"><FaCheck /><span>Approve</span></button>
                <button onClick={() => handleReview(selectedReport.id, 'rejected')} className="flex items-center space-x-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"><FaTimes /><span>Reject</span></button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyReportReview;