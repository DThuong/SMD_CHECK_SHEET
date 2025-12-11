import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = 'https://smd-server-agepb7h5fgdzc7fw.eastasia-01.azurewebsites.net/api';

// ==================== TYPES ====================

// CheckModel
export interface CheckModelData {
    id?: number,
    lineChange?: string,
    model?: string,
    fCode?: string,
    pcBver?: string,
    workOrder?: string,
    usedCNcard?: boolean,
    revS15?: string,
    revMounter?: string,
    qty?: number,
    feederCheck?: string,
    opAccept?: string,
    jig?: boolean,
    codePCB?: string
}

// ProgramCheck
export interface ProgramCheckData {
  id?: number;
  printerProgram?: string;
  spiProgram?: string;
  mounterProgram?: string;
  pointMounter?: number;
  maoiProgram?: string;
  saoiProgram?: string;
  pointSAOI?: number;
  reflowProgram?: string;
  reflowSpeed?: number;
}

// StandardProduction
export interface StandardProductionData {
  id?: number;
  numMASK?: string;
  numMES?: string;
  numScanPrinter?: number;
  numScanSignMES?: number;
  mlS3Closed?: string;
  useOnly?: string;
  labelProgram?: string;
}

// TimeChangeModel
export interface TimeChangeModelData {
  qc?: string;
  result?: string;
  startTime?: string;
  endTime?: string;
  countTime?: number;
  history?: string;
  id?: number;
}

// StandardVehicle
export interface StandardVehicleData {
  printerSpecGTAL?: number;
  printerSpecTDQ?: number;
  printerSpecTDKC?: number;
  printerSpecSLL?: number;
  printerSpecDSL?: number;

  printerRealGTAL?: number;
  printerRealTDQ?: number;
  printerRealTDKC?: number;
  printerRealSLL?: number;
  printerRealDSL?: number;

  printerQ1?: boolean;
  spiQ1?: boolean;
  mountQ1?: boolean;
  mountQ2?: boolean;

  reflowQ1?: boolean;
  reFlowSettingRail?: number;
  reFlowRealRail?: number;

  aoiQ1?: boolean;
  aoiCheck?: string;

  outputQ1?: boolean;
  outputModelValue?: string;
  outputPitchValue?: string;
  outputChecker?: string;

  nameOP?: string;
  nameAOI?: string;

  id?: number;
}

// PQCCheck
export interface PQCCheckData {
  id?: number;
  icPlan?: string;
  checksumReal?: string;
  checksumConfirm?: string;
  turner?: string;
  startLCR?: string;
  endLCR?: string;
  nameCheck?: string;
  resultLCR?: boolean;
}


// ==================== STATE ====================
interface subTableState {
    loading: boolean;
    error: string | null;
    success: boolean;
    lastUpdatedTable: string | null;
    completedTables: string[];

    // data của từng bảng con
    checkModel: CheckModelData | null;
    programCheck: ProgramCheckData | null;
    standardProduction: StandardProductionData | null;
    timeChangeModel: TimeChangeModelData | null;
    standardVehicle: StandardVehicleData | null;
    pqcCheck: PQCCheckData | null;
}

const initialState: subTableState = {
  loading: false,
  error: null,
  success: false,
  lastUpdatedTable: null,
  completedTables: [],
  
  // Initialize data
  checkModel: null,
  programCheck: null,
  standardProduction: null,
  timeChangeModel: null,
  standardVehicle: null,
  pqcCheck: null,
};
// ==================== ASYNC THUNKS ====================

// -----------------PUT DATA
// CheckModel
export const updateCheckModel = createAsyncThunk(
  'subTable/updateCheckModel',
  async ({ id, data }: { id: number; data: CheckModelData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/CheckModel/${id}`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể cập nhật CheckModel');
    }
  }
);

// ProgramCheck
export const updateProgramCheck = createAsyncThunk(
  'subTable/updateProgramCheck',
  async ({ id, data }: { id: number; data: ProgramCheckData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/ProgramCheck/${id}`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể cập nhật ProgramCheck');
    }
  }
);

