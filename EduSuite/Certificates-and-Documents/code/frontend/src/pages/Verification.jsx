import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Search, 
  QrCode,
  Shield,
  Clock,
  FileCheck,
  AlertCircle,
  Download,
  Copy
} from 'lucide-react';
import axios from '../services/axios';
import toast from 'react-hot-toast';

const Verification = () => {
  const [verificationCode, setVerificationCode] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [scanMode, setScanMode] = useState(false);

  const handleVerify = async () => {
    if (!verificationCode || !documentNumber) {
      toast.error('Please enter both verification code and document number');
      return;
    }

    try {
      setVerifying(true);
      const response = await axios.post('/api/v1/verification/verify', {
        verificationCode,
        documentNumber
      });
      setResult(response.data.data);
      toast.success('Verification completed');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Verification failed');
      setResult(null);
    } finally {
      setVerifying(false);
    }
  };

  const handleQRScan = () => {
    setScanMode(!scanMode);
    // In production, implement QR scanner using react-qr-reader
    toast.info('QR scanning feature coming soon');
  };

  const handleCopyCode = () => {
    if (verificationCode) {
      navigator.clipboard.writeText(verificationCode);
      toast.success('Code copied to clipboard');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">Document Verification</h1>
        <p className="text-gray-500 text-sm">Verify documents using QR code or verification code</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Verification Form */}
        <div className="lg:col-span-2">
          <div className="card">
            <h3 className="font-semibold text-primary mb-4">Verify Document</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                    placeholder="Enter verification code (e.g., VC-ABCD1234)"
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  />
                  <button 
                    onClick={handleCopyCode}
                    className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Number
                </label>
                <input
                  type="text"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="Enter document number"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/30"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleVerify}
                  disabled={verifying}
                  className="btn-primary flex-1"
                >
                  {verifying ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Verify Document
                    </>
                  )}
                </button>
                <button
                  onClick={handleQRScan}
                  className="btn-secondary"
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Scan QR
                </button>
              </div>
            </div>

            {/* Result Display */}
            {result && (
              <div className={`mt-6 p-4 rounded-lg ${result.verified ? 'bg-green-50 border border-green-200' : 'bg-rose-50 border border-rose-200'}`}>
                <div className="flex items-start gap-3">
                  {result.verified ? (
                    <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className={`font-semibold ${result.verified ? 'text-green-800' : 'text-rose-800'}`}>
                      {result.verified ? 'Document Verified' : 'Verification Failed'}
                    </h4>
                    {result.verified && result.document && (
                      <div className="mt-2 space-y-1 text-sm">
                        <p><span className="text-gray-500">Document:</span> {result.document.title}</p>
                        <p><span className="text-gray-500">Number:</span> {result.document.documentNumber}</p>
                        <p><span className="text-gray-500">Organization:</span> {result.document.organization}</p>
                        <p><span className="text-gray-500">Status:</span> {result.document.status}</p>
                        <p><span className="text-gray-500">Issued:</span> {new Date(result.document.issuedAt).toLocaleString()}</p>
                        {result.previouslyVerified && (
                          <p className="text-amber-600 font-medium">⚠️ This document has been verified before</p>
                        )}
                      </div>
                    )}
                    {!result.verified && result.message && (
                      <p className="text-rose-700 text-sm mt-1">{result.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-4">
          <div className="card">
            <h4 className="font-semibold text-primary mb-3">Verification Stats</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Verifications</span>
                <span className="font-semibold text-primary">1,247</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Verified Today</span>
                <span className="font-semibold text-green-600">89</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Failed Attempts</span>
                <span className="font-semibold text-rose-600">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending Verification</span>
                <span className="font-semibold text-amber-600">34</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h4 className="font-semibold text-primary mb-3">Quick Actions</h4>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-secondary" />
                <span className="text-sm">Verify by Hash</span>
              </button>
              <button className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg flex items-center gap-2">
                <Download className="w-4 h-4 text-secondary" />
                <span className="text-sm">Export Report</span>
              </button>
              <button className="w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg flex items-center gap-2">
                <Clock className="w-4 h-4 text-secondary" />
                <span className="text-sm">View History</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Verification;