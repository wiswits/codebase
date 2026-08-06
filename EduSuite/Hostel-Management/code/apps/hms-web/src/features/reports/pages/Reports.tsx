import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  BarChart3, 
  PieChart, 
  Users, 
  DollarSign,
  Building2,
  Calendar,
  Download
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { useHostels } from '../../hierarchy/hooks/useHostels';
import { OccupancyReport } from '../components/OccupancyReport';
import { VacancyReport } from '../components/VacancyReport';
import { AttendanceReport } from '../components/AttendanceReport';
import { RevenueReport } from '../components/RevenueReport';

type ReportType = 'occupancy' | 'vacancy' | 'attendance' | 'revenue';

export const Reports: React.FC = () => {
  const navigate = useNavigate();
  const { hostels } = useHostels();
  const [selectedHostelId, setSelectedHostelId] = useState<string>('');
  const [reportType, setReportType] = useState<ReportType>('occupancy');

  const hostelOptions = hostels?.map(h => ({
    value: h.id,
    label: `${h.name} (${h.code})`,
  })) || [];

  const reportOptions = [
    { value: 'occupancy', label: 'Occupancy Report', icon: PieChart },
    { value: 'vacancy', label: 'Vacancy Report', icon: BarChart3 },
    { value: 'attendance', label: 'Attendance Report', icon: Users },
    { value: 'revenue', label: 'Revenue Report', icon: DollarSign },
  ];

  const renderReport = () => {
    if (!selectedHostelId) {
      return (
        <Card className="p-12">
          <div className="text-center text-gray-500">
            <BarChart3 size={48} className="mx-auto mb-4 opacity-30" />
            <p>Select a hostel to view reports</p>
            <p className="text-sm">Choose a hostel from the dropdown above</p>
          </div>
        </Card>
      );
    }

    switch (reportType) {
      case 'occupancy':
        return <OccupancyReport hostelId={selectedHostelId} />;
      case 'vacancy':
        return <VacancyReport hostelId={selectedHostelId} />;
      case 'attendance':
        return <AttendanceReport hostelId={selectedHostelId} />;
      case 'revenue':
        return <RevenueReport hostelId={selectedHostelId} />;
      default:
        return null;
    }
  };

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
          <h1 className="text-2xl font-display">Reports & Analytics</h1>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Hostel
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
              Report Type
            </label>
            <Select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              options={reportOptions.map(opt => ({
                value: opt.value,
                label: opt.label,
              }))}
            />
          </div>
          <div className="flex items-end justify-end">
            {selectedHostelId && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">
                  <Building2 size={14} className="inline mr-1" />
                  {hostels?.find(h => h.id === selectedHostelId)?.name}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Report Content */}
      {renderReport()}
    </div>
  );
};