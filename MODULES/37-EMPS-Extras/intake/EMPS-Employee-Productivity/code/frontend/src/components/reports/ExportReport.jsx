import React, { useState } from 'react';
import { FaDownload, FaFilePdf, FaFileExcel, FaFileAlt } from 'react-icons/fa';
import { reportApi } from '../../api/reportApi';
import { toast } from 'react-toastify';

const ExportReport = ({ reportId, data, format = 'pdf' }) => {
  const [exporting, setExporting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleExport = async (exportFormat) => {
    setExporting(true);
    try {
      // In a real implementation, you would call the export API
      // const response = await reportApi.export(reportId, { format: exportFormat });
      
      // Mock download
      const blob = new Blob(['Mock report data'], { 
        type: exportFormat === 'pdf' ? 'application/pdf' : 
              exportFormat === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 
              'text/csv'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report.${exportFormat === 'pdf' ? 'pdf' : exportFormat === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success(`Report exported as ${exportFormat.toUpperCase()}`);
      setShowOptions(false);
    } catch (error) {
      toast.error('Failed to export report');
      console.error('Export error:', error);
    } finally {
      setExporting(false);
    }
  };

  const exportOptions = [
    { format: 'pdf', icon: FaFilePdf, label: 'PDF', color: 'text-red-500' },
    { format: 'excel', icon: FaFileExcel, label: 'Excel', color: 'text-green-500' },
    { format: 'csv', icon: FaFileAlt, label: 'CSV', color: 'text-blue-500' }
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={exporting}
        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
      >
        {exporting ? (
          <>
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <FaDownload />
            <span>Export</span>
          </>
        )}
      </button>

      {showOptions && !exporting && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50">
          {exportOptions.map((option) => (
            <button
              key={option.format}
              onClick={() => handleExport(option.format)}
              className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <option.icon className={option.color} />
              <span>Export as {option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExportReport;