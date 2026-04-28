import ViewDetailButton from "../general/ViewDetailButton";
import Modal from "../general/Modal";
import { useEffect, useState, useRef, memo } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  deleteSPIImage,
  deleteAOIImage,
  deleteStandardVehicleIssueImage,
  deleteMounterImage,
  deletePrinterImage,
  deletePrinterCleanImage,
  deleteXRayImage,
  fetchStandardVehicle,
  updateStandardVehicle,
  uploadAOIImage,
  uploadSPIImage,
  uploadStandardVehicleIssueImage,
  uploadMounterImage,
  uploadPrinterImage,
  uploadPrinterCleanImage,
  uploadStandardVehicleReflowImage,
  deleteStandardVehicleReflowImage
} from "../../redux/slices/subTableSlice";
import ImagePreviewModal from "../files/ImagePreviewModal";
import ImageViewIcon from "../files/ImageViewIcon";
import type { StandardVehicleData } from "../../redux/slices/subTableSlice";
import { uploadXRayImage } from "../../redux/slices/subTableSlice";
import { useNotification } from "../../redux/hooks";
import Notification from "../general/Notification";
import { useTranslation } from "react-i18next";
import MultiImageUpload from "../files/MultiImageUpload";
import { useSubTableFetch } from "../../utils/useSubTableFetch";

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

  imgSPI: [],
  imgAOI: [],

  id: 0,

  note: "",
  imgIssue: [],
  imgMounter: [],
  imgPrinter: [],
  imgPrinterClean: [],
  imgXray: [],
  imgReflow: [],
};

