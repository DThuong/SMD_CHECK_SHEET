import { useEffect, useState } from "react";
import Modal from "../Modal";
import ViewDetailButton from "../ViewDetailButton";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { uploadBothFiles } from "../../redux/slices/changeModelSlice";
import {addCompletedTable} from "../../redux/slices/subTableSlice";
type SheetHeaderProps = {
  lcr?: File | undefined;
  reflow?: File | undefined;
};

const initialHeaderProps: SheetHeaderProps = {
  lcr: undefined,
  reflow: undefined,
};

const SheetHeader = ({canEdit}: {canEdit: boolean}) => {
  const dispatch = useAppDispatch();
  // lấy dữ liệu từ redux
  const { currentSheet, error, uploadLoading } = useAppSelector((state) => state.changeModel);
  // const { sheetData, updateSheetHeader} = useSmdSheet();
  const [open, setOpen] = useState(false);
  
  // State lưu trữ đối tượng File đã chọn
  const [form, setForm] = useState<SheetHeaderProps>(initialHeaderProps);
  
  // State tạm thời để lưu trữ file khi chỉnh sửa trong modal
  const [tempForm, setTempForm] = useState<SheetHeaderProps>(initialHeaderProps);

  const { completedTables } = useAppSelector(state => state.subTable);
  const isCompleted = completedTables.includes('SheetHeader');

  const [warningMessage, setWarningMessage] = useState(false);

  // component mount lần đầu, reset state
  useEffect(() => {
    if (currentSheet) {
      setForm({
        lcr: undefined,
        reflow: undefined
      });
    }
  }, [currentSheet]);

  // set hiển thị warning message trong 2s
  useEffect(() => {
      if (warningMessage) {
        const timer = setTimeout(() => {
          setWarningMessage (false);
        }, 4000);
        return () => clearTimeout(timer);
      }
    }, [warningMessage]);

  const set = <K extends keyof SheetHeaderProps>(k: K, v: SheetHeaderProps[K]) =>
    setTempForm((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    const hasExcelFile = currentSheet?.excelFileUrl || form.lcr;
    const hasPdfFile = currentSheet?.pdfFileUrl || form.reflow;
    
    // ✅ CHỈ mark completed khi CẢ HAI file đều có
    if (hasExcelFile && hasPdfFile && !isCompleted) {
      console.log('✅ Both files uploaded, marking SheetHeader as completed');
      dispatch(addCompletedTable('SheetHeader'));
    }
  }, [currentSheet, form, dispatch, isCompleted]);


  /**
   * Hàm xử lý khi nhấn nút Lưu trong Modal.
   * CẬP NHẬT: Lưu tempForm vào form chính, sau đó update context
   */
  const submit = async () => {
    if (!currentSheet?.id) {
      alert('Không tìm thấy Change Model ID!');
      return;
    }

    // VALIDATION 1: Kiểm tra CẢ HAI file phải có
    if (!tempForm.lcr || !tempForm.reflow) {
      setWarningMessage(true);
      return;
    }

    try {
      await dispatch(uploadBothFiles({
        changeModelId: currentSheet.id,
        excelFile: tempForm.lcr,
        pdfFile: tempForm.reflow,
      })).unwrap();

      // Cập nhật form chính sau khi upload thành công
      setForm(tempForm);
      setOpen(false);
    } catch (err: any) {
      alert(`Upload thất bại: ${err}`);
    }
  };
  
  /**
   * Mở modal và đồng bộ hóa state chính vào state tạm thời.
   */
  const handleOpenModal = () => {
    setTempForm(form); // Gán giá trị file hiện tại vào state tạm
    setOpen(true);
  };

  const handleFileChange = (type: keyof SheetHeaderProps, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      set(type, file);
    } else {
      set(type, undefined);
    }
    e.target.value = ''; 
  };
  
  // Lấy tên file để hiển thị - SỬ DỤNG FORM CHÍNH
 const lcrName = form.lcr?.name || 
    (currentSheet?.excelFileUrl ? currentSheet.excelFileUrl.split('/').pop() : "Chưa có file");
  
  const reflowName = form.reflow?.name || 
    (currentSheet?.pdfFileUrl ? currentSheet.pdfFileUrl.split('/').pop() : "Chưa có file");
  
  const tempLcrName = tempForm.lcr?.name || lcrName;
  const tempReflowName = tempForm.reflow?.name || reflowName;

  const bothFilesUploaded = 
    (form.lcr || currentSheet?.excelFileUrl) && 
    (form.reflow || currentSheet?.pdfFileUrl);


  // *** PHẦN RENDER GIAO DIỆN ***
  return (
    <div>
      <div className="p-0 w-full">
        {/* Status Indicator */}
        {warningMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 w-full max-w-[900px] animate-slide-down z-99">
          <div className="bg-orange-50 border-l-4 border-orange-200 p-3 rounded shadow">
            <p className="font-bold text-black text-sm text-center mb-0">⚠️ Vui lòng chọn cả 2 file (LCR Excel và Reflow PDF) để upload. Cả hai file đều bắt buộc.</p>
          </div>
        </div>
      )}
        {bothFilesUploaded && isCompleted && (
          <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-xs text-green-800 font-semibold flex items-center gap-2 mb-0">
              ✓ Đã upload đầy đủ cả hai file
            </p>
          </div>
        )}
        {/* Website View - Bảng ngang */}
        <div className="hidden lg:block w-full overflow-x-auto">
          <table className="border border-gray-600 w-full min-w-[1400px] text-center">
            <thead>
              {/* Row 1 - Main Header */}
              <tr>
                <th
                  rowSpan={2}
                  colSpan={7}
                  className="border border-gray-600 px-4 py-6 text-2xl font-bold text-left"
                >
                  SMD Check Sheet Change Model
                </th>
                <th
                  rowSpan={2}
                  className="border border-gray-600 px-2 py-2 text-sm font-bold bg-gray-100"
                  style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                >
                  PQC SMD
                </th>
                <th
                  rowSpan={2}
                  className="border border-gray-600 px-2 py-2 text-sm font-bold bg-gray-100"
                  style={{ textOrientation: 'mixed' }}
                >
                  FILE ATTACH
                </th>
                <th
                  colSpan={2}
                  className="border border-gray-600 px-2 py-1 text-xs font-semibold bg-gray-100"
                >
                  LCR FILE (xlsx)
                </th>
                <th
                  colSpan={2}
                  className="border border-gray-600 px-2 py-1 text-xs font-semibold bg-gray-100"
                >
                  REFLOW FILE (pdf)
                </th>
              </tr>

              {/* Row 2 - File Display */}
              <tr>
                {/* LCR FILE Display */}
                <td colSpan={2} className={`border border-gray-600 px-2 py-1 text-xs text-left ${
                  form.lcr || currentSheet?.excelFileUrl ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <div className="text-sm font-semibold truncate text-gray-800">
                    {form.lcr || currentSheet?.excelFileUrl ? (
                      <>✓ {lcrName}</>
                    ) : (
                      <>⚠️ Chưa upload</>
                    )}
                  </div>
                </td>

                {/* REFLOW FILE Display */}
                 <td colSpan={2} className={`border border-gray-600 px-2 py-1 text-xs text-left ${
                  form.reflow || currentSheet?.pdfFileUrl ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <div className="text-sm font-semibold truncate text-gray-800">
                    {form.reflow || currentSheet?.pdfFileUrl ? (
                      <>✓ {reflowName}</>
                    ) : (
                      <>⚠️ Chưa upload</>
                    )}
                  </div>
                </td>
              </tr>
            </thead>
          </table>
        </div>

        {/* Mobile View - Card dọc (Chỉ hiển thị thông tin, click vào để mở modal chỉnh sửa) */}
        <div className="lg:hidden">
          <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm" onClick={handleOpenModal}>
            <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">SMD Check Sheet Change Model</h3>

            <div className="grid grid-cols-2 gap-4 mb-3">
              {/* LCR File Mobile Display */}
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">LCR FILE (.xlsx)</div>
                <div className={`w-full text-sm px-2 py-1 border rounded truncate overflow-hidden ${
                  form.lcr || currentSheet?.excelFileUrl 
                    ? 'bg-green-50 border-green-300 text-green-800' 
                    : 'bg-red-50 border-red-300 text-red-800'
                }`}>
                  {form.lcr || currentSheet?.excelFileUrl ? `✓ ${lcrName}` : '⚠️ Chưa upload'}
                </div>
              </div>

              {/* Reflow File Mobile Display */}
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">REFLOW FILE (.pdf)</div>
                <div className={`w-full text-sm px-2 py-1 border rounded truncate overflow-hidden ${
                  form.reflow || currentSheet?.pdfFileUrl 
                    ? 'bg-green-50 border-green-300 text-green-800' 
                    : 'bg-red-50 border-red-300 text-red-800'
                }`}>
                  {form.reflow || currentSheet?.pdfFileUrl ? `✓ ${reflowName}` : '⚠️ Chưa upload'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-row justify-end w-full gap-2 mt-3">
          <ViewDetailButton onOpen={handleOpenModal} disabled={!canEdit}>Chỉnh sửa</ViewDetailButton>
          {/* <ViewDetailButton color="green" onOpen={submit}>Lưu</ViewDetailButton> */}
        </div>

        {/* Modal để chỉnh sửa/tải lên file */}
         {/* Modal để chỉnh sửa/tải lên file */}
        {/* Modal để chỉnh sửa/tải lên file */}
        <Modal
          open={open}
          title="Upload LCR & REFLOW Files"
          onClose={() => setOpen(false)}
          onSave={submit}
        >
          <div className="grid gap-4 max-h-[60vh] overflow-y-auto">

            {/* Loading state */}
            {uploadLoading && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <p className="text-sm text-blue-600 font-semibold">⏳ Đang upload files...</p>
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 font-semibold">❌ {error}</p>
              </div>
            )}

            {/* LCR File Input */}
            <div className="p-3 border rounded-lg bg-gray-50">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                LCR File (.xlsx) <span className="text-red-500">*</span>
                {tempForm.lcr && <span className="text-green-600 text-xs">✓</span>}
              </h4>
              
              <p className="text-xs text-gray-600 mb-2 truncate">
                File hiện tại: <strong>{tempLcrName}</strong>
              </p>

              <label className="text-xs block mb-2 w-full">
                Chọn File Mới:
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => handleFileChange("lcr", e)}
                  disabled={uploadLoading}
                  className="mt-1 block w-full border rounded px-3 py-2 text-sm cursor-pointer hover:bg-gray-600 bg-gray-500 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                />
              </label>
              
              {tempForm.lcr && (
                <button
                  type="button"
                  onClick={() => set("lcr", undefined)}
                  disabled={uploadLoading}
                  className="w-full text-xs px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Xóa File
                </button>
              )}
            </div>

            {/* Reflow File Input */}
            <div className="p-3 border rounded-lg bg-gray-50">
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                REFLOW File (.pdf) <span className="text-red-500">*</span>
                {tempForm.reflow && <span className="text-green-600 text-xs">✓</span>}
              </h4>
              
              <p className="text-xs text-gray-600 mb-2 truncate">
                File hiện tại: <strong>{tempReflowName}</strong>
              </p>

              <label className="text-xs block mb-2 w-full">
                Chọn File Mới:
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileChange("reflow", e)}
                  disabled={uploadLoading}
                  className="mt-1 block w-full border rounded px-3 py-2 text-sm cursor-pointer hover:bg-gray-600 bg-gray-500 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                />
              </label>
              
              {tempForm.reflow && (
                <button
                  type="button"
                  onClick={() => set("reflow", undefined)}
                  disabled={uploadLoading}
                  className="w-full text-xs px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Xóa File
                </button>
              )}
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}

export default SheetHeader;