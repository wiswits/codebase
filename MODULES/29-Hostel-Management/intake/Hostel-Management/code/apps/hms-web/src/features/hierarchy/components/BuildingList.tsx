import React, { useState } from 'react';
import { Plus, Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useHierarchy } from '../hooks/useHierarchy';
import { WingList } from './WingList';

interface BuildingListProps {
  hostelId: string;
}

export const BuildingList: React.FC<BuildingListProps> = ({ hostelId }) => {
  const { buildings, createBuilding, deleteBuilding } = useHierarchy(hostelId);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newBuildingName, setNewBuildingName] = useState('');
  const [newBuildingCode, setNewBuildingCode] = useState('');

  const toggleExpand = (buildingId: string) => {
    setExpanded(prev =>
      prev.includes(buildingId)
        ? prev.filter(id => id !== buildingId)
        : [...prev, buildingId]
    );
  };

  const handleCreate = async () => {
    if (!newBuildingName || !newBuildingCode) return;
    await createBuilding({
      hostelId,
      name: newBuildingName,
      code: newBuildingCode,
    });
    setNewBuildingName('');
    setNewBuildingCode('');
    setShowForm(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-700">Buildings</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={14} className="mr-1" />
          Add Building
        </Button>
      </div>

      {showForm && (
        <Card className="p-4 bg-apex-ivory border-dashed">
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Building Code (e.g., B1)"
              value={newBuildingCode}
              onChange={(e) => setNewBuildingCode(e.target.value)}
            />
            <Input
              placeholder="Building Name"
              value={newBuildingName}
              onChange={(e) => setNewBuildingName(e.target.value)}
            />
          </div>
          <div className="flex gap-2 mt-3 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreate}>
              Create
            </Button>
          </div>
        </Card>
      )}

      {buildings?.map((building) => (
        <Card key={building.id} className="overflow-hidden">
          <div
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
            onClick={() => toggleExpand(building.id)}
          >
            <div className="flex items-center gap-3">
              {expanded.includes(building.id) ? (
                <ChevronDown size={16} className="text-gray-500" />
              ) : (
                <ChevronRight size={16} className="text-gray-500" />
              )}
              <div>
                <span className="font-medium">{building.name}</span>
                <span className="ml-2 text-sm text-gray-500">({building.code})</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm">
                <Edit size={14} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteBuilding(building.id);
                }}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>

          {expanded.includes(building.id) && (
            <div className="p-4 pt-0 border-t border-gray-100">
              <WingList buildingId={building.id} />
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};