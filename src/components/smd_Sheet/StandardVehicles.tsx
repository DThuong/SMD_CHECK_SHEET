import ViewDetailButton from "../general/ViewDetailButton"
import Modal from "../general/Modal";
import { useEffect, useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchStandardVehicle, updateStandardVehicle,uploadAOIImage, uploadSPIImage } from "../../redux/slices/subTableSlice";
import ImagePreviewModal from "../files/ImagePreviewModal";
import ImageViewIcon from "../files/ImageViewIcon";
import type { StandardVehicleData } from "../../redux/slices/subTableSlice";
import { useNotification } from "../../redux/hooks";
import Notification from "../general/Notification";
import { FaCamera } from "react-icons/fa";
import { IoEyeSharp } from "react-icons/io5";
import { normalizeImageUrl } from "../../utils/imageUrl";

const initialStandardVehiclesState: StandardVehicleData = {
  printerSpecGTAL: "",
  printerSpecTDQ: "",
  printerSpecTDKC: "",
  printerSpecSLL: "",
  printerSpecDSL: "",

  printerRealGTAL: "",
  printerRealTDQ: "",
  printerRealTDKC: "",
  printerRealSLL: "",
  printerRealDSL: "",

  printerQ1: false,
  spiQ1: false,
  mountQ1: false,
  mountQ2: false,

  reflowQ1: false,
  reFlowSettingRail: "",
  reFlowRealRail: "",

  aoiQ1: false,
  aoiCheck: "",

  outputQ1: false,
  outputModelValue: "",
  outputPitchValue: "",
  outputChecker: "",

  nameOP: "",
  nameAOI: "",

  printerProgram: "",
  spiProgram: "",
  mounterProgram: "",
  pointMounter: "",
  maoiProgram: "",
  saoiProgram: "",
  pointSAOI: "",
  reflowProgram: "",
  reflowSpeed: "",
  rev: "",

  imgSPI: "",
  imgAOI: "",

  id: 0,
};

