import React from 'react';
import { clsx } from 'clsx';
import { Bed, User, Clock, Lock } from 'lucide-react';
import type { Bed as BedType } from '@shared/schemas/hostel';

interface BedTileProps {
  bed: BedType;
  onClick?: () => void;
  selected?: boolean;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const BedTile: React.FC<BedTileProps> = ({
  bed,
  onClick,
  selected = false,
  showDetails = false,
  size = 'md',
}) => {
  const getStatusColor = (status: BedType['status']) => {
    switch (status) {
      case 'vacant':
        return 'bg-apex-ivory border-2 border-dashed border-gray-300 hover:border-apex-gold';
      case 'occupied':
        return 'bg-apex-navy text-white';
      case 'reserved':
        return 'bg-apex-gold text-white';
      case 'blocked':
        return 'bg-apex-grey text-white opacity-60';
      default:
        return 'bg-gray-100';
    }
  };

  const getStatusIcon = (status: BedType['status']) => {
    switch (status) {
      case 'vacant':
        return <Bed size={16} />;
      case 'occupied':
        return <User size={16} />;
      case 'reserved':
        return <Clock size={16} />;
      case 'blocked':
        return <Lock size={16} />;
      default:
        return <Bed size={16} />;
    }
  };

  const getStatusLabel = (status: BedType['status']) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const sizes = {
    sm: 'p-2 text-xs',
    md: 'p-3 text-sm',
    lg: 'p-4 text-base',
  };

  const isClickable = bed.status === 'vacant' || bed.status === 'occupied';

  return (
    <div
      className={clsx(
        'rounded-lg transition-all duration-200 cursor-pointer',
        getStatusColor(bed.status),
        sizes[size],
        selected && 'ring-2 ring-apex-gold ring-offset-2 shadow-lg',
        isClickable && 'hover:scale-105 hover:shadow-md',
        !isClickable && 'cursor-not-allowed'
      )}
      onClick={isClickable ? onClick : undefined}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getStatusIcon(bed.status)}
          <span className="font-semibold">{bed.bedLabel}</span>
        </div>
        <span className="text-xs opacity-75">{getStatusLabel(bed.status)}</span>
      </div>

      {showDetails && (
        <div className="mt-2 text-xs opacity-75 space-y-0.5">
          <p>Room: {bed.roomId}</p>
          <p>Rent: {bed.rentTier}</p>
          {bed.bedType && <p>Type: {bed.bedType}</p>}
        </div>
      )}
    </div>
  );
};