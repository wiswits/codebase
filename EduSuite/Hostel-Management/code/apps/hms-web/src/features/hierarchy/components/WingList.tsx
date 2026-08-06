import React, { useState } from 'react';
import { Plus, Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { useHierarchy } from '../hooks/useHierarchy';
import { FloorList } from './FloorList';

interface WingListProps {
  buildingId: string;
}

export const WingList: React.FC<WingListProps> = ({ buildingId }) => {
  const { wings, createWing, deleteWing } = useHierarchy(undefined, buildingId);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newWingCode, setNewWingCode] = useState('');
  const [newWingDirection, setNewWingDirection] = useState<'E' | 'W' | 'N' | 'S'>('E');

  const toggleExpand = (wingId: string) => {
    setExpanded(prev =>
      prev.includes(wingId)
        ? prev.filter(id => id !== wingId)
        : [...prev, wingId]
    );
  };

  const handleCreate = async () => {
    if (!newWingCode) return;
    await createWing({
      buildingId,
      code: newWingCode,
      direction: newWingDirection,
    });
    setNewWingCode('');
    setShowForm(false);
  };

  return (
    <div className="space-y-3 ml-4">
      <div className="flex items-center justify-between">
        <h5 className="font-medium text-sm text-gray-600">Wings</h5>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={12} />
        </Button>
      </div>

      {showForm && (
        <Card className="p-3 bg-apex-ivory border-dashed">
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Wing Code (e.g., MAIN)"
              value={newWingCode}
              onChange={(e) => setNewWingCode(e.target.value)}
              size="sm"
            />
            <Select
              value={newWingDirection}
              onChange={(e) => setNewWingDirection(e.target.value as any)}
              options={[
                { value: 'E', label: 'East' },
                { value: 'W', label: 'West' },
                { value: 'N', label: 'North' },
                { value: 'S', label: 'South' },
              ]}
            />
          </div>
          <div className="flex gap-1 mt-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreate}>
              Add
            </Button>
          </div>
        </Card>
      )}

      {wings?.map((wing) => (
        <div key={wing.id}>
          <div
            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
            onClick={() => toggleExpand(wing.id)}
          >
            <div className="flex items-center gap-2">
              {expanded.includes(wing.id) ? (
                <ChevronDown size={14} className="text-gray-500" />
              ) : (
                <ChevronRight size={14} className="text-gray-500" />
              )}
              <span className="text-sm font-medium">{wing.code}</span>
              {wing.direction && (
                <span className="text-xs text-gray-500">({wing.direction})</span>
              )}
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm">
                <Edit size={12} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteWing(wing.id);
                }}
              >
                <Trash2 size={12} />
              </Button>
            </div>
          </div>

          {expanded.includes(wing.id) && (
            <div className="ml-6 mt-2">
              <FloorList wingId={wing.id} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};