const StandardVehicles = ({canEdit}: {canEdit: boolean}) => {
   const dispatch = useAppDispatch();
      // khai báo loading để xử lý loading state trong modal
    const { completedTables } = useAppSelector(state => state.subTable);
      // lấy checkModel data từ redux store
    const {standardVehicle} = useAppSelector(state => state.subTable);
      // lấy checkModel id từ currentSheet trong changeModel Slice
    const currentSheet = useAppSelector(state => state.changeModel.currentSheet);
    const smdSheetId = currentSheet?.id;
    const standardVehicleId = currentSheet?.standardVehicleId || standardVehicle?.id;
    
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState<StandardVehicleData>(initialStandardVehiclesState);
    
    const isSaved = completedTables.includes('StandardVehicle');
    
    const { notification, showNotification,  hideNotification } = useNotification();
    const isUploadingRef = useRef(false);
    const hasUserEditedRef = useRef(false);

    // Xử lý upload hình ảnh preview modal
    const [imagePreview, setImagePreview] = useState<{
    isOpen: boolean;
    imageUrl: string;
    title: string;
  }>({
    isOpen: false,
    imageUrl: "",
    title: ""
  });

    // Hàm mở preview
  const openImagePreview = (imageUrl: string, title: string) => {
    setImagePreview({
      isOpen: true,
      imageUrl,
      title
    });
  };

    // Hàm đóng preview
  const closeImagePreview = () => {
    setImagePreview({
      isOpen: false,
      imageUrl: "",
      title: ""
    });
  };


  // fetch data khi standardVehicle thay đổi
  useEffect(() => {
    if (standardVehicleId) {
      dispatch(fetchStandardVehicle(standardVehicleId));
    }
  }, [standardVehicleId, dispatch]);

  useEffect(() => {
    if (standardVehicle && !hasUserEditedRef.current && !isUploadingRef.current) {
      setForm(standardVehicle);
    }
  }, [standardVehicle]);

  useEffect(() => {
    if (open && standardVehicle && !hasUserEditedRef.current && !isUploadingRef.current) {
      setForm(standardVehicle);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      hasUserEditedRef.current = false;
      isUploadingRef.current = false;
    }
  }, [open]);
  
  if (!standardVehicleId) {
    return (
      <div className="p-4 bg-gray-50 rounded border border-gray-200">
        <p className="text-sm text-gray-500">Đang tải dữ liệu Standard Production...</p>
      </div>
    );
  }


  // FIXED: Upload handler với flag protection cho CÁ 2 trường imgSPI và imgAOI
  const handleImageUpload = async (field: 'imgSPI' | 'imgAOI', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!standardVehicleId) {
      showNotification('error', 'Lỗi upload', 'Không tìm thấy StandardVehicle ID');
      return;
    }

    try {
      // Set flag TRƯỚC KHI upload
      isUploadingRef.current = true;

      if (field === 'imgSPI') {
        const result = await dispatch(uploadSPIImage({ 
          id: Number(standardVehicleId), 
          file 
        })).unwrap();
        
        // Chỉ cập nhật field imgSPI, KHÔNG trigger re-sync toàn bộ form
        if (result?.imageUrl) {
          setForm(prev => ({
            ...prev,
            imgSPI: result.imageUrl
          }));
        }
        
        showNotification('success', 'Thành công', 'Upload hình ảnh SPI thành công');
      } else if (field === 'imgAOI') {
        const result = await dispatch(uploadAOIImage({ 
          id: Number(standardVehicleId), 
          file 
        })).unwrap();
        
        // Chỉ cập nhật field imgAOI, KHÔNG trigger re-sync toàn bộ form
        if (result?.imageUrl) {
          setForm(prev => ({
            ...prev,
            imgAOI: result.imageUrl
          }));
        }
        
        showNotification('success', 'Thành công', 'Upload hình ảnh AOI thành công');
      }

    } catch (error) {
      console.error('Failed to upload image:', error);
      showNotification('error', 'Lỗi upload', `Không thể upload hình ảnh ${field === 'imgSPI' ? 'SPI' : 'AOI'}`);
    } finally {
      // Reset flag SAU KHI upload xong (thành công hay thất bại)
      isUploadingRef.current = false;
    }
  };

  // Wrapper cho set() để đánh dấu user đã edit
  const set = <K extends keyof StandardVehicleData>(k: K, v: StandardVehicleData[K]) => {
    hasUserEditedRef.current = true; // Đánh dấu user đã edit
    setForm((s) => ({ ...s, [k]: v }));
  };
    
  const submit = async() => {
    if (!standardVehicleId) {
      showNotification('error', 'Lỗi lưu Standard Vehicle', 'Không tìm thấy StandardVehicle ID');
      return;
    }

    if (!smdSheetId) {
      showNotification('error', 'Lỗi lưu Standard Vehicle', 'Không tìm thấy SMD Sheet ID');
      return;
    }

    try {
      // Dispatch action để update
      await dispatch(updateStandardVehicle({
        id: smdSheetId,
        data: form
      })).unwrap();
      
      // Fetch lại data SAU KHI lưu thành công
      if (standardVehicleId) {
        await dispatch(fetchStandardVehicle(standardVehicleId)).unwrap();
      }
      
      // Reset flags
      hasUserEditedRef.current = false;
      isUploadingRef.current = false;
      
      setOpen(false);
      showNotification('success', 'Thành công', 'Cập nhật Standard Vehicle thành công');
    } catch (error) {
      console.error('Failed to update StandardVehicles:', error);
      showNotification('error', 'Lỗi lưu Standard Vehicle', 'Có lỗi xảy ra khi cập nhật StandardVehicles');
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
      {standardVehicleId && (
        <div className={`mb-2 text-xs p-2 rounded flex items-center gap-2 ${
          isSaved ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-600 border border-gray-200'
        }`}>
          {isSaved && <span className="text-green-600">✓</span>}
          <span>StandardVehicle ID: <strong>{standardVehicleId}</strong></span>
          {currentSheet?.id && <span>| ChangeModel ID: <strong>{currentSheet.id}</strong></span>}
          {isSaved && <span className="ml-auto font-semibold">Đã lưu</span>}
        </div>
      )}
      {/* Desktop View */}
      <div className="hidden lg:block w-full overflow-x-auto">
        <table className="border border-gray-600 w-full text-center opacity-80">
          <tbody>
            {/* Row 16 */}
            <tr>
              <th className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">Tiêu chuẩn thiết bị</th>
              <td colSpan={12} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
            </tr>

            

            {/** Row 17 */}
            <tr>
              <th rowSpan={5} className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">Printer</th>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Giá trị cài đặt Screen Sprint</th>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Giá trị áp lực</th>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Tốc độ quét</th>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Tốc độ khoảng cách tách bàn</th>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Số lần lau</th>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Dao sử dụng</th>
            </tr>

            {/** Row 18 */}
            <tr>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100 text-left!">Tiêu chuẩn Spec đưa ra</th>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{form.printerSpecGTAL || ""} kg</td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{form.printerSpecTDQ || ""} mm/s</td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{form.printerSpecTDKC || ""} mm/s</td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{form.printerSpecSLL || ""}</td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{form.printerSpecDSL || ""}</td>
            </tr>

            {/** Row 19 */}
            <tr>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100 text-left!">Giá trị cài đặt thực tế trên máy</th>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{form.printerRealGTAL || ""} kg</td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{form.printerRealTDQ || ""} mm/s</td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{form.printerRealTDKC || ""} mm/s</td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{form.printerRealSLL || ""}</td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs">{form.printerRealDSL || ""}</td>
            </tr>

            {/** Row 20 */}
            <tr>
              <th colSpan={8} className="border border-gray-600 px-2 py-2 text-left! text-xs bg-gray-100">
                Sau khi sử dụng Vaccum Block thì có ảnh hưởng tác động tới pcb hay linh kiện không ?
              </th>
              <td colSpan={2} className="border border-gray-600 px-2 py-2">
                <div className="flex items-center justify-center flex-row gap-2">
                  <label className="font-bold text-xs">OK</label>
                  <input 
                    type="checkbox" 
                    checked={!!form.printerQ1 || false}
                    onChange={(e) => set("printerQ1", e.target.checked)}
                  />
                </div>
              </td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2"></td>
            </tr>

            {/** row 20.1: thêm sprinter program */}
            <tr>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100 text-left!">Sprinter Program</th>
              <td colSpan={11} className="border border-gray-600 px-2 py-2 text-xs">{form.printerProgram || ""}</td>
            </tr>

            {/** Row 21 */}
            <tr>
              <th colSpan={1} rowSpan={5} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">SPI</th>
              <th colSpan={8} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Hạng mục check (kiểm tra tiêu chuẩn setting SPI)</th>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
            </tr>



            {/** Row 22 */}
            <tr>
              <th colSpan={8} className="border border-gray-600 px-2 py-2 text-left! text-xs bg-gray-100">Điều kiện setting Inspection (volume: 60-180%; Area: 40-200%; ofset: 0.15, short: 60)</th>
              <td colSpan={2} className="border border-gray-600 px-2 py-2">
                <div className="flex items-center justify-center flex-row gap-2">
                  <label className="font-bold text-xs">OK</label>
                  <input 
                    type="checkbox"
                    checked={!!form.spiQ1}
                    onChange={(e) => set("spiQ1", e.target.checked)}
                  />
                </div>
              </td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
            </tr>

            {/** 22.0.1: thêm spi program */}
            <tr>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100 text-left!">SPI Program</th>
              <td colSpan={11} className="border border-gray-600 px-2 py-2 text-xs">{form.spiProgram || ""}</td>
            </tr>

            {/** Row 22.0.2: hình ảnh SPI */}
            <tr>
              <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100 text-left!">
                Hình ảnh SPI
              </th>
              <td colSpan={11} className="border border-gray-600 px-2 py-2">
                <div className="flex items-center justify-center">
                  <ImageViewIcon 
                    imageUrl={form.imgSPI} 
                    title="Hình ảnh SPI"
                    onView={openImagePreview}
                  />
                </div>
              </td>
            </tr>

            {/** REV */}
            <tr>
              <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100 text-left!">REV</th>
              <td colSpan={11} className="border border-gray-600 px-2 py-2 text-xs">{form.rev || ""}</td>
            </tr>



            {/** Row 23 */}
            <tr>
              <th colSpan={1} rowSpan={4} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Mount</th>
              <th colSpan={8} className="border border-gray-600 px-2 py-2 text-left! text-xs bg-gray-100">Kiểm tra 3 board đầu tiên sau khi cắm linh kiện có ok không ?</th>
              <td colSpan={2} className="border border-gray-600 px-2 py-2">
                <div className="flex items-center justify-center flex-row gap-2">
                  <label className="font-bold text-xs">OK</label>
                  <input 
                    type="checkbox"
                    checked={!!form.mountQ1}
                    onChange={(e) => set("mountQ1", e.target.checked)}
                  />
                </div>
              </td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
            </tr>

             {/** Row 24 */}
            <tr>
              <th colSpan={8} className="border border-gray-600 px-2 py-2 text-left! text-xs bg-gray-100">Kiểm tra 1 tấm ở mặt dưới có NG hay bể linh kiện không ?</th>
              <td colSpan={2} className="border border-gray-600 px-2 py-2">
                <div className="flex items-center justify-center flex-row gap-2">
                  <label className="font-bold text-xs">OK</label>
                  <input 
                    type="checkbox"
                    checked={!!form.mountQ2}
                    onChange={(e) => set("mountQ2", e.target.checked)}
                  />
                </div>
              </td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
            </tr>

            {/** row 23.1: mounter program */}
            <tr>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100 text-left!">Mounter Program</th>
              <td colSpan={11} className="border border-gray-600 px-2 py-2 text-xs">{form.mounterProgram || ""}</td>
            </tr>
            {/** row 23.2: point mounter */}
            <tr>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100 text-left!">Point Mounter</th>
              <td colSpan={11} className="border border-gray-600 px-2 py-2 text-xs">{form.pointMounter || ""}</td>
            </tr>

            {/** Row 25 */}
            <tr>
              <th colSpan={1} rowSpan={4} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Reflow</th>
              <th colSpan={8} className="border border-gray-600 px-2 py-2 text-left! text-xs bg-gray-100">Kiểm tra tình trạng chiều rộng của Conveyor ?</th>
              <td colSpan={2} className="border border-gray-600 px-2 py-2">
                <div className="flex items-center justify-center flex-row gap-2">
                  <label className="font-bold text-xs">OK</label>
                  <input 
                    type="checkbox"
                    checked={!!form.reflowQ1}
                    onChange={(e) => set("reflowQ1", e.target.checked)}
                  />
                </div>
              </td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
            </tr>

            {/** row 25.0.1: reflow program */}
            <tr>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100 text-left!">Reflow Program</th>
              <td colSpan={11} className="border border-gray-600 px-2 py-2 text-xs">{form.reflowProgram || ""}</td>
            </tr>

            {/** row 25.0.2: reflow speed */}
            <tr>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100 text-left!">Reflow Speed</th>
              <td colSpan={11} className="border border-gray-600 px-2 py-2 text-xs">{form.reflowSpeed || ""}</td>
            </tr>

            {/** Row 26 */}
            <tr>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs text-left! bg-gray-100">Giá trị cài đặt Rail</th>
              <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs">{form.reFlowSettingRail || ""} mm</th>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100 text-left!">Giá trị thực tế Rail</th>
              <th colSpan={3} className="border border-gray-600 px-2 py-2 text-xs">{form.reFlowRealRail || ""} mm</th>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 bg-gray-300"></td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
            </tr>

            {/** Row 27 - HÀNG ĐẦU TIÊN */}
            <tr>
              <th colSpan={1} rowSpan={5} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">
                AOI
              </th>
              <th colSpan={8} className="border border-gray-600 px-2 py-2 text-left! text-xs bg-gray-100">
                Xray 3 board đầu tiên có OK hay không ?
              </th>
              <td colSpan={2} className="border border-gray-600 px-2 py-2">
                <div className="flex items-center justify-center flex-row gap-2">
                  <label className="font-bold text-xs">OK</label>
                  <input 
                    type="checkbox"
                    checked={!!form.aoiQ1}
                    onChange={(e) => set("aoiQ1", e.target.checked)}
                  />
                </div>
              </td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2 text-left! text-xs">
                Người kiểm tra: {form.aoiCheck || ""}
              </td>

            </tr>

            {/** Row 27.0.1: mAoi program */}
            <tr>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100 text-left!">mAOI Program</th>
              <td colSpan={11} className="border border-gray-600 px-2 py-2 text-xs">{form.maoiProgram || ""}</td>
            </tr>

            {/** Row 27.0.2: sAoi program */}
            <tr>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100 text-left!">sAOI Program</th>
              <td colSpan={11} className="border border-gray-600 px-2 py-2 text-xs">{form.saoiProgram || ""}</td>
            </tr>

            {/** Row 27.0.3: point sAoi */}
            <tr>
              <th colSpan={2} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100 text-left!">Point sAOI</th>
              <td colSpan={11} className="border border-gray-600 px-2 py-2 text-xs">{form.pointSAOI || ""}</td>
            </tr>

            {/** Row 27.0.4: hình ảnh AOI */}
            <tr>
              <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100 text-left!">
                Hình ảnh AOI
              </th>
              <td colSpan={11} className="border border-gray-600 px-2 py-2">
                <div className="flex items-center justify-center">
                  <ImageViewIcon 
                    imageUrl={form.imgAOI} 
                    title="Hình ảnh AOI"
                    onView={openImagePreview}
                  />
                </div>
              </td>
            </tr>

            {/** Row 27.1 - HÀNG THỨ HAI (độc lập) */}
            <tr>
              <th rowSpan={2} className="border px-2 py-2 text-xs bg-gray-100">OUTPUT</th>

              <th colSpan={8} className="border px-2 py-2 text-left text-xs bg-gray-100">
                Kiểm tra tình trạng setting. khoảng cách input magazine tại uploader ?
              </th>

              <td colSpan={2} className="border px-2 py-2">
                <div className="flex items-center justify-center gap-2">
                  <label className="text-xs font-bold">OK</label>
                  <input
                    type="checkbox"
                    checked={!!form.outputQ1}
                    onChange={(e) => set("outputQ1", e.target.checked)}
                  />
                </div>
              </td>

              <td colSpan={2} className="border px-2 py-2 text-xs">
                Người kiểm tra: {form.outputChecker || ""}
              </td>
            </tr>

            {/** Row 27.2 */}
            <tr>

              <th colSpan={8} className="border px-2 py-2 text-xs bg-gray-100">
                <div className="font-semibold mb-1">Giá trị cài đặt theo yêu cầu</div>
                <div className="flex justify-center gap-4">
                  <span>Model: {form.outputModelValue || ""}</span>
                  <span>Pitch: {form.outputPitchValue || ""}</span>
                </div>
              </th>

              <td colSpan={2} className="border px-2 py-2 bg-gray-300"></td>
              <td colSpan={2} className="border px-2 py-2 bg-gray-300"></td>
            </tr>

            {/** Row 28 */}
            <tr>
              <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Công nhân</th>
              <th colSpan={4} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Tên</th>
              <th colSpan={4} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Ghi chú</th>
              <th colSpan={1} rowSpan={3} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Mẫu kiểm tra (5PCB)</th>
              <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Tên lỗi</th>
              <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Số lượng lỗi</th>
              <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">Tình trạng sửa chữa</th>
            </tr>

            {/** Row 29 */}
            <tr>
              <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">OP</th>
              <td colSpan={4} className="border border-gray-600 px-2 py-2 text-xs">{form.nameOP || ""}</td>
              <td colSpan={4} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
              <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
              <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
              <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
            </tr>

            {/** Row 30 */}
            <tr>
              <th colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-100">AOI</th>
              <td colSpan={4} className="border border-gray-600 px-2 py-2 text-xs">{form.nameAOI || ""}</td>
              <td colSpan={4} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
              <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
              <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
              <td colSpan={1} className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"></td>
            </tr>
          </tbody>
        </table>
      </div>
    {/* Mobile View */}
    <div className="lg:hidden space-y-4">
    {/* Printer Section */}
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm mb-4" onClick={() => setOpen(true)}>
      <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-200">Printer</h3>
      
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-600 mb-1">Áp lực Spec (kg)</div>
          <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
            {form.printerSpecGTAL || "—"}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-600 mb-1">Áp lực thực tế (kg)</div>
          <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
            {form.printerRealGTAL || "—"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-600 mb-1">Tốc độ quét Spec (mm/s)</div>
          <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
            {form.printerSpecTDQ || "—"}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-600 mb-1">Tốc độ quét thực tế (mm/s)</div>
          <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
            {form.printerRealTDQ || "—"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-600 mb-1">Tốc độ tách bàn Spec (mm/s)</div>
          <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
            {form.printerSpecTDKC || "—"}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-600 mb-1">Tốc độ tách bàn thực tế (mm/s)</div>
          <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
            {form.printerRealTDKC || "—"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-600 mb-1">Số lần lau Spec</div>
          <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
            {form.printerSpecSLL || "—"}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-600 mb-1">Số lần lau thực tế</div>
          <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
            {form.printerRealSLL || "—"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-600 mb-1">Dao sử dụng Spec</div>
          <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
            {form.printerSpecDSL || "—"}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-600 mb-1">Dao sử dụng thực tế</div>
          <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
            {form.printerRealDSL || "—"}
          </div>
        </div>
      </div>

      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Vacuum Block</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
          {form.printerQ1 ? "✓ OK" : "—"}
        </div>
      </div>

      {/** Printer Program */}
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Sprinter Program</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
          {form.printerProgram || "—"}
        </div>
      </div>

    </div>

    {/* SPI Section */}
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm mb-4" onClick={() => setOpen(true)}>
      <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">SPI</h3>

      {/** spi program */}
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">SPI Program</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
          {form.spiProgram || "—"}
        </div>
      </div>

      {/** REV */}
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">REV</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
          {form.rev || "—"}
        </div>
      </div>

      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Inspection Setting OK</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
          {form.spiQ1 ? "✓ OK" : "—"}
        </div>
      </div>

      {/** Hình ảnh SPI */}
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Hình ảnh SPI</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 flex items-center justify-center">
          <ImageViewIcon 
            imageUrl={form.imgSPI} 
            title="Hình ảnh SPI"
            onView={openImagePreview}
          />
        </div>
      </div>
    </div>

    {/* Mount Section */}
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm mb-4" onClick={() => setOpen(true)}>
      <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">Mount</h3>

      {/** mounter program */}
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Mounter Program</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
          {form.mounterProgram || "—"}
        </div>
      </div>

      {/** point mounter */}
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Point Mounter</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
          {form.pointMounter || "—"}
        </div>
      </div>
      
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Kiểm tra 3 board đầu tiên sau khi cắm linh kiện có OK không ?</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
          {form.mountQ1 ? "✓ OK" : "—"}
        </div>
      </div>

      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Kiểm tra 1 tấm ở mặt dưới có NG hay bể linh kiện không ?</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
          {form.mountQ2 ? "✓ OK" : "—"}
        </div>
      </div>
    </div>

    {/* Reflow Section */}
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm mb-4" onClick={() => setOpen(true)}>
      <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">Reflow</h3>
      
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Chiều rộng Conveyor</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
          {form.reflowQ1 ? "✓ OK" : "—"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-600 mb-1">Rail cài đặt (mm)</div>
          <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
            {form.reFlowSettingRail || "—"}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-600 mb-1">Rail thực tế (mm)</div>
          <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
            {form.reFlowRealRail || "—"}
          </div>
        </div>
      </div>

      {/** reflow program */}
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Reflow Program</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
          {form.reflowProgram || "—"}
        </div>
      </div>

      {/** reflow speed */}
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Reflow Speed</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
          {form.reflowSpeed || "—"}
        </div>
      </div>
    </div>

    {/* AOI Section */}
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm mb-4" onClick={() => setOpen(true)}>
      <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">AOI</h3>
      
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Xray 3 board đầu tiên có OK hay không ?</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
          {form.aoiQ1 ? "✓ OK" : "—"}
        </div>
      </div>

      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Chương trình mAoi</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
          {form.maoiProgram || "—"}
        </div>
      </div>

      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Chương trình sAoi</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
          {form.saoiProgram || "—"}
        </div>
      </div>

      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Point sAoi</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
          {form.pointSAOI || "—"}
        </div>
      </div>

      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Người kiểm tra</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
          {form.aoiCheck || "—"}
        </div>
      </div>

      {/** Hình ảnh AOI */}
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Hình ảnh AOI</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 flex items-center justify-center">
          <ImageViewIcon 
            imageUrl={form.imgAOI} 
            title="Hình ảnh AOI"
            onView={openImagePreview}
          />
        </div>
      </div>
    </div>

    {/* Output Section */}
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm mb-4" onClick={() => setOpen(true)}>
      <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">Output</h3>
      
      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Khoảng cách input magazine tại uploader</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
          {form.outputQ1 ? "✓ OK" : "—"}
        </div>
      </div>

      <div className="mb-3">
        <div className="text-xs font-semibold text-gray-600 mb-1">Người kiểm tra</div>
        <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
          {form.outputChecker || "—"}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-600 mb-1">Model</div>
          <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
            {form.outputModelValue || "—"}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-600 mb-1">Pitch</div>
          <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
            {form.outputPitchValue || "—"}
          </div>
        </div>
      </div>
    </div>

    {/* Worker Section */}
    <div className="bg-white border border-gray-300 rounded-lg p-4 shadow-sm mb-4" onClick={() => setOpen(true)}>
      <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">Công nhân</h3>
      <div className="mb-4">
        <h4 className="text-xs font-bold text-gray-600 mb-2">OP</h4>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">Tên</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
              {form.nameOP|| "—"}
            </div>
          </div>
      </div>

      <div>
        <h4 className="text-xs font-bold text-gray-600 mb-2">AOI</h4>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-gray-600 mb-1">Tên</div>
            <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
              {form.nameAOI || "—"}
            </div>
          </div>
      </div>
    </div>

  </div>

  {/* Buttons */}
  <div className="flex flex-row justify-end w-full gap-2 mt-3">
    <ViewDetailButton onOpen={() => setOpen(true)} disabled={!canEdit}>Chỉnh sửa</ViewDetailButton>
    {/* <ViewDetailButton color="green" onOpen={() => {}}>Lưu</ViewDetailButton> */}
  </div>

   {/* Modal */}
    <Modal open={open} title="Chi tiết Vehicle Check" onClose={() => setOpen(false)} onSave={submit}>
  <div className="grid gap-4 max-h-[70vh] overflow-y-auto px-1 scrollbar-hide">
    {/* Printer */}
    <section className="pb-3 border-b border-gray-200">
      <h4 className="text-sm font-semibold mb-3 text-gray-700">Printer</h4>

      <div className="grid grid-cols-1 gap-3 mb-3">
        <div className="min-w-0">
          <label className="text-xs block mb-1">Giá trị áp lực Spec (kg)</label>
          <input
            className="block w-full border rounded px-3 py-2 text-sm min-w-0"
            value={form.printerSpecGTAL ?? ""}
            onChange={(e) => set("printerSpecGTAL", e.target.value )}
            type="text"
          />
        </div>

        <div className="min-w-0">
          <label className="text-xs block mb-1">Tốc độ quét Spec (mm/s)</label>
          <input
            className="block w-full border rounded px-3 py-2 text-sm min-w-0"
            value={form.printerSpecTDQ ?? ""}
            onChange={(e) => set("printerSpecTDQ", e.target.value )}
            type="text"
          />
        </div>
      </div>

      <div className="min-w-0 mb-3">
        <label className="text-xs block mb-1">Tốc độ khoảng cách tách bàn Spec (mm/s)</label>
        <input
          className="block w-full border rounded px-3 py-2 text-sm min-w-0"
          value={form.printerSpecTDKC ?? ""}
          onChange={(e) => set("printerSpecTDKC", e.target.value )}
          type="text"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 mb-3">
        <div className="min-w-0">
          <label className="text-xs block mb-1">Số lần lau Spec</label>
          <input
            className="block w-full border rounded px-3 py-2 text-sm min-w-0"
            value={form.printerSpecSLL ?? ""}
            onChange={(e) => set("printerSpecSLL", e.target.value )}
            type="text"
          />
        </div>

        <div className="min-w-0">
          <label className="text-xs block mb-1">Dao sử dụng Spec</label>
          <input
            className="block w-full border rounded px-3 py-2 text-sm min-w-0"
            value={form.printerSpecDSL ?? ""}
            onChange={(e) => set("printerSpecDSL", e.target.value )}
            type="text"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 mb-3">
        <div className="min-w-0">
          <label className="text-xs block mb-1">Giá trị áp lực thực tế trên máy (kg)</label>
          <input
            className="block w-full border rounded px-3 py-2 text-sm min-w-0"
            value={form.printerRealGTAL ?? ""}
            onChange={(e) => set("printerRealGTAL", e.target.value )}
            type="text"
          />
        </div>

        <div className="min-w-0">
          <label className="text-xs block mb-1">Tốc độ quét thực tế trên máy (mm/s)</label>
          <input
            className="block w-full border rounded px-3 py-2 text-sm min-w-0"
            value={form.printerRealTDQ ?? ""}
            onChange={(e) => set("printerRealTDQ", e.target.value )}
            type="text"
          />
        </div>
      </div>

      <div className="min-w-0 mb-3">
        <label className="text-xs block mb-1">Tốc độ tách bàn thực tế trên máy (mm/s)</label>
        <input
          className="block w-full border rounded px-3 py-2 text-sm min-w-0"
          value={form.printerRealTDKC ?? ""}
          onChange={(e) => set("printerRealTDKC", e.target.value )}
          type="text"
        />
      </div>

      <div className="min-w-0 mb-3">
          <label className="text-xs block mb-1">Số lần lau thực tế trên máy</label>
          <input
            className="block w-full border rounded px-3 py-2 text-sm min-w-0"
            value={form.printerRealSLL ?? ""}
            onChange={(e) => set("printerRealSLL", e.target.value )}
            type="text"
          />
      </div>

      <div className="min-w-0 mb-3">
          <label className="text-xs block mb-1">Dao sử dụng thực tế trên máy</label>
          <input
            className="block w-full border rounded px-3 py-2 text-sm min-w-0"
            value={form.printerRealDSL ?? ""}
            onChange={(e) => set("printerRealDSL", e.target.value )}
            type="text"
          />
      </div>

      <div className="min-w-0 mb-3">
          <label className="text-xs block mb-1">Printer Program</label>
          <input
            className="block w-full border rounded px-3 py-2 text-sm min-w-0"
            value={form.printerProgram ?? ""}
            onChange={(e) => set("printerProgram", e.target.value)}
            type="text"
          />
      </div>
      

      <div className="min-w-0 flex items-center">
        <input
          id="vacuumBlockOk"
          type="checkbox"
          checked={!!form.printerQ1}
          onChange={(e) => set("printerQ1", e.target.checked)}
          className=""
        />
        <label htmlFor="vacuumBlockOk" className="text-xs mx-2">
          Sau khi sử dụng Vaccum Block thì có ảnh hưởng, tác động tới PCB hay linh kiện không ?
        </label>
      </div>
    </section>

    {/* SPI */}
    <div className="grid grid-cols-1 border-b border-gray-200 pb-3">
      <h4 className="text-sm font-semibold mb-3 text-gray-700">SPI</h4>
      {/** spi program */}
      <div className="min-w-0 mb-3">
          <label className="text-xs block mb-1">SPI Program</label>
          <input
            className="block w-full border rounded px-3 py-2 text-sm min-w-0"
            value={form.spiProgram ?? ""}
            onChange={(e) => set("spiProgram", e.target.value)}
            type="text"
          />
      </div>
      {/** REV */}
      <div className="min-w-0 mb-3">
          <label className="text-xs block mb-1">REV</label>
          <input
            className="block w-full border rounded px-3 py-2 text-sm min-w-0"
            value={form.rev ?? ""}
            onChange={(e) => set("rev", e.target.value)}
            type="text"
          />
      </div>
      {/** inspection setting ok */}
      <div className="min-w-0 mb-3">
        <div className="flex items-center gap-2">
          <input
            id="inspectionSettingOk"
            type="checkbox"
            checked={!!form.spiQ1}
            onChange={(e) => set("spiQ1", e.target.checked)}
            className=""
          />
          <label htmlFor="inspectionSettingOk" className="text-xs">
            Inspection Setting OK
          </label>
        </div>
      </div>
      <label className="block text-sm font-medium mb-1">Hình ảnh SPI</label>
      <div className="my-2">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleImageUpload('imgSPI', e)}
          className="border border-gray-300 rounded px-3 py-2 w-full text-sm!"
        />
      </div>

      <div>
      <label className="block text-xs text-gray-600 mb-1">📸 Hoặc chụp ảnh</label>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleImageUpload('imgSPI', e)}
        className="hidden"
        id="camera-capture-spi"
      />
      <label
        htmlFor="camera-capture-spi"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors font-medium shadow-sm"
      >
        {/* Thêm display: inline-block hoặc inline-flex */}
        <div className="inline-flex items-center">
          <FaCamera size={15} />
        </div>
        <div className="inline-flex items-center mx-2">
          Chụp ảnh SPI
        </div>
      </label>
    </div>
      
      {/* Preview Section */}
      {form.imgSPI && (
      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-600 mb-2">Ảnh đã chọn:</p>
        <div className="flex items-center gap-3">
          <img 
            src={normalizeImageUrl(form.imgSPI)} 
            alt="SPI Preview" 
            className="w-24 h-24 object-cover rounded-lg border-2 border-blue-500 cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={() => openImagePreview(normalizeImageUrl(form.imgSPI!), "Hình ảnh SPI")} 
          />
          <button
            type="button"
            onClick={() => openImagePreview(normalizeImageUrl(form.imgSPI!), "Hình ảnh SPI")}
            className="flex-1 text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2 py-2 px-3 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <IoEyeSharp size={20} />
            <span className="text-sm font-medium">Xem ảnh</span>
          </button>
        </div>
      </div>
    )}
    </div>

    {/* Mount */}
    <section className="pb-3 border-b border-gray-200">
      <h4 className="text-sm font-semibold mb-3 text-gray-700">Mount</h4>

      <div className="min-w-0 mb-3">
          <label className="text-xs block mb-1">Mounter Program</label>
          <input
            className="block w-full border rounded px-3 py-2 text-sm min-w-0"
            value={form.mounterProgram ?? ""}
            onChange={(e) => set("mounterProgram", e.target.value)}
            type="text"
          />
      </div>

      <div className="min-w-0 mb-3">
          <label className="text-xs block mb-1">Point Mounter</label>
          <input
            className="block w-full border rounded px-3 py-2 text-sm min-w-0"
            value={form.pointMounter ?? ""}
            onChange={(e) => set("pointMounter", e.target.value )}
            type="text"
          />
      </div>
      
      <div className="grid grid-cols-1 gap-3 mb-3">
        <div className="min-w-0 flex items-center gap-2">
          <input
            id="firstThreeBoardsOk"
            type="checkbox"
            checked={!!form.mountQ1}
            onChange={(e) => set("mountQ1", e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="firstThreeBoardsOk" className="text-xs">
            Kiểm tra 3 board đầu tiên sau khi cắm linh kiện có OK không ?
          </label>
        </div>

        <div className="min-w-0 flex items-center gap-2">
          <input
            id="bottomBoardOk"
            type="checkbox"
            checked={!!form.mountQ2}
            onChange={(e) => set("mountQ2", e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="bottomBoardOk" className="text-xs">
            Kiểm tra 1 tấm ở mặt dưới có NG hay bể linh kiện không ?
          </label>
        </div>
      </div>
    </section>

    {/* Reflow */}
    <section className="pb-3 border-b border-gray-200">
      <h4 className="text-sm font-semibold mb-3 text-gray-700">Reflow</h4>

      <div className="grid grid-cols-1 gap-3 mb-3">
        <div className="min-w-0 flex items-center gap-2">
          <input
            id="conveyorWidthOk"
            type="checkbox"
            checked={!!form.reflowQ1}
            onChange={(e) => set("reflowQ1", e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="conveyorWidthOk" className="text-xs">
            Kiểm tra tình trạng chiều rộng của Conveyor
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="min-w-0">
            <label className="text-xs block mb-1">Giá trị cài đặt Rail (mm)</label>
            <input
              className="block w-full border rounded px-3 py-2 text-sm min-w-0"
              value={form.reFlowSettingRail ?? ""}
              onChange={(e) => set("reFlowSettingRail", e.target.value )}
              type="text"
            />
          </div>
          <div className="min-w-0">
            <label className="text-xs block mb-1">Giá trị thực tế Rail (mm)</label>
            <input
              className="block w-full border rounded px-3 py-2 text-sm min-w-0"
              value={form.reFlowRealRail ?? ""}
              onChange={(e) => set("reFlowRealRail", e.target.value )}
              type="text"
            />
          </div>
        </div>

        <div className="min-w-0 ">
          <label className="text-xs block mb-1">Reflow Program</label>
          <input
            className="block w-full border rounded px-3 py-2 text-sm min-w-0"
            value={form.reflowProgram ?? ""}
            onChange={(e) => set("reflowProgram", e.target.value )}
            type="text"
          />
      </div>

      <div className="min-w-0">
          <label className="text-xs block mb-1">Reflow Speed</label>
          <input
            className="block w-full border rounded px-3 py-2 text-sm min-w-0"
            value={form.reflowSpeed ?? ""}
            onChange={(e) => set("reflowSpeed", e.target.value )}
            type="text"
          />
      </div>
      </div>
    </section>

     {/* AOI */}
<div className="grid grid-cols-1 border-b border-gray-200 pb-3">
  <h4 className="text-sm font-semibold mb-3 text-gray-700">AOI</h4>
  {/** xray 3 board đầu tiên có Ok hay không ? */}
  <div className="min-w-0 flex items-center gap-2 mb-3">
    <input
      id="xrayThreeBoardsOk"
      type="checkbox"
      checked={!!form.aoiQ1}
      onChange={(e) => set("aoiQ1", e.target.checked)}
      className="mr-2"
    />
    <label htmlFor="xrayThreeBoardsOk" className="text-xs">
      Xray 3 board đầu tiên có OK hay không ?
    </label>
  </div>
  {/** maoi program */}
  <div className="min-w-0 mb-3">
    <label className="text-xs block mb-1">Chương trình mAoi</label>
    <input
      className="block w-full border rounded px-3 py-2 text-sm min-w-0"
      value={form.maoiProgram ?? ""}
      onChange={(e) => set("maoiProgram", e.target.value)}
      type="text"
    />
  </div>
  {/** saoi program */}
  <div className="min-w-0 mb-3">
    <label className="text-xs block mb-1">Chương trình sAoi</label>
    <input
      className="block w-full border rounded px-3 py-2 text-sm min-w-0"
      value={form.saoiProgram ?? ""}
      onChange={(e) => set("saoiProgram", e.target.value)}
      type="text"
    />
  </div>
  {/** point saoi */}
  <div className="min-w-0 mb-3">
    <label className="text-xs block mb-1">Point sAoi</label>
    <input
      className="block w-full border rounded px-3 py-2 text-sm min-w-0"
      value={form.pointSAOI ?? ""}
      onChange={(e) => set("pointSAOI", e.target.value )}
      type="text"
    />
  </div>
  {/** Người kiểm tra */}
  <div className="min-w-0 mb-3">
    <label className="text-xs block mb-1">Người kiểm tra</label>
    <input
      className="block w-full border rounded px-3 py-2 text-sm min-w-0"
      value={form.aoiCheck ?? ""}
      onChange={(e) => set("aoiCheck", e.target.value)}
      type="text"
    />
  </div>
  <label className="block text-xs font-medium mb-1">Hình ảnh AOI</label>
  <div className="flex flex-col gap-2">
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleImageUpload('imgAOI', e)}
        className="flex-1 border border-gray-300 rounded px-3 py-2 w-full text-sm!"
      />
    </div>

    <div>
      <label className="block text-xs text-gray-600 mb-1">📸 Hoặc chụp ảnh</label>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleImageUpload('imgAOI', e)}
        className="hidden"
        id="camera-capture-aoi"
      />
      <label
        htmlFor="camera-capture-aoi"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors font-medium shadow-sm"
      >
        {/* Thêm display: inline-block hoặc inline-flex */}
                      <div className="inline-flex items-center">
                        <FaCamera size={15} />
                      </div>
                      <div className="inline-flex items-center mx-2">
                        Chụp ảnh AOI
                      </div>
      </label>
    </div>
  </div>
  
  {/* Preview Section */}
  {form.imgAOI && (
      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-600 mb-2">Ảnh đã chọn:</p>
        <div className="flex items-center gap-3">
          <img 
            src={normalizeImageUrl(form.imgAOI)} 
            alt="AOI Preview" 
            className="w-24 h-24 object-cover rounded-lg border-2 border-blue-500 cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={() => openImagePreview(normalizeImageUrl(form.imgAOI!), "Hình ảnh AOI")} 
          />
          <button
            type="button"
            onClick={() => openImagePreview(normalizeImageUrl(form.imgAOI!), "Hình ảnh AOI")}
            className="flex-1 text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2 py-2 px-3 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <IoEyeSharp size={20} />
            <span className="text-sm font-medium">Xem ảnh</span>
          </button>
        </div>
      </div>
    )}
</div>
    {/* Output */}
    <section className="pb-3 border-b border-gray-200">
      <h4 className="text-sm font-semibold mb-3 text-gray-700">Output</h4>

      <div className="grid grid-cols-1 gap-3 mb-3">
        <div className="min-w-0 flex items-center gap-2">
          <input
            id="magazineDistanceOk"
            type="checkbox"
            checked={!!form.outputQ1}
            onChange={(e) => set("outputQ1", e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="magazineDistanceOk" className="text-xs">
            Kiểm tra tình trạng setting, khoảng cách input magazine tại uploader ?
          </label>
        </div>

        <div className="min-w-0">
          <label className="text-xs block mb-1">Người kiểm tra</label>
          <input
            className="block w-full border rounded px-3 py-2 text-sm min-w-0"
            value={form.outputChecker ?? ""}
            onChange={(e) => set("outputChecker", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-3">
          <div className="min-w-0">
            <label className="text-xs block mb-1">Giá trị cài đặt theo yêu cầu Model</label>
            <input
              className="block w-full border rounded px-3 py-2 text-sm min-w-0"
              value={form.outputModelValue ?? ""}
              onChange={(e) => set("outputModelValue", e.target.value)}
            />
          </div>
          <div className="min-w-0">
            <label className="text-xs block mb-1">Giá trị cài đặt theo yêu cầu Pitch</label>
            <input
              className="block w-full border rounded px-3 py-2 text-sm min-w-0"
              value={form.outputPitchValue ?? ""}
              onChange={(e) => set("outputPitchValue", e.target.value)}
            />
          </div>
        </div>
      </div>
    </section>

    {/* Worker */}
    <section>
      <h4 className="text-sm font-semibold mb-3 text-gray-700">Công nhân</h4>

      <div className="grid grid-cols-1 gap-3 mb-3">
        <div className="min-w-0">
          <label className="text-xs block mb-1">Tên OP</label>
          <input
            className="block w-full border rounded px-3 py-2 text-sm min-w-0"
            value={form.nameOP ?? ""}
            onChange={(e) => set("nameOP", e.target.value)}
          />
        </div>

        <div className="min-w-0">
          <label className="text-xs block mb-1">Tên AOI</label>
          <input
            className="block w-full border rounded px-3 py-2 text-sm min-w-0"
            value={form.nameAOI ?? ""}
            onChange={(e) => set("nameAOI", e.target.value)}
          />
        </div>
      </div>
    </section>
  </div>
</Modal>

<ImagePreviewModal
    isOpen={imagePreview.isOpen}
    imageUrl={imagePreview.imageUrl}
    title={imagePreview.title}
    onClose={closeImagePreview}
  />
    </div>
  )
}

export default StandardVehicles