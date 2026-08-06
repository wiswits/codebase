import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: true,
  theme: 'light',
  modalOpen: false,
  modalContent: null,
  loading: false,
  toast: null,
  searchQuery: '',
  currentPage: 1,
  pageSize: 10,
  sortField: null,
  sortDirection: 'asc',
  filters: {},
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(action.payload);
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(state.theme);
    },
    openModal: (state, action) => {
      state.modalOpen = true;
      state.modalContent = action.payload;
    },
    closeModal: (state) => {
      state.modalOpen = false;
      state.modalContent = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    showToast: (state, action) => {
      state.toast = action.payload;
    },
    clearToast: (state) => {
      state.toast = null;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    setPageSize: (state, action) => {
      state.pageSize = action.payload;
      state.currentPage = 1;
    },
    setSort: (state, action) => {
      state.sortField = action.payload.field;
      state.sortDirection = action.payload.direction || 'asc';
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.currentPage = 1;
    },
    clearFilters: (state) => {
      state.filters = {};
      state.currentPage = 1;
    },
    resetUI: (state) => {
      return { ...initialState, theme: state.theme, sidebarOpen: state.sidebarOpen };
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  toggleTheme,
  openModal,
  closeModal,
  setLoading,
  showToast,
  clearToast,
  setSearchQuery,
  setCurrentPage,
  setPageSize,
  setSort,
  setFilters,
  clearFilters,
  resetUI,
} = uiSlice.actions;

export default uiSlice.reducer;