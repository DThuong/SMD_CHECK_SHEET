import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import smdApi from '../services/smdApi'; // Chỉ import smdApi

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
  imgStandard?: string;
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

  printerProgram?: string;
  spiProgram?: string;
  mounterProgram?: string;
  pointMounter?: number;
  maoiProgram?: string;
  saoiProgram?: string;
  pointSAOI?: number;
  reflowProgram?: string;
  reflowSpeed?: number;
  rev?: string;

  imgSPI?: string;
  imgAOI?: string;

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
  standardProduction: null,
  timeChangeModel: null,
  standardVehicle: null,
  pqcCheck: null,
};

// ==================== ASYNC THUNKS ====================

// ==================== PUT (UPDATE) APIs ====================

// ✅ CheckModel
export const updateCheckModel = createAsyncThunk(
  'subTable/updateCheckModel',
  async ({ id, data }: { id: number; data: CheckModelData }, { rejectWithValue }) => {
    try {
      const response = await smdApi.put(`CheckModel/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể cập nhật CheckModel');
    }
  }
);


// ✅ StandardProduction
export const updateStandardProduction = createAsyncThunk(
  'subTable/updateStandardProduction',
  async ({ id, data }: { id: number; data: StandardProductionData }, { rejectWithValue }) => {
    try {
      const response = await smdApi.put(`StandardProduction/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể cập nhật StandardProduction');
    }
  }
);

// ✅ TimeChangeModel
export const updateTimeChangeModel = createAsyncThunk(
  'subTable/updateTimeChangeModel',
  async ({ id, data }: { id: number; data: TimeChangeModelData }, { rejectWithValue }) => {
    try {
      const response = await smdApi.put(`TimeChangeModel/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể cập nhật TimeChangeModel');
    }
  }
);

// ✅ StandardVehicle
export const updateStandardVehicle = createAsyncThunk(
  'subTable/updateStandardVehicle',
  async ({ id, data }: { id: number; data: StandardVehicleData }, { rejectWithValue }) => {
    try {
      const response = await smdApi.put(`StandardVehicle/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể cập nhật StandardVehicle');
    }
  }
);

// ✅ PQCCheck
export const updatePQCCheck = createAsyncThunk(
  'subTable/updatePQCCheck',
  async ({ id, data }: { id: number; data: PQCCheckData }, { rejectWithValue }) => {
    try {
      const response = await smdApi.put(`PQCCheck/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể cập nhật PQCCheck');
    }
  }
);

// ==================== GET (FETCH) APIs ====================

// ✅ CheckModel
export const fetchCheckModel = createAsyncThunk(
  'subTable/fetchCheckModel',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await smdApi.get(`CheckModel/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải CheckModel');
    }
  }
);

// ✅ StandardProduction
export const fetchStandardProduction = createAsyncThunk(
  'subTable/fetchStandardProduction',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await smdApi.get(`StandardProduction/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải StandardProduction');
    }
  }
);

// ✅ StandardVehicle
export const fetchStandardVehicle = createAsyncThunk(
  'subTable/fetchStandardVehicle',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await smdApi.get(`StandardVehicle/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải StandardVehicle');
    }
  }
);

// ✅ PQCCheck
export const fetchPQCCheck = createAsyncThunk(
  'subTable/fetchPQCCheck',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await smdApi.get(`PQCCheck/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải PQCCheck');
    }
  }
);

// ✅ TimeChangeModel
export const fetchTimeChangeModel = createAsyncThunk(
  'subTable/fetchTimeChangeModel',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await smdApi.get(`TimeChangeModel/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải TimeChangeModel');
    }
  }
);

// upload standard product
export const uploadStandardProductionFile = createAsyncThunk(
  'subTable/uploadStandardProductionFile',
  async ({ standardProductionId, file }: { standardProductionId: number; file: File }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await smdApi.put(`StandardProduction/image/${standardProductionId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải StandardProduction');
    }
  }
);

// upload spi image
export const uploadSPIImage = createAsyncThunk(
  'subTable/uploadSPIImage',
  async ({ id, file }: { id: number; file: File }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await smdApi.put(`StandardVehicle/image-spi/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải StandardVehicle');
    }
  }
);

// upload aoi image
export const uploadAOIImage = createAsyncThunk(
  'subTable/uploadAOIImage',
  async ({ id, file }: { id: number; file: File }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await smdApi.put(`StandardVehicle/image-aoi/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Không thể tải StandardVehicle');
    }
  }
);
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
      state.standardProduction = null;
      state.timeChangeModel = null;
      state.standardVehicle = null;
      state.pqcCheck = null;
      state.error = null;
      state.success = false;
      state.lastUpdatedTable = null;
    },

    // Set actions
    setCheckModel: (state, action) => {
      state.checkModel = action.payload;
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
    addCompletedTable: (state, action) => {
      // Chỉ thêm nếu chưa tồn tại
      if (!state.completedTables.includes(action.payload)) {
        state.completedTables.push(action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    // ==================== FETCH DATA ====================
    
    // CheckModel
    builder
      .addCase(fetchCheckModel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCheckModel.fulfilled, (state, action) => {
        state.loading = false;
        state.checkModel = action.payload;
        state.error = null;
      })
      .addCase(fetchCheckModel.rejected, (state, action) => {
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
        state.standardProduction = action.payload;
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
        state.standardVehicle = action.payload;
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
        state.pqcCheck = action.payload;
        state.error = null;
      })
      .addCase(fetchPQCCheck.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    
    // TimeChangeModel
    builder
      .addCase(fetchTimeChangeModel.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTimeChangeModel.fulfilled, (state, action) => {
        state.loading = false;
        state.timeChangeModel = action.payload;
        state.error = null;
      })
      .addCase(fetchTimeChangeModel.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ==================== UPDATE DATA ====================
    
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

    // Upload SPI Image
builder
  .addCase(uploadSPIImage.pending, (state) => {
    state.loading = true;
    state.error = null;
  })
  .addCase(uploadSPIImage.fulfilled, (state, action) => {
    state.loading = false;
    // Cập nhật URL hình ảnh nếu backend trả về
    if (state.standardVehicle && action.payload?.imageUrl) {
      state.standardVehicle.imgSPI = action.payload.imageUrl;
    }
  })
  .addCase(uploadSPIImage.rejected, (state, action) => {
    state.loading = false;
    state.error = action.payload as string;
  });

// Upload AOI Image
builder
  .addCase(uploadAOIImage.pending, (state) => {
    state.loading = true;
    state.error = null;
  })
  .addCase(uploadAOIImage.fulfilled, (state, action) => {
    state.loading = false;
    // Cập nhật URL hình ảnh nếu backend trả về
    if (state.standardVehicle && action.payload?.imageUrl) {
      state.standardVehicle.imgAOI = action.payload.imageUrl;
    }
  })
  .addCase(uploadAOIImage.rejected, (state, action) => {
    state.loading = false;
    state.error = action.payload as string;
  });

  // upload Standard Production Image
  builder
    .addCase(uploadStandardProductionFile.pending, (state) => {
      state.loading = true;
      state.error = null;
    })
    .addCase(uploadStandardProductionFile.fulfilled, (state, action) => {
      state.loading = false;
      // Cập nhật URL hình ảnh nếu backend trả về
      if (state.standardProduction && action.payload?.imageUrl) {
        state.standardProduction.imgStandard = action.payload.imageUrl;
      }
    })
    .addCase(uploadStandardProductionFile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
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
  setPQCCheck,
  setStandardProduction,
  setTimeChangeModel,
  setStandardVehicle
} = subTableSlice.actions;

export default subTableSlice.reducer;