// StandardProduction
export const updateStandardProduction = createAsyncThunk(
  'subTable/updateStandardProduction',
  async ({ id, data }: { id: number; data: StandardProductionData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/StandardProduction/${id}`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể cập nhật StandardProduction');
    }
  }
);

// TimeChangeModel
export const updateTimeChangeModel = createAsyncThunk(
  'subTable/updateTimeChangeModel',
  async ({ id, data }: { id: number; data: TimeChangeModelData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/TimeChangeModel/${id}`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể cập nhật TimeChangeModel');
    }
  }
);

// StandardVehicle
export const updateStandardVehicle = createAsyncThunk(
  'subTable/updateStandardVehicle',
  async ({ id, data }: { id: number; data: StandardVehicleData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/StandardVehicle/${id}`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể cập nhật StandardVehicle');
    }
  }
);

// PQCCheck
export const updatePQCCheck = createAsyncThunk(
  'subTable/updatePQCCheck',
  async ({ id, data }: { id: number; data: PQCCheckData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/PQCCheck/${id}`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể cập nhật PQCCheck');
    }
  }
);

// -------------------GET DATA
// checkModel
export const fetchCheckModel = createAsyncThunk(
  'subTable/fetchCheckModel',
  async (id: number, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/CheckModel/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải CheckModel');
    }
  }
)
// progamCheck
export const fetchProgramCheck = createAsyncThunk(
  'subTable/fetchProgramCheck',
  async (id: number, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/ProgramCheck/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải ProgramCheck');
    }
  }
);
// StandardProduction
export const fetchStandardProduction = createAsyncThunk(
  'subTable/fetchStandardProduction',
  async (id: number, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/StandardProduction/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải StandardProduction');
    }
  }
)
// StandardVehicle
export const fetchStandardVehicle = createAsyncThunk(
  'subTable/fetchStandardVehicle',
  async (id: number, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/StandardVehicle/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải StandardVehicle');
    }
  }
)
// pqcCheck
export const fetchPQCCheck = createAsyncThunk(
  'subTable/fetchPQCCheck',
  async (id: number, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/PQCCheck/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải PQCCheck');
    }
  }
)
// timeChangeModel
export const fetchTimeChangeModel = createAsyncThunk(
  'subTable/fetchTimeChangeModel',
  async (id: number, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/TimeChangeModel/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải TimeChangeModel');
    }
  }
)
// ==================== SLICE ====================

