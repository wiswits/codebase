import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { leaveApi } from '../../api/leaveApi';

// Async thunks
export const applyLeave = createAsyncThunk(
  'leaves/apply',
  async (data, { rejectWithValue }) => {
    try {
      const response = await leaveApi.apply(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to apply for leave');
    }
  }
);

export const fetchMyLeaves = createAsyncThunk(
  'leaves/fetchMy',
  async (params, { rejectWithValue }) => {
    try {
      const response = await leaveApi.getMyLeaves(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leaves');
    }
  }
);

export const fetchAllLeaves = createAsyncThunk(
  'leaves/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await leaveApi.getAll(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch all leaves');
    }
  }
);

export const fetchLeaveBalance = createAsyncThunk(
  'leaves/fetchBalance',
  async (_, { rejectWithValue }) => {
    try {
      const response = await leaveApi.getBalance();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leave balance');
    }
  }
);

export const approveLeave = createAsyncThunk(
  'leaves/approve',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await leaveApi.approve(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to approve leave');
    }
  }
);

const initialState = {
  myLeaves: [],
  allLeaves: [],
  balance: null,
  selectedLeave: null,
  loading: false,
  error: null,
};

const leaveSlice = createSlice({
  name: 'leaves',
  initialState,
  reducers: {
    clearSelectedLeave: (state) => {
      state.selectedLeave = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Apply Leave
      .addCase(applyLeave.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(applyLeave.fulfilled, (state, action) => {
        state.loading = false;
        state.myLeaves.unshift(action.payload);
      })
      .addCase(applyLeave.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to apply for leave';
      })
      // Fetch My Leaves
      .addCase(fetchMyLeaves.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyLeaves.fulfilled, (state, action) => {
        state.loading = false;
        state.myLeaves = action.payload;
      })
      .addCase(fetchMyLeaves.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch leaves';
      })
      // Fetch All Leaves
      .addCase(fetchAllLeaves.fulfilled, (state, action) => {
        state.allLeaves = action.payload;
      })
      // Fetch Balance
      .addCase(fetchLeaveBalance.fulfilled, (state, action) => {
        state.balance = action.payload;
      })
      // Approve Leave
      .addCase(approveLeave.fulfilled, (state, action) => {
        const index = state.myLeaves.findIndex(l => l._id === action.payload._id);
        if (index !== -1) {
          state.myLeaves[index] = action.payload;
        }
        const allIndex = state.allLeaves.findIndex(l => l._id === action.payload._id);
        if (allIndex !== -1) {
          state.allLeaves[allIndex] = action.payload;
        }
        if (state.selectedLeave?._id === action.payload._id) {
          state.selectedLeave = action.payload;
        }
      });
  },
});

export const { clearSelectedLeave, clearError } = leaveSlice.actions;
export default leaveSlice.reducer;