const StandardVehicles = memo(({ canEdit }: { canEdit: boolean }) => {
  const dispatch = useAppDispatch();
  // khai báo loading để xử lý loading state trong modal
  const { completedTables } = useAppSelector((state) => state.subTable);
  // lấy checkModel data từ redux store
  const { standardVehicle } = useAppSelector((state) => state.subTable);
  // lấy checkModel id từ currentSheet trong changeModel Slice
  const currentSheet = useAppSelector(
    (state) => state.changeModel.currentSheet,
  );
  const smdSheetId = currentSheet?.id;
  const standardVehicleId =
    currentSheet?.standardVehicleId || standardVehicle?.id;

  const [open, setOpen] = useState(false);
  const [scrollTarget, setScrollTarget] = useState<string>('');
  const [form, setForm] = useState<StandardVehicleData>(
    initialStandardVehiclesState,
  );
  const sectionRefs = {
    printer: useRef<HTMLDivElement>(null),
    spi: useRef<HTMLDivElement>(null),
    mount: useRef<HTMLDivElement>(null),
    reflow: useRef<HTMLDivElement>(null),
    aoi: useRef<HTMLDivElement>(null),
    output: useRef<HTMLDivElement>(null),
    worker: useRef<HTMLDivElement>(null),
    issue: useRef<HTMLDivElement>(null),
  };

  const isSaved = completedTables.includes("StandardVehicle");


  const { notification, showNotification, hideNotification } =
    useNotification();
  // const isModalInitializedRef = useRef(false);
  const hasUserEditedRef = useRef(false);
  const isUploadingRef = useRef(false);
  const deletingRef = useRef(false);

  const { t } = useTranslation("standardVehicle");
  const { t: t2 } = useTranslation("common");

  // Xử lý upload hình ảnh preview modal
  const [imagePreview, setImagePreview] = useState<{
    isOpen: boolean;
    imageUrl: string | string[];
    title: string;
    initialIndex?: number;
  }>({
    isOpen: false,
    imageUrl: "",
    title: "",
    initialIndex: 0,
  });

  // Hàm mở preview
  const openImagePreview = (
    imageUrl: string | string[],
    title: string,
    initialIndex = 0,
  ) => {
    setImagePreview({
      isOpen: true,
      imageUrl,
      title,
      initialIndex,
    });
  };

  // Hàm đóng preview
  const closeImagePreview = () => {
    setImagePreview({
      isOpen: false,
      imageUrl: "",
      title: "",
      initialIndex: 0,
    });
  };
  // useEffect #1: Fetch data khi ID thay đổi
  useSubTableFetch(standardVehicleId, fetchStandardVehicle);

  // useEffect #3: Sync form với Redux
  useEffect(() => {
    if (
      standardVehicle &&
      !hasUserEditedRef.current &&
      !isUploadingRef.current &&
      !deletingRef.current
    ) {
      setForm(standardVehicle);
    }
  }, [standardVehicle]);

  // useEffect #4: Reset flags khi đóng modal
  useEffect(() => {
    if (!open) {
      hasUserEditedRef.current = false;
      isUploadingRef.current = false;
      deletingRef.current = false;
    }
  }, [open]);

  // useEffect scroll đến section khi modal mở
  useEffect(() => {
  if (!open || !scrollTarget) return;

  const timer = setTimeout(() => {
    const ref = sectionRefs[scrollTarget as keyof typeof sectionRefs];
    if (!ref?.current) {
      setScrollTarget('');
      return;
    }

    // Tìm scrollable container bằng cách đi ngược lên DOM từ section
    let container: HTMLElement | null = ref.current.parentElement;
    while (container) {
      const overflow = window.getComputedStyle(container).overflowY;
      if (overflow === 'auto' || overflow === 'scroll') break;
      container = container.parentElement;
    }

    if (container) {
      const containerTop = container.getBoundingClientRect().top;
      const sectionTop = ref.current.getBoundingClientRect().top;
      const offset = sectionTop - containerTop;

      container.scrollBy({
        top: offset,
        behavior: 'smooth',
      });
    }

    setScrollTarget('');
  }, 150);

  return () => clearTimeout(timer);
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [open, scrollTarget]);

  const openModalAt = (section: string) => {
    if (!canEdit) return;
    setScrollTarget(section);
    setOpen(true);
  };

  if (!standardVehicleId) {
    return (
      <div className="p-4 bg-gray-50 rounded border border-gray-200">
        <p className="text-sm text-gray-500">
          Đang tải dữ liệu Standard Vehicle...
        </p>
      </div>
    );
  }

  // FIXED: Upload handler với flag protection cho CÁ 2 trường imgSPI và imgAOI
  const handleImageUpload = async (
    field: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!standardVehicleId) {
      showNotification(
        "error",
        "Lỗi upload",
        "Không tìm thấy StandardVehicle ID",
      );
      return;
    }

    try {
      isUploadingRef.current = true;

      let result;
      let successMessage = "";

      switch (field) {
        case "imgSPI":
          result = await dispatch(
            uploadSPIImage({ id: Number(standardVehicleId), file }),
          ).unwrap();
          successMessage = "Upload hình ảnh SPI thành công";
          break;
        case "imgAOI":
          result = await dispatch(
            uploadAOIImage({ id: Number(standardVehicleId), file }),
          ).unwrap();
          successMessage = "Upload hình ảnh AOI thành công";
          break;
        case "imgMounter":
          result = await dispatch(
            uploadMounterImage({
              StandardVehicleId: Number(standardVehicleId),
              file,
            }),
          ).unwrap();
          successMessage = "Upload hình ảnh sau mounter thành công";
          break;
        case "imgPrinter":
          result = await dispatch(
            uploadPrinterImage({
              StandardVehicleId: Number(standardVehicleId),
              file,
            }),
          ).unwrap();
          successMessage = "Upload hình ảnh sau printer thành công";
          break;
        case "imgPrinterClean":
          result = await dispatch(
            uploadPrinterCleanImage({
              StandardVehicleId: Number(standardVehicleId),
              file,
            }),
          ).unwrap();
          successMessage = "Upload hình ảnh cleaning printer thành công";
          break;
        case "imgIssue":
          result = await dispatch(
            uploadStandardVehicleIssueImage({
              StandardVehicleId: Number(standardVehicleId),
              file,
            }),
          ).unwrap();
          successMessage = "Upload hình ảnh vấn đề phát sinh thành công";
          break;
        case "imgXray":
          result = await dispatch(
            uploadXRayImage({
              StandardVehicleId: Number(standardVehicleId),
              file,
            }),
          ).unwrap();
          successMessage = "Upload hình ảnh X-ray thành công";
          break;
        case "imgReflow":
          result = await dispatch(
            uploadStandardVehicleReflowImage({
              StandardVehicleId: Number(standardVehicleId),
              file,
            }),
          ).unwrap();
          successMessage = "Upload hình ảnh Reflow thành công";
          break;
      }

      // Thêm ảnh mới vào array, update local state
      if (result?.imageUrl) {
        setForm((prev) => {
          const fieldKey = field as
            | "imgSPI"
            | "imgAOI"
            | "imgMounter"
            | "imgPrinter"
            | "imgPrinterClean"
            | "imgIssue"
            | "imgXray"
            | "imgReflow";
          const currentArray = prev[fieldKey] || [];
          return {
            ...prev,
            [fieldKey]: [...currentArray, result.imageUrl],
          };
        });
      }

      showNotification("success", "Thành công", successMessage);
    } catch (error) {
      console.error("Failed to upload image:", error);
      showNotification(
        "error",
        "Lỗi upload",
        `Không thể upload hình ảnh ${field}`,
      );
    } finally {
      isUploadingRef.current = false;
    }
  };

  // Handler để xóa ảnh
  const handleRemoveImage = async (
    field: keyof StandardVehicleData,
    index: number,
  ) => {
    if (!standardVehicleId) {
      showNotification("error", "Lỗi xóa", "Không tìm thấy StandardVehicle ID");
      return;
    }

    const imageUrl = (form[field] as string[])?.[index];
    if (!imageUrl) return;

    try {
      deletingRef.current = true;
      // Gọi API delete tương ứng với field
      switch (field) {
        case "imgSPI":
          await dispatch(
            deleteSPIImage({
              standardVehicleId: Number(standardVehicleId),
              imageUrl,
            }),
          ).unwrap();
          break;
        case "imgAOI":
          await dispatch(
            deleteAOIImage({
              standardVehicleId: Number(standardVehicleId),
              imageUrl,
            }),
          ).unwrap();
          break;
        case "imgIssue":
          await dispatch(
            deleteStandardVehicleIssueImage({
              standardVehicleId: Number(standardVehicleId),
              imageUrl,
            }),
          ).unwrap();
          break;
        case "imgMounter":
          await dispatch(
            deleteMounterImage({
              standardVehicleId: Number(standardVehicleId),
              imageUrl,
            }),
          ).unwrap();
          break;
        case "imgPrinter":
          await dispatch(
            deletePrinterImage({
              standardVehicleId: Number(standardVehicleId),
              imageUrl,
            }),
          ).unwrap();
          break;
        case "imgPrinterClean":
          await dispatch(
            deletePrinterCleanImage({
              standardVehicleId: Number(standardVehicleId),
              imageUrl,
            }),
          ).unwrap();
          break;
        case "imgXray":
          await dispatch(
            deleteXRayImage({
              standardVehicleId: Number(standardVehicleId),
              imageUrl,
            }),
          ).unwrap();
          break;
        case "imgReflow":
          await dispatch(
            deleteStandardVehicleReflowImage({
              standardVehicleId: Number(standardVehicleId),
              imageUrl,
            }),
          ).unwrap();
          break;
        default:
          throw new Error(`Unsupported field: ${field}`);
      }

      // Cập nhật local state
      setForm((prev) => ({
        ...prev,
        [field]: (prev[field] as string[])?.filter((_, i) => i !== index) || [],
      }));

      showNotification("success", "Đã xóa", `Đã xóa ảnh ${field} thành công`);
    } catch (error) {
      console.error("Failed to delete image:", error);
      showNotification("error", "Lỗi xóa", `Không thể xóa ảnh ${field}`);
    } finally {
      deletingRef.current = false; // ← Reset flag
    }
  };

  // Wrapper cho set() để đánh dấu user đã edit
  const set = <K extends keyof StandardVehicleData>(
    k: K,
    v: StandardVehicleData[K],
  ) => {
    hasUserEditedRef.current = true;
    setForm((s) => ({ ...s, [k]: v }));
  };

  const submit = async () => {
    if (!standardVehicleId) {
      showNotification(
        "error",
        "Lỗi lưu Standard Vehicle",
        "Không tìm thấy StandardVehicle ID",
      );
      return;
    }

    if (!smdSheetId) {
      showNotification(
        "error",
        "Lỗi lưu Standard Vehicle",
        "Không tìm thấy SMD Sheet ID",
      );
      return;
    }

    try {
      const dataToSubmit = {
        ...form,
        printerSpecGTAL: form.printerSpecGTAL?.toUpperCase() || "",
        printerSpecTDQ: form.printerSpecTDQ?.toUpperCase() || "",
        printerSpecTDKC: form.printerSpecTDKC?.toUpperCase() || "",
        printerSpecSLL: form.printerSpecSLL?.toUpperCase() || "",
        printerSpecDSL: form.printerSpecDSL?.toUpperCase() || "",
        printerRealGTAL: form.printerRealGTAL?.toUpperCase() || "",
        printerRealTDQ: form.printerRealTDQ?.toUpperCase() || "",
        printerRealTDKC: form.printerRealTDKC?.toUpperCase() || "",
        printerRealSLL: form.printerRealSLL?.toUpperCase() || "",
        printerRealDSL: form.printerRealDSL?.toUpperCase() || "",
        reFlowSettingRail: form.reFlowSettingRail?.toUpperCase() || "",
        reFlowRealRail: form.reFlowRealRail?.toUpperCase() || "",
        aoiCheck: form.aoiCheck?.toUpperCase() || "",
        outputModelValue: form.outputModelValue?.toUpperCase() || "",
        outputPitchValue: form.outputPitchValue?.toUpperCase() || "",
        outputChecker: form.outputChecker?.toUpperCase() || "",
        nameOP: form.nameOP?.toUpperCase() || "",
        nameAOI: form.nameAOI?.toUpperCase() || "",
        printerProgram: form.printerProgram?.toUpperCase() || "",
        spiProgram: form.spiProgram?.toUpperCase() || "",
        mounterProgram: form.mounterProgram?.toUpperCase() || "",
        pointMounter: form.pointMounter?.toUpperCase() || "",
        maoiProgram: form.maoiProgram?.toUpperCase() || "",
        saoiProgram: form.saoiProgram?.toUpperCase() || "",
        pointSAOI: form.pointSAOI?.toUpperCase() || "",
        reflowProgram: form.reflowProgram?.toUpperCase() || "",
        reflowSpeed: form.reflowSpeed?.toUpperCase() || "",
        rev: form.rev?.toUpperCase() || "",
        note: form.note?.toUpperCase() || "",
      };

      await dispatch(
        updateStandardVehicle({
          id: standardVehicleId,
          data: dataToSubmit,
        }),
      ).unwrap();

      if (standardVehicleId) {
        await dispatch(fetchStandardVehicle(standardVehicleId)).unwrap();
      }

      setOpen(false);
      showNotification(
        "success",
        "Thành công",
        "Cập nhật Standard Vehicle thành công",
      );
    } catch (error) {
      console.error("Failed to update StandardVehicles:", error);
      showNotification(
        "error",
        "Lỗi lưu Standard Vehicle",
        "Có lỗi xảy ra khi cập nhật StandardVehicles",
      );
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
        <div
          className={`mb-2 text-xs p-2 rounded flex items-center gap-2 no-print ${isSaved
            ? "bg-green-50 text-green-700 border border-green-200"
            : "bg-gray-50 text-gray-600 border border-gray-200"
            }`}
        >
          {isSaved && <span className="text-green-600">✓</span>}
          <span>
            StandardVehicle ID: <strong>{standardVehicleId}</strong>
          </span>
          {currentSheet?.id && (
            <span>
              | ChangeModel ID: <strong>{currentSheet.id}</strong>
            </span>
          )}
        </div>
      )}
      {/* Desktop View */}
      <div className="hidden lg:block w-full overflow-x-auto">
        <table className="border border-gray-600 w-full text-center opacity-80">
          <tbody>
            {/* Row 16 */}
            <tr>
              <th className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100">
                {t("title")}
              </th>
              <td
                colSpan={12}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"
              ></td>
            </tr>

            {/** printer section */}
            {/** Row 17 */}
            <tr className="pdf-section-printer">
              <th
                rowSpan={7}
                className="border border-gray-600 px-2 py-2 text-xs text-left bg-gray-100"
              >
                Printer
              </th>
              <th
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100"
              >
                {t("printer.pressureValue")}
              </th>
              <th
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100"
              >
                {t("printer.pressureSpec")}
              </th>
              <th
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100"
              >
                {t("printer.speedSpec")}
              </th>
              <th
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100"
              >
                {t("printer.separationSpeed")}
              </th>
              <th
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100"
              >
                {t("printer.wipeCount")}
              </th>
              <th
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100"
              >
                {t("printer.bladeUsed")}
              </th>
            </tr>

            {/** Row 18 */}
            <tr>
              <th
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100 text-left!"
              >
                {t("printer.settingSpec")}
              </th>
              <td
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                {form.printerSpecGTAL || ""} kg
              </td>
              <td
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                {form.printerSpecTDQ || ""} mm/s
              </td>
              <td
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                {form.printerSpecTDKC || ""} mm/s
              </td>
              <td
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                {form.printerSpecSLL || ""}
              </td>
              <td
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                {form.printerSpecDSL || ""}
              </td>
            </tr>

            {/** Row 19 */}
            <tr>
              <th
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100 text-left!"
              >
                {t("printer.realSetting")}
              </th>
              <td
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                {form.printerRealGTAL || ""} kg
              </td>
              <td
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                {form.printerRealTDQ || ""} mm/s
              </td>
              <td
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                {form.printerRealTDKC || ""} mm/s
              </td>
              <td
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                {form.printerRealSLL || ""}
              </td>
              <td
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                {form.printerRealDSL || ""}
              </td>
            </tr>

            {/** Row 20 */}
            <tr>
              <th
                colSpan={8}
                className="border border-gray-600 px-2 py-2 text-left! text-xs bg-gray-100"
              >
                {t("printer.vacuumBlock")}
              </th>
              <td colSpan={2} className="border border-gray-600 px-2 py-2">
                <div className="flex items-center justify-center flex-row gap-2">
                  <label className="font-bold text-xs">OK</label>
                  <span className="text-base font-bold">
                    {form.printerQ1 ? "✓" : ""}
                  </span>
                </div>
              </td>
              <td colSpan={2} className="border border-gray-600 px-2 py-2"></td>
            </tr>

            {/** row 20.1: thêm sprinter program */}
            <tr>
              <th
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100 text-left!"
              >
                Sprinter Program
              </th>
              <td
                colSpan={11}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                {form.printerProgram || ""}
              </td>
            </tr>
            {/** row 20.2: thêm hình ảnh sau printer */}
            <tr>
              <th
                colSpan={1}
                className="border border-gray-600 px-2 py-2 text-xs text-left! bg-gray-100"
              >
                {t2("printerAfterImage")}
              </th>
              <td
                colSpan={11}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                <div className="flex items-center justify-center">
                  <div className="flex items-center justify-center gap-2">
                    <ImageViewIcon
                      imageUrl={form.imgPrinter}
                      title={t2("printerAfterImage")}
                      onView={openImagePreview}
                    />
                  </div>
                </div>
              </td>
            </tr>

            {/** row 20.3: thêm hình ảnh cleaning printer */}
            <tr>
              <th
                colSpan={1}
                className="border border-gray-600 px-2 py-2 text-xs text-left! bg-gray-100"
              >
                {t2("autoCleaningPrinter")}
              </th>
              <td
                colSpan={11}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                <div className="flex items-center justify-center">
                  <div className="flex items-center justify-center gap-2">
                    <ImageViewIcon
                      imageUrl={form.imgPrinterClean}
                      title={t2("autoCleaningPrinter")}
                      onView={openImagePreview}
                    />
                  </div>
                </div>
              </td>
            </tr>

            {/** SPI Section */}
            {/** Row 21 */}
            <tr className="pdf-section-spi">
              <th
                colSpan={1}
                rowSpan={5}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100"
              >
                SPI
              </th>
              <th
                colSpan={8}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100"
              >
                {t("spi.checkItems")}
              </th>
              <td
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"
              ></td>
              <td
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"
              ></td>
            </tr>

            {/** Row 22 */}
            <tr>
              <th
                colSpan={8}
                className="border border-gray-600 px-2 py-2 text-left! text-xs bg-gray-100"
              >
                {t("spi.inspectionSetting")}
              </th>
              <td colSpan={2} className="border border-gray-600 px-2 py-2">
                <div className="flex items-center justify-center flex-row gap-2">
                  <label className="font-bold text-xs">OK</label>
                  <span className="text-base font-bold">
                    {form.spiQ1 ? "✓" : ""}
                  </span>
                </div>
              </td>
              <td
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"
              ></td>
            </tr>

            {/** 22.0.1: thêm spi program */}
            <tr>
              <th
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100 text-left!"
              >
                SPI Program
              </th>
              <td
                colSpan={11}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                {form.spiProgram || ""}
              </td>
            </tr>

            {/** Row 22.0.2: hình ảnh SPI */}
            <tr>
              <th
                colSpan={1}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100 text-left!"
              >
                {t("spi.imageSPI")}
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
              <th
                colSpan={1}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100 text-left!"
              >
                REV
              </th>
              <td
                colSpan={11}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                {form.rev || ""}
              </td>
            </tr>

            {/** Mount Section */}
            {/** Row 23 */}
            <tr className="pdf-section-mount">
              <th
                colSpan={1}
                rowSpan={5}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100"
              >
                Mount
              </th>
              <th
                colSpan={8}
                className="border border-gray-600 px-2 py-2 text-left! text-xs bg-gray-100"
              >
                {t("mount.checkFirst3Boards")}
              </th>
              <td colSpan={2} className="border border-gray-600 px-2 py-2">
                <div className="flex items-center justify-center flex-row gap-2">
                  <label className="font-bold text-xs">OK</label>
                  <span className="text-base font-bold">
                    {form.mountQ1 ? "✓" : ""}
                  </span>
                </div>
              </td>
              <td
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"
              ></td>
            </tr>

            {/** Row 24 */}
            <tr>
              <th
                colSpan={8}
                className="border border-gray-600 px-2 py-2 text-left! text-xs bg-gray-100"
              >
                {t("mount.checkBottomBoard")}
              </th>
              <td colSpan={2} className="border border-gray-600 px-2 py-2">
                <div className="flex items-center justify-center flex-row gap-2">
                  <label className="font-bold text-xs">OK</label>
                  <span className="text-base font-bold">
                    {form.mountQ2 ? "✓" : ""}
                  </span>
                </div>
              </td>
              <td
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"
              ></td>
            </tr>

            {/** row 23.1: mounter program */}
            <tr>
              <th
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100 text-left!"
              >
                Mounter Program
              </th>
              <td
                colSpan={11}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                {form.mounterProgram || ""}
              </td>
            </tr>
            {/** row 23.2: point mounter */}
            <tr>
              <th
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100 text-left!"
              >
                Point Mounter
              </th>
              <td
                colSpan={11}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                {form.pointMounter || ""}
              </td>
            </tr>

            {/** row 23.3: hình ảnh sau mounter */}
            <tr>
              <th
                colSpan={1}
                className="border border-gray-600 px-2 py-2 text-xs text-left! bg-gray-100"
              >
                {t2("mounterAfterImage")}
              </th>
              <td
                colSpan={11}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                <div className="flex items-center justify-center">
                  <div className="flex items-center justify-center gap-2">
                    <ImageViewIcon
                      imageUrl={form.imgMounter}
                      title={t2("mounterAfterImage")}
                      onView={openImagePreview}
                    />
                  </div>
                </div>
              </td>
            </tr>

            {/** Row 25 */}
            <tr className="pdf-section-reflow">
              <th
                colSpan={1}
                rowSpan={5}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100"
              >
                Reflow
              </th>
              <th
                colSpan={8}
                className="border border-gray-600 px-2 py-2 text-left! text-xs bg-gray-100"
              >
                {t("reflow.conveyorWidth")}
              </th>
              <td colSpan={2} className="border border-gray-600 px-2 py-2">
                <div className="flex items-center justify-center flex-row gap-2">
                  <label className="font-bold text-xs">OK</label>
                  <span className="text-base font-bold">
                    {form.reflowQ1 ? "✓" : ""}
                  </span>
                </div>
              </td>
              <td
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"
              ></td>
            </tr>

            {/** row 25.0.1: reflow program */}
            <tr>
              <th
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100 text-left!"
              >
                Reflow Program
              </th>
              <td
                colSpan={11}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                {form.reflowProgram || ""}
              </td>
            </tr>

            {/** row 25.0.2: reflow speed */}
            <tr>
              <th
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100 text-left!"
              >
                Reflow Speed
              </th>
              <td
                colSpan={11}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                {form.reflowSpeed || ""}
              </td>
            </tr>

            {/** Row 26 */}
            <tr>
              <th
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs text-left! bg-gray-100"
              >
                {t("reflow.settingRail")}
              </th>
              <th
                colSpan={1}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                {form.reFlowSettingRail || ""} mm
              </th>
              <th
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100 text-left!"
              >
                {t("reflow.realRail")}
              </th>
              <th
                colSpan={3}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                {form.reFlowRealRail || ""} mm
              </th>
              <td
                colSpan={2}
                className="border border-gray-600 px-2 py-2 bg-gray-300"
              ></td>
              <td
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"
              ></td>
            </tr>

            {/** Reflow image  */}
            <tr>
              <th
                colSpan={1}
                className="border border-gray-600 px-2 py-2 text-xs text-left! bg-gray-100"
              >
                {t("reflow.imgReflow")}
              </th>
              <td
                colSpan={11}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                <div className="flex items-center justify-center">
                  <div className="flex items-center justify-center gap-2">
                    <ImageViewIcon
                      imageUrl={form.imgReflow}
                      title={t("reflow.imgReflow")}
                      onView={openImagePreview}
                    />
                  </div>
                </div>
              </td>
            </tr>

            {/** Row 27 - HÀNG ĐẦU TIÊN */}
            <tr className="pdf-section-aoi">
              <th
                colSpan={1}
                rowSpan={6}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100"
              >
                AOI
              </th>
              <th
                colSpan={8}
                className="border border-gray-600 px-2 py-2 text-left! text-xs bg-gray-100"
              >
                {t("aoi.xray3Boards")}
              </th>
              <td colSpan={2} className="border border-gray-600 px-2 py-2">
                <div className="flex items-center justify-center flex-row gap-2">
                  <label className="font-bold text-xs">OK</label>
                  <span className="text-base font-bold">
                    {form.aoiQ1 ? "✓" : ""}
                  </span>
                </div>
              </td>
              <td
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-left! text-xs"
              >
                {t("aoi.checker")}: {form.aoiCheck || ""}
              </td>
            </tr>

            {/** row 27.0: hình ảnh image xray */}
            <tr>
              <th
                colSpan={1}
                className="border border-gray-600 px-2 py-2 text-xs text-left! bg-gray-100"
              >
                {t2("xrayImg")}
              </th>
              <td
                colSpan={11}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                <div className="flex items-center justify-center">
                  <div className="flex items-center justify-center gap-2">
                    <ImageViewIcon
                      imageUrl={form.imgXray}
                      title={t2("xrayImg")}
                      onView={openImagePreview}
                    />
                  </div>
                </div>
              </td>
            </tr>

            {/** Row 27.0.1: mAoi program */}
            <tr>
              <th
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100 text-left!"
              >
                mAOI Program
              </th>
              <td
                colSpan={11}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                {form.maoiProgram || ""}
              </td>
            </tr>

            {/** Row 27.0.2: sAoi program */}
            <tr>
              <th
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100 text-left!"
              >
                sAOI Program
              </th>
              <td
                colSpan={11}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                {form.saoiProgram || ""}
              </td>
            </tr>

            {/** Row 27.0.3: point sAoi */}
            <tr>
              <th
                colSpan={2}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100 text-left!"
              >
                Point sAOI
              </th>
              <td
                colSpan={11}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                {form.pointSAOI || ""}
              </td>
            </tr>

            {/** Row 27.0.4: hình ảnh AOI */}
            <tr>
              <th
                colSpan={1}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100 text-left!"
              >
                {t("aoi.imageAOI")}
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
            <tr className="pdf-section-output pdf-spacing-before">
              <th rowSpan={2} className="border px-2 py-2 text-xs bg-gray-100">
                OUTPUT
              </th>

              <th
                colSpan={8}
                className="border px-2 py-2 text-left text-xs bg-gray-100"
              >
                {t("output.magazineDistance")}
              </th>

              <td colSpan={2} className="border px-2 py-2">
                <div className="flex items-center justify-center gap-2">
                  <label className="text-xs font-bold">OK</label>
                  <span className="text-base font-bold">
                    {form.outputQ1 ? "✓" : ""}
                  </span>
                </div>
              </td>

              <td colSpan={2} className="border px-2 py-2 text-xs">
                {t("output.checker")}: {form.outputChecker || ""}
              </td>
            </tr>

            {/** Row 27.2 */}
            <tr>
              <th colSpan={8} className="border px-2 py-2 text-xs bg-gray-100">
                <div className="font-semibold mb-1">
                  {t("output.settingValue")}
                </div>
                <div className="flex justify-center gap-4">
                  <span>Model: {form.outputModelValue || ""}</span>
                  <span>Pitch: {form.outputPitchValue || ""}</span>
                </div>
              </th>

              <td colSpan={2} className="border px-2 py-2 bg-gray-300"></td>
              <td colSpan={2} className="border px-2 py-2 bg-gray-300"></td>
            </tr>

            {/** Row 28 */}
            <tr className="pdf-section-worker">
              <th
                colSpan={1}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100"
              >
                {t("worker.title")}
              </th>
              <th
                colSpan={4}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100"
              >
                {t("worker.name")}
              </th>
              <th
                colSpan={4}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100"
              >
                {t("worker.note")}
              </th>
              <th
                colSpan={1}
                rowSpan={3}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100"
              >
                {t("worker.sampleCheck")}
              </th>
              <th
                colSpan={1}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100"
              >
                {t("worker.errorName")}
              </th>
              <th
                colSpan={1}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100"
              >
                {t("worker.errorCount")}
              </th>
              <th
                colSpan={1}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100"
              >
                {t("worker.repairStatus")}
              </th>
            </tr>

            {/** Row 29 */}
            <tr>
              <th
                colSpan={1}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100"
              >
                OP
              </th>
              <td
                colSpan={4}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                {form.nameOP || ""}
              </td>
              <td
                colSpan={4}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"
              ></td>
              <td
                colSpan={1}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"
              ></td>
              <td
                colSpan={1}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"
              ></td>
              <td
                colSpan={1}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"
              ></td>
            </tr>

            {/** Row 30 */}
            <tr>
              <th
                colSpan={1}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100"
              >
                AOI
              </th>
              <td
                colSpan={4}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                {form.nameAOI || ""}
              </td>
              <td
                colSpan={4}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"
              ></td>
              <td
                colSpan={1}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"
              ></td>
              <td
                colSpan={1}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"
              ></td>
              <td
                colSpan={1}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-300"
              ></td>
            </tr>

            {/** row 31: Ghi chú vấn đề phát sinh */}
            <tr>
              <th
                colSpan={1}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100"
              >
                {t2("issueNote")}
              </th>
              <td
                colSpan={12}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                {form.note || ""}
              </td>
            </tr>
            {/** row 32: hình ảnh vấn đề phát sinh */}
            <tr>
              <th
                colSpan={1}
                className="border border-gray-600 px-2 py-2 text-xs bg-gray-100"
              >
                {t2("issueImg")}
              </th>
              <td
                colSpan={12}
                className="border border-gray-600 px-2 py-2 text-xs"
              >
                <div className="flex items-center justify-center">
                  <div className="flex items-center justify-center gap-2">
                    <ImageViewIcon
                      imageUrl={form.imgIssue}
                      title={t2("issueImg")}
                      onView={openImagePreview}
                    />
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {/* Mobile View */}
      <div className="lg:hidden space-y-4">
        {/* ==================== PRINTER SECTION ==================== */}
        <div className="w-full bg-white border border-gray-300 rounded-lg shadow-sm mb-3">
          {/* Clickable area */}
          <div
            onClick={() => openModalAt('printer')}
            className={`p-4 ${canEdit
              ? "cursor-pointer hover:bg-gray-50 active:bg-gray-100"
              : "cursor-not-allowed opacity-90"
              }`}
            role="button"
            tabIndex={canEdit ? 0 : -1}
            onKeyDown={(e) => {
              if (canEdit && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                setOpen(true);
              }
            }}
            aria-disabled={!canEdit}
          >
            <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-200">
              {t("printer.title")}
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  {t("printer.specGTAL")}
                </div>
                <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                  {form.printerSpecGTAL || "—"}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  {t("printer.realGTAL")}
                </div>
                <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                  {form.printerRealGTAL || "—"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  {t("printer.specTDQ")}
                </div>
                <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                  {form.printerSpecTDQ || "—"}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  {t("printer.realTDQ")}
                </div>
                <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                  {form.printerRealTDQ || "—"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  {t("printer.specTDKC")}
                </div>
                <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                  {form.printerSpecTDKC || "—"}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  {t("printer.realTDKC")}
                </div>
                <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                  {form.printerRealTDKC || "—"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  {t("printer.specSLL")}
                </div>
                <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                  {form.printerSpecSLL || "—"}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  {t("printer.realSLL")}
                </div>
                <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                  {form.printerRealSLL || "—"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  {t("printer.specDSL")}
                </div>
                <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                  {form.printerSpecDSL || "—"}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  {t("printer.realDSL")}
                </div>
                <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                  {form.printerRealDSL || "—"}
                </div>
              </div>
            </div>

            <div className="mb-3">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                {t("printer.vacuumBlock")}
              </div>
              <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
                {form.printerQ1 ? "✓ OK" : "—"}
              </div>
            </div>

            <div className="mb-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                Sprinter Program
              </div>
              <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                {form.printerProgram || "—"}
              </div>
            </div>
          </div>

          {/* Image section */}
          <div className="px-4 pb-4 pt-0">
            <div className="mb-3">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                {t2("printerAfterImage")}
              </div>
              <div
                className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <ImageViewIcon
                  imageUrl={form.imgPrinter}
                  title={t2("printerAfterImage")}
                  onView={openImagePreview}
                />
              </div>
            </div>

            <div className="mb-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                {t2("autoCleaningPrinter")}
              </div>
              <div
                className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <ImageViewIcon
                  imageUrl={form.imgPrinterClean}
                  title={t2("autoCleaningPrinter")}
                  onView={openImagePreview}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ==================== SPI SECTION ==================== */}
        <div className="w-full bg-white border border-gray-300 rounded-lg shadow-sm mb-3">
          <div
            onClick={() => openModalAt('spi')}
            className={`p-4 ${canEdit
              ? "cursor-pointer hover:bg-gray-50 active:bg-gray-100"
              : "cursor-not-allowed opacity-90"
              }`}
            role="button"
            tabIndex={canEdit ? 0 : -1}
            onKeyDown={(e) => {
              if (canEdit && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                setOpen(true);
              }
            }}
            aria-disabled={!canEdit}
          >
            <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">
              SPI
            </h3>

            <div className="mb-3">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                SPI Program
              </div>
              <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                {form.spiProgram || "—"}
              </div>
            </div>

            <div className="mb-3">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                REV
              </div>
              <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                {form.rev || "—"}
              </div>
            </div>

            <div className="mb-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                {t("spi.inspectionSetting")}
              </div>
              <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
                {form.spiQ1 ? "✓ OK" : "—"}
              </div>
            </div>
          </div>

          <div className="px-4 pb-4 pt-0">
            <div className="mb-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                {t("spi.imageSPI")}
              </div>
              <div
                className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <ImageViewIcon
                  imageUrl={form.imgSPI}
                  title="Hình ảnh SPI"
                  onView={openImagePreview}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ==================== MOUNT SECTION ==================== */}
        <div className="w-full bg-white border border-gray-300 rounded-lg shadow-sm mb-3">
          <div
            onClick={() => openModalAt('mount')}
            className={`p-4 ${canEdit
              ? "cursor-pointer hover:bg-gray-50 active:bg-gray-100"
              : "cursor-not-allowed opacity-90"
              }`}
            role="button"
            tabIndex={canEdit ? 0 : -1}
            onKeyDown={(e) => {
              if (canEdit && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                setOpen(true);
              }
            }}
            aria-disabled={!canEdit}
          >
            <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">
              Mount
            </h3>

            <div className="mb-3">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                Mounter Program
              </div>
              <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                {form.mounterProgram || "—"}
              </div>
            </div>

            <div className="mb-3">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                Point Mounter
              </div>
              <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                {form.pointMounter || "—"}
              </div>
            </div>

            <div className="mb-3">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                {t("mount.checkFirst3Boards")}
              </div>
              <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
                {form.mountQ1 ? "✓ OK" : "—"}
              </div>
            </div>

            <div className="mb-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                {t("mount.checkBottomBoard")}
              </div>
              <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
                {form.mountQ2 ? "✓ OK" : "—"}
              </div>
            </div>
          </div>

          <div className="px-4 pb-4 pt-0">
            <div className="mb-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                {t2("mounterAfterImage")}
              </div>
              <div
                className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <ImageViewIcon
                  imageUrl={form.imgMounter}
                  title={t2("mounterAfterImage")}
                  onView={openImagePreview}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ==================== REFLOW SECTION ==================== */}
        <div className="w-full bg-white border border-gray-300 rounded-lg shadow-sm mb-3">
          <div
            onClick={() => openModalAt('reflow')}
            className={`p-4 ${canEdit
              ? "cursor-pointer hover:bg-gray-50 active:bg-gray-100"
              : "cursor-not-allowed opacity-90"
              }`}
            role="button"
            tabIndex={canEdit ? 0 : -1}
            onKeyDown={(e) => {
              if (canEdit && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                setOpen(true);
              }
            }}
            aria-disabled={!canEdit}
          >
            <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">
              Reflow
            </h3>

            <div className="mb-3">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                {t("reflow.conveyorWidth")}
              </div>
              <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
                {form.reflowQ1 ? "✓ OK" : "—"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  {t("reflow.settingRail")}
                </div>
                <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                  {form.reFlowSettingRail || "—"}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  {t("reflow.realRail")}
                </div>
                <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                  {form.reFlowRealRail || "—"}
                </div>
              </div>
            </div>

            <div className="mb-3">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                Reflow Program
              </div>
              <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                {form.reflowProgram || "—"}
              </div>
            </div>

            <div className="mb-3">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                Reflow Speed
              </div>
              <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                {form.reflowSpeed || "—"}
              </div>
            </div>

            {/* Reflow image */}
            <div className="mb-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                {t("reflow.imgReflow")}
              </div>
              <div
                className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <ImageViewIcon
                  imageUrl={form.imgReflow}
                  title={t("reflow.imgReflow")}
                  onView={openImagePreview}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ==================== AOI SECTION ==================== */}
        <div className="w-full bg-white border border-gray-300 rounded-lg shadow-sm mb-3">
          <div
            onClick={() => openModalAt('aoi')}
            className={`p-4 ${canEdit
              ? "cursor-pointer hover:bg-gray-50 active:bg-gray-100"
              : "cursor-not-allowed opacity-90"
              }`}
            role="button"
            tabIndex={canEdit ? 0 : -1}
            onKeyDown={(e) => {
              if (canEdit && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                setOpen(true);
              }
            }}
            aria-disabled={!canEdit}
          >
            <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">
              AOI
            </h3>

            <div className="mb-3">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                {t("aoi.xray3Boards")}
              </div>
              <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
                {form.aoiQ1 ? "✓ OK" : "—"}
              </div>
            </div>

            <div className="mb-3">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                mAoi Program
              </div>
              <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                {form.maoiProgram || "—"}
              </div>
            </div>

            <div className="mb-3">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                sAoi Program
              </div>
              <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                {form.saoiProgram || "—"}
              </div>
            </div>

            <div className="mb-3">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                Point sAoi
              </div>
              <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                {form.pointSAOI || "—"}
              </div>
            </div>

            <div className="mb-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                {t("aoi.checker")}
              </div>
              <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                {form.aoiCheck || "—"}
              </div>
            </div>
          </div>

          <div className="px-4 pb-4 pt-0">
            <div className="mb-3">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                {t2("xrayImg")}
              </div>
              <div
                className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <ImageViewIcon
                    imageUrl={form.imgXray}
                    title={t2("xrayImg")}
                    onView={openImagePreview}
                  />
                </div>
              </div>
            </div>

            <div className="mb-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                {t("aoi.imageAOI")}
              </div>
              <div
                className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <ImageViewIcon
                  imageUrl={form.imgAOI}
                  title={t("aoi.imageAOI")}
                  onView={openImagePreview}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ==================== OUTPUT SECTION ==================== */}
        <div className="w-full bg-white border border-gray-300 rounded-lg shadow-sm mb-3">
          <div
            onClick={() => openModalAt('output')}
            className={`p-4 ${canEdit
              ? "cursor-pointer hover:bg-gray-50 active:bg-gray-100"
              : "cursor-not-allowed opacity-90"
              }`}
            role="button"
            tabIndex={canEdit ? 0 : -1}
            onKeyDown={(e) => {
              if (canEdit && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                setOpen(true);
              }
            }}
            aria-disabled={!canEdit}
          >
            <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">
              Output
            </h3>

            <div className="mb-3">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                {t("output.magazineDistance")}
              </div>
              <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100">
                {form.outputQ1 ? "✓ OK" : "—"}
              </div>
            </div>

            <div className="mb-3">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                {t("output.checker")}
              </div>
              <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                {form.outputChecker || "—"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-0">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  Model
                </div>
                <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                  {form.outputModelValue || "—"}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  Pitch
                </div>
                <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                  {form.outputPitchValue || "—"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== WORKER SECTION ==================== */}
        <div className="w-full bg-white border border-gray-300 rounded-lg shadow-sm mb-3">
          <div
            onClick={() => openModalAt('worker')}
            className={`p-4 ${canEdit
              ? "cursor-pointer hover:bg-gray-50 active:bg-gray-100"
              : "cursor-not-allowed opacity-90"
              }`}
            role="button"
            tabIndex={canEdit ? 0 : -1}
            onKeyDown={(e) => {
              if (canEdit && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                setOpen(true);
              }
            }}
            aria-disabled={!canEdit}
          >
            <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">
              {t("worker.title")}
            </h3>

            <div className="mb-4">
              <h4 className="text-xs font-bold text-gray-600 mb-2">OP</h4>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  {t("worker.name")}
                </div>
                <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                  {form.nameOP || "—"}
                </div>
              </div>
            </div>

            <div className="mb-0">
              <h4 className="text-xs font-bold text-gray-600 mb-2">AOI</h4>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  {t("worker.name")}
                </div>
                <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                  {form.nameAOI || "—"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== NOTES SECTION ==================== */}
        <div className="w-full bg-white border border-gray-300 rounded-lg shadow-sm mb-3">
          <div
            onClick={() => openModalAt('issue')}
            className={`p-4 ${canEdit
              ? "cursor-pointer hover:bg-gray-50 active:bg-gray-100"
              : "cursor-not-allowed opacity-90"
              }`}
            role="button"
            tabIndex={canEdit ? 0 : -1}
            onKeyDown={(e) => {
              if (canEdit && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                setOpen(true);
              }
            }}
            aria-disabled={!canEdit}
          >
            <h3 className="text-sm font-bold text-gray-700 mb-3 pb-2 border-b border-gray-300">
              {t2("issueMsg")}
            </h3>

            <div className="mb-0">
              <div className="min-w-0">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  {t2("issueNote")}
                </div>
                <div className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 truncate">
                  {form.note || "—"}
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 pb-4 pt-0">
            <div className="mb-0">
              <div className="text-xs font-semibold text-gray-600 mb-1">
                {t2("issueImg")}
              </div>
              <div
                className="w-full text-sm px-2 py-1 border border-gray-300 rounded bg-gray-100 flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <ImageViewIcon
                  imageUrl={form.imgIssue}
                  title={t2("issueImg")}
                  onView={openImagePreview}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-row justify-end w-full gap-2 mt-3 no-print">
        <ViewDetailButton
          onOpen={() => openModalAt('printer')}
          disabled={!canEdit}
          {...(!canEdit ? {} : { "data-edit-button": "true" })}
        >
          {t2("button.edit")}
        </ViewDetailButton>
      </div>

      {/* Modal */}
      <Modal
        open={open}
        title="Chi tiết Vehicle Check"
        onClose={() => setOpen(false)}
        onSave={submit}
      >
        <div className="max-h-[60vh] overflow-y-auto scrollbar-hide">
          <div className="grid gap-4 p-1">
            {/* Printer */}
            <section ref={sectionRefs.printer} className="pb-3 border-b border-gray-200 scrollbar-hide">
              <h4 className="text-sm font-semibold mb-3 text-gray-700">
                Printer
              </h4>

              <div className="grid grid-cols-1 gap-3 mb-3">
                <div className="min-w-0">
                  <label className="text-xs block mb-1">
                    Giá trị áp lực Spec (kg)
                  </label>
                  <input
                    className="block w-full border rounded px-3 py-2 text-sm min-w-0 uppercase"
                    value={form.printerSpecGTAL ?? ""}
                    onChange={(e) => set("printerSpecGTAL", e.target.value)}
                    type="text"
                  />
                </div>

                <div className="min-w-0">
                  <label className="text-xs block mb-1">
                    Tốc độ quét Spec (mm/s)
                  </label>
                  <input
                    className="block w-full border rounded px-3 py-2 text-sm min-w-0 uppercase"
                    value={form.printerSpecTDQ ?? ""}
                    onChange={(e) => set("printerSpecTDQ", e.target.value)}
                    type="text"
                  />
                </div>
              </div>

              <div className="min-w-0 mb-3">
                <label className="text-xs block mb-1">
                  Tốc độ khoảng cách tách bàn Spec (mm/s)
                </label>
                <input
                  className="block w-full border rounded px-3 py-2 text-sm min-w-0 uppercase"
                  value={form.printerSpecTDKC ?? ""}
                  onChange={(e) => set("printerSpecTDKC", e.target.value)}
                  type="text"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 mb-3">
                <div className="min-w-0">
                  <label className="text-xs block mb-1">Số lần lau Spec</label>
                  <input
                    className="block w-full border rounded px-3 py-2 text-sm min-w-0 uppercase"
                    value={form.printerSpecSLL ?? ""}
                    onChange={(e) => set("printerSpecSLL", e.target.value)}
                    type="text"
                  />
                </div>

                <div className="min-w-0">
                  <label className="text-xs block mb-1">Dao sử dụng Spec</label>
                  <input
                    className="block w-full border rounded px-3 py-2 text-sm min-w-0 uppercase"
                    value={form.printerSpecDSL ?? ""}
                    onChange={(e) => set("printerSpecDSL", e.target.value)}
                    type="text"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 mb-3">
                <div className="min-w-0">
                  <label className="text-xs block mb-1">
                    Giá trị áp lực thực tế trên máy (kg)
                  </label>
                  <input
                    className="block w-full border rounded px-3 py-2 text-sm min-w-0 uppercase"
                    value={form.printerRealGTAL ?? ""}
                    onChange={(e) => set("printerRealGTAL", e.target.value)}
                    type="text"
                  />
                </div>

                <div className="min-w-0">
                  <label className="text-xs block mb-1">
                    Tốc độ quét thực tế trên máy (mm/s)
                  </label>
                  <input
                    className="block w-full border rounded px-3 py-2 text-sm min-w-0 uppercase"
                    value={form.printerRealTDQ ?? ""}
                    onChange={(e) => set("printerRealTDQ", e.target.value)}
                    type="text"
                  />
                </div>
              </div>

              <div className="min-w-0 mb-3">
                <label className="text-xs block mb-1">
                  Tốc độ tách bàn thực tế trên máy (mm/s)
                </label>
                <input
                  className="block w-full border rounded px-3 py-2 text-sm min-w-0 uppercase"
                  value={form.printerRealTDKC ?? ""}
                  onChange={(e) => set("printerRealTDKC", e.target.value)}
                  type="text"
                />
              </div>

              <div className="min-w-0 mb-3">
                <label className="text-xs block mb-1">
                  Số lần lau thực tế trên máy
                </label>
                <input
                  className="block w-full border rounded px-3 py-2 text-sm min-w-0 uppercase"
                  value={form.printerRealSLL ?? ""}
                  onChange={(e) => set("printerRealSLL", e.target.value)}
                  type="text"
                />
              </div>

              <div className="min-w-0 mb-3">
                <label className="text-xs block mb-1">
                  Dao sử dụng thực tế trên máy
                </label>
                <input
                  className="block w-full border rounded px-3 py-2 text-sm min-w-0 uppercase"
                  value={form.printerRealDSL ?? ""}
                  onChange={(e) => set("printerRealDSL", e.target.value)}
                  type="text"
                />
              </div>

              <div className="min-w-0 mb-3">
                <label className="text-xs block mb-1">Printer Program</label>
                <input
                  className="block w-full border rounded px-3 py-2 text-sm min-w-0 uppercase"
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
                  Sau khi sử dụng Vaccum Block thì có ảnh hưởng, tác động tới
                  PCB hay linh kiện không ?
                </label>
              </div>

              <MultiImageUpload
                label="sau printer"
                images={form.imgPrinter}
                fieldName="imgPrinter"
                onUpload={handleImageUpload}
                onRemove={(index) => handleRemoveImage("imgPrinter", index)}
                onViewAll={() =>
                  openImagePreview(
                    form.imgPrinter || [],
                    "Hình ảnh sau printer",
                    0,
                  )
                }
                onViewSingle={(url, title) => openImagePreview(url, title)}
              />

              <MultiImageUpload
                label="cleaning printer"
                images={form.imgPrinterClean}
                fieldName="imgPrinterClean"
                onUpload={handleImageUpload}
                onRemove={(index) =>
                  handleRemoveImage("imgPrinterClean", index)
                }
                onViewAll={() =>
                  openImagePreview(
                    form.imgPrinterClean || [],
                    "Hình ảnh cleaning printer",
                    0,
                  )
                }
                onViewSingle={(url, title) => openImagePreview(url, title)}
              />
            </section>

            {/* SPI */}
            <section ref={sectionRefs.spi} className="grid grid-cols-1 border-b border-gray-200 pb-3">
              <h4 className="text-sm font-semibold mb-3 text-gray-700">SPI</h4>
              {/** spi program */}
              <div className="min-w-0 mb-3">
                <label className="text-xs block mb-1">SPI Program</label>
                <input
                  className="block w-full border rounded px-3 py-2 text-sm min-w-0 uppercase"
                  value={form.spiProgram ?? ""}
                  onChange={(e) => set("spiProgram", e.target.value)}
                  type="text"
                />
              </div>
              {/** REV */}
              <div className="min-w-0 mb-3">
                <label className="text-xs block mb-1">REV</label>
                <input
                  className="block w-full border rounded px-3 py-2 text-sm min-w-0 uppercase"
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
              <MultiImageUpload
                label="SPI"
                images={form.imgSPI}
                fieldName="imgSPI"
                onUpload={handleImageUpload}
                onRemove={(index) => handleRemoveImage("imgSPI", index)}
                onViewAll={() =>
                  openImagePreview(form.imgSPI || [], "Hình ảnh SPI", 0)
                }
                onViewSingle={(url, title) => openImagePreview(url, title)}
              />
            </section>

            {/* Mount */}
            <section ref={sectionRefs.mount} className="pb-3 border-b border-gray-200">
              <h4 className="text-sm font-semibold mb-3 text-gray-700">
                Mount
              </h4>

              <div className="min-w-0 mb-3">
                <label className="text-xs block mb-1">Mounter Program</label>
                <input
                  className="block w-full border rounded px-3 py-2 text-sm min-w-0 uppercase"
                  value={form.mounterProgram ?? ""}
                  onChange={(e) => set("mounterProgram", e.target.value)}
                  type="text"
                />
              </div>

              <div className="min-w-0 mb-3">
                <label className="text-xs block mb-1">Point Mounter</label>
                <input
                  className="block w-full border rounded px-3 py-2 text-sm min-w-0 uppercase"
                  value={form.pointMounter ?? ""}
                  onChange={(e) => set("pointMounter", e.target.value)}
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
                    Kiểm tra 3 board đầu tiên sau khi cắm linh kiện có OK không
                    ?
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

              <MultiImageUpload
                label="sau Mounter"
                images={form.imgMounter}
                fieldName="imgMounter"
                onUpload={handleImageUpload}
                onRemove={(index) => handleRemoveImage("imgMounter", index)}
                onViewAll={() =>
                  openImagePreview(
                    form.imgMounter || [],
                    "Hình ảnh sau Mounter",
                    0,
                  )
                }
                onViewSingle={(url, title) => openImagePreview(url, title)}
              />
            </section>

            {/* Reflow */}
            <section ref={sectionRefs.reflow} className="pb-3 border-b border-gray-200">
              <h4 className="text-sm font-semibold mb-3 text-gray-700">
                Reflow
              </h4>

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
                    <label className="text-xs block mb-1">
                      Giá trị cài đặt Rail (mm)
                    </label>
                    <input
                      className="block w-full border rounded px-3 py-2 text-sm min-w-0 uppercase"
                      value={form.reFlowSettingRail ?? ""}
                      onChange={(e) => set("reFlowSettingRail", e.target.value)}
                      type="text"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="text-xs block mb-1">
                      Giá trị thực tế Rail (mm)
                    </label>
                    <input
                      className="block w-full border rounded px-3 py-2 text-sm min-w-0 uppercase"
                      value={form.reFlowRealRail ?? ""}
                      onChange={(e) => set("reFlowRealRail", e.target.value)}
                      type="text"
                    />
                  </div>
                </div>

                <div className="min-w-0 ">
                  <label className="text-xs block mb-1">Reflow Program</label>
                  <input
                    className="block w-full border rounded px-3 py-2 text-sm min-w-0 uppercase"
                    value={form.reflowProgram ?? ""}
                    onChange={(e) => set("reflowProgram", e.target.value)}
                    type="text"
                  />
                </div>

                <div className="min-w-0">
                  <label className="text-xs block mb-1">Reflow Speed</label>
                  <input
                    className="block w-full border rounded px-3 py-2 text-sm min-w-0 uppercase"
                    value={form.reflowSpeed ?? ""}
                    onChange={(e) => set("reflowSpeed", e.target.value)}
                    type="text"
                  />
                </div>
              </div>
              <MultiImageUpload
                label="Reflow"
                images={form.imgReflow}
                fieldName="imgReflow"
                onUpload={handleImageUpload}
                onRemove={(index) => handleRemoveImage("imgReflow", index)}
                onViewAll={() =>
                  openImagePreview(form.imgReflow || [], "Hình ảnh Reflow", 0)
                }
                onViewSingle={(url, title) => openImagePreview(url, title)}
              />
            </section>

            {/* AOI */}
            <section ref={sectionRefs.aoi} className="grid grid-cols-1 border-b border-gray-200 pb-3">
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
              {/** Hình ảnh xray */}
              <MultiImageUpload
                label="Xray"
                images={form.imgXray}
                fieldName="imgXray"
                onUpload={handleImageUpload}
                onRemove={(index) => handleRemoveImage("imgXray", index)}
                onViewAll={() =>
                  openImagePreview(form.imgXray || [], "Hình ảnh Xray", 0)
                }
                onViewSingle={(url, title) => openImagePreview(url, title)}
              />
              {/** maoi program */}
              <div className="min-w-0 mb-3">
                <label className="text-xs block mb-1">Chương trình mAoi</label>
                <input
                  className="block w-full border rounded px-3 py-2 text-sm min-w-0 uppercase"
                  value={form.maoiProgram ?? ""}
                  onChange={(e) => set("maoiProgram", e.target.value)}
                  type="text"
                />
              </div>
              {/** saoi program */}
              <div className="min-w-0 mb-3">
                <label className="text-xs block mb-1">Chương trình sAoi</label>
                <input
                  className="block w-full border rounded px-3 py-2 text-sm min-w-0 uppercase"
                  value={form.saoiProgram ?? ""}
                  onChange={(e) => set("saoiProgram", e.target.value)}
                  type="text"
                />
              </div>
              {/** point saoi */}
              <div className="min-w-0 mb-3">
                <label className="text-xs block mb-1">Point sAoi</label>
                <input
                  className="block w-full border rounded px-3 py-2 text-sm min-w-0 uppercase"
                  value={form.pointSAOI ?? ""}
                  onChange={(e) => set("pointSAOI", e.target.value)}
                  type="text"
                />
              </div>
              {/** Người kiểm tra */}
              <div className="min-w-0 mb-3">
                <label className="text-xs block mb-1">Người kiểm tra</label>
                <input
                  className="block w-full border rounded px-3 py-2 text-sm min-w-0 uppercase"
                  value={form.aoiCheck ?? ""}
                  onChange={(e) => set("aoiCheck", e.target.value)}
                  type="text"
                />
              </div>
              <MultiImageUpload
                label="AOI"
                images={form.imgAOI}
                fieldName="imgAOI"
                onUpload={handleImageUpload}
                onRemove={(index) => handleRemoveImage("imgAOI", index)}
                onViewAll={() =>
                  openImagePreview(form.imgAOI || [], "Hình ảnh AOI", 0)
                }
                onViewSingle={(url, title) => openImagePreview(url, title)}
              />
            </section>
            {/* Output */}
            <section ref={sectionRefs.output} className="pb-3 border-b border-gray-200">
              <h4 className="text-sm font-semibold mb-3 text-gray-700">
                Output
              </h4>

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
                    Kiểm tra tình trạng setting, khoảng cách input magazine tại
                    uploader ?
                  </label>
                </div>

                <div className="min-w-0">
                  <label className="text-xs block mb-1">Người kiểm tra</label>
                  <input
                    className="block w-full border rounded px-3 py-2 text-sm min-w-0 uppercase"
                    value={form.outputChecker ?? ""}
                    onChange={(e) => set("outputChecker", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="min-w-0">
                    <label className="text-xs block mb-1">
                      Giá trị cài đặt theo yêu cầu Model
                    </label>
                    <input
                      className="block w-full border rounded px-3 py-2 text-sm min-w-0 uppercase"
                      value={form.outputModelValue ?? ""}
                      onChange={(e) => set("outputModelValue", e.target.value)}
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="text-xs block mb-1">
                      Giá trị cài đặt theo yêu cầu Pitch
                    </label>
                    <input
                      className="block w-full border rounded px-3 py-2 text-sm min-w-0 uppercase"
                      value={form.outputPitchValue ?? ""}
                      onChange={(e) => set("outputPitchValue", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Worker */}
            <section ref={sectionRefs.worker}>
              <h4 className="text-sm font-semibold mb-3 text-gray-700">
                Công nhân
              </h4>

              <div className="grid grid-cols-1 gap-3 mb-3">
                <div className="min-w-0">
                  <label className="text-xs block mb-1">Tên OP</label>
                  <input
                    className="block w-full border rounded px-3 py-2 text-sm min-w-0 uppercase"
                    value={form.nameOP ?? ""}
                    onChange={(e) => set("nameOP", e.target.value)}
                  />
                </div>

                <div className="min-w-0">
                  <label className="text-xs block mb-1">Tên AOI</label>
                  <input
                    className="block w-full border rounded px-3 py-2 text-sm min-w-0 uppercase"
                    value={form.nameAOI ?? ""}
                    onChange={(e) => set("nameAOI", e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Ghi chú vấn đề phát sinh */}
            <section ref={sectionRefs.issue}>
              <h4 className="text-sm font-semibold mb-3 text-gray-700">
                Vấn đề phát sinh
              </h4>

              <div className="grid grid-cols-1 gap-3 mb-3">
                <div className="min-w-0">
                  <label className="text-xs block mb-1">
                    Ghi chú vấn đề phát sinh
                  </label>
                  <input
                    className="block w-full border rounded px-3 py-2 text-sm min-w-0 uppercase"
                    value={form.note}
                    onChange={(e) => set("note", e.target.value)}
                  />
                </div>

                <MultiImageUpload
                  label="Vấn đề phát sinh"
                  images={form.imgIssue}
                  fieldName="imgIssue"
                  onUpload={handleImageUpload}
                  onRemove={(index) => handleRemoveImage("imgIssue", index)}
                  onViewAll={() =>
                    openImagePreview(
                      form.imgIssue || [],
                      "Hình ảnh Vấn đề phát sinh",
                      0,
                    )
                  }
                  onViewSingle={(url, title) => openImagePreview(url, title)}
                />
              </div>
            </section>
          </div>
        </div>
      </Modal>

      <ImagePreviewModal
        isOpen={imagePreview.isOpen}
        imageUrl={imagePreview.imageUrl}
        title={imagePreview.title}
        initialIndex={imagePreview.initialIndex}
        onClose={closeImagePreview}
      />
    </div>
  );
});

export default StandardVehicles;