const subTableSlice = createSlice({
  name: 'subTable',
  initialState,
  reducers: {
    clearSubTableError: (state) => {
      state.error = null;
    },
    clearSubTableSuccess: (state) => {
      state.success = false;
      state.lastUpdatedTable = null;
    },
    resetCompletedTables: (state) => {
      state.completedTables = [];
    },
    // Clear all data
    clearAllSubTableData: (state) => {
      state.completedTables = [];
      state.checkModel = null;
      state.programCheck = null;
      state.standardProduction = null;
      state.timeChangeModel = null;
      state.standardVehicle = null;
      state.pqcCheck = null;
      state.error = null;
      state.success = false;
      state.lastUpdatedTable = null;
    },

    // thêm action để fetch data trực tiếp
    setCheckModel: (state, action) => {
      state.checkModel = action.payload;
    },
    setProgramCheck: (state, action) => {
      state.programCheck = action.payload;
    },
    setPQCCheck: (state, action) => {
      state.pqcCheck = action.payload;
    },
    setStandardProduction: (state, action) => {
      state.standardProduction = action.payload;
    },
    setTimeChangeModel: (state, action) => {
      state.timeChangeModel = action.payload;
    },
    setStandardVehicle: (state, action) => {
      state.standardVehicle = action.payload;
    },
    // sử dụng cho sheet Header
    addCompletedTable: (state, action) => {
      state.completedTables.push(action.payload);
    }
  },
  extraReducers: (builder) => {
    // ----------------------fetch data
    // CheckModel
    builder
      .addCase(fetchCheckModel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCheckModel.fulfilled, (state, action) => {
        state.loading = false;
        state.checkModel = action.payload; //Lưu data vào state
        state.error = null;
      })
      .addCase(fetchCheckModel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    // programCheck
    builder
      .addCase(fetchProgramCheck.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProgramCheck.fulfilled, (state, action) => {
        state.loading = false;
        state.programCheck = action.payload; //Lưu data vào state
        state.error = null;
      })
      .addCase(fetchProgramCheck.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
      // StandardProduction
      builder
      .addCase(fetchStandardProduction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStandardProduction.fulfilled, (state, action) => {
        state.loading = false;
        state.standardProduction = action.payload; //Lưu data vào state
        state.error = null;
      })
      .addCase(fetchStandardProduction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
      // StandardVehicle
      builder
      .addCase(fetchStandardVehicle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStandardVehicle.fulfilled, (state, action) => {
        state.loading = false;
        state.standardVehicle = action.payload; //Lưu data vào state
        state.error = null;
      })
      .addCase(fetchStandardVehicle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
      // PQCCheck
      builder
      .addCase(fetchPQCCheck.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPQCCheck.fulfilled, (state, action) => {
        state.loading = false;
        state.pqcCheck = action.payload; //Lưu data vào state
        state.error = null;
      })
      .addCase(fetchPQCCheck.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    // -----------------------put data
    // CheckModel
    builder
      .addCase(updateCheckModel.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateCheckModel.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.lastUpdatedTable = 'CheckModel';
        if (!state.completedTables.includes('CheckModel')) {
          state.completedTables.push('CheckModel');
        }
        state.error = null;
      })
      .addCase(updateCheckModel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });

    // ProgramCheck
    builder
      .addCase(updateProgramCheck.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateProgramCheck.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.lastUpdatedTable = 'ProgramCheck';
        state.programCheck = action.payload; // Update data sau khi save
        if (!state.completedTables.includes('ProgramCheck')) {
          state.completedTables.push('ProgramCheck');
        }
        state.error = null;
      })
      .addCase(updateProgramCheck.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });

    // StandardProduction
    builder
      .addCase(updateStandardProduction.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateStandardProduction.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.lastUpdatedTable = 'StandardProduction';
        if (!state.completedTables.includes('StandardProduction')) {
          state.completedTables.push('StandardProduction');
        }
        state.error = null;
      })
      .addCase(updateStandardProduction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });

    // TimeChangeModel
    builder
      .addCase(updateTimeChangeModel.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateTimeChangeModel.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.lastUpdatedTable = 'TimeChangeModel';
        if (!state.completedTables.includes('TimeChangeModel')) {
          state.completedTables.push('TimeChangeModel');
        }
        state.error = null;
      })
      .addCase(updateTimeChangeModel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });

    // StandardVehicle
    builder
      .addCase(updateStandardVehicle.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateStandardVehicle.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.lastUpdatedTable = 'StandardVehicle';
        if (!state.completedTables.includes('StandardVehicle')) {
          state.completedTables.push('StandardVehicle');
        }
        state.error = null;
      })
      .addCase(updateStandardVehicle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });

    // PQCCheck
    builder
      .addCase(updatePQCCheck.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updatePQCCheck.fulfilled, (state) => {
        state.loading = false;
        state.success = true;
        state.lastUpdatedTable = 'PQCCheck';
        if (!state.completedTables.includes('PQCCheck')) {
          state.completedTables.push('PQCCheck');
        }
        state.error = null;
      })
      .addCase(updatePQCCheck.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.success = false;
      });
  },
});

export const { 
  clearSubTableError, 
  clearSubTableSuccess, 
  resetCompletedTables, 
  clearAllSubTableData, 
  addCompletedTable,
  setCheckModel,
  setProgramCheck,
  setPQCCheck,
  setStandardProduction,
  setTimeChangeModel,
  setStandardVehicle
} = subTableSlice.actions;
export default subTableSlice.reducer;