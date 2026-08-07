import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaUserCircle, FaPlus, FaUsers, FaComments } from 'react-icons/fa';
import { chatApi } from '../../api/chatApi';
import { formatDistanceToNow } from 'date-fns';
import LoadingSpinner from '../common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const response = await chatApi.getChats();
      setChats(response.data || []);
    } catch (err) {
      setError('Failed to load chats');
      console.error('Chat fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getChatName = (chat) => {
    if (chat.type === 'private') {
      const otherUser = chat.participants?.find(p => p._id !== user?._id);
      return otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Unknown User';
    }
    return chat.name || 'Group Chat';
  };

  const getChatAvatar = (chat) => {
    if (chat.type === 'private') {
      const otherUser = chat.participants?.find(p => p._id !== user?._id);
      if (otherUser?.profilePhoto) return otherUser.profilePhoto;
      return null;
    }
    return null;
  };

  const getInitials = (chat) => {
    const name = getChatName(chat);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getLastMessage = (chat) => {
    if (chat.lastMessage) {
      return chat.lastMessage.text || 'Sent an attachment';
    }
    return 'No messages yet';
  };

  const getLastMessageTime = (chat) => {
    if (chat.lastMessage?.timestamp) {
      return formatDistanceToNow(new Date(chat.lastMessage.timestamp), { addSuffix: true });
    }
    if (chat.messages?.length > 0) {
      const lastMsg = chat.messages[chat.messages.length - 1];
      return formatDistanceToNow(new Date(lastMsg.createdAt), { addSuffix: true });
    }
    return '';
  };

  const getUnreadCount = (chat) => {
    if (!chat.messages) return 0;
    return chat.messages.filter(msg => 
      msg.sender?._id !== user?._id && 
      !msg.readBy?.some(r => r.user?._id === user?._id)
    ).length;
  };

  const filteredChats = chats.filter(chat => 
    getChatName(chat).toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchChats}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Messages</h3>
          <button
            onClick={() => navigate('/communication/new')}
            className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
          >
            <FaPlus />
            <span>New</span>
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <FaComments className="mx-auto text-3xl mb-2" />
            <p>{searchQuery ? 'No conversations found' : 'No conversations yet'}</p>
            <p className="text-xs mt-1">Start a new chat to connect with colleagues</p>
          </div>
        ) : (
          filteredChats.map((chat) => {
            const unreadCount = getUnreadCount(chat);
            return (
              <div
                key={chat._id}
                onClick={() => navigate(`/communication/${chat._id}`)}
                className={`flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-700 ${
                  unreadCount > 0 ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''
                }`}
              >
                <div className="relative flex-shrink-0">
                  {getChatAvatar(chat) ? (
                    <img
                      src={getChatAvatar(chat)}
                      alt={getChatName(chat)}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-lg">
                      {getInitials(chat)}
                    </div>
                  )}
                  {chat.type === 'group' && (
                    <FaUsers className="absolute -bottom-1 -right-1 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-full p-0.5 text-xs" />
                  )}
                </div>

                <div className="flex-1 min-w-0 ml-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {getChatName(chat)}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                      {getLastMessageTime(chat)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {getLastMessage(chat)}
                    </p>
                    {unreadCount > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full flex-shrink-0">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatList;