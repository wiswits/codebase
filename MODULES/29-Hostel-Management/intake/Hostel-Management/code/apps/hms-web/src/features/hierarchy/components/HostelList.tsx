import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Building2 } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useHostels } from '../hooks/useHostels';
import { usePermissions } from '../../../hooks/usePermissions';
import type { Hostel } from '@shared/schemas/hostel';

interface HostelListProps {
  onEdit?: (hostel: Hostel) => void;
  onDelete?: (id: string) => void;
}

export const HostelList: React.FC<HostelListProps> = ({ onEdit, onDelete }) => {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { data: hostels, isLoading, error } = useHostels();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHostels = hostels?.filter(h =>
    h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-apex-gold"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600">
        <p>Error loading hostels: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search hostels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-apex-gold focus:border-transparent"
          />
        </div>
        {can('hms:hostel:create') && (
          <Button variant="primary" onClick={() => navigate('/hostels/new')}>
            <Plus size={16} className="mr-2" />
            Add Hostel
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHostels?.map((hostel) => (
          <Card key={hostel.id} className="hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Building2 size={20} className="text-apex-gold" />
                    <h3 className="font-display text-lg font-semibold">{hostel.name}</h3>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Code: {hostel.code}</p>
                  <p className="text-sm text-gray-600">
                    Type: <span className="capitalize">{hostel.type}</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Created: {new Date(hostel.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/hostels/${hostel.id}/beds`)}
                  >
                    <Eye size={16} />
                  </Button>
                  {can('hms:hostel:update') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit?.(hostel)}
                    >
                      <Edit size={16} />
                    </Button>
                  )}
                  {can('hms:hostel:delete') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => onDelete?.(hostel.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </div>
              {hostel.facilities.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {hostel.facilities.slice(0, 3).map((facility) => (
                    <span
                      key={facility}
                      className="px-2 py-1 bg-apex-ivory text-xs rounded-full"
                    >
                      {facility}
                    </span>
                  ))}
                  {hostel.facilities.length > 3 && (
                    <span className="px-2 py-1 text-xs text-gray-500">
                      +{hostel.facilities.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {filteredHostels?.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Building2 size={48} className="mx-auto mb-4 opacity-30" />
          <p>No hostels found</p>
          {can('hms:hostel:create') && (
            <Button
              variant="primary"
              className="mt-4"
              onClick={() => navigate('/hostels/new')}
            >
              Create your first hostel
            </Button>
          )}
        </div>
      )}
    </div>
  );
};