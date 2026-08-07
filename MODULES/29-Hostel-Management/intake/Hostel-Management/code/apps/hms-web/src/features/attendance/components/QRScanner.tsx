import React, { useState, useRef } from 'react';
import { QrScanner } from '@yudiel/react-qr-scanner';
import { Check, X, Camera, AlertCircle, User, Clock } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAttendance } from '../hooks/useAttendance';
import type { Attendance } from '@shared/schemas/attendance';

interface QRScannerProps {
  hostelId: string;
  onScanSuccess?: (attendance: Attendance) => void;
}

export const QRScannerComponent: React.FC<QRScannerProps> = ({
  hostelId,
  onScanSuccess,
}) => {
  const { scanQR, isScanning } = useAttendance(hostelId);
  const [isScanningMode, setIsScanningMode] = useState(false);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    data?: Attendance;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async (result: string) => {
    try {
      setError(null);
      const attendance = await scanQR({
        passCode: result,
        deviceId: 'web-scanner',
      });
      
      setScanResult({
        success: true,
        message: `Attendance marked for student`,
        data: attendance,
      });
      
      onScanSuccess?.(attendance);
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        setScanResult(null);
        setIsScanningMode(false);
      }, 3000);
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
        <h3 className="font-display text-lg">QR Scanner</h3>
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
              Stop Scanning
            </>
          ) : (
            <>
              <Camera size={16} className="mr-2" />
              Start Scanning
            </>
          )}
        </Button>
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
            Position QR code within the frame
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
            {scanResult.data && (
              <div className="text-sm text-gray-600 mt-1">
                <User size={14} className="inline mr-1" />
                Student ID: {scanResult.data.apexStudentId}
                <Clock size={14} className="inline ml-3 mr-1" />
                {new Date(scanResult.data.markedAt).toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        <p>Scan QR codes from:</p>
        <ul className="list-disc list-inside ml-2">
          <li>Student ID cards</li>
          <li>Gate passes</li>
          <li>Attendance QR codes displayed in hostel</li>
        </ul>
      </div>
    </Card>
  );
};