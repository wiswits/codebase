import React, { useState } from 'react';
import { QrScanner } from '@yudiel/react-qr-scanner';
import { Check, X, User, Clock, AlertCircle, DoorOpen, DoorClosed } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { gatePassApi } from '../../../api/generated/leave';

interface GatePassScannerProps {
  onScanSuccess?: (data: any) => void;
}

export const GatePassScanner: React.FC<GatePassScannerProps> = ({
  onScanSuccess,
}) => {
  const [isScanningMode, setIsScanningMode] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [direction, setDirection] = useState<'exit' | 'entry'>('exit');

  const handleScan = async (result: string) => {
    try {
      setError(null);
      const response = await gatePassApi.scan(result, direction);
      
      setScanResult({
        success: response.valid,
        message: response.valid 
          ? `Gate pass ${direction === 'exit' ? 'exit' : 'entry'} recorded for ${response.studentName}`
          : response.error || 'Invalid gate pass',
        data: response,
      });
      
      if (response.valid) {
        onScanSuccess?.(response);
      }
      
      // Auto-close after 3 seconds on success
      if (response.valid) {
        setTimeout(() => {
          setScanResult(null);
          setIsScanningMode(false);
        }, 3000);
      }
    } catch (err) {
      setScanResult({
        success: false,
        message: err instanceof Error ? err.message : 'Invalid QR code',
      });
      setError(err instanceof Error ? err.message : 'Scan failed');
    }
  };

  const handleError = (err: unknown) => {
    console.error('QR Scanner error:', err);
    setError('Failed to access camera. Please check permissions.');
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg">Gate Pass Scanner</h3>
        <div className="flex gap-2">
          <Button
            variant={direction === 'exit' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setDirection('exit')}
          >
            <DoorOpen size={14} className="mr-1" />
            Exit
          </Button>
          <Button
            variant={direction === 'entry' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setDirection('entry')}
          >
            <DoorClosed size={14} className="mr-1" />
            Entry
          </Button>
          <Button
            variant={isScanningMode ? 'secondary' : 'primary'}
            onClick={() => {
              setIsScanningMode(!isScanningMode);
              setScanResult(null);
              setError(null);
            }}
          >
            {isScanningMode ? (
              <>
                <X size={16} className="mr-2" />
                Stop
              </>
            ) : (
              <>
                <Camera size={16} className="mr-2" />
                Scan
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <AlertCircle size={14} />
        <span>Scanning for: <strong className="capitalize">{direction}</strong></span>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {isScanningMode && (
        <div className="relative">
          <div className="aspect-square max-w-md mx-auto overflow-hidden rounded-lg bg-black">
            <QrScanner
              onDecode={handleScan}
              onError={handleError}
              constraints={{
                facingMode: 'environment',
              }}
            />
          </div>
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-white border-opacity-50 rounded-lg" />
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">
            Scan student QR code or gate pass
          </p>
        </div>
      )}

      {scanResult && (
        <div className={`
          mt-4 p-4 rounded-lg flex items-center gap-3
          ${scanResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}
        `}>
          {scanResult.success ? (
            <Check size={20} className="text-green-600" />
          ) : (
            <X size={20} className="text-red-600" />
          )}
          <div className="flex-1">
            <p className={`font-medium ${scanResult.success ? 'text-green-800' : 'text-red-800'}`}>
              {scanResult.message}
            </p>
            {scanResult.data?.leave && (
              <div className="text-sm text-gray-600 mt-1 space-y-1">
                <div className="flex items-center gap-1">
                  <User size={14} />
                  <span>Student: {scanResult.data.studentName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>
                    Valid: {new Date(scanResult.data.leave.fromTs).toLocaleString()} - 
                    {new Date(scanResult.data.leave.toTs).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        <p>Instructions:</p>
        <ul className="list-disc list-inside ml-2 space-y-1">
          <li>Select <strong>Exit</strong> when student is leaving the hostel</li>
          <li>Select <strong>Entry</strong> when student is returning</li>
          <li>Both exit and entry scans are required for attendance</li>
          <li>Only valid gate passes with approved leave will work</li>
        </ul>
      </div>
    </Card>
  );
};