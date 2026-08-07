import React from 'react';
import { clsx } from 'clsx';
import { Bed, Users, Home, ArrowRight } from 'lucide-react';
import { Card } from '../ui/Card';
import type { Room } from '@shared/schemas/hostel';

interface RoomCardProps {
  room: Room & { beds?: BedType[]; floorNumber?: number };
  onSelect?: () => void;
  selected?: boolean;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  onSelect,
  selected = false,
}) => {
  const occupiedBeds = room.beds?.filter(b => b.status === 'occupied').length || 0;
  const totalBeds = room.beds?.length || room.maxCapacity;
  const isFull = occupiedBeds === totalBeds;
  const isVacant = occupiedBeds === 0;

  const getStatusColor = () => {
    if (isFull) return 'border-red-200 bg-red-50';
    if (isVacant) return 'border-green-200 bg-green-50';
    return 'border-yellow-200 bg-yellow-50';
  };

  return (
    <Card
      className={clsx(
        'p-4 border-2 transition-all duration-200',
        getStatusColor(),
        selected && 'border-apex-gold shadow-lg',
        onSelect && 'cursor-pointer hover:shadow-md'
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-display font-semibold text-lg">
            Room {room.roomNumber}
          </h4>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
            <span className="capitalize">{room.roomType}</span>
            {room.floorNumber !== undefined && (
              <span className="flex items-center gap-1">
                <Home size={14} />
                Floor {room.floorNumber}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={clsx(
            'px-2 py-1 rounded-full text-xs font-medium',
            isFull ? 'bg-red-100 text-red-800' :
            isVacant ? 'bg-green-100 text-green-800' :
            'bg-yellow-100 text-yellow-800'
          )}>
            {isFull ? 'Full' : isVacant ? 'Vacant' : `${occupiedBeds}/${totalBeds} occupied`}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Bed size={16} />
          <span>{totalBeds} beds</span>
        </div>
        <div className="flex items-center gap-1">
          <Users size={16} />
          <span>{occupiedBeds} occupied</span>
        </div>
        <div className="flex-1" />
        {onSelect && (
          <ArrowRight size={16} className="text-apex-gold" />
        )}
      </div>

      {room.beds && room.beds.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {room.beds.map(bed => (
            <div
              key={bed.id}
              className={clsx(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                bed.status === 'occupied' && 'bg-apex-navy text-white',
                bed.status === 'vacant' && 'bg-apex-ivory border-2 border-dashed border-gray-300',
                bed.status === 'reserved' && 'bg-apex-gold text-white',
                bed.status === 'blocked' && 'bg-apex-grey text-white',
              )}
              title={`Bed ${bed.bedLabel} - ${bed.status}`}
            >
              {bed.bedLabel}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};