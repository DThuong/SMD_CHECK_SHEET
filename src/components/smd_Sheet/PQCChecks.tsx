import ViewDetailButton from "../ViewDetailButton"
import { useState } from "react"
import Modal from "../Modal";
type PQCChecksState = {
  // Dựa vào các trường trong bảng
  icPlan: string;              // "IC nạp kế hoạch"
  realChecksum: string;        // "Checksum thực tế"
  checksumConfirmed: boolean;  // "Xác nhận có thay đổi check sum mới"
  acceptedChecksum?: string;   // nếu muốn lưu checksum mới (chuỗi)
  tuner: string;               // "Tuner"
  processStage: string;        // "Công đoạn" (tên công đoạn)
  startTimeLCR: string;        // "Thời gian bắt đầu đo LCR" (ISO date/time string)
  endTimeLCR: string;          // "Thời gian kết thúc đo LCR"
  pqcName: string;             // "tên" (PQC)
  resultLCROk: boolean;        // "Kết quả đo LCR" (OK checkbox)
};

const initialPQCChecksState: PQCChecksState = {
  icPlan: "",
  realChecksum: "",
  checksumConfirmed: false,
  acceptedChecksum: "",
  tuner: "",
  processStage: "",
  startTimeLCR: "",
  endTimeLCR: "",
  pqcName: "",
  resultLCROk: false,
};

