/* eslint-disable @typescript-eslint/no-explicit-any */
// utils/navigationState.ts

const FILTER_STATE_KEY = 'logsFilter';
const CURRENT_PAGE_KEY = 'logsCurrentPage';
const SELECTED_SHEET_ID_KEY = 'selectedSheetId';
const HOME_FILTER_STATE_KEY = 'homeFilterState';
const HOME_CURRENT_PAGE_KEY = 'homeCurrentPage';
const HOME_ACTIVE_TAB_KEY = 'homeActiveTab';

// ✅ Save Home filter state
export const saveHomeFilterState = (filter: any, currentPage: number, activeTab: string) => {
  try {
    sessionStorage.setItem(HOME_FILTER_STATE_KEY, JSON.stringify(filter));
    sessionStorage.setItem(HOME_CURRENT_PAGE_KEY, currentPage.toString());
    sessionStorage.setItem(HOME_ACTIVE_TAB_KEY, activeTab);
  } catch (error) {
    console.error('Error saving home filter state:', error);
  }
};

// ✅ Get Home filter state
export const getHomeFilterState = (): { 
  filter: any | null; 
  currentPage: number;
  activeTab: string;
} => {
  try {
    const filterStr = sessionStorage.getItem(HOME_FILTER_STATE_KEY);
    const pageStr = sessionStorage.getItem(HOME_CURRENT_PAGE_KEY);
    const activeTab = sessionStorage.getItem(HOME_ACTIVE_TAB_KEY);
    
    return {
      filter: filterStr ? JSON.parse(filterStr) : null,
      currentPage: pageStr ? parseInt(pageStr) : 0,
      activeTab: activeTab || 'list'
    };
  } catch (error) {
    console.error('Error getting home filter state:', error);
    return { filter: null, currentPage: 0, activeTab: 'list' };
  }
};

// ✅ Clear Home filter state
export const clearHomeFilterState = () => {
  try {
    sessionStorage.removeItem(HOME_FILTER_STATE_KEY);
    sessionStorage.removeItem(HOME_CURRENT_PAGE_KEY);
    sessionStorage.removeItem(HOME_ACTIVE_TAB_KEY);
  } catch (error) {
    console.error('Error clearing home filter state:', error);
  }
};

// ✅ Save filter state
export const saveFilterState = (filter: any, currentPage: number) => {
  try {
    sessionStorage.setItem(FILTER_STATE_KEY, JSON.stringify(filter));
    sessionStorage.setItem(CURRENT_PAGE_KEY, currentPage.toString());
  } catch (error) {
    console.error('Error saving filter state:', error);
  }
};

// ✅ Get filter state
export const getFilterState = (): { filter: any | null; currentPage: number } => {
  try {
    const filterStr = sessionStorage.getItem(FILTER_STATE_KEY);
    const pageStr = sessionStorage.getItem(CURRENT_PAGE_KEY);
    
    return {
      filter: filterStr ? JSON.parse(filterStr) : null,
      currentPage: pageStr ? parseInt(pageStr) : 0
    };
  } catch (error) {
    console.error('Error getting filter state:', error);
    return { filter: null, currentPage: 0 };
  }
};

// ✅ Clear filter state (nếu cần)
export const clearFilterState = () => {
  try {
    sessionStorage.removeItem(FILTER_STATE_KEY);
    sessionStorage.removeItem(CURRENT_PAGE_KEY);
  } catch (error) {
    console.error('Error clearing filter state:', error);
  }
};

// ✅ Selected sheet ID functions
export const saveSelectedSheetId = (sheetId: number) => {
  try {
    sessionStorage.setItem(SELECTED_SHEET_ID_KEY, sheetId.toString());
  } catch (error) {
    console.error('Error saving selected sheet ID:', error);
  }
};

export const getSelectedSheetId = (): number | null => {
  try {
    const id = sessionStorage.getItem(SELECTED_SHEET_ID_KEY);
    return id ? parseInt(id) : null;
  } catch (error) {
    console.error('Error getting selected sheet ID:', error);
    return null;
  }
};

export const clearSelectedSheetId = () => {
  try {
    sessionStorage.removeItem(SELECTED_SHEET_ID_KEY);
  } catch (error) {
    console.error('Error clearing selected sheet ID:', error);
  }
};