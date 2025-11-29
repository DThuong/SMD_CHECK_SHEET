import {useState} from 'react';
import ViewDetailButton from '../ViewDetailButton';
import Modal from '../Modal';
type ProgramFormState = {
    printer?: string;
    spi?: string;
    mounter?: string;
    pointMounter?: string;
    mAoi?: string;
    sAoi?: string;
    pointSaoi?: string;
    reflow?: string;
    reflowSpeed?: string;
}

const initialProgramForm: ProgramFormState = {printer: "", spi: "", mounter: "", pointMounter: "", pointSaoi: "", mAoi: "", sAoi: "", reflow: "", reflowSpeed: ""};
// Program Section
const ProgramChecks = () => {
    const [form, setForm] = useState<ProgramFormState>(initialProgramForm);
    const [open, setOpen] = useState(false);

    const set = <K extends keyof ProgramFormState>(k: K, v: ProgramFormState[K]) =>
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
            
              {/* Row 7 - Program Header */}
              <tr>
                <th rowSpan={3} className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">Program</th>
                <th rowSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Chương trình Printer</th>
                <th rowSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Chương trình SPI</th>
                <th rowSpan={2} colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Chương trình Mounter</th>
                <th className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Point</th>
                <th rowSpan={2} colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Chương trình M-AOI</th>
                <td className="border border-gray-600 px-2 py-2 text-xs"></td>
                <th rowSpan={2} colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Chương trình S-AOI</th>
                <th className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Point</th>
                <th rowSpan={2} colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Chương trình Reflow</th>
                <th className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Reflow speed</th>
              </tr>

              {/* Row 8 */}
              <tr>
                <td className="border border-gray-600 px-2 py-2 text-xs"></td>
                <td className="border border-gray-600 px-2 py-2 text-xs"></td>
                <td className="border border-gray-600 px-2 py-2 text-xs"></td>
                <td className="border border-gray-600 px-2 py-2 text-xs"></td>
              </tr>

              {/* Row 9 */}
              <tr>
                <td className="border border-gray-600 px-2 py-2 text-xs"></td>
                <td className="border border-gray-600 px-2 py-2 text-xs"></td>
                <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs"></td>
                <td colSpan={3} className="border border-gray-600 px-2 py-2 text-xs"></td>
                <td colSpan={3} className="border border-gray-600 px-2 py-2 text-xs"></td>
                <td colSpan={3} className="border border-gray-600 px-2 py-2 text-xs"></td>
              </tr>

          </tbody>
        </table>
      </div>

          {/* Responsive for mobile */}
      {/* Mobile View - Card dọc */}
<div className="lg:hidden">
  <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm">
    <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">Program</h3>
    {/* Row 1: Printer & SPI */}
    <div className="grid grid-cols-2 gap-4 mb-3">
      <div className="min-w-0">
        <div className="text-xs font-semibold text-gray-600 mb-1">Chương trình Printer</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
          {form.printer || "—"}
        </div>
      </div>

      <div className="min-w-0">
        <div className="text-xs font-semibold text-gray-600 mb-1">Chương trình SPI</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
          {form.spi || "—"}
        </div>
      </div>
    </div>

    {/* Row 2: Mounter & Point Mounter */}
    <div className="grid grid-cols-2 gap-4 mb-3">
      <div className="min-w-0">
        <div className="text-xs font-semibold text-gray-600 mb-1">Chương trình Mounter</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
          {form.mounter || "—"}
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
          {form.mAoi || "—"}
        </div>
      </div>

      <div className="min-w-0">
        <div className="text-xs font-semibold text-gray-600 mb-1">Chương trình S-AOI</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
          {form.sAoi || "—"}
        </div>
      </div>
    </div>

    {/* Row 4: Point S-AOI & Reflow */}
    <div className="grid grid-cols-2 gap-4 mb-3">
      <div className="min-w-0">
        <div className="text-xs font-semibold text-gray-600 mb-1">Point S-AOI</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
          {form.pointSaoi || "—"}
        </div>
      </div>

      <div className="min-w-0">
        <div className="text-xs font-semibold text-gray-600 mb-1">Chương trình reflow</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
          {form.reflow || "—"}
        </div>
      </div>
    </div>

    {/* Row 5: Reflow Speed (full width hoặc 1 cột nếu không có field khác) */}
    <div className="grid grid-cols-2 gap-4 mb-3">
      <div className="min-w-0">
        <div className="text-xs font-semibold text-gray-600 mb-1">Reflow Speed</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate overflow-hidden">
          {form.reflowSpeed || "—"}
        </div>
      </div>
      {/* Cột thứ 2 để trống hoặc thêm field khác */}
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
  title="Chi tiết Program"
  onClose={() => setOpen(false)}
  onSave={submit}
>
  <div className="grid gap-3 max-h-[60vh] overflow-y-auto">
    <label className="text-xs">
      Line đổi (Printer)
      <input
        value={form.printer ?? ""}
        onChange={(e) => set("printer", e.target.value)}
        className="mt-1 block w-full border rounded px-3 py-2 text-sm"
        placeholder=""
      />
    </label>

    <label className="text-xs">
      SPI
      <input
        value={form.spi ?? ""}
        onChange={(e) => set("spi", e.target.value)}
        className="mt-1 block w-full border rounded px-3 py-2 text-sm"
        placeholder=""
      />
    </label>

    <label className="text-xs">
      Mounter
      <input
        value={form.mounter ?? ""}
        onChange={(e) => set("mounter", e.target.value)}
        className="mt-1 block w-full border rounded px-3 py-2 text-sm"
        placeholder=""
      />
    </label>

    <div className="grid grid-cols-2 gap-3">
      <label className="text-xs">
        Point Mounter
        <input
          value={form.pointMounter ?? ""}
          onChange={(e) => set("pointMounter", e.target.value)}
          className="mt-1 block w-full border rounded px-3 py-2 text-sm"
          placeholder=""
        />
      </label>

      <label className="text-xs">
        Point S-AOI
        <input
          value={form.pointSaoi ?? ""}
          onChange={(e) => set("pointSaoi", e.target.value)}
          className="mt-1 block w-full border rounded px-3 py-2 text-sm"
          placeholder=""
        />
      </label>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <label className="text-xs">
        M AOI
        <input
          value={form.mAoi ?? ""}
          onChange={(e) => set("mAoi", e.target.value)}
          className="mt-1 block w-full border rounded px-3 py-2 text-sm"
          placeholder=""
        />
      </label>

      <label className="text-xs">
        S AOI
        <input
          value={form.sAoi ?? ""}
          onChange={(e) => set("sAoi", e.target.value)}
          className="mt-1 block w-full border rounded px-3 py-2 text-sm"
          placeholder=""
        />
      </label>
    </div>

    <label className="text-xs">
      Reflow (profile)
      <input
        value={form.reflow ?? ""}
        onChange={(e) => set("reflow", e.target.value)}
        className="mt-1 block w-full border rounded px-3 py-2 text-sm"
        placeholder=""
      />
    </label>

    <label className="text-xs">
      Reflow Speed
      <input
        value={form.reflowSpeed ?? ""}
        onChange={(e) => set("reflowSpeed", e.target.value)}
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