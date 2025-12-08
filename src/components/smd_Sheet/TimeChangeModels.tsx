import { useEffect, useState } from "react";
import Modal from "../Modal";
import ViewDetailButton from "../ViewDetailButton";
import { useSmdSheet } from "../../contexts/SmdSheetContext";

type TimeChangeState = {
  resultName?: string;   
  timeStart?: string;
  timeEnd?: string;        
  minutes?: number;    
  history?: string;  
  qcName?: string;          
};

const initialTimeChangeState: TimeChangeState = {
  resultName: "",   
  timeStart: "",
  timeEnd: "",        
  minutes: undefined,    
  history: "",  
  qcName: "",   
};

const TimeChangeModels = () => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TimeChangeState>(initialTimeChangeState);
  const { sheetData, updateTimeChange } = useSmdSheet();
  useEffect(() => {
    setForm(sheetData.timeChange);
  }, [sheetData.timeChange]);
  const set = <K extends keyof TimeChangeState>(
    k: K,
    v: TimeChangeState[K]
  ) => setForm((s) => ({ ...s, [k]: v }));

  const submit = () => {
    // console.log("submit", form);
    updateTimeChange(form);
    setOpen(false);
    alert("Time Change Models updated successfully!");
  };

  return (
    <div className="p-0 py-4 w-full">
      {/* Desktop View */}
      <div className="hidden lg:block w-full overflow-x-auto">
        <table className="border border-gray-600 w-full min-w-[1400px] text-center opacity-60">
          <tbody>
            {/* Row 12 - Title */}
            <tr>
              <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">
                Thời gian đổi model
              </th>
              <td colSpan={12} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
            </tr>

            {/* Row 13 - Section Headers */}
            <tr>
              <th className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Hạng mục</th>
              <th className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Tên</th>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Thời gian bắt đầu</th>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Thời gian kết thúc</th>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Số phút</th>
              <th colSpan={4} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Lịch sử</th>
            </tr>

            {/* Row 14 - Result */}
            <tr>
              <th className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">Result</th>
              <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs">{form.resultName || ""}</td>
              <td colSpan={2} rowSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{form.timeStart || ""}</td>
              <td colSpan={2} rowSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{form.timeEnd || ""}</td>
              <td colSpan={2} rowSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{form.minutes ?? ""}</td>
              <td colSpan={2} rowSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{form.history || ""}</td>
            </tr>

            {/* Row 15 - QC */}
            <tr>
              <th className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">QC</th>
              <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs">{form.qcName || ""}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mobile View - Card dọc */}
      <div className="lg:hidden">
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm mb-4" onClick={() => setOpen(true)}>
          <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-200">Thời gian đổi model</h3>

          {/* tên QC */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-600 mb-1">Tên QC</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
              {form.qcName || "—"}
            </div>
          </div>

          {/* Tên Result */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-600 mb-1">Tên Result</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
              {form.resultName || "—"}
            </div>
          </div>
          
          {/* Thời gian bắt đầu */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-600 mb-1">Thời gian bắt đầu</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
              {form.timeStart || "—"}
            </div>
          </div>

          {/* Thời gian kết thúc */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-600 mb-1">Thời gian kết thúc</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
              {form.timeEnd || "—"}
            </div>
          </div>

          {/* Số phút */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-600 mb-1">Số phút</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
              {form.minutes ?? "—"}
            </div>
          </div>

          {/* Lịch sử */}
          <div className="mb-3 min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">Lịch sử</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 whitespace-pre-wrap wrap-break-word">
              {form.history || "—"}
            </div>
          </div>
        </div>

      </div>

      {/* Buttons */}
      <div className="flex flex-row justify-end w-full gap-2 mt-3">
        <ViewDetailButton onOpen={() => setOpen(true)}>Chỉnh sửa</ViewDetailButton>
        {/* <ViewDetailButton color="green" onOpen={() => {}}>Lưu</ViewDetailButton> */}
      </div>

      {/* Modal */}
<Modal
  open={open}
  title="Chi tiết Thời gian đổi model"
  onClose={() => setOpen(false)}
  onSave={submit}
>
  <div className="grid gap-3 max-h-[60vh] overflow-y-auto px-1">
    {/* Time change model Section */}
    <div className="pb-3 border-b border-gray-200">
      <div className="grid grid-cols-2 gap-3 mb-3">

        <div className="min-w-0">
          <label className="text-xs block mb-1">Tên QC</label>
          <input
            type="text"
            value={form.qcName ?? ""}
            onChange={(e) => set("qcName", e.target.value)}
            className="block w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="min-w-0">
          <label className="text-xs block mb-1">Tên Result</label>
          <input
            type="text"
            value={form.resultName ?? ""}
            onChange={(e) => set("resultName", e.target.value)}
            className="block w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        
        <div className="min-w-0">
          <label className="text-xs block mb-1">Thời gian bắt đầu</label>
          <input
            type="time"
            value={form.timeStart ?? ""}
            onChange={(e) => set("timeStart", e.target.value)}
            className="block w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="min-w-0">
          <label className="text-xs block mb-1">Thời gian kết thúc</label>
          <input
            type="time"
            value={form.timeEnd ?? ""}
            onChange={(e) => set("timeEnd", e.target.value)}
            className="block w-full border rounded px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="mb-3 min-w-0">
        <label className="text-xs block mb-1">Số phút</label>
        <input
          type="number"
          value={form.minutes ?? ""}
          onChange={(e) => set("minutes", e.target.value ? Number(e.target.value) : undefined)}
          className="block w-full border rounded px-3 py-2 text-sm"
          placeholder="Nhập số phút..."
        />
      </div>

      <div className="min-w-0">
        <label className="text-xs block mb-1">Lịch sử</label>
        <textarea
          value={form.history ?? ""}
          onChange={(e) => set("history", e.target.value)}
          className="focus:outline-none block w-full border rounded px-3 py-2 text-sm min-h-20 resize-y wrap-break-words"
          placeholder="Nhập lịch sử..."
        />
      </div>
    </div>
  </div>
</Modal>
    </div>
  );
};

export default TimeChangeModels;