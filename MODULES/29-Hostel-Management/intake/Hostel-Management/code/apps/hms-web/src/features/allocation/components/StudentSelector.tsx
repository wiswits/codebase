import React, { useState, useMemo, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import { Search, User, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { apiClient } from '../../../api/client';

interface Student {
  id: string;
  name: string;
  email?: string;
  gender: string;
  class?: string;
  feeClearanceFlag: boolean;
  guardianIds?: string[];
}

interface StudentSelectorProps {
  onSelect: (studentId: string) => void;
  selectedId?: string;
  excludeAllocated?: boolean;
}

export const StudentSelector: React.FC<StudentSelectorProps> = ({
  onSelect,
  selectedId,
  excludeAllocated = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 300);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search students from APEX
  React.useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setStudents([]);
      return;
    }

    const searchStudents = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get<Student[]>(
          `/apex/v1/students/search?q=${debouncedSearch}&limit=20`
        );
        setStudents(response.data);
      } catch (err) {
        setError('Failed to search students');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    searchStudents();
  }, [debouncedSearch]);

  const selectedStudent = students.find(s => s.id === selectedId);

  const handleSelect = useCallback((student: Student) => {
    if (student.feeClearanceFlag) {
      onSelect(student.id);
    }
  }, [onSelect]);

  const clearSelection = () => {
    setSearchTerm('');
    setStudents([]);
    // Clear selection by calling onSelect with undefined
  };

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input
          placeholder="Search by name, email, or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <button
            onClick={clearSelection}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">
          <AlertCircle size={16} className="inline mr-2" />
          {error}
        </div>
      )}

      {/* Selected student */}
      {selectedStudent && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-apex-gold text-white flex items-center justify-center font-semibold">
                {selectedStudent.name.charAt(0)}
              </div>
              <div>
                <p className="font-medium">{selectedStudent.name}</p>
                <p className="text-sm text-gray-600">
                  {selectedStudent.class || 'Student'} · {selectedStudent.gender}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-green-700 bg-green-100 px-2 py-1 rounded-full">
                <CheckCircle size={14} className="inline mr-1" />
                Fee Cleared
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
              >
                Change
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Results list */}
      {!selectedStudent && loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-apex-gold"></div>
        </div>
      )}

      {!selectedStudent && students.length > 0 && !loading && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {students.map((student) => (
            <div
              key={student.id}
              className={`
                p-3 rounded-lg border cursor-pointer transition-all
                ${student.feeClearanceFlag 
                  ? 'hover:bg-apex-ivory hover:border-apex-gold' 
                  : 'opacity-60 cursor-not-allowed bg-gray-50'}
                ${student.id === selectedId ? 'border-apex-gold bg-apex-ivory' : 'border-gray-200'}
              `}
              onClick={() => student.feeClearanceFlag && handleSelect(student)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-apex-navy text-white flex items-center justify-center text-sm font-semibold">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-gray-600">
                      {student.email || 'No email'} · {student.class || 'Student'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm capitalize">{student.gender}</span>
                  {student.feeClearanceFlag ? (
                    <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                      ✓ Cleared
                    </span>
                  ) : (
                    <span className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded-full">
                      ✗ Pending
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!selectedStudent && students.length === 0 && searchTerm && !loading && (
        <div className="text-center py-8 text-gray-500">
          <User size={48} className="mx-auto mb-4 opacity-30" />
          <p>No students found</p>
          <p className="text-sm">Try a different search term</p>
        </div>
      )}

      {!selectedStudent && !searchTerm && (
        <div className="text-center py-8 text-gray-500">
          <User size={48} className="mx-auto mb-4 opacity-30" />
          <p>Search for a student to allocate</p>
          <p className="text-sm">Enter at least 2 characters to start searching</p>
        </div>
      )}
    </div>
  );
};