import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { reportApi } from '../../api/reportApi';

// Async thunks
export const fetchReports = createAsyncThunk(
  'reports/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await reportApi.getAll(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch reports');
    }
  }
);

export const fetchReportById = createAsyncThunk(
  'reports/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await reportApi.getById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch report');
    }
  }
);

export const generateReport = createAsyncThunk(
  'reports/generate',
  async (data, { rejectWithValue }) => {
    try {
      const response = await reportApi.generate(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate report');
    }
  }
);

export const submitDailyReport = createAsyncThunk(
  'reports/submitDaily',
  async (data, { rejectWithValue }) => {
    try {
      const response = await reportApi.submitDaily(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to submit daily report');
    }
  }
);

const initialState = {
  reports: [],
  selectedReport: null,
  loading: false,
  error: null,
  generating: false,
};

const reportSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    clearSelectedReport: (state) => {
      state.selectedReport = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All
      .addCase(fetchReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = action.payload;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch reports';
      })
      // Fetch By ID
      .addCase(fetchReportById.fulfilled, (state, action) => {
        state.selectedReport = action.payload;
      })
      // Generate Report
      .addCase(generateReport.pending, (state) => {
        state.generating = true;
        state.error = null;
      })
      .addCase(generateReport.fulfilled, (state, action) => {
        state.generating = false;
        state.reports.unshift(action.payload);
        state.selectedReport = action.payload;
      })
      .addCase(generateReport.rejected, (state, action) => {
        state.generating = false;
        state.error = action.payload || 'Failed to generate report';
      })
      // Submit Daily Report
      .addCase(submitDailyReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitDailyReport.fulfilled, (state, action) => {
        state.loading = false;
        state.reports.unshift(action.payload);
      })
      .addCase(submitDailyReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to submit daily report';
      });
  },
});

export const { clearSelectedReport, clearError } = reportSlice.actions;
export default reportSlice.reducer;