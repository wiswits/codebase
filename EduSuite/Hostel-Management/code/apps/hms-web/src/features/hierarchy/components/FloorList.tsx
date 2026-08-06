import React, { useState } from 'react';
import { Plus, Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useHierarchy } from '../hooks/useHierarchy';
import { RoomForm } from './RoomForm';

interface FloorListProps {
  wingId: string;
}

export const FloorList: React.FC<FloorListProps> = ({ wingId }) => {
  const { floors, createFloor, deleteFloor } = useHierarchy(undefined, undefined, wingId);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newFloorNumber, setNewFloorNumber] = useState<number>(0);

  const toggleExpand = (floorId: string) => {
    setExpanded(prev =>
      prev.includes(floorId)
        ? prev.filter(id => id !== floorId)
        : [...prev, floorId]
    );
  };

  const handleCreate = async () => {
    await createFloor({
      wingId,
      floorNumber: newFloorNumber,
    });
    setNewFloorNumber(0);
    setShowForm(false);
  };

  const sortedFloors = floors?.sort((a, b) => a.floorNumber - b.floorNumber);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h6 className="text-xs font-medium text-gray-500 uppercase">Floors</h6>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={12} />
        </Button>
      </div>

      {showForm && (
        <div className="flex items-center gap-2 p-2 bg-apex-ivory rounded-lg">
          <Input
            type="number"
            min={0}
            placeholder="Floor number"
            value={newFloorNumber}
            onChange={(e) => setNewFloorNumber(parseInt(e.target.value))}
            className="w-32"
          />
          <Button variant="primary" size="sm" onClick={handleCreate}>
            Add
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
            Cancel
          </Button>
        </div>
      )}

      {sortedFloors?.map((floor) => (
        <div key={floor.id}>
          <div
            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
            onClick={() => toggleExpand(floor.id)}
          >
            <div className="flex items-center gap-2">
              {expanded.includes(floor.id) ? (
                <ChevronDown size={12} className="text-gray-500" />
              ) : (
                <ChevronRight size={12} className="text-gray-500" />
              )}
              <span className="text-sm">
                Floor {floor.floorNumber === 0 ? 'Ground' : floor.floorNumber}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                deleteFloor(floor.id);
              }}
            >
              <Trash2 size={12} />
            </Button>
          </div>

          {expanded.includes(floor.id) && (
            <div className="ml-6 mt-2">
              <RoomForm floorId={floor.id} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};