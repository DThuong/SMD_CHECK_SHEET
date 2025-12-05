import { use, useEffect, useState } from "react";
// Giả định rằng bạn đã có sẵn các component này trong dự án của bạn
import Modal from "../Modal";
import ViewDetailButton from "../ViewDetailButton";
import { useSmdSheet } from "../../contexts/SmdSheetContext";

/**
 * @type SheetHeaderProps
 * Sử dụng File | string | undefined. Trong thực tế, chúng ta sẽ lưu đối tượng File
 * hoặc đường dẫn/tên File sau khi upload thành công.
 * Ở đây, tôi dùng `File | undefined` để quản lý việc chọn File trong React State.
 */
type SheetHeaderProps = {
  lcr?: File | undefined;
  reflow?: File | undefined;
};

const initialHeaderProps: SheetHeaderProps = {
  lcr: undefined,
  reflow: undefined,
};

const SheetHeader = () => {
  const { sheetData, updateSheetHeader} = useSmdSheet();
  const [open, setOpen] = useState(false);
  // useEffect
  useEffect(() => {
    setForm(sheetData.sheetHeader);
  }, [sheetData.sheetHeader]);

  // State lưu trữ đối tượng File đã chọn
  const [form, setForm] = useState<SheetHeaderProps>(initialHeaderProps);
  
  // State tạm thời để lưu trữ file khi chỉnh sửa trong modal
  const [tempForm, setTempForm] = useState<SheetHeaderProps>(initialHeaderProps);

  /**
   * Hàm helper để cập nhật state form.
   * @param k - key của thuộc tính cần cập nhật.
   * @param v - giá trị mới (là đối tượng File hoặc undefined).
   */
  const set = <K extends keyof SheetHeaderProps>(k: K, v: SheetHeaderProps[K]) =>
    setTempForm((s) => ({ ...s, [k]: v }));

  /**
   * Hàm xử lý khi nhấn nút Lưu trong Modal.
   */
  const submit = () => {
    updateSheetHeader(form);
    setOpen(false);
    alert('Sheet Header updated successfully!');
  };
  
  /**
   * Mở modal và đồng bộ hóa state chính vào state tạm thời.
   */
  const handleOpenModal = () => {
    setTempForm(form); // Gán giá trị file hiện tại vào state tạm
    setOpen(true);
  };

  /**
   * Xử lý khi người dùng chọn file thật trong Modal.
   */
  const handleFileChange = (type: keyof SheetHeaderProps, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      set(type, file);
    } else {
      set(type, undefined);
    }
    // Sau khi chọn file, reset input để có thể chọn lại file cùng tên
    e.target.value = ''; 
  };
  
  // Lấy tên file để hiển thị
  const lcrName = form.lcr?.name || "Chưa có file";
  const reflowName = form.reflow?.name || "Chưa có file";
  const tempLcrName = tempForm.lcr?.name || "Chưa có file";
  const tempReflowName = tempForm.reflow?.name || "Chưa có file";


  // *** PHẦN RENDER GIAO DIỆN ***
  return (
    <div>
      <div className="p-0 w-full">
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
                <td colSpan={2} className="border border-gray-600 px-2 py-1 text-xs bg-gray-50 text-left">
                  <div className="text-sm font-semibold truncate text-gray-800">{lcrName}</div>
                </td>

                {/* REFLOW FILE Display */}
                <td colSpan={2} className="border border-gray-600 px-2 py-1 text-xs bg-gray-50 text-left">
                  <div className="text-sm font-semibold truncate text-gray-800">{reflowName}</div>
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
                <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
                  {lcrName}
                </div>
              </div>

              {/* Reflow File Mobile Display */}
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">REFLOW FILE (.pdf)</div>
                <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
                  {reflowName}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-row justify-end w-full gap-2 mt-3">
          <ViewDetailButton onOpen={handleOpenModal}>Chỉnh sửa</ViewDetailButton>
          {/* <ViewDetailButton color="green" onOpen={submit}>Lưu</ViewDetailButton> */}
        </div>

        {/* Modal để chỉnh sửa/tải lên file */}
        <Modal
          open={open}
          title="Chi tiết LCR, REFLOW Files"
          onClose={() => setOpen(false)}
          onSave={submit}
        >
          <div className="grid gap-3 max-h-[60vh] overflow-y-auto">
            {/* LCR File Input trong Modal */}
            <div className="p-3 border rounded-lg">
                <h4 className="text-sm font-semibold mb-2">LCR File (.xlsx)</h4>
                
                {/* Hiển thị tên file hiện tại */}
                <p className="text-xs text-gray-600 mb-2 truncate">
                    **File hiện tại:** <strong>{tempLcrName}</strong>
                </p>

                {/* Input chọn file mới */}
                <label className="text-xs block mb-2 w-full">
                    Chọn File Mới (xlsx):
                    <input
                        type="file"
                        accept=".xlsx"
                        onChange={(e) => handleFileChange("lcr", e)}
                        className="mt-1 block w-full border rounded px-3 py-2 text-sm cursor-pointer hover:bg-gray-600 bg-gray-500 text-white"
                    />
                </label>
                
                {/* Nút xóa file */}
                <button
                    type="button"
                    onClick={() => set("lcr", undefined)}
                    disabled={!tempForm.lcr}
                    className={`w-full text-xs px-3 py-1 rounded ${!tempForm.lcr ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-red-500 text-white hover:bg-red-600"}`}
                >
                    Xóa File Hiện Tại
                </button>
            </div>

            {/* Reflow File Input trong Modal */}
            <div className="p-3 border rounded-lg">
                <h4 className="text-sm font-semibold mb-2">REFLOW File (.pdf)</h4>
                
                {/* Hiển thị tên file hiện tại */}
                <p className="text-xs text-gray-600 mb-2 truncate">
                    **File hiện tại:** <strong>{tempReflowName}</strong>
                </p>

                {/* Input chọn file mới */}
                <label className="text-xs block mb-2 w-full">
                    Chọn File Mới (pdf):
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileChange("reflow", e)}
                        className="mt-1 block w-full border rounded px-3 py-2 text-sm cursor-pointer hover:bg-gray-600 bg-gray-500 text-white"
                    />
                </label>
                
                {/* Nút xóa file */}
                <button
                    type="button"
                    onClick={() => set("reflow", undefined)}
                    disabled={!tempForm.reflow}
                    className={`w-full text-xs px-3 py-1 rounded ${!tempForm.reflow ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-red-500 text-white hover:bg-red-600"}`}
                >
                    Xóa File Hiện Tại
                </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}

export default SheetHeader;