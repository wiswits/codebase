import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft, Users, QrCode } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Select } from '../../../components/ui/Select';
import { AttendanceRoster } from '../components/AttendanceRoster';
import { QRScannerComponent } from '../components/QRScanner';
import { MissingStudentsAlert } from '../components/MissingStudentsAlert';
import { useHostels } from '../../hierarchy/hooks/useHostels';

export const Attendance: React.FC = () => {
  const navigate = useNavigate();
  const { hostels } = useHostels();
  const [selectedHostelId, setSelectedHostelId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<'roster' | 'qr'>('roster');

  const hostelOptions = hostels?.map(h => ({
    value: h.id,
    label: `${h.name} (${h.code})`,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-display">Attendance Management</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === 'roster' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setView('roster')}
          >
            <Users size={14} className="mr-1" />
            Roster
          </Button>
          <Button
            variant={view === 'qr' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setView('qr')}
          >
            <QrCode size={14} className="mr-1" />
            QR Scanner
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Hostel *
            </label>
            <Select
              value={selectedHostelId}
              onChange={(e) => setSelectedHostelId(e.target.value)}
              options={[
                { value: '', label: 'Select a hostel...' },
                ...hostelOptions,
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="w-full rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-apex-gold focus:border-transparent"
            />
          </div>
        </div>
      </Card>

      {selectedHostelId && (
        <>
          <MissingStudentsAlert
            hostelId={selectedHostelId}
            date={selectedDate}
          />

          {view === 'roster' ? (
            <AttendanceRoster
              hostelId={selectedHostelId}
              date={selectedDate}
            />
          ) : (
            <QRScannerComponent
              hostelId={selectedHostelId}
              onScanSuccess={() => {
                // Refresh roster after successful scan
              }}
            />
          )}
        </>
      )}

      {!selectedHostelId && (
        <Card className="p-12">
          <div className="text-center text-gray-500">
            <Users size={48} className="mx-auto mb-4 opacity-30" />
            <p>Select a hostel to manage attendance</p>
            <p className="text-sm">Choose a hostel from the dropdown above</p>
          </div>
        </Card>
      )}
    </div>
  );
};