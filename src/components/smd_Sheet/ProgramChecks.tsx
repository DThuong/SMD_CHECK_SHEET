import {useEffect, useState} from 'react';
import ViewDetailButton from '../ViewDetailButton';
import Modal from '../Modal';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { fetchProgramCheck, updateProgramCheck } from '../../redux/slices/subTableSlice';
import type { ProgramCheckData } from '../../redux/slices/subTableSlice';

const initialProgramForm: ProgramCheckData = {
    id: undefined,
    printerProgram: "",
    spiProgram: "",
    mounterProgram: "",
    pointMounter: undefined,
    maoiProgram: "",
    saoiProgram: "",
    pointSAOI: undefined,
    reflowProgram: "",
    reflowSpeed: undefined
};

const ProgramChecks = ({canEdit}: {canEdit: boolean}) => {
    const [form, setForm] = useState<ProgramCheckData>(initialProgramForm);
    const [open, setOpen] = useState(false);

    const dispatch = useAppDispatch();
    
    // Lấy dữ liệu từ Redux store
    const { programCheck ,completedTables } = useAppSelector(state => state.subTable);
    const smdSheetId = useAppSelector(state => state.changeModel?.currentSheet?.id);
    const currentSheet = useAppSelector(state => state.changeModel.currentSheet);
    const programCheckId = currentSheet?.programCheckId || programCheck?.id;
    const isSaved = completedTables.includes('ProgramCheck');

    // fetch data khi programcheck thay đổi
    useEffect(() => {
      if (programCheckId) {
        dispatch(fetchProgramCheck(programCheckId));
      }
    }, [programCheckId, dispatch]);
    // sync form với redux store thay vì sử dụng context
    useEffect(() => {
      if (programCheck) {
        setForm(programCheck);
      }
    }, [programCheck]);

    const set = <K extends keyof ProgramCheckData>(k: K, v: ProgramCheckData[K]) =>
      setForm((s) => ({ ...s, [k]: v }));

    const submit = async () => {
      // kiểm tra program Check id
      if (!programCheckId) {
        alert('Không tìm thấy Program Check ID');
        return;
      }

      if (!smdSheetId) {
        alert('Không tìm thấy SMD Sheet ID');
        return;
      }

      try {
        // Dispatch action để update
        await dispatch(updateProgramCheck({
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
    <div className="p-0 w-full">
      {/* Status indicator */}
      {programCheckId && (
        <div className={`mb-2 text-xs p-2 rounded flex items-center gap-2 ${
          isSaved ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-600 border border-gray-200'
        }`}>
          {isSaved && <span className="text-green-600">✓</span>}
          <span>ProgramCheck ID: <strong>{programCheckId}</strong></span>
          {currentSheet?.id && <span>| ChangeModel ID: <strong>{currentSheet.id}</strong></span>}
          {isSaved && <span className="ml-auto font-semibold">Đã lưu</span>}
        </div>
      )}
      {/** responsive for website */}
      <div className='hidden lg:block w-full overflow-x-auto'>
        <table className="border border-gray-600 w-full text-center opacity-60">
          <tbody>
            {/* Row 7 - Program Header */}
            <tr>
              <th rowSpan={3} className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">Program</th>
              <th rowSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Chương trình Printer</th>
              <th rowSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Chương trình SPI</th>
              <th rowSpan={2} colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Chương trình Mounter</th>
              <th className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Point</th>
              <th rowSpan={2} colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Chương trình M-AOI</th>
              <td className="border border-gray-600 px-2 py-2 text-xs bg-gray-100"></td>
              <th rowSpan={2} colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Chương trình S-AOI</th>
              <th className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Point</th>
              <th rowSpan={2} colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Chương trình Reflow</th>
              <th className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Reflow speed</th>
            </tr>

            {/* Row 8 */}
            <tr>
              <td className="border border-gray-600 px-2 py-2 text-xs">{form.pointMounter || ""}</td>
              <td className="border border-gray-600 px-2 py-2 text-xs"></td>
              <td className="border border-gray-600 px-2 py-2 text-xs">{form.pointSAOI || ""}</td>
              <td className="border border-gray-600 px-2 py-2 text-xs">{form.reflowSpeed || ""}</td>
            </tr>

            {/* Row 9 */}
            <tr>
              <td className="border border-gray-600 px-2 py-2 text-xs">{form.printerProgram || ""}</td>
              <td className="border border-gray-600 px-2 py-2 text-xs">{form.spiProgram || ""}</td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{form.mounterProgram || ""}</td>
              <td colSpan={3} className="border border-gray-600 px-2 py-2 text-xs">{form.maoiProgram || ""}</td>
              <td colSpan={3} className="border border-gray-600 px-2 py-2 text-xs">{form.saoiProgram || ""}</td>
              <td colSpan={3} className="border border-gray-600 px-2 py-2 text-xs">{form.reflowProgram || ""}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mobile View - Card dọc */}
      <div className="lg:hidden">
        <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm" onClick={() => setOpen(true)}>
          <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">Program</h3>
          
          {/* Row 1: Printer & SPI */}
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Chương trình Printer</div>
              <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
                {form.printerProgram || "—"}
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Chương trình SPI</div>
              <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
                {form.spiProgram || "—"}
              </div>
            </div>
          </div>

          {/* Row 2: Mounter & Point Mounter */}
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Chương trình Mounter</div>
              <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
                {form.mounterProgram || "—"}
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Point Mounter</div>
              <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
                {form.pointMounter || "—"}
              </div>
            </div>
          </div>

          {/* Row 3: M-AOI & S-AOI */}
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Chương trình M-AOI</div>
              <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
                {form.maoiProgram || "—"}
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Chương trình S-AOI</div>
              <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
                {form.saoiProgram || "—"}
              </div>
            </div>
          </div>

          {/* Row 4: Point S-AOI & Reflow */}
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Point S-AOI</div>
              <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
                {form.pointSAOI || "—"}
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Chương trình reflow</div>
              <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
                {form.reflowProgram || "—"}
              </div>
            </div>
          </div>

          {/* Row 5: Reflow Speed */}
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">Reflow Speed</div>
              <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
                {form.reflowSpeed || "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/** buttons */}
      <div className="flex flex-row justify-end w-full gap-2 mt-3">
        <ViewDetailButton onOpen={() => setOpen(true)} disabled={!canEdit}>Chỉnh sửa</ViewDetailButton>
      </div>

      <Modal
        open={open}
        title="Chi tiết Program"
        onClose={() => setOpen(false)}
        onSave={submit}
      >
        <div className="grid gap-3 max-h-[60vh] overflow-y-auto">
          <label className="text-xs">
            Chương trình Printer
            <input
              value={form.printerProgram ?? ""}
              onChange={(e) => set("printerProgram", e.target.value)}
              className="mt-1 block w-full border rounded px-3 py-2 text-sm"
              placeholder=""
            />
          </label>

          <label className="text-xs">
            Chương trình SPI
            <input
              value={form.spiProgram ?? ""}
              onChange={(e) => set("spiProgram", e.target.value)}
              className="mt-1 block w-full border rounded px-3 py-2 text-sm"
              placeholder=""
            />
          </label>

          <label className="text-xs">
            Chương trình Mounter
            <input
              value={form.mounterProgram ?? ""}
              onChange={(e) => set("mounterProgram", e.target.value)}
              className="mt-1 block w-full border rounded px-3 py-2 text-sm"
              placeholder=""
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs">
              Point Mounter
              <input
                type='number'
                value={form.pointMounter ?? ""}
                onChange={(e) => set("pointMounter", e.target.value ? Number(e.target.value) : undefined)}
                className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                placeholder=""
              />
            </label>

            <label className="text-xs">
              Point S-AOI
              <input
                type='number'
                value={form.pointSAOI ?? ""}
                onChange={(e) => set("pointSAOI", e.target.value ? Number(e.target.value) : undefined)}
                className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                placeholder=""
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs">
              M AOI
              <input
                value={form.maoiProgram ?? ""}
                onChange={(e) => set("maoiProgram", e.target.value)}
                className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                placeholder=""
              />
            </label>

            <label className="text-xs">
              S AOI
              <input
                value={form.saoiProgram ?? ""}
                onChange={(e) => set("saoiProgram", e.target.value)}
                className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                placeholder=""
              />
            </label>
          </div>

          <label className="text-xs">
            Reflow (profile)
            <input
              value={form.reflowProgram ?? ""}
              onChange={(e) => set("reflowProgram", e.target.value)}
              className="mt-1 block w-full border rounded px-3 py-2 text-sm"
              placeholder=""
            />
          </label>

          <label className="text-xs">
            Reflow Speed
            <input
              type='number'
              value={form.reflowSpeed ?? ""}
              onChange={(e) => set("reflowSpeed", e.target.value ? Number(e.target.value) : undefined)}
              className="mt-1 block w-full border rounded px-3 py-2 text-sm"
              placeholder=""
            />
          </label>
        </div>
      </Modal>
    </div>
  );
};

export default ProgramChecks;