import { useState } from "react";
import Modal from "../Modal";
import ViewDetailButton from "../ViewDetailButton";

type TimeChangeState = {
  resultStart?: string;      // Thời gian bắt đầu Result
  resultEnd?: string;         // Thời gian kết thúc Result
  resultMinutes?: number;     // Số phút Result
  resultHistory?: string;     // Lịch sử Result
  qcStart?: string;          // Thời gian bắt đầu QC
  qcEnd?: string;            // Thời gian kết thúc QC
  qcMinutes?: number;        // Số phút QC
  qcHistory?: string;        // Lịch sử QC
};

const initialTimeChangeState: TimeChangeState = {
  resultStart: "",
  resultEnd: "",
  resultMinutes: undefined,
  resultHistory: "",
  qcStart: "",
  qcEnd: "",
  qcMinutes: undefined,
  qcHistory: "",
};

const TimeChangeModels = () => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TimeChangeState>(initialTimeChangeState);

  const set = <K extends keyof TimeChangeState>(
    k: K,
    v: TimeChangeState[K]
  ) => setForm((s) => ({ ...s, [k]: v }));

  const submit = () => {
    console.log("submit", form);
    setOpen(false);
  };

  return (
    <div className="p-3 sm:p-4 w-full">
      {/* Desktop View */}
      <div className="hidden lg:block w-full overflow-x-auto">
        <table className="border border-gray-600 w-full min-w-[1400px] text-center opacity-60">
          <tbody>
            {/* Row 12 - Title */}
            <tr>
              <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">
                Thời gian đổi model
              </th>
              <td colSpan={12} className="border border-gray-600 px-2 py-2 text-xs"></td>
            </tr>

            {/* Row 13 - Section Headers */}
            <tr>
              <th className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Hạng mục</th>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Thời gian bắt đầu</th>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Thời gian kết thúc</th>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Số phút</th>
              <th colSpan={4} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Lịch sử</th>
            </tr>

            {/* Row 14 - Result */}
            <tr>
              <th className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">Result</th>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">
                <input
                  type="time"
                  value={form.resultStart ?? ""}
                  onChange={(e) => set("resultStart", e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded"
                />
              </td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">
                <input
                  type="time"
                  value={form.resultEnd ?? ""}
                  onChange={(e) => set("resultEnd", e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded"
                />
              </td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">
                <input
                  type="number"
                  value={form.resultMinutes ?? ""}
                  onChange={(e) => set("resultMinutes", e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-2 py-1 text-sm border rounded"
                  placeholder="Phút"
                />
              </td>
              <td colSpan={4} className="border border-gray-600 px-2 py-2 text-xs">
                <textarea
                  value={form.resultHistory ?? ""}
                  onChange={(e) => set("resultHistory", e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded min-h-[40px] resize-y"
                  placeholder="Nhập lịch sử..."
                />
              </td>
            </tr>

            {/* Row 15 - QC */}
            <tr>
              <th className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">QC</th>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">
                <input
                  type="time"
                  value={form.qcStart ?? ""}
                  onChange={(e) => set("qcStart", e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded"
                />
              </td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">
                <input
                  type="time"
                  value={form.qcEnd ?? ""}
                  onChange={(e) => set("qcEnd", e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded"
                />
              </td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">
                <input
                  type="number"
                  value={form.qcMinutes ?? ""}
                  onChange={(e) => set("qcMinutes", e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-2 py-1 text-sm border rounded"
                  placeholder="Phút"
                />
              </td>
              <td colSpan={4} className="border border-gray-600 px-2 py-2 text-xs">
                <textarea
                  value={form.qcHistory ?? ""}
                  onChange={(e) => set("qcHistory", e.target.value)}
                  className="w-full px-2 py-1 text-sm border rounded min-h-[40px] resize-y"
                  placeholder="Nhập lịch sử..."
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mobile View - Card dọc */}
      <div className="lg:hidden">
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm mb-4">
          <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-200">Result</h3>
          
          {/* Thời gian bắt đầu */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-600 mb-1">Thời gian bắt đầu</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
              {form.resultStart || "—"}
            </div>
          </div>

          {/* Thời gian kết thúc */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-600 mb-1">Thời gian kết thúc</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
              {form.resultEnd || "—"}
            </div>
          </div>

          {/* Số phút */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-600 mb-1">Số phút</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
              {form.resultMinutes ?? "—"}
            </div>
          </div>

          {/* Lịch sử */}
          <div className="mb-3 min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">Lịch sử</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 whitespace-pre-wrap wrap-break-word">
              {form.resultHistory || "—"}
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-200">QC</h3>
          
          {/* Thời gian bắt đầu */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-600 mb-1">Thời gian bắt đầu</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
              {form.qcStart || "—"}
            </div>
          </div>

          {/* Thời gian kết thúc */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-600 mb-1">Thời gian kết thúc</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
              {form.qcEnd || "—"}
            </div>
          </div>

          {/* Số phút */}
          <div className="mb-3">
            <div className="text-xs font-semibold text-gray-600 mb-1">Số phút</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
              {form.qcMinutes ?? "—"}
            </div>
          </div>

          {/* Lịch sử */}
          <div className="mb-3 min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">Lịch sử</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 whitespace-pre-wrap wrap-break-word">
              {form.qcHistory || "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-row justify-end w-full gap-2 mt-3">
        <ViewDetailButton onOpen={() => setOpen(true)}>Chỉnh sửa</ViewDetailButton>
        <ViewDetailButton color="green" onOpen={() => {}}>Lưu</ViewDetailButton>
      </div>

      {/* Modal */}
<Modal
  open={open}
  title="Chi tiết Thời gian đổi model"
  onClose={() => setOpen(false)}
  onSave={submit}
>
  <div className="grid gap-3 max-h-[60vh] overflow-y-auto px-1">
    {/* Result Section */}
    <div className="pb-3 border-b border-gray-200">
      <h4 className="text-sm font-semibold mb-3 text-gray-700">Result</h4>
      
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="min-w-0">
          <label className="text-xs block mb-1">Thời gian bắt đầu</label>
          <input
            type="time"
            value={form.resultStart ?? ""}
            onChange={(e) => set("resultStart", e.target.value)}
            className="block w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="min-w-0">
          <label className="text-xs block mb-1">Thời gian kết thúc</label>
          <input
            type="time"
            value={form.resultEnd ?? ""}
            onChange={(e) => set("resultEnd", e.target.value)}
            className="block w-full border rounded px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="mb-3 min-w-0">
        <label className="text-xs block mb-1">Số phút</label>
        <input
          type="number"
          value={form.resultMinutes ?? ""}
          onChange={(e) => set("resultMinutes", e.target.value ? Number(e.target.value) : undefined)}
          className="block w-full border rounded px-3 py-2 text-sm"
          placeholder="Nhập số phút..."
        />
      </div>

      <div className="min-w-0">
        <label className="text-xs block mb-1">Lịch sử</label>
        <textarea
          value={form.resultHistory ?? ""}
          onChange={(e) => set("resultHistory", e.target.value)}
          className="focus:outline-none block w-full border rounded px-3 py-2 text-sm min-h-20 resize-y wrap-break-words"
          placeholder="Nhập lịch sử..."
        />
      </div>
    </div>

    {/* QC Section */}
    <div className="">
      <h4 className="text-sm font-semibold mb-3 text-gray-700">QC</h4>
      
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="min-w-0">
          <label className="text-xs block mb-1">Thời gian bắt đầu</label>
          <input
            type="time"
            value={form.qcStart ?? ""}
            onChange={(e) => set("qcStart", e.target.value)}
            className="block w-full border rounded px-3 py-2 text-sm"
          />
        </div>

        <div className="min-w-0">
          <label className="text-xs block mb-1">Thời gian kết thúc</label>
          <input
            type="time"
            value={form.qcEnd ?? ""}
            onChange={(e) => set("qcEnd", e.target.value)}
            className="block w-full border rounded px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="mb-3 min-w-0">
        <label className="text-xs block mb-1">Số phút</label>
        <input
          type="number"
          value={form.qcMinutes ?? ""}
          onChange={(e) => set("qcMinutes", e.target.value ? Number(e.target.value) : undefined)}
          className="block w-full border rounded px-3 py-2 text-sm"
          placeholder="Nhập số phút..."
        />
      </div>

      <div className="min-w-0">
        <label className="text-xs block mb-1">Lịch sử</label>
        <textarea
          value={form.qcHistory ?? ""}
          onChange={(e) => set("qcHistory", e.target.value)}
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