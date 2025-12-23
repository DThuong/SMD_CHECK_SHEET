import ViewDetailButton from "../ViewDetailButton";
import { useEffect, useState } from "react";
import Modal from "../Modal";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchStandardProduction, updateStandardProduction, uploadStandardProductionFile } from "../../redux/slices/subTableSlice";
import type { StandardProductionData } from "../../redux/slices/subTableSlice";
import { useNotification } from "../../redux/hooks";
import Notification from "../Notification";
import ImageViewIcon from "../ImageViewIcon";
import { IoEyeSharp } from "react-icons/io5";
import { FaCamera, FaEyeSlash } from "react-icons/fa6";
import ImagePreviewModal from "../ImagePreviewModal";


const initialStandardProductState: StandardProductionData = {
    id: undefined,
    numMASK: "",
    numMES: "",
    numScanPrinter: undefined,
    numScanSignMES: undefined,
    mlS3Closed: "",
    useOnly: "",
    labelProgram: "",
    imgStandard: "",
};

// Standard Production Section
const StandardProductionSection = ({canEdit}: {canEdit: boolean}) => {

  const dispatch = useAppDispatch();
    // khai báo loading để xử lý loading state trong modal
  const { completedTables } = useAppSelector(state => state.subTable);
    // lấy checkModel data từ redux store
  const {standardProduction} = useAppSelector(state => state.subTable);
    // lấy checkModel id từ currentSheet trong changeModel Slice
  const currentSheet = useAppSelector(state => state.changeModel.currentSheet);
  const smdSheetId = currentSheet?.id;
  const standardProductionId = currentSheet?.standardProductionId || standardProduction?.id;
  
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<StandardProductionData>(initialStandardProductState);
  
  const isSaved = completedTables.includes('StandardProduction');

  const { notification, showNotification,  hideNotification } = useNotification();

  // xử lý upload hình ảnh + preview modal
  const [imagePreview, setImagePreview] = useState<{
    isOpen: boolean;
    imageUrl: string;
    title: string;
  }>({
    isOpen: false,
    imageUrl: "",
    title: ""
  });

  // hàm mở preview
  const openImagePreview = (imageUrl: string, title: string) => {
    setImagePreview({
      isOpen: true,
      imageUrl,
      title
    });
  };

  // hàm đóng preview
  const closeImagePreview = () => {
    setImagePreview({
      isOpen: false,
      imageUrl: "",
      title: ""
    });
  };

  // fetch data khi StandardProduction thay đổi
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

  // xử lý upload hình ảnh
  const handleImageUpload = async (field: 'imgStandard', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    if (!standardProductionId) {
      showNotification('error', 'Lỗi upload', 'Không tìm thấy StandardProduction ID');
      return;
    }
  
    try {
      // Upload file lên server (KHÔNG hiển thị preview base64 nữa)
      if (field === 'imgStandard') {
        const result = await dispatch(uploadStandardProductionFile({ 
          standardProductionId: Number(standardProductionId), 
          file 
        })).unwrap();
        
        // Cập nhật URL từ server vào form
        if (result?.imageUrl) {
          set(field, result.imageUrl);
        }
        
        showNotification('success', 'Thành công', 'Upload hình ảnh Standard Production thành công');
      }
  
      // Fetch lại data để đảm bảo sync với server
      if (standardProductionId) {
        await dispatch(fetchStandardProduction(standardProductionId)).unwrap();
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      showNotification('error', 'Lỗi upload', 'Có lỗi xảy ra khi upload hình ảnh');
    }
  };

  // xử lý chụp ảnh từ camera
  const handleCameraCapture = async (field: 'imgStandard') => {
    if (!standardProductionId) {
      showNotification('error', 'Lỗi', 'Không tìm thấy StandardProduction ID');
      return;
    }
  
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
  
      // Tạo modal để hiển thị camera
      const cameraModal = document.createElement('div');
      cameraModal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;flex-direction:column;';
      
      video.style.cssText = 'max-width:90%;max-height:70%;';
      cameraModal.appendChild(video);
  
      const captureBtn = document.createElement('button');
      captureBtn.textContent = 'Chụp ảnh';
      captureBtn.style.cssText = 'margin-top:20px;padding:10px 20px;background:#3b82f6;color:white;border:none;border-radius:5px;cursor:pointer;';
      cameraModal.appendChild(captureBtn);
  
      const closeBtn = document.createElement('button');
      closeBtn.textContent = 'Đóng';
      closeBtn.style.cssText = 'margin-top:10px;padding:10px 20px;background:#ef4444;color:white;border:none;border-radius:5px;cursor:pointer;';
      cameraModal.appendChild(closeBtn);
  
      document.body.appendChild(cameraModal);
  
      captureBtn.onclick = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d')?.drawImage(video, 0, 0);
        
        // Convert canvas to blob
        canvas.toBlob(async (blob) => {
          if (blob) {
            // Tạo File object từ blob
            const file = new File([blob], `${field}_${Date.now()}.jpg`, { type: 'image/jpeg' });
  
            try {
              // Upload lên server
              if (field === 'imgStandard') {
                const result = await dispatch(uploadStandardProductionFile({ 
                  standardProductionId: Number(standardProductionId), 
                  file 
                })).unwrap();
                
                // Cập nhật URL từ server
                if (result?.imageUrl) {
                  set(field, result.imageUrl);
                }
                
                showNotification('success', 'Thành công', 'Upload hình ảnh Standard Production thành công');
              } 
  
              // Fetch lại data
              if (standardProductionId) {
                await dispatch(fetchStandardProduction(standardProductionId));
              }
            } catch (error) {
              console.error('Failed to upload image:', error);
              showNotification('error', 'Lỗi upload', 'Có lỗi xảy ra khi upload hình ảnh');
            }
          }
        }, 'image/jpeg', 0.9);
  
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(cameraModal);
      };
  
      closeBtn.onclick = () => {
        stream.getTracks().forEach(track => track.stop());
        document.body.removeChild(cameraModal);
      };
    } catch (error) {
      console.error('Camera error:', error);
      showNotification('error', 'Lỗi Camera', 'Không thể truy cập camera');
    }
  };
  

  const set = <K extends keyof StandardProductionData>(k: K, v: StandardProductionData[K]) =>
  setForm((s) => ({ ...s, [k]: v }));
    
  const submit = async() => {
    // kiểm tra program Check id
          if (!standardProductionId) {
            showNotification('error', 'Lỗi lưu Standard Production', 'Không tìm thấy StandardProduction ID');
            return;
          }
    
          if (!smdSheetId) {
            showNotification('error', 'Lỗi lưu Standard Production', 'Không tìm thấy SMD Sheet ID');
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
            console.error('Failed to update StandardProductions:', error);
            showNotification('error', 'Lỗi lưu Standard Production', 'Có lỗi xảy ra khi cập nhật StandardProductions');
          }
  };
  return (
    <div className="p-0 py-4 w-full">
      <Notification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        onClose={hideNotification}
      />
      {/* Status indicator */}
      {standardProductionId && (
        <div className={`mb-2 text-xs p-2 rounded flex items-center gap-2 ${
          isSaved ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-600 border border-gray-200'
        }`}>
          {isSaved && <span className="text-green-600">✓</span>}
          <span>StandardProduction ID: <strong>{standardProductionId}</strong></span>
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

    {/** Hình ảnh Standard production */}
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Hình ảnh Standard Production</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 flex items-center justify-center">
          <ImageViewIcon 
            imageUrl={form.imgStandard} 
            title="Hình ảnh Standard Production"
            onView={openImagePreview}
          />
        </div>
      </div>
  </div>
</div>
      {/** buttons */}
      <div className="flex flex-row justify-end w-full gap-2 mt-3">
        <ViewDetailButton onOpen={() => setOpen(true)} disabled={!canEdit}>Chỉnh sửa</ViewDetailButton>
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

    <label className="block text-sm font-medium mb-1">Hình ảnh Standard Production</label>
      <div className="my-2">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleImageUpload('imgStandard', e)}
          className="border border-gray-300 rounded px-3 py-2 w-full"
        />
        <button
          type="button"
          onClick={() => handleCameraCapture('imgStandard')}
          className=" bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center gap-2 mt-2 w-full"
        >
          <FaCamera size={10} />
          Chụp ảnh Standard Production
        </button>
      </div>
      
      {/* Preview Section */}
      <div className="flex items-center gap-3 mt-2">
        {form.imgStandard ? (
          <>
            <img src={form.imgStandard} alt="Standard Production Preview" className="w-20 h-20 object-cover rounded border" onClick={() => openImagePreview(form.imgStandard!, "Hình ảnh Standard Production")} />
            <button
              type="button"
              onClick={() => openImagePreview(form.imgStandard!, "Hình ảnh Standard Production")}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
            >
              <IoEyeSharp size={20} />
              <span className="text-sm">Xem hình ảnh</span>
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2 text-gray-400">
            <FaEyeSlash size={20} />
            <span className="text-sm">Chưa có hình ảnh</span>
          </div>
        )}
      </div>

  </div>
</Modal>
<ImagePreviewModal
    isOpen={imagePreview.isOpen}
    imageUrl={imagePreview.imageUrl}
    title={imagePreview.title}
    onClose={closeImagePreview}
  />
    </div>
  );
};

export default StandardProductionSection