const PQCChecks = () => {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<PQCChecksState>(initialPQCChecksState);

  // helper set kiểu-safe
  const set = <K extends keyof PQCChecksState>(k: K, v: PQCChecksState[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const submit = () => {
    // TODO: thay bằng call API
    console.log("PQCChecks submit:", form);
    setOpen(false);
  };

  return (
    <div className="p-3 sm:p-4 w-full">
      {/* Website View - Bảng ngang */}
      <div className="hidden lg:block w-full overflow-x-auto">
            <table className="border border-gray-600 w-full text-center opacity-60">
                <tbody>
         {/** Row 31 */}
            <tr>
                <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">PQC kiểm tra board đầu</th>
                <td colSpan={11} className="border border-gray-600 px-2 py-2 text-xs"></td>
            </tr>

            {/** Row 32 */}
            <tr>
                <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">IC nạp kế hoạch</th>
                <td colSpan={8} className="border border-gray-600 px-2 py-2 text-xs"></td>
                <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Checksum thực tế</th>
                <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs"></td>
                <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Xác nhận có thay đổi <br /> check sum mới</th>
                <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs"></td>
            </tr>

            {/** Row 33 */}
            <tr>
                <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Tuner</th>
                <td colSpan={8} className="border border-gray-600 px-2 py-2 text-xs"></td>
                <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs"></td>
                <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs"></td>
                <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs"></td>
            </tr>

            {/** Row 34 */}
            <tr>
                <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Công đoạn</th>
                <th colSpan={4} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Thời gian bắt đầu đo LCR</th>
                <th colSpan={4} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Thời gian kết thúc đo LCR</th>
                <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">tên</th>
                <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Kết quả đo LCR</th>
            </tr>

            {/** Row 35 */}
            <tr>
                <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">PQC</th>
                <td colSpan={4} className="border border-gray-600 px-2 py-2 text-xs"></td>
                <td colSpan={4} className="border border-gray-600 px-2 py-2 text-xs"></td>
                <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs"></td>
                <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">
                    <div className="flex items-center justify-center flex-row gap-2"><label className="font-bold">OK</label><input type="checkbox" /></div>
              </td>
            </tr>
                </tbody>
            </table>
 
    </div>

      {/* Mobile View - Card dọc (mỗi trường 1 dòng full-width) */}
      <div className="lg:hidden">
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm" onClick={() => setOpen(true)}>
    <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">PQC kiểm tra board đầu</h3>
          {/* each field full width row */}
          <div className="mb-3 min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">IC nạp kế hoạch</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 wrap-break-words wrap-break-words">
              {form.icPlan || "—"}
            </div>
          </div>

          <div className="mb-3 min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">Checksum thực tế</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 wrap-break-words wrap-break-words">
              {form.realChecksum || "—"}
            </div>
          </div>

          <div className="mb-3 min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">Xác nhận khi có thay đổi Checksum mới</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 wrap-break-words wrap-break-words">
              {form.acceptedChecksum || (form.checksumConfirmed ? "Đã xác nhận" : "—")}
            </div>
          </div>

          <div className="mb-3 min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">Tuner</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 wrap-break-words wrap-break-words">
              {form.tuner || "—"}
            </div>
          </div>

          <div className="mb-3 min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">Thời gian bắt đầu đo LCR</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 wrap-break-words wrap-break-words">
              {form.startTimeLCR || "—"}
            </div>
          </div>

          <div className="mb-3 min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">Thời gian kết thúc đo LCR</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 wrap-break-words wrap-break-words">
              {form.endTimeLCR || "—"}
            </div>
          </div>

          <div className="mb-3 min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">PQC Name</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 wrap-break-words wrap-break-words">
              {form.pqcName || "—"}
            </div>
          </div>

          <div className="mb-0 min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">Kết quả đo LCR</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
              {form.resultLCROk ? "OK" : "NG"}
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-row justify-end w-full gap-2 mt-3">
        <ViewDetailButton onOpen={() => setOpen(true)}>Chỉnh sửa</ViewDetailButton>
        <ViewDetailButton color="green" onOpen={() => submit()}>
          Lưu
        </ViewDetailButton>
      </div>

        {/* Modal chỉnh sửa — style & input */}
      <Modal open={open} title="Chi tiết PQC Check" onClose={() => setOpen(false)} onSave={submit}>
        <div className="grid gap-3 max-h-[60vh] overflow-y-auto">
          <label className="text-xs">
            IC nạp kế hoạch
            <input
              value={form.icPlan ?? ""}
              onChange={(e) => set("icPlan", e.target.value)}
              className="mt-1 block w-full border rounded px-3 py-2 text-sm"
            />
          </label>

          <label className="text-xs">
            Checksum thực tế
            <input
              value={form.realChecksum ?? ""}
              onChange={(e) => set("realChecksum", e.target.value)}
              className="mt-1 block w-full border rounded px-3 py-2 text-sm"
            />
          </label>

          <label className="text-xs">
            Xác nhận khi có thay đổi Checksum mới
            <input
              value={form.acceptedChecksum ?? ""}
              onChange={(e) => set("acceptedChecksum", e.target.value)}
              className="mt-1 block w-full border rounded px-3 py-2 text-sm"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs">
              Tuner
              <input
                value={form.tuner ?? ""}
                onChange={(e) => set("tuner", e.target.value)}
                className="mt-1 block w-full border rounded px-3 py-2 text-sm"
              />
            </label>

            <label className="text-xs">
              Công đoạn
              <input
                value={form.processStage ?? ""}
                onChange={(e) => set("processStage", e.target.value)}
                className="mt-1 block w-full border rounded px-3 py-2 text-sm"
              />
            </label>
          </div>

            <div className="grid grid-cols-2 gap-3">
            <label className="text-xs">
                Thời gian bắt đầu đo LCR
                <div className="mt-2">
                    <input type="time" name="" id="" className="border border-gray-200 py-2 px-2 w-full" />
                </div>
            </label>

            <label className="text-xs">
                Thời gian kết thúc đo LCR
                <div className="mt-2">
                    <input type="time" name="" id="" className="border border-gray-200 py-2 px-2 w-full" />
                </div>
            </label>
        </div>

          <label className="text-xs">
            Tên PQC
            <input
              value={form.pqcName ?? ""}
              onChange={(e) => set("pqcName", e.target.value)}
              className="mt-1 block w-full border rounded px-3 py-2 text-sm"
            />
          </label>

          <div className="flex items-center gap-2">
            <div className="text-xs">Kết quả đo LCR</div>
            <button
              type="button"
              onClick={() => set("resultLCROk", true)}
              className={`px-3 py-2 rounded text-sm border ${form.resultLCROk ? "bg-blue-100 border-blue-500" : ""}`}
            >
              OK
            </button>
            <button
              type="button"
              onClick={() => set("resultLCROk", false)}
              className={`px-3 py-2 rounded text-sm border ${form.resultLCROk === false ? "bg-blue-100 border-blue-500" : ""}`}
            >
              NG
            </button>
          </div>

        </div>
      </Modal>
    </div>
  )
}

export default PQCChecks