import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPaperclip, FaPaperPlane, FaUserCircle, FaUsers, FaEllipsisV } from 'react-icons/fa';
import { chatApi } from '../../api/chatApi';
import { useAuth } from '../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';

const ChatWindow = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    fetchChat();
    connectSocket();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectSocket = () => {
    const token = localStorage.getItem('token');
    socketRef.current = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      auth: { token }
    });

    socketRef.current.on('new_message', (data) => {
      if (data.chatId === id) {
        setMessages(prev => [...prev, data.message]);
      }
    });

    socketRef.current.on('user_typing', (data) => {
      // Handle typing indicator
    });

    socketRef.current.on('messages_read', (data) => {
      if (data.chatId === id) {
        setMessages(prev => prev.map(msg => ({
          ...msg,
          readBy: data.userId === user?._id ? 
            [...msg.readBy, { user: user._id, readAt: new Date() }] : 
            msg.readBy
        })));
      }
    });
  };

  const fetchChat = async () => {
    try {
      const response = await chatApi.getById(id);
      setChat(response.data);
      setMessages(response.data.messages || []);
      markAsRead();
    } catch (err) {
      setError('Failed to load chat');
      console.error('Chat fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await chatApi.markAsRead(id);
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const response = await chatApi.sendMessage(id, { text: newMessage });
      setMessages(prev => [...prev, response.data.messages[response.data.messages.length - 1]]);
      setNewMessage('');
      
      if (socketRef.current) {
        socketRef.current.emit('send_message', {
          chatId: id,
          text: newMessage
        });
      }
    } catch (error) {
      toast.error('Failed to send message');
      console.error('Send message error:', error);
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (socketRef.current) {
      socketRef.current.emit('typing', {
        chatId: id,
        isTyping: e.target.value.length > 0
      });
    }
  };

  const getChatName = () => {
    if (!chat) return 'Chat';
    if (chat.type === 'private') {
      const otherUser = chat.participants?.find(p => p._id !== user?._id);
      return otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Unknown User';
    }
    return chat.name || 'Group Chat';
  };

  const getChatAvatar = () => {
    if (!chat) return null;
    if (chat.type === 'private') {
      const otherUser = chat.participants?.find(p => p._id !== user?._id);
      if (otherUser?.profilePhoto) return otherUser.profilePhoto;
      return null;
    }
    return null;
  };

  const getInitials = () => {
    const name = getChatName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const isOwnMessage = (message) => {
    return message.sender?._id === user?._id;
  };

  if (loading) return <LoadingSpinner />;

  if (error || !chat) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">{error || 'Chat not found'}</p>
        <button
          onClick={() => navigate('/communication')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Back to Chats
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/communication')}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <FaArrowLeft />
          </button>
          {getChatAvatar() ? (
            <img
              src={getChatAvatar()}
              alt={getChatName()}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold">
              {getInitials()}
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {getChatName()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {chat.type === 'private' ? 'Private chat' : `${chat.participants?.length || 0} members`}
            </p>
          </div>
        </div>
        <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
          <FaEllipsisV />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No messages yet</p>
            <p className="text-xs mt-1">Start the conversation</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = isOwnMessage(message);
            return (
              <div
                key={index}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                  <div className={`p-3 rounded-lg ${
                    isOwn
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}>
                    <p className="text-sm">{message.text}</p>
                  </div>
                  <div className={`flex items-center space-x-2 mt-1 text-xs text-gray-500 dark:text-gray-400 ${
                    isOwn ? 'justify-end' : 'justify-start'
                  }`}>
                    <span>
                      {message.sender?.firstName || 'Unknown'}
                    </span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </span>
                    {isOwn && message.readBy?.length > 0 && (
                      <span className="text-green-500">✓✓</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <FaPaperclip />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className={`p-2 rounded-lg text-white transition-colors ${
              sending || !newMessage.trim()
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
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;