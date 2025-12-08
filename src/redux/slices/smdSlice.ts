import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store';

/**
 * 📦 SLICE - Quản lý state cục bộ (không phải API)
 * 
 * Sử dụng khi:
 * ✅ Lưu UI state (modal open/close, selected items...)
 * ✅ Lưu filters, search queries
 * ✅ Lưu temporary data
 */

// ===================================
// 📝 TYPES
// ===================================

interface SmdState {
  // UI State
  isDetailModalOpen: boolean;
  selectedLogId: string | null;
  
  // Filters
  searchFilters: {
    date: string;
    name: string;
    status: 'all' | 'confirmed' | 'pending';
  };
  
  // Temporary data
  draftLog: any | null;
}

// ===================================
// 🎨 INITIAL STATE
// ===================================

const initialState: SmdState = {
  isDetailModalOpen: false,
  selectedLogId: null,
  searchFilters: {
    date: '',
    name: '',
    status: 'all',
  },
  draftLog: null,
};

// ===================================
// 🔧 SLICE
// ===================================

const smdSlice = createSlice({
  name: 'smd',  // Tên của slice
  initialState,
  
  // ✅ REDUCERS - Các hàm thay đổi state
  reducers: {
    // Mở modal detail
    openDetailModal: (state, action: PayloadAction<string>) => {
      state.isDetailModalOpen = true;
      state.selectedLogId = action.payload;
    },
    
    // Đóng modal detail
    closeDetailModal: (state) => {
      state.isDetailModalOpen = false;
      state.selectedLogId = null;
    },
    
    // Cập nhật filters
    setSearchFilters: (state, action: PayloadAction<Partial<SmdState['searchFilters']>>) => {
      state.searchFilters = {
        ...state.searchFilters,
        ...action.payload,
      };
    },
    
    // Clear filters
    clearSearchFilters: (state) => {
      state.searchFilters = initialState.searchFilters;
    },
    
    // Set filter date
    setFilterDate: (state, action: PayloadAction<string>) => {
      state.searchFilters.date = action.payload;
    },
    
    // Set filter name
    setFilterName: (state, action: PayloadAction<string>) => {
      state.searchFilters.name = action.payload;
    },
    
    // Set filter status
    setFilterStatus: (state, action: PayloadAction<'all' | 'confirmed' | 'pending'>) => {
      state.searchFilters.status = action.payload;
    },
    
    // Save draft log
    saveDraftLog: (state, action: PayloadAction<any>) => {
      state.draftLog = action.payload;
    },
    
    // Clear draft log
    clearDraftLog: (state) => {
      state.draftLog = null;
    },
  },
});

// ===================================
// 🎁 EXPORT ACTIONS
// ===================================

export const {
  openDetailModal,
  closeDetailModal,
  setSearchFilters,
  clearSearchFilters,
  setFilterDate,
  setFilterName,
  setFilterStatus,
  saveDraftLog,
  clearDraftLog,
} = smdSlice.actions;

// ===================================
// 🎯 SELECTORS - Lấy data từ state
// ===================================

export const selectIsDetailModalOpen = (state: RootState) => state.smd.isDetailModalOpen;
export const selectSelectedLogId = (state: RootState) => state.smd.selectedLogId;
export const selectSearchFilters = (state: RootState) => state.smd.searchFilters;
export const selectDraftLog = (state: RootState) => state.smd.draftLog;

// ===================================
// 📤 EXPORT REDUCER
// ===================================

export default smdSlice.reducer;