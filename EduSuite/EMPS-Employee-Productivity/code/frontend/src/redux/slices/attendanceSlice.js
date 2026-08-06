import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { attendanceApi } from '../../api/attendanceApi';

// Async thunks
export const checkIn = createAsyncThunk(
  'attendance/checkIn',
  async (data, { rejectWithValue }) => {
    try {
      const response = await attendanceApi.checkIn(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to check in');
    }
  }
);

export const checkOut = createAsyncThunk(
  'attendance/checkOut',
  async (data, { rejectWithValue }) => {
    try {
      const response = await attendanceApi.checkOut(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to check out');
    }
  }
);

export const startLunch = createAsyncThunk(
  'attendance/startLunch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await attendanceApi.lunchStart();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to start lunch');
    }
  }
);

export const endLunch = createAsyncThunk(
  'attendance/endLunch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await attendanceApi.lunchEnd();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to end lunch');
    }
  }
);

export const fetchAttendanceHistory = createAsyncThunk(
  'attendance/fetchHistory',
  async (params, { rejectWithValue }) => {
    try {
      const response = await attendanceApi.getHistory(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch attendance history');
    }
  }
);

export const fetchAttendanceStats = createAsyncThunk(
  'attendance/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await attendanceApi.getStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch attendance stats');
    }
  }
);

export const correctAttendance = createAsyncThunk(
  'attendance/correct',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await attendanceApi.correct(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to correct attendance');
    }
  }
);

const initialState = {
  currentAttendance: null,
  history: [],
  stats: null,
  loading: false,
  error: null,
};

const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {
    clearCurrentAttendance: (state) => {
      state.currentAttendance = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Check In
      .addCase(checkIn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkIn.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAttendance = action.payload;
      })
      .addCase(checkIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to check in';
      })
      // Check Out
      .addCase(checkOut.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkOut.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAttendance = action.payload;
      })
      .addCase(checkOut.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to check out';
      })
      // Start Lunch
      .addCase(startLunch.fulfilled, (state, action) => {
        state.currentAttendance = action.payload;
      })
      // End Lunch
      .addCase(endLunch.fulfilled, (state, action) => {
        state.currentAttendance = action.payload;
      })
      // Fetch History
      .addCase(fetchAttendanceHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendanceHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload;
      })
      .addCase(fetchAttendanceHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch history';
      })
      // Fetch Stats
      .addCase(fetchAttendanceStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      // Correct Attendance
      .addCase(correctAttendance.fulfilled, (state, action) => {
        const index = state.history.findIndex(h => h._id === action.payload._id);
        if (index !== -1) {
          state.history[index] = action.payload;
        }
        if (state.currentAttendance?._id === action.payload._id) {
          state.currentAttendance = action.payload;
        }
      });
  },
});

export const { clearCurrentAttendance, clearError } = attendanceSlice.actions;
export default attendanceSlice.reducer;