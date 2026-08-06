import React, { useState } from 'react';
import { Plus, Edit, Trash2, Bed } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useHierarchy } from '../hooks/useHierarchy';
import { ROOM_TYPES } from '../../../lib/constants';

interface RoomFormProps {
  floorId: string;
}

export const RoomForm: React.FC<RoomFormProps> = ({ floorId }) => {
  const { rooms, createRoom, deleteRoom, createBeds } = useHierarchy(undefined, undefined, undefined, floorId);
  const [showForm, setShowForm] = useState(false);
  const [newRoom, setNewRoom] = useState({
    roomNumber: '',
    roomType: 'single' as const,
    maxCapacity: 1,
  });
  const [bedCount, setBedCount] = useState(1);
  const [rentTier, setRentTier] = useState('standard');

  const handleCreate = async () => {
    const room = await createRoom({
      floorId,
      roomNumber: newRoom.roomNumber,
      roomType: newRoom.roomType,
      maxCapacity: newRoom.maxCapacity,
    });

    // Create beds for the room
    if (room) {
      const bedLabels = Array.from({ length: bedCount }, (_, i) => 
        String.fromCharCode(65 + i) // A, B, C, ...
      );
      await createBeds({
        roomId: room.id,
        bedLabels,
        rentTier,
      });
    }

    setShowForm(false);
    setNewRoom({ roomNumber: '', roomType: 'single', maxCapacity: 1 });
  };

  const getCapacityOptions = (type: string) => {
    switch (type) {
      case 'single': return [{ value: '1', label: '1' }];
      case 'double': return [{ value: '2', label: '2' }];
      case 'triple': return [{ value: '3', label: '3' }];
      case 'dorm': return [
        { value: '4', label: '4' },
        { value: '6', label: '6' },
        { value: '8', label: '8' },
      ];
      default: return [{ value: '1', label: '1' }];
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h6 className="text-xs font-medium text-gray-500 uppercase">Rooms</h6>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={12} />
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 bg-apex-ivory border-dashed">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Room Number"
                value={newRoom.roomNumber}
                onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
              />
              <Select
                value={newRoom.roomType}
                onChange={(e) => setNewRoom({ 
                  ...newRoom, 
                  roomType: e.target.value as any,
                  maxCapacity: 1
                })}
                options={Object.entries(ROOM_TYPES).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={String(newRoom.maxCapacity)}
                onChange={(e) => setNewRoom({ 
                  ...newRoom, 
                  maxCapacity: parseInt(e.target.value) 
                })}
                options={getCapacityOptions(newRoom.roomType)}
                label="Capacity"
              />
              <Select
                value={rentTier}
                onChange={(e) => setRentTier(e.target.value)}
                options={[
                  { value: 'standard', label: 'Standard' },
                  { value: 'premium', label: 'Premium' },
                  { value: 'luxury', label: 'Luxury' },
                ]}
                label="Rent Tier"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">Number of Beds</label>
              <input
                type="range"
                min={1}
                max={10}
                value={bedCount}
                onChange={(e) => setBedCount(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1</span>
                <span>{bedCount} beds</span>
                <span>10</span>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleCreate}>
                Create Room with {bedCount} beds
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {rooms?.map((room) => (
          <Card key={room.id} className="p-3 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Room {room.roomNumber}</p>
                <p className="text-xs text-gray-500 capitalize">{room.roomType}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Bed size={12} className="text-gray-400" />
                  <span className="text-xs text-gray-500">{room.maxCapacity} beds</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600"
                onClick={() => deleteRoom(room.id)}
              >
                <Trash2 size={12} />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};