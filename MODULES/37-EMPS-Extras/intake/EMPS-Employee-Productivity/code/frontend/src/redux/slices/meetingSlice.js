import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { meetingApi } from '../../api/meetingApi';

// Async thunks
export const fetchMeetings = createAsyncThunk(
  'meetings/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await meetingApi.getAll(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch meetings');
    }
  }
);

export const fetchMyMeetings = createAsyncThunk(
  'meetings/fetchMy',
  async (_, { rejectWithValue }) => {
    try {
      const response = await meetingApi.getMyMeetings();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch my meetings');
    }
  }
);

export const fetchMeetingById = createAsyncThunk(
  'meetings/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await meetingApi.getById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch meeting');
    }
  }
);

export const createMeeting = createAsyncThunk(
  'meetings/create',
  async (data, { rejectWithValue }) => {
    try {
      const response = await meetingApi.create(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create meeting');
    }
  }
);

export const updateMeeting = createAsyncThunk(
  'meetings/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await meetingApi.update(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update meeting');
    }
  }
);

export const deleteMeeting = createAsyncThunk(
  'meetings/delete',
  async (id, { rejectWithValue }) => {
    try {
      await meetingApi.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete meeting');
    }
  }
);

export const addMeetingNotes = createAsyncThunk(
  'meetings/addNotes',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await meetingApi.addNotes(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add notes');
    }
  }
);

const initialState = {
  meetings: [],
  myMeetings: [],
  selectedMeeting: null,
  loading: false,
  error: null,
};

const meetingSlice = createSlice({
  name: 'meetings',
  initialState,
  reducers: {
    clearSelectedMeeting: (state) => {
      state.selectedMeeting = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchMeetings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMeetings.fulfilled, (state, action) => {
        state.loading = false;
        state.meetings = action.payload;
      })
      .addCase(fetchMeetings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch meetings';
      })
      // Fetch My
      .addCase(fetchMyMeetings.fulfilled, (state, action) => {
        state.myMeetings = action.payload;
      })
      // Fetch By ID
      .addCase(fetchMeetingById.fulfilled, (state, action) => {
        state.selectedMeeting = action.payload;
      })
      // Create
      .addCase(createMeeting.fulfilled, (state, action) => {
        state.meetings.unshift(action.payload);
        state.myMeetings.unshift(action.payload);
      })
      // Update
      .addCase(updateMeeting.fulfilled, (state, action) => {
        const index = state.meetings.findIndex(m => m._id === action.payload._id);
        if (index !== -1) {
          state.meetings[index] = action.payload;
        }
        const myIndex = state.myMeetings.findIndex(m => m._id === action.payload._id);
        if (myIndex !== -1) {
          state.myMeetings[myIndex] = action.payload;
        }
        if (state.selectedMeeting?._id === action.payload._id) {
          state.selectedMeeting = action.payload;
        }
      })
      // Delete
      .addCase(deleteMeeting.fulfilled, (state, action) => {
        state.meetings = state.meetings.filter(m => m._id !== action.payload);
        state.myMeetings = state.myMeetings.filter(m => m._id !== action.payload);
        if (state.selectedMeeting?._id === action.payload) {
          state.selectedMeeting = null;
        }
      })
      // Add Notes
      .addCase(addMeetingNotes.fulfilled, (state, action) => {
        if (state.selectedMeeting) {
          state.selectedMeeting = action.payload;
        }
      });
  },
});

export const { clearSelectedMeeting, clearError } = meetingSlice.actions;
export default meetingSlice.reducer;