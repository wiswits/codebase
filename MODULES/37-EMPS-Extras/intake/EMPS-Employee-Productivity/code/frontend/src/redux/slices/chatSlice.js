import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { chatApi } from '../../api/chatApi';

// Async thunks
export const fetchChats = createAsyncThunk(
  'chat/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await chatApi.getChats();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch chats');
    }
  }
);

export const fetchChatById = createAsyncThunk(
  'chat/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await chatApi.getById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch chat');
    }
  }
);

export const createChat = createAsyncThunk(
  'chat/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await chatApi.create(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create chat');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await chatApi.sendMessage(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

export const markChatAsRead = createAsyncThunk(
  'chat/markAsRead',
  async (id, { rejectWithValue }) => {
    try {
      await chatApi.markAsRead(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark as read');
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'chat/fetchUnread',
  async (_, { rejectWithValue }) => {
    try {
      const response = await chatApi.getUnread();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch unread count');
    }
  }
);

const initialState = {
  chats: [],
  selectedChat: null,
  unreadCount: 0,
  loading: false,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    clearSelectedChat: (state) => {
      state.selectedChat = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    addNewMessage: (state, action) => {
      const { chatId, message } = action.payload;
      const chat = state.chats.find(c => c._id === chatId);
      if (chat) {
        if (!chat.messages) chat.messages = [];
        chat.messages.push(message);
        chat.lastMessage = {
          sender: message.sender,
          text: message.text,
          timestamp: message.createdAt
        };
      }
      if (state.selectedChat?._id === chatId) {
        state.selectedChat.messages.push(message);
        state.selectedChat.lastMessage = {
          sender: message.sender,
          text: message.text,
          timestamp: message.createdAt
        };
      }
    },
    updateUnreadCount: (state, action) => {
      state.unreadCount = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchChats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.loading = false;
        state.chats = action.payload;
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch chats';
      })
      // Fetch By ID
      .addCase(fetchChatById.fulfilled, (state, action) => {
        state.selectedChat = action.payload;
      })
      // Create Chat
      .addCase(createChat.fulfilled, (state, action) => {
        state.chats.unshift(action.payload);
      })
      // Send Message
      .addCase(sendMessage.fulfilled, (state, action) => {
        const chat = state.chats.find(c => c._id === action.payload._id);
        if (chat) {
          chat.messages = action.payload.messages;
          chat.lastMessage = action.payload.lastMessage;
        }
        if (state.selectedChat?._id === action.payload._id) {
          state.selectedChat = action.payload;
        }
      })
      // Mark as Read
      .addCase(markChatAsRead.fulfilled, (state, action) => {
        const chat = state.chats.find(c => c._id === action.payload);
        if (chat) {
          chat.messages = chat.messages?.map(m => ({
            ...m,
            readBy: [...(m.readBy || []), { user: null, readAt: new Date() }]
          }));
        }
        if (state.selectedChat?._id === action.payload) {
          state.selectedChat.messages = state.selectedChat.messages?.map(m => ({
            ...m,
            readBy: [...(m.readBy || []), { user: null, readAt: new Date() }]
          }));
        }
      })
      // Fetch Unread Count
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload?.unreadCount || 0;
      });
  },
});

export const { clearSelectedChat, clearError, addNewMessage, updateUnreadCount } = chatSlice.actions;
export default chatSlice.reducer;