import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaUserPlus, FaTimes } from 'react-icons/fa';
import { chatApi } from '../../api/chatApi';
import { employeeApi } from '../../api/employeeApi';
import { toast } from 'react-toastify';
import LoadingSpinner from '../common/LoadingSpinner';

const GroupChat = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [showEmployeeList, setShowEmployeeList] = useState(false);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      try {
        const response = await employeeApi.getAll({ search: query });
        setEmployees(response.data || []);
        setShowEmployeeList(true);
      } catch (error) {
        console.error('Search error:', error);
      }
    } else {
      setEmployees([]);
      setShowEmployeeList(false);
    }
  };

  const addMember = (employee) => {
    if (!selectedMembers.find(m => m._id === employee._id)) {
      setSelectedMembers([...selectedMembers, employee]);
    }
    setSearchQuery('');
    setEmployees([]);
    setShowEmployeeList(false);
  };

  const removeMember = (employeeId) => {
    setSelectedMembers(selectedMembers.filter(m => m._id !== employeeId));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }
    if (selectedMembers.length < 2) {
      toast.error('Please add at least 2 members');
      return;
    }

    setLoading(true);
    try {
      const response = await chatApi.create({
        name: groupName,
        participants: selectedMembers.map(m => m._id),
        type: 'group'
      });
      toast.success('Group created successfully');
      navigate(`/communication/${response.data._id}`);
    } catch (error) {
      toast.error('Failed to create group');
      console.error('Create group error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Create Group Chat
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Group Name
          </label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Add Members
          </label>
          <div className="relative">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search employees..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={() => setShowEmployeeList(!showEmployeeList)}
                className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
              >
                <FaUserPlus size={20} />
              </button>
            </div>

            {showEmployeeList && employees.length > 0 && (
              <div className="absolute mt-1 w-full bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 max-h-48 overflow-y-auto z-10">
                {employees.map((emp) => (
                  <div
                    key={emp._id}
                    onClick={() => addMember(emp)}
                    className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors flex items-center space-x-2"
                  >
                    <span className="text-sm text-gray-900 dark:text-white">
                      {emp.firstName} {emp.lastName}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({emp.employeeId})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedMembers.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Members ({selectedMembers.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedMembers.map((member) => (
                <div
                  key={member._id}
                  className="flex items-center space-x-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-lg text-sm"
                >
                  <span>{member.firstName} {member.lastName}</span>
                  <button
                    onClick={() => removeMember(member._id)}
                    className="text-indigo-500 hover:text-red-600 dark:text-indigo-400 dark:hover:text-red-400 transition-colors"
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => navigate('/communication')}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedMembers.length < 2}
            className={`flex items-center space-x-2 px-6 py-2 text-white rounded-lg transition-colors ${
              !groupName.trim() || selectedMembers.length < 2
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            <FaUsers />
            <span>Create Group</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupChat;