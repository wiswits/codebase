import React, { useState } from 'react';
import { FaUserCircle, FaPaperclip, FaPaperPlane } from 'react-icons/fa';
import { taskApi } from '../../api/taskApi';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';

const TaskComments = ({ taskId, comments, onUpdate }) => {
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSending(true);
    try {
      await taskApi.addComment(taskId, { text: newComment });
      toast.success('Comment added');
      setNewComment('');
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('Failed to add comment');
      console.error('Add comment error:', error);
    } finally {
      setSending(false);
    }
  };

  if (!comments || comments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p className="text-sm">No comments yet</p>
        <p className="text-xs mt-1">Be the first to comment</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4 max-h-80 overflow-y-auto">
        {comments.map((comment, index) => (
          <div key={index} className="flex items-start space-x-3">
            {comment.user?.profilePhoto ? (
              <img
                src={comment.user.profilePhoto}
                alt={comment.user.firstName}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <FaUserCircle className="text-gray-400 text-3xl" />
            )}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {comment.user?.firstName} {comment.user?.lastName}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                {comment.text}
              </p>
              {comment.attachments && comment.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {comment.attachments.map((att, idx) => (
                    <a
                      key={idx}
                      href={att}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
                    >
                      <FaPaperclip size={10} />
                      <span>Attachment {idx + 1}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        <div className="flex-1">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            rows="2"
          />
        </div>
        <button
          type="submit"
          disabled={sending || !newComment.trim()}
          className={`p-2 rounded-lg text-white transition-colors ${
            sending || !newComment.trim()
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {sending ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <FaPaperPlane />
          )}
        </button>
      </form>
    </div>
  );
};

export default TaskComments;