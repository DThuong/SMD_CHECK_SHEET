import ViewDetailButton from "../ViewDetailButton"
import { useState, useEffect } from "react"
import Modal from "../Modal";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchPQCCheck, updatePQCCheck } from "../../redux/slices/subTableSlice";
import type { PQCCheckData } from "../../redux/slices/subTableSlice";

const initialPQCChecksState: PQCCheckData = {
  id: undefined,
  icPlan: "",
  checksumReal: "",
  checksumConfirm: "",
  turner: "",
  startLCR: "",
  endLCR: "",
  nameCheck: "",
  resultLCR: false
};

const PQCChecks = () => {
      const [form, setForm] = useState<PQCCheckData>(initialPQCChecksState);
       const [open, setOpen] = useState(false);
   
       const dispatch = useAppDispatch();
       
       // Lấy dữ liệu từ Redux store
       const { pqcCheck ,completedTables } = useAppSelector(state => state.subTable);
       const smdSheetId = useAppSelector(state => state.changeModel?.currentSheet?.id);
       const currentSheet = useAppSelector(state => state.changeModel.currentSheet);
       const pqcCheckId = currentSheet?.pqcCheckId;
       const isSaved = completedTables.includes('PQCCheck');
   
       // fetch data khi programcheck thay đổi
       useEffect(() => {
         if (pqcCheckId) {
           dispatch(fetchPQCCheck(pqcCheckId));
         }
       }, [pqcCheckId, dispatch]);
       // sync form với redux store thay vì sử dụng context
       useEffect(() => {
         if (pqcCheck) {
           setForm(pqcCheck);
         }
       }, [pqcCheck]);
   
       const set = <K extends keyof PQCCheckData>(k: K, v: PQCCheckData[K]) =>
         setForm((s) => ({ ...s, [k]: v }));
   
       const submit = async () => {
         // kiểm tra id
         if (!pqcCheckId) {
           alert('Không tìm thấy Program Check ID');
           return;
         }
   
         if (!smdSheetId) {
           alert('Không tìm thấy SMD Sheet ID');
           return;
         }
   
         try {
           // Dispatch action để update
           await dispatch(updatePQCCheck({
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
      {pqcCheckId && (
        <div className={`mb-2 text-xs p-2 rounded flex items-center gap-2 ${
          isSaved ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-600 border border-gray-200'
        }`}>
          {isSaved && <span className="text-green-600">✓</span>}
          <span>PQCCheck ID: <strong>{pqcCheckId}</strong></span>
          {currentSheet?.id && <span>| ChangeModel ID: <strong>{currentSheet.id}</strong></span>}
          {isSaved && <span className="ml-auto font-semibold">Đã lưu</span>}
        </div>
      )}
      {/* Website View - Bảng ngang */}
      <div className="hidden lg:block w-full overflow-x-auto">
  <table className="border border-gray-600 w-full text-center opacity-60">
    <tbody>
      {/** Row 31 */}
      <tr>
        <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">PQC kiểm tra board đầu</th>
        <td colSpan={11} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
      </tr>

      {/** Row 32 */}
      <tr>
        <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">IC nạp kế hoạch</th>
        <td colSpan={8} className="border border-gray-600 px-2 py-2 text-xs">{form.icPlan || ""}</td>
        <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Checksum thực tế</th>
        <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs">{form.checksumReal || ""}</td>
        <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Xác nhận có thay đổi <br /> check sum mới</th>
        <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs">
          <div className="flex items-center justify-center">
            <input 
              type="text"
              value={form.checksumConfirm || ""}
              onChange={(e) => set("checksumConfirm", e.target.value)}
            />
          </div>
        </td>
      </tr>

      {/** Row 33 */}
      <tr>
        <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Tuner</th>
        <td colSpan={8} className="border border-gray-600 px-2 py-2 text-xs">{form.turner || ""}</td>
        <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
        <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
        <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
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
        <td colSpan={4} className="border border-gray-600 px-2 py-2 text-xs">{form.startLCR || ""}</td>
        <td colSpan={4} className="border border-gray-600 px-2 py-2 text-xs">{form.endLCR || ""}</td>
        <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{form.nameCheck || ""}</td>
        <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">
          <div className="flex items-center justify-center flex-row gap-2">
            <label className="font-bold">OK</label>
            <input 
              type="checkbox"
              checked={!!form.resultLCR}
              onChange={(e) => set("resultLCR", e.target.checked)}
            />
          </div>
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
              {form.checksumReal || "—"}
            </div>
          </div>

          <div className="mb-3 min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">Xác nhận khi có thay đổi Checksum mới</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 wrap-break-words wrap-break-words">
              {form.checksumConfirm || "—"}
            </div>
          </div>

          <div className="mb-3 min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">Tuner</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 wrap-break-words wrap-break-words">
              {form.turner || "—"}
            </div>
          </div>

          <div className="mb-3 min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">Thời gian bắt đầu đo LCR</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 wrap-break-words wrap-break-words">
              {form.startLCR || "—"}
            </div>
          </div>

          <div className="mb-3 min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">Thời gian kết thúc đo LCR</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 wrap-break-words wrap-break-words">
              {form.endLCR || "—"}
            </div>
          </div>

          <div className="mb-3 min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">PQC Name</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 wrap-break-words wrap-break-words">
              {form.nameCheck || "—"}
            </div>
          </div>

          <div className="mb-0 min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">Kết quả đo LCR</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
              {form.resultLCR ? "OK" : "NG"}
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-row justify-end w-full gap-2 mt-3">
        <ViewDetailButton onOpen={() => setOpen(true)}>Chỉnh sửa</ViewDetailButton>
        {/* <ViewDetailButton color="green" onOpen={() => submit()}>Lưu</ViewDetailButton> */}
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
              value={form.checksumReal ?? ""}
              onChange={(e) => set("checksumReal", e.target.value)}
              className="mt-1 block w-full border rounded px-3 py-2 text-sm"
            />
          </label>

          <label className="text-xs">
            Xác nhận khi có thay đổi Checksum mới
            <input
              value={form.checksumConfirm ?? ""}
              onChange={(e) => set("checksumConfirm", e.target.value)}
              className="mt-1 block w-full border rounded px-3 py-2 text-sm"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs">
              Tuner
              <input
                value={form.turner ?? ""}
                onChange={(e) => set("turner", e.target.value)}
                className="mt-1 block w-full border rounded px-3 py-2 text-sm"
              />
            </label>

          </div>

         <div className="grid grid-cols-2 gap-3">
      <label className="text-xs">
        Thời gian bắt đầu đo LCR
        <input 
          type="datetime-local" 
          value={form.startLCR ?? ""}
          onChange={(e) => set("startLCR", e.target.value)}
          className="mt-1 block w-full border rounded px-3 py-2 text-sm"
        />
      </label>

      <label className="text-xs">
        Thời gian kết thúc đo LCR
        <input 
          type="datetime-local" 
          value={form.endLCR ?? ""}
          onChange={(e) => set("endLCR", e.target.value)}
          className="mt-1 block w-full border rounded px-3 py-2 text-sm"
        />
      </label>
    </div>

          <label className="text-xs">
            Tên PQC
            <input
              value={form.nameCheck ?? ""}
              onChange={(e) => set("nameCheck", e.target.value)}
              className="mt-1 block w-full border rounded px-3 py-2 text-sm"
            />
          </label>

          <div className="flex items-center gap-2">
            <div className="text-xs">Kết quả đo LCR</div>
            <input type="checkbox" checked={form.resultLCR} onChange={(e) => set("resultLCR", e.target.checked)} />
          </div>

        </div>
      </Modal>
    </div>
  )
}

export default PQCChecks