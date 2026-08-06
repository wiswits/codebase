import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaTimes, FaFile, FaUser, FaHashtag } from 'react-icons/fa';
import { chatApi } from '../../api/chatApi';
import LoadingSpinner from '../common/LoadingSpinner';

const ChatSearch = ({ chatId, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.length >= 2) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query, searchType]);

  const performSearch = async () => {
    setLoading(true);
    try {
      // In a real implementation, you would have a search API
      // const response = await chatApi.searchMessages(chatId, { query, type: searchType });
      // setResults(response.data || []);
      
      // Mock results
      const mockResults = [
        { id: 1, type: 'message', text: `Message containing "${query}"`, sender: 'John Doe', time: new Date() },
        { id: 2, type: 'file', text: `File: "${query}.pdf"`, sender: 'Jane Smith', time: new Date() },
        { id: 3, type: 'message', text: `Another message with "${query}"`, sender: 'Bob Johnson', time: new Date() }
      ];
      setResults(mockResults);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getResultIcon = (type) => {
    switch (type) {
      case 'message': return <FaHashtag className="text-blue-500" />;
      case 'file': return <FaFile className="text-orange-500" />;
      case 'user': return <FaUser className="text-green-500" />;
      default: return <FaHashtag className="text-gray-400" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Search</h4>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <FaTimes />
        </button>
      </div>

      <div className="relative mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search messages..."
          className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
          autoFocus
        />
        <FaSearch className="absolute left-3 top-3 text-gray-400" />
      </div>

      <div className="flex space-x-2 mb-3">
        <button
          onClick={() => setSearchType('all')}
          className={`px-3 py-1 text-xs rounded-lg transition-colors ${
            searchType === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setSearchType('messages')}
          className={`px-3 py-1 text-xs rounded-lg transition-colors ${
            searchType === 'messages'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Messages
        </button>
        <button
          onClick={() => setSearchType('files')}
          className={`px-3 py-1 text-xs rounded-lg transition-colors ${
            searchType === 'files'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Files
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="sm" />
        </div>
      ) : query.length >= 2 ? (
        results.length === 0 ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No results found for "{query}"</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {results.map((result) => (
              <div
                key={result.id}
                className="flex items-start space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                onClick={() => {
                  // Navigate to the specific message
                  if (result.type === 'message') {
                    // navigate to message
                  }
                  onClose();
                }}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {getResultIcon(result.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white truncate">
                    {result.text}
                  </p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{result.sender}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(result.time), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-4 text-gray-400 dark:text-gray-500">
          <p className="text-sm">Type at least 2 characters to search</p>
        </div>
      )}
    </div>
  );
};

export default ChatSearch;