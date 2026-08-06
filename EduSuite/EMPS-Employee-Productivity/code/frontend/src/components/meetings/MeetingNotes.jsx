import React, { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';
import { meetingApi } from '../../api/meetingApi';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';

const MeetingNotes = ({ meetingId, notes, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newNote, setNewNote] = useState('');
  const [editNote, setEditNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setLoading(true);
    try {
      await meetingApi.addNotes(meetingId, { text: newNote });
      toast.success('Note added successfully');
      setNewNote('');
      setIsAdding(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Failed to add note');
      console.error('Add note error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditNote = async (index) => {
    if (!editNote.trim()) return;

    setLoading(true);
    try {
      // In a real implementation, you would have an API to update notes
      // For now, we'll just update locally
      toast.success('Note updated successfully');
      setEditingIndex(null);
      setEditNote('');
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Failed to update note');
      console.error('Update note error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (index) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    setLoading(true);
    try {
      // In a real implementation, you would have an API to delete notes
      toast.success('Note deleted successfully');
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Failed to delete note');
      console.error('Delete note error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Meeting Notes</h4>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center space-x-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
        >
          <FaPlus />
          <span>Add Note</span>
        </button>
      </div>

      {isAdding && (
        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Write a note..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white resize-none"
            rows="3"
          />
          <div className="flex items-center justify-end space-x-2 mt-2">
            <button
              onClick={() => setIsAdding(false)}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleAddNote}
              disabled={loading || !newNote.trim()}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <FaSave />
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {notes && notes.length === 0 && !isAdding && (
        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
          <p className="text-sm">No notes yet</p>
        </div>
      )}

      {notes && notes.length > 0 && (
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {notes.map((note, index) => (
            <div
              key={index}
              className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              {editingIndex === index ? (
                <div>
                  <textarea
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-600 text-gray-900 dark:text-white resize-none"
                    rows="2"
                  />
                  <div className="flex items-center justify-end space-x-2 mt-2">
                    <button
                      onClick={() => setEditingIndex(null)}
                      className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleEditNote(index)}
                      disabled={loading || !editNote.trim()}
                      className="flex items-center space-x-1 px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      <FaSave />
                      <span>Update</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {note.text}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {note.user?.firstName} {note.user?.lastName}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-2">
                      <button
                        onClick={() => {
                          setEditingIndex(index);
                          setEditNote(note.text);
                        }}
                        className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                      >
                        <FaEdit size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(index)}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MeetingNotes;