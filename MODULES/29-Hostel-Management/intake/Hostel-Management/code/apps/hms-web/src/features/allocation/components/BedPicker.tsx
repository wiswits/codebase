import React, { useState, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Search, Bed, Building2, Filter } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { bedApi } from '../../../api/generated/hierarchy';
import { BED_STATUS_COLORS } from '../../../lib/constants';
import type { Bed } from '@shared/schemas/hostel';

interface BedPickerProps {
  onSelect: (bedId: string) => void;
  selectedId?: string;
  hostelId?: string;
  gender?: string;
  roomType?: string;
}

export const BedPicker: React.FC<BedPickerProps> = ({
  onSelect,
  selectedId,
  hostelId,
  gender,
  roomType,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRoomType, setFilterRoomType] = useState<string>('all');
  const [filterFloor, setFilterFloor] = useState<string>('all');

  const { data: beds, isLoading } = bedApi.getAvailable({
    hostelId,
    status: 'vacant',
  });

  const parentRef = React.useRef<HTMLDivElement>(null);

  const filteredBeds = useMemo(() => {
    if (!beds) return [];
    
    return beds.filter(bed => {
      // Search filter
      const searchMatch = 
        bed.bedLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bed.roomId.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Room type filter
      const typeMatch = filterRoomType === 'all' || bed.roomType === filterRoomType;
      
      // Floor filter (would need to fetch floor data)
      const floorMatch = filterFloor === 'all' || bed.floorNumber === parseInt(filterFloor);
      
      return searchMatch && typeMatch && floorMatch;
    });
  }, [beds, searchTerm, filterRoomType, filterFloor]);

  const virtualizer = useVirtualizer({
    count: filteredBeds.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  const getStatusColor = (status: Bed['status']) => {
    return BED_STATUS_COLORS[status] || 'bg-gray-100';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-apex-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Search beds..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={filterRoomType}
          onChange={(e) => setFilterRoomType(e.target.value)}
          options={[
            { value: 'all', label: 'All Room Types' },
            { value: 'single', label: 'Single' },
            { value: 'double', label: 'Double' },
            { value: 'triple', label: 'Triple' },
            { value: 'dorm', label: 'Dormitory' },
          ]}
        />
        <Select
          value={filterFloor}
          onChange={(e) => setFilterFloor(e.target.value)}
          options={[
            { value: 'all', label: 'All Floors' },
            { value: '0', label: 'Ground' },
            { value: '1', label: '1st Floor' },
            { value: '2', label: '2nd Floor' },
            { value: '3', label: '3rd Floor' },
          ]}
        />
      </div>

      {/* Bed grid */}
      <div 
        ref={parentRef}
        className="h-[400px] overflow-auto border border-gray-200 rounded-lg"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const bed = filteredBeds[virtualRow.index];
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
                  className={`
                    rounded-lg p-3 cursor-pointer transition-all hover:shadow-md
                    ${selectedId === bed.id ? 'ring-2 ring-apex-gold shadow-lg' : ''}
                    ${bed.status === 'vacant' ? 'hover:bg-apex-ivory' : 'opacity-50 cursor-not-allowed'}
                  `}
                  onClick={() => bed.status === 'vacant' && onSelect(bed.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center font-bold
                        ${getStatusColor(bed.status)}
                      `}>
                        {bed.bedLabel}
                      </div>
                      <div>
                        <p className="font-medium">
                          Room {bed.roomNumber || bed.roomId}
                        </p>
                        <p className="text-sm text-gray-600">
                          <Building2 size={12} className="inline mr-1" />
                          {bed.buildingName || 'Building'} · Floor {bed.floorNumber || '?'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Available
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {bed.rentTier} tier
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {filteredBeds.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Bed size={48} className="mx-auto mb-4 opacity-30" />
          <p>No available beds found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      )}

      <div className="text-sm text-gray-500">
        {filteredBeds.length} bed{filteredBeds.length !== 1 ? 's' : ''} available
      </div>
    </div>
  );
};