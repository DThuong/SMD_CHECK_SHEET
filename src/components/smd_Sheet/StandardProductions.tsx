import ViewDetailButton from "../ViewDetailButton";
import { useState } from "react";
import Modal from "../Modal";

type StandardProductState = {
  numMask?: string;
  numMes?: string;
  numDaoPrinter?: string;
  numDaoMes?: string;
  msl3Closed?: string;
  exclusiveUse?: "Duksan" | "Heesung";
  labelProgram?: string;
};

const initialStandardProductState: StandardProductState = {
  numMask: "",
  numMes: "",
  numDaoPrinter: "",
  numDaoMes: "",
  msl3Closed: "",
  exclusiveUse: undefined,
  labelProgram: ""
};

// Standard Production Section
const StandardProductionSection = () => {
      const [form, setForm] = useState<StandardProductState>(initialStandardProductState);
        const [open, setOpen] = useState(false);
    
        const set = <K extends keyof StandardProductState>(k: K, v: StandardProductState[K]) =>
        setForm((s) => ({ ...s, [k]: v }));
    
        const submit = () => {
          console.log("submit", form);
          setOpen(false);
        };
  return (
    <div className="p-3 sm:p-4 w-full">
        {/** repsponsive for website */}
        <div className='hidden lg:block w-full overflow-x-auto'>
        <table className="border border-gray-600 w-full text-center opacity-60">
            <tbody>
            {/* Row 10 */}
                <tr>
                <th rowSpan={2} className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">Tiêu chuẩn sản xuất</th>
                <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Số quản lý trên Mask</th>
                <td className="border border-gray-600 px-2 py-2"></td>
                <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Số dao quét numMask</th>
                <td className="border border-gray-600 px-2 py-2"></td>
                <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Liệu MSL3 mở đóng gói</th>
                <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Chỉ sử dụng</th>
                <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Chương trình máy label</th>
                </tr>

                {/* Row 11 */}
                <tr>
                <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Số đăng ký trên MES</th>
                <td className="border border-gray-600 px-2 py-2 text-xs"></td>
                <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Số đăng ký dao quét trên MES</th>
                <td className="border border-gray-600 px-2 py-2 text-xs"></td>
                <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs"></td>
                <td colSpan={2} className="border border-gray-600 px-2 py-2">
                    <div className="flex flex-row justify-center items-center gap-3">
                    <div className="flex flex-row items-center justify-center gap-1"><input type="checkbox" className="w-4 h-4"/><label className="flex items-center justify-center gap-2">
                        Duksan
                    </label></div>
                    <div className="flex flex-row items-center justify-center gap-1">
                        <input type="checkbox" className="w-4 h-4"/>
                        <label className="flex items-center justify-center gap-2">
                        Heesung
                    </label>
                    </div>
                    </div>
                </td>
                <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs"></td>
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
          {form.numMask || "—"}
        </div>
      </div>

      <div className="min-w-0">
        <div className="text-xs font-semibold text-gray-600 mb-1">Số đăng ký trên MES</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
          {form.numMes || "—"}
        </div>
      </div>
    </div>

    {/* Row 2: Số dao quét Printer */}
        <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Số dao quét Printer</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
            {form.numDaoPrinter || "—"}
        </div>
        </div>

        {/* Row 3: Số đăng ký dao quét trên MES */}
        <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Số đăng ký dao quét trên MES</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
            {form.numDaoMes || "—"}
        </div>
        </div>

    {/* Row 3: Liệu MSL3 mở đóng gói & Chương trình máy label */}
    <div className="grid grid-cols-2 gap-4 mb-3">
      <div className="min-w-0">
        <div className="text-xs font-semibold text-gray-600 mb-1">Liệu MSL3 mở đóng gói</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
          {form.msl3Closed || "—"}
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
        {form.exclusiveUse === "Duksan" 
          ? "Duksan" 
          : form.exclusiveUse === "Heesung" 
          ? "Heesung" 
          : "—"}
      </div>
    </div>
  </div>
</div>
      {/** buttons */}
      <div className="flex flex-row justify-end w-full gap-2 mt-3">
        <ViewDetailButton onOpen={() => setOpen(true)}>Chỉnh sửa</ViewDetailButton>
        <ViewDetailButton color="green" onOpen={() => {}}>Lưu</ViewDetailButton>
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
          value={form.numMask ?? ""} 
          onChange={(e) => set("numMask", e.target.value)} 
          className="mt-1 block w-full border rounded px-3 py-2 text-sm"
          placeholder=""
        />
      </label>

      <label className="text-xs">
        Số đăng ký trên MES
        <input 
          value={form.numMes ?? ""} 
          onChange={(e) => set("numMes", e.target.value)} 
          className="mt-1 block w-full border rounded px-3 py-2 text-sm"
          placeholder=""
        />
      </label>
    </div>

    <label className="text-xs">
    Số dao quét Printer
    <input 
        value={form.numDaoPrinter ?? ""} 
        onChange={(e) => set("numDaoPrinter", e.target.value)} 
        className="mt-1 block w-full border rounded px-3 py-2 text-sm"
        placeholder=""
    />
    </label>

    <label className="text-xs">
    Số đăng ký dao quét trên MES
    <input 
        value={form.numDaoMes ?? ""} 
        onChange={(e) => set("numDaoMes", e.target.value)} 
        className="mt-1 block w-full border rounded px-3 py-2 text-sm"
        placeholder=""
    />
    </label>

    <label className="text-xs">
      Liệu MSL3 mở đóng gói
      <input 
        value={form.msl3Closed ?? ""} 
        onChange={(e) => set("msl3Closed", e.target.value)} 
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
            onClick={() => set("exclusiveUse", "Duksan")} 
            className={`px-3 py-2 rounded text-sm border ${form.exclusiveUse === "Duksan" ? "bg-blue-100 border-blue-500" : ""}`}
          >
            Duksan
          </button>
          <button 
            type="button" 
            onClick={() => set("exclusiveUse", "Heesung")} 
            className={`px-3 py-2 rounded text-sm border ${form.exclusiveUse === "Heesung" ? "bg-blue-100 border-blue-500" : ""}`}
          >
            Heesung
          </button>
          <button 
            type="button" 
            onClick={() => set("exclusiveUse", undefined)} 
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