// src/config/requiredFieldsConfig.ts

/**
 * Config các fields bắt buộc phải điền đầy đủ cho mỗi sub-table
 * Chỉ khi TẤT CẢ fields được điền, table mới được mark là completed
 */

export const REQUIRED_FIELDS_CONFIG = {
  CheckModel: [
    'lineChange',
    'model',
    'fCode',
    'pcBver',
    'workOrder',
    'usedCNcard',
    'revS15',
    'revMounter',
    'qty',
    'feederCheck',
    'opAccept',
    'jig',
    'codePCB'
  ],
  
  ProgramCheck: [
    'printerProgram',
    'spiProgram',
    'mounterProgram',
    'pointMounter',
    'maoiProgram',
    'saoiProgram',
    'pointSAOI',
    'reflowProgram',
    'reflowSpeed',
    'rev'
  ],
  
  StandardProduction: [
    'numMASK',
    'numMES',
    'numScanPrinter',
    'numScanSignMES',
    'mlS3Closed',
    'useOnly',
    'labelProgram'
  ],
  
  TimeChangeModel: [
    'qc',
    'result',
    'startTime',
    'endTime',
    'countTime',
    'history'
  ],
  
  StandardVehicle: [
    'printerSpecGTAL',
    'printerSpecTDQ',
    'printerSpecTDKC',
    'printerSpecSLL',
    'printerSpecDSL',
    'printerRealGTAL',
    'printerRealTDQ',
    'printerRealTDKC',
    'printerRealSLL',
    'printerRealDSL',
    'printerQ1',
    'spiQ1',
    'mountQ1',
    'mountQ2',
    'reflowQ1',
    'reFlowSettingRail',
    'reFlowRealRail',
    'aoiQ1',
    'aoiCheck',
    'outputQ1',
    'outputModelValue',
    'outputPitchValue',
    'outputChecker',
    'nameOP',
    'nameAOI'
  ],
  
  PQCCheck: [
    'icPlan',
    'checksumReal',
    'checksumConfirm',
    'turner',
    'startLCR',
    'endLCR',
    'nameCheck',
    'resultLCR'
  ],
  
  SheetHeader: [
    'lcr',
    'reflow'
  ]
};

/**
 * Helper function để check xem object có đầy đủ required fields không
 * @param obj - Object cần check
 * @param requiredFields - Mảng các field names bắt buộc
 * @returns true nếu TẤT CẢ required fields đã có giá trị hợp lệ
 */
export const hasAllRequiredData = (obj: any, requiredFields: string[]): boolean => {
  if (!obj || !obj.id) return false;
  
  return requiredFields.every(field => {
    const value = obj[field];
    
    // Boolean: luôn valid (true/false đều ok)
    if (typeof value === 'boolean') return true;
    
    // Number: phải có giá trị (không undefined/null)
    // Chú ý: 0 cũng là giá trị hợp lệ
    if (typeof value === 'number') return !isNaN(value);
    
    // String: không được rỗng
    if (typeof value === 'string') return value.trim() !== '';
    
    // Default: không null/undefined
    return value !== null && value !== undefined;
  });
};

/**
 * Helper function để lấy danh sách fields còn thiếu
 * @param obj - Object cần check
 * @param requiredFields - Mảng các field names bắt buộc
 * @returns Mảng các field names còn thiếu
 */
export const getMissingFields = (obj: any, requiredFields: string[]): string[] => {
  if (!obj) return requiredFields;
  
  return requiredFields.filter(field => {
    const value = obj[field];
    
    if (typeof value === 'boolean') return false;
    if (typeof value === 'number') return isNaN(value);
    if (typeof value === 'string') return value.trim() === '';
    
    return value === null || value === undefined;
  });
};