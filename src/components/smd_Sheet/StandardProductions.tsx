import ViewDetailButton from "../ViewDetailButton";
import { use, useEffect, useState } from "react";
import Modal from "../Modal";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchStandardProduction, updateStandardProduction } from "../../redux/slices/subTableSlice";
import type { StandardProductionData } from "../../redux/slices/subTableSlice";
import SmdSheet from "../SmdSheet";


const initialStandardProductState: StandardProductionData = {
    id: undefined,
    numMASK: "",
    numMES: "",
    numScanPrinter: undefined,
    numScanSignMES: undefined,
    mlS3Closed: "",
    useOnly: "",
    labelProgram: ""
};

// Standard Production Section
const StandardProductionSection = () => {

  const dispatch = useAppDispatch();
    // khai báo loading để xử lý loading state trong modal
  const { completedTables } = useAppSelector(state => state.subTable);
    // lấy checkModel data từ redux store
  const {standardProduction} = useAppSelector(state => state.subTable);
    // lấy checkModel id từ currentSheet trong changeModel Slice
  const currentSheet = useAppSelector(state => state.changeModel.currentSheet);
  const smdSheetId = currentSheet?.id;
  const standardProductionId = currentSheet?.standardProductionId;
  
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<StandardProductionData>(initialStandardProductState);
  
  const isSaved = completedTables.includes('StandardProduction');
  

  // fetch data khi programcheck thay đổi
      useEffect(() => {
        if (standardProductionId) {
          dispatch(fetchStandardProduction(standardProductionId));
        }
      }, [standardProductionId, dispatch]);
      // sync form với redux store thay vì sử dụng context
      useEffect(() => {
        if (standardProduction) {
          setForm(standardProduction);
        }
      }, [standardProduction]);
  

  const set = <K extends keyof StandardProductionData>(k: K, v: StandardProductionData[K]) =>
  setForm((s) => ({ ...s, [k]: v }));
    
  const submit = async() => {
    // kiểm tra program Check id
          if (!standardProductionId) {
            alert('Không tìm thấy Program Check ID');
            return;
          }
    
          if (!smdSheetId) {
            alert('Không tìm thấy SMD Sheet ID');
            return;
          }
    
          try {
            // Dispatch action để update
            await dispatch(updateStandardProduction({
              id: smdSheetId,
              data: form
            })).unwrap();
            
            setOpen(false);
          } catch (error) {
            console.error('Failed to update program checks:', error);
            alert('Có lỗi xảy ra khi cập nhật Program Checks');
          }
  };
  return (
    <div className="p-0 py-4 w-full">
      {/* Status indicator */}
      {standardProductionId && (
        <div className={`mb-2 text-xs p-2 rounded flex items-center gap-2 ${
          isSaved ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-600 border border-gray-200'
        }`}>
          {isSaved && <span className="text-green-600">✓</span>}
          <span>ProgramCheck ID: <strong>{standardProductionId}</strong></span>
          {currentSheet?.id && <span>| ChangeModel ID: <strong>{currentSheet.id}</strong></span>}
          {isSaved && <span className="ml-auto font-semibold">Đã lưu</span>}
        </div>
      )}
        {/** repsponsive for website */}
        <div className='hidden lg:block w-full overflow-x-auto'>
        <table className="border border-gray-600 w-full text-center opacity-60">
          <tbody>
            {/* Row 10 */}
            <tr>
              <th rowSpan={2} className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">Tiêu chuẩn sản xuất</th>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Số quản lý trên Mask</th>
              <td className="border border-gray-600 px-2 py-2 text-xs">{form.numMASK || ""}</td>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Số dao quét Printer</th>
              <td className="border border-gray-600 px-2 py-2 text-xs">{form.numScanPrinter || ""}</td>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Liệu MSL3 mở đóng gói</th>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Chỉ sử dụng</th>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Chương trình máy label</th>
            </tr>

            {/* Row 11 */}
            <tr>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Số đăng ký trên MES</th>
              <td className="border border-gray-600 px-2 py-2 text-xs">{form.numMES || ""}</td>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Số đăng ký dao quét trên MES</th>
              <td className="border border-gray-600 px-2 py-2 text-xs">{form.numScanSignMES || ""}</td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{form.mlS3Closed || ""}</td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2">
                <div className="flex flex-row justify-center items-center gap-3">
                  <div className="flex flex-row items-center justify-center gap-1">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4"
                      checked={form.useOnly === "Duksan"}
                      onChange={() => set("useOnly", form.useOnly === "Duksan" ? undefined : "Duksan")}
                    />
                    <label className="flex items-center justify-center gap-2 text-xs">
                      Duksan
                    </label>
                  </div>
                  <div className="flex flex-row items-center justify-center gap-1">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4"
                      checked={form.useOnly === "Heesung"}
                      onChange={() => set("useOnly", form.useOnly === "Heesung" ? undefined : "Heesung")}
                    />
                    <label className="flex items-center justify-center gap-2 text-xs">
                      Heesung
                    </label>
                  </div>
                </div>
              </td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{form.labelProgram || ""}</td>
            </tr>
          </tbody>
        </table>
      </div>
        
{/* Responsive for mobile */}
{/* Mobile View - Card dọc */}
<div className="lg:hidden">
  <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm" onClick={() => setOpen(true)}>
    <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">Tiêu chuẩn sản xuất</h3>
    {/* Row 1: Số quản lý trên Mask & Số đăng ký trên MES */}
    <div className="grid grid-cols-2 gap-4 mb-3">
      <div className="min-w-0">
        <div className="text-xs font-semibold text-gray-600 mb-1">Số quản lý trên Mask</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
          {form.numMASK || "—"}
        </div>
      </div>

      <div className="min-w-0">
        <div className="text-xs font-semibold text-gray-600 mb-1">Số đăng ký trên MES</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
          {form.numMES || "—"}
        </div>
      </div>
    </div>

    {/* Row 2: Số dao quét Printer */}
        <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Số dao quét Printer</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
            {form.numScanPrinter || "—"}
        </div>
        </div>

        {/* Row 3: Số đăng ký dao quét trên MES */}
        <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Số đăng ký dao quét trên MES</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
            {form.numScanSignMES || "—"}
        </div>
        </div>

    {/* Row 3: Liệu MSL3 mở đóng gói & Chương trình máy label */}
    <div className="grid grid-cols-2 gap-4 mb-3">
      <div className="min-w-0">
        <div className="text-xs font-semibold text-gray-600 mb-1">Liệu MSL3 mở đóng gói</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
          {form.mlS3Closed || "—"}
        </div>
      </div>

      <div className="min-w-0">
        <div className="text-xs font-semibold text-gray-600 mb-1">Chương trình máy label</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
          {form.labelProgram || "—"}
        </div>
      </div>
    </div>

    {/* Row 4: Chỉ sử dụng (full width) */}
    <div className="mb-3">
      <div className="text-xs font-semibold text-gray-600 mb-1">Chỉ sử dụng</div>
      <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
        {form.useOnly === "Duksan" 
          ? "Duksan" 
          : form.useOnly === "Heesung" 
          ? "Heesung" 
          : "—"}
      </div>
    </div>
  </div>
</div>
      {/** buttons */}
      <div className="flex flex-row justify-end w-full gap-2 mt-3">
        <ViewDetailButton onOpen={() => setOpen(true)}>Chỉnh sửa</ViewDetailButton>
        {/* <ViewDetailButton color="green" onOpen={() => {}}>Lưu</ViewDetailButton> */}
      </div>

<Modal
  open={open}
  title="Chi tiết Tiêu chuẩn sản xuất"
  onClose={() => setOpen(false)}
  onSave={submit}
>
  <div className="grid gap-3 max-h-[60vh] overflow-y-auto">
    <div className="grid grid-cols-2 gap-3">
      <label className="text-xs">
        Số quản lý trên Mask
        <input 
          value={form.numMASK ?? ""} 
          onChange={(e) => set("numMASK", e.target.value)} 
          className="mt-1 block w-full border rounded px-3 py-2 text-sm"
          placeholder=""
        />
      </label>

      <label className="text-xs">
        Số đăng ký trên MES
        <input 
          value={form.numMES ?? ""} 
          onChange={(e) => set("numMES", e.target.value)} 
          className="mt-1 block w-full border rounded px-3 py-2 text-sm"
          placeholder=""
        />
      </label>
    </div>

    <label className="text-xs">
    Số dao quét Printer
    <input 
        value={form.numScanPrinter ?? ""} 
        onChange={(e) => set("numScanPrinter", e.target.value ? Number(e.target.value) : undefined)}
        className="mt-1 block w-full border rounded px-3 py-2 text-sm"
        placeholder=""
    />
    </label>

    <label className="text-xs">
    Số đăng ký dao quét trên MES
    <input 
        value={form.numScanSignMES ?? ""} 
        onChange={(e) => set("numScanSignMES", e.target.value ? Number(e.target.value) : undefined)}
        className="mt-1 block w-full border rounded px-3 py-2 text-sm"
        placeholder=""
    />
    </label>

    <label className="text-xs">
      Liệu MSL3 mở đóng gói
      <input 
        value={form.mlS3Closed ?? ""} 
        onChange={(e) => set("mlS3Closed", e.target.value)} 
        className="mt-1 block w-full border rounded px-3 py-2 text-sm"
        placeholder=""
      />
    </label>

    <label className="text-xs">
      Chương trình máy label
      <input 
        value={form.labelProgram ?? ""} 
        onChange={(e) => set("labelProgram", e.target.value)} 
        className="mt-1 block w-full border rounded px-3 py-2 text-sm"
        placeholder=""
      />
    </label>

    <div className="flex flex-col gap-2">
      <div>
        <div className="text-xs mb-1">Chỉ sử dụng</div>
        <div className="flex gap-2">
          <button 
            type="button" 
            onClick={() => set("useOnly", "Duksan")} 
            className={`px-3 py-2 rounded text-sm border ${form.useOnly === "Duksan" ? "bg-blue-100 border-blue-500" : ""}`}
          >
            Duksan
          </button>
          <button 
            type="button" 
            onClick={() => set("useOnly", "Heesung")} 
            className={`px-3 py-2 rounded text-sm border ${form.useOnly === "Heesung" ? "bg-blue-100 border-blue-500" : ""}`}
          >
            Heesung
          </button>
          <button 
            type="button" 
            onClick={() => set("useOnly", undefined)} 
            className="px-3 py-2 rounded text-sm border border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  </div>
</Modal>
    </div>
  );
};

export default StandardProductionSection