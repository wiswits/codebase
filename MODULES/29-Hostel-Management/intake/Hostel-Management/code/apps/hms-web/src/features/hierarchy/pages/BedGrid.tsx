import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowLeft, Bed as BedIcon, User } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { useHostels } from '../hooks/useHostels';
import { bedApi } from '../../../api/generated/hierarchy';
import { BED_STATUS_COLORS } from '../../../lib/constants';
import type { Bed } from '@shared/schemas/hostel';

export const BedGrid: React.FC = () => {
  const { hostelId } = useParams<{ hostelId: string }>();
  const navigate = useNavigate();
  const { hostels } = useHostels();
  const [filter, setFilter] = useState<'all' | 'vacant' | 'occupied' | 'blocked' | 'reserved'>('all');
  
  const { data: beds, isLoading } = bedApi.getAvailable({
    hostelId,
    status: filter === 'all' ? undefined : filter,
  });

  const hostel = hostels?.find(h => h.id === hostelId);

  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: beds?.length || 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 5,
  });

  const getStatusColor = (status: Bed['status']) => {
    return BED_STATUS_COLORS[status] || 'bg-gray-100';
  };

  const getStatusLabel = (status: Bed['status']) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleBedClick = (bed: Bed) => {
    if (bed.status === 'vacant') {
      navigate(`/allocate?bed=${bed.id}`);
    } else if (bed.status === 'occupied') {
      // Open student drawer
      console.log('View student in bed:', bed.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-apex-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/hostels`)}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-display">{hostel?.name || 'Bed Grid'}</h1>
            <p className="text-sm text-gray-600">
              {beds?.filter(b => b.status === 'occupied').length || 0} occupied · 
              {beds?.filter(b => b.status === 'vacant').length || 0} vacant · 
              {beds?.length || 0} total
            </p>
          </div>
        </div>
        
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          options={[
            { value: 'all', label: 'All Beds' },
            { value: 'vacant', label: 'Vacant' },
            { value: 'occupied', label: 'Occupied' },
            { value: 'blocked', label: 'Blocked' },
            { value: 'reserved', label: 'Reserved' },
          ]}
          className="w-40"
        />
      </div>

      <Card className="p-4">
        <div 
          ref={parentRef}
          className="h-[600px] overflow-auto"
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const bed = beds?.[virtualRow.index];
              if (!bed) return null;

              return (
                <div
                  key={bed.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="p-2"
                >
                  <div
                    className={`rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg ${getStatusColor(bed.status)}`}
                    onClick={() => handleBedClick(bed)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <BedIcon size={20} />
                        <div>
                          <p className="font-medium">{bed.bedLabel}</p>
                          <p className="text-xs opacity-75">Room {bed.roomId}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          bed.status === 'vacant' ? 'bg-green-100 text-green-800' :
                          bed.status === 'occupied' ? 'bg-blue-100 text-blue-800' :
                          bed.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getStatusLabel(bed.status)}
                        </span>
                        {bed.status === 'occupied' && (
                          <User size={16} className="opacity-75" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Legend */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-apex-ivory border-2 border-dashed border-gray-300"></div>
          <span>Vacant</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-apex-navy"></div>
          <span>Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-apex-gold"></div>
          <span>Reserved</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-apex-grey"></div>
          <span>Blocked</span>
        </div>
      </div>
    </div>
  );
};