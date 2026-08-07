import React, { useState, useRef } from 'react';
import { FaUpload, FaFile, FaImage, FaFilePdf, FaFileWord, FaFileExcel, FaTimes, FaDownload } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { formatFileSize } from '../../utils/helpers';

const FileSharing = ({ onFileUpload, files = [], onFileDelete }) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    await uploadFiles(selectedFiles);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    await uploadFiles(droppedFiles);
  };

  const uploadFiles = async (fileList) => {
    if (fileList.length === 0) return;

    setUploading(true);
    try {
      // In a real implementation, you would upload to a file service
      // and then call onFileUpload with the results
      const uploadedFiles = fileList.map(file => ({
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file)
      }));

      if (onFileUpload) {
        onFileUpload(uploadedFiles);
      }
      toast.success(`${uploadedFiles.length} file(s) uploaded successfully`);
    } catch (error) {
      toast.error('Failed to upload files');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getFileIcon = (file) => {
    const type = file.type || '';
    if (type.startsWith('image/')) return <FaImage className="text-blue-500" />;
    if (type === 'application/pdf') return <FaFilePdf className="text-red-500" />;
    if (type.includes('word') || type.includes('document')) return <FaFileWord className="text-blue-600" />;
    if (type.includes('sheet') || type.includes('excel')) return <FaFileExcel className="text-green-600" />;
    return <FaFile className="text-gray-500" />;
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <FaUpload className="mx-auto text-gray-400 text-3xl mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Drag and drop files here, or{' '}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            browse
          </button>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          Supports images, documents, and more (max 10MB per file)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {uploading && (
        <div className="flex items-center justify-center py-2">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-indigo-600"></div>
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Uploading...</span>
        </div>
      )}

      {files && files.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <div className="flex-shrink-0">
                  {getFileIcon(file)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 flex-shrink-0">
                {file.url && (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <FaDownload size={14} />
                  </a>
                )}
                {onFileDelete && (
                  <button
                    onClick={() => onFileDelete(file.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <FaTimes size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileSharing;