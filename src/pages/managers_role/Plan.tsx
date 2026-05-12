import { useState, useEffect, useRef } from "react";
import type { ChangeEvent } from "react";
import {
  ArrowClockwise,
  UploadSimple,
  CheckCircle,
  Spinner,
  Trash,
  FileArrowDown,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import {
  getPlanWorkByDate,
  uploadPlan,
  deletePlanWorkById,
  deletePlanWorkByDate,
  closePlanWorkByDate,
  clearError,
  resetPlanByDate,
} from "../../redux/slices/planWorkSlice";
import type { Plan } from "../../redux/slices/planWorkSlice";
import LoadingSpinner from "../../components/general/LoadingSpinner";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { savePlanDate, getPlanDate } from "../../utils/planState";
import { useTranslation } from "react-i18next";
import Modal from "../../components/general/Modal";

// helpers
const toInputDate = (d: Date) => d.toISOString().split("T")[0];
const fmtDate = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

type StatusKey = "Pending" | "In Progress" | "Done";

const STATUS_CFG: Record<
  StatusKey,
  {
    labelKey: string;
    bg: string;
    text: string;
    border: string;
    dot: string;
    rowBg: string;
  }
> = {
  Pending: {
    labelKey: "plan.notCreated",
    rowBg: "bg-amber-50/60 hover:bg-amber-100/60",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-400",
  },
  "In Progress": {
    labelKey: "plan.inProgress",
    rowBg: "bg-blue-50/60  hover:bg-blue-100/60",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  Done: {
    labelKey: "plan.done",
    rowBg: "bg-emerald-50/60 hover:bg-emerald-100/60",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
};

const getStatusCfg = (s?: string) =>
  STATUS_CFG[s as StatusKey] ?? {
    labelKey: s ?? "—",
    bg: "bg-gray-50",
    text: "text-gray-500",
    border: "border-gray-200",
    dot: "bg-gray-400",
    rowBg: "bg-white hover:bg-slate-50/40",
  };

const StatusBadge = ({ status }: { status?: string }) => {
  const { t } = useTranslation("common");
  const cfg = getStatusCfg(status);
  return (
    <span
      className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${cfg.bg} ${cfg.text} ${cfg.border}`}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
      {t(cfg.labelKey)}
    </span>
  );
};

const StatCard = ({
  label,
  value,
  colorClass,
  accentClass,
}: {
  label: string;
  value: number;
  colorClass: string;
  accentClass: string;
}) => (
  <div className={`rounded-xl border p-4 flex flex-col gap-2 ${colorClass}`}>
    <span
      className={`text-[10px] font-bold uppercase tracking-widest opacity-60 ${accentClass}`}
    >
      {label}
    </span>
    <span className={`text-3xl font-black tracking-tight ${accentClass}`}>
      {value}
    </span>
  </div>
);

const ConfirmActionModal = ({
  open,
  title,
  message,
  confirmLabel,
  confirmClass,
  loading,
  onConfirm,
  onClose,
  closeLabel,
}: {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  confirmClass: string;
  closeLabel: string;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) => (
  <Modal open={open} title={title} onClose={onClose}>
    <p className="text-sm text-slate-600 mb-4">{message}</p>
    <div className="flex gap-3">
      <button
        onClick={onConfirm}
        disabled={loading}
        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-colors ${confirmClass}`}
      >
        {loading && <Spinner size={14} className="animate-spin" />}
        {confirmLabel}
      </button>
      <button
        onClick={onClose}
        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-sm font-semibold"
      >
        {closeLabel}
      </button>
    </div>
  </Modal>
);

// ─── main ─────────────────────────────────────────────────────────────────────

const PlanPage = () => {
  const { t } = useTranslation("common");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { planByDate, loading } = useAppSelector((s) => s.planSlice);
  const { user } = useAppSelector((s) => s.auth);

  const [selectedDate, setSelectedDate] = useState(
    getPlanDate() ?? toInputDate(new Date()),
  );
  const [uploading, setUploading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingDate, setDeletingDate] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmModal, setConfirmModal] = useState<{
    type: "deleteById" | "closeDate" | "deleteByDate" | null;
    id?: number;
  }>({ type: null });

  useEffect(() => {
    dispatch(getPlanWorkByDate({ date: new Date(selectedDate) }));
    return () => {
      dispatch(clearError());
      dispatch(resetPlanByDate());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchByDate = (dateStr: string) =>
    dispatch(getPlanWorkByDate({ date: new Date(dateStr) }));

  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value;
    setSelectedDate(d);
    savePlanDate(d);
    fetchByDate(d);
  };

  const handleWorkOrderClick = (workOrder: string) => {
    const roleLower = user?.role?.toLowerCase();
    navigate(
      `/${roleLower}/smd-sheet-logs?workOrder=${encodeURIComponent(workOrder)}`,
    );
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const result = await dispatch(uploadPlan({ file }));
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (uploadPlan.fulfilled.match(result)) {
      toast.success(t("plan.importSuccess"));
      fetchByDate(selectedDate);
    } else {
      toast.error(t("plan.importFailed"));
    }
  };

  const handleDeleteById = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({ type: "deleteById", id });
  };

  const confirmDeleteById = async () => {
    const id = confirmModal.id!;
    setConfirmModal({ type: null });
    setDeletingId(id);
    const result = await dispatch(deletePlanWorkById({ id }));
    setDeletingId(null);
    if (deletePlanWorkById.fulfilled.match(result)) {
      toast.success(t("plan.deleteSuccess"));
      fetchByDate(selectedDate);
    } else {
      toast.error(t("plan.deleteFailed"));
    }
  };

  const confirmDeleteByDate = async () => {
    setConfirmModal({ type: null });
    setDeletingDate(true);
    const result = await dispatch(
      deletePlanWorkByDate({ date: new Date(selectedDate) }),
    );
    setDeletingDate(false);
    if (deletePlanWorkByDate.fulfilled.match(result)) {
      toast.success(`${t("plan.deleteAllSuccess")} ${fmtDate(selectedDate)}`);
    } else {
      toast.error(t("plan.deleteFailed"));
    }
  };
  const handleCloseDate = () => setConfirmModal({ type: "closeDate" });

  const confirmCloseDate = async () => {
    setConfirmModal({ type: null });
    setClosing(true);
    const result = await dispatch(closePlanWorkByDate({ date: selectedDate }));
    setClosing(false);
    if (closePlanWorkByDate.fulfilled.match(result)) {
      toast.success(t("plan.closeDateSuccess"));
      fetchByDate(selectedDate);
    } else {
      toast.error(t("plan.closeDateFailed"));
    }
  };

  const items: Plan[] = planByDate?.items ?? [];
  const total = planByDate?.total ?? 0;
  const created = planByDate?.created ?? 0;
  const inProgress = items.filter((p) => p.status === "In Progress").length;
  const done = items.filter((p) => p.status === "Done").length;
  const notCreated = total - inProgress - done;

  return (
    <div className="min-h-screen bg-slate-50/80">
      <div className="max-w-full mx-auto sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">
        {/* ── Header ── */}
        <div className=" mb-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {t("plan.title")}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                {t("plan.subtitle")}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 items-center w-full lg:w-auto">
              <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 h-11 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all shadow-sm w-full sm:w-auto">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer w-full"
                />
              </div>

              <button
                onClick={() => fetchByDate(selectedDate)}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-3 h-11 bg-white border border-slate-200 hover:border-slate-300! hover:bg-slate-50! rounded-xl text-sm font-semibold text-slate-600 transition-all disabled:opacity-50 shadow-sm w-full sm:w-auto"
              >
                <ArrowClockwise
                  size={16}
                  weight="bold"
                  className={loading ? "animate-spin" : ""}
                />
                <span className="hidden sm:inline">{t("plan.refresh")}</span>
              </button>

              <button
                onClick={handleCloseDate}
                disabled={loading || closing}
                className="flex items-center justify-center gap-2 px-4 h-11 bg-green-700 hover:bg-green-800! disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-green-200 w-full sm:w-auto"
              >
                {closing ? (
                  <Spinner size={16} className="animate-spin" />
                ) : (
                  <>
                    <CheckCircle size={18} weight="bold" />
                  </>
                )}
                <span className="xs:inline">{t("plan.closeDate")}</span>
              </button>

              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading || loading}
                className="flex items-center justify-center gap-2 px-4 h-11 bg-emerald-600 hover:bg-emerald-700! disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-emerald-200 w-full sm:w-auto"
              >
                {uploading ? (
                  <Spinner size={16} className="animate-spin" />
                ) : (
                  <UploadSimple size={16} weight="bold" />
                )}
                <span>{t("plan.importPlan")}</span>
              </button>

              {items.length > 0 && (
                <button
                  onClick={() => setConfirmModal({ type: "deleteByDate" })}
                  className="flex items-center justify-center gap-2 px-3 h-11 bg-white border border-red-200 hover:bg-red-50! hover:border-red-300! text-red-600 rounded-xl text-sm font-semibold transition-all w-full sm:w-auto"
                >
                  <Trash size={16} weight="bold" />
                  <span className="hidden sm:inline">
                    {t("plan.deleteThisDay")}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-3">
          <StatCard
            label={t("plan.totalPlan")}
            value={total}
            colorClass="bg-white border-slate-200 shadow-sm"
            accentClass="text-slate-700"
          />
          <StatCard
            label={t("plan.createdSheet")}
            value={created}
            colorClass="bg-white border-slate-200 shadow-sm"
            accentClass="text-slate-700"
          />
          <StatCard
            label={t("plan.notCreated")}
            value={notCreated}
            colorClass="bg-amber-50 border-amber-200 shadow-sm"
            accentClass="text-amber-700"
          />
          <StatCard
            label={t("plan.inProgress")}
            value={inProgress}
            colorClass="bg-blue-50 border-blue-200 shadow-sm"
            accentClass="text-blue-700"
          />
          <StatCard
            label={t("plan.done")}
            value={done}
            colorClass="bg-emerald-50 border-emerald-200 shadow-sm"
            accentClass="text-emerald-700"
          />
        </div>

        {/* ── Data ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Toolbar */}
          <div className="px-4 sm:px-5 py-3 border-b border-slate-100 bg-slate-50/50">
            <span className="text-sm font-semibold text-slate-700">
              {items.length > 0 ? (
                <>
                  {items.length}{" "}
                  <span className="font-normal text-slate-400">
                    {t("plan.workOrders")} —
                  </span>{" "}
                  {fmtDate(selectedDate)}
                </>
              ) : (
                <span className="font-normal text-slate-400">
                  {t("plan.noData")}
                </span>
              )}
            </span>
          </div>

          {loading ? (
            <div className="py-20">
              <LoadingSpinner size="sm" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400 p-4!">
              <FileArrowDown size={40} weight="thin" />
              <p className="text-sm font-medium">{t("plan.noDataForDay")}</p>
              <p className="text-xs">{t("plan.importExcelHint")}</p>
            </div>
          ) : (
            <>
              {/* ── Desktop Table (md+) ── */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {[
                        t("plan.stt"),
                        t("plan.workOrder"),
                        t("plan.setToWork"),
                        "Oper",
                        "S-Code",
                        t("plan.quantity"),
                        t("plan.status"),
                        t("plan.delete"),
                      ].map((h, i) => (
                        <th
                          key={h}
                          className={`px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap ${i === 5 || i === 7 ? "text-center" : "text-left"}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.map((plan, idx) => {
                      const cfg = getStatusCfg(plan.status);
                      return (
                        <tr
                          key={plan.id}
                          onClick={() => handleWorkOrderClick(plan.workOrder)}
                          className={`transition-colors ${cfg.rowBg} cursor-pointer group/row border-b border-slate-50 last:border-0`}
                        >
                          <td className="px-5 py-4 text-xs font-mono text-slate-400 w-12 whitespace-nowrap">
                            {String(idx + 1).padStart(2, "0")}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div
                              className="flex items-center gap-2"
                              title={`Xem phiếu của ${plan.workOrder}`}
                            >
                              <span className="font-bold text-slate-800 text-sm group-hover/row:text-blue-600 transition-colors">
                                {plan.workOrder}
                              </span>
                              <ArrowSquareOut
                                size={12}
                                weight="bold"
                                className="text-slate-300 group-hover/row:text-blue-500 transition-colors shrink-0"
                              />
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-600 whitespace-nowrap">
                            {fmtDate(plan.setToWork)}
                          </td>
                          <td className="px-5 py-4 text-sm font-semibold text-slate-700 whitespace-nowrap">
                            {plan.oper || "—"}
                          </td>
                          <td className="px-5 py-4 text-sm font-semibold text-slate-700 whitespace-nowrap">
                            {plan.sCode || "—"}
                          </td>
                          <td className="px-5 py-4 text-center whitespace-nowrap">
                            <span className="inline-flex items-center justify-center w-8 h-7 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200">
                              {plan.quantity}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <StatusBadge status={plan.status} />
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center">
                              <button
                                onClick={(e) => handleDeleteById(plan.id, e)}
                                disabled={deletingId === plan.id}
                                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                              >
                                {deletingId === plan.id ? (
                                  <Spinner size={12} className="animate-spin" />
                                ) : (
                                  <Trash size={12} weight="bold" />
                                )}
                                {t("plan.delete")}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile List (< md) ── */}
              <div className="md:hidden space-y-3! p-3 bg-slate-50/50">
                {items.map((plan, idx) => {
                  return (
                    <div
                      key={plan.id}
                      onClick={() => handleWorkOrderClick(plan.workOrder)}
                      className={`p-4 bg-white border border-slate-100 rounded-xl shadow-sm transition-colors active:bg-slate-50 group/row`}
                    >
                      {/* Header with ID and Status */}
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-50">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                            #{String(idx + 1).padStart(2, "0")}
                          </span>
                          <div className="flex items-center gap-1 font-bold text-slate-800">
                            {plan.workOrder}
                            <ArrowSquareOut size={14} className="text-slate-300" />
                          </div>
                        </div>
                        <StatusBadge status={plan.status} />
                      </div>

                      {/* Details - One item per row */}
                      <div className="space-y-2! mb-2!">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-medium">{t("plan.setToWork")}</span>
                          <span className="text-slate-600 font-semibold">{fmtDate(plan.setToWork)}</span>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-medium whitespace-nowrap">Oper</span>
                          <span className="text-slate-700 font-bold bg-slate-50 px-2 py-0.5 rounded">{plan.oper || "—"}</span>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-medium whitespace-nowrap">S-Code</span>
                          <span className="text-slate-700 font-bold bg-slate-50 px-2 py-0.5 rounded">{plan.sCode || "—"}</span>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-medium">{t("plan.quantity")}</span>
                          <span className="text-slate-800 font-black">{plan.quantity}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-3 border-t border-slate-50">
                        <button
                          onClick={(e) => handleDeleteById(plan.id, e)}
                          disabled={deletingId === plan.id}
                          className="w-full flex items-center justify-center gap-2 py-3 bg-red-100 hover:bg-red-50 text-red-500 hover:text-red-600 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                        >
                          {deletingId === plan.id ? (
                            <Spinner size={12} className="animate-spin" />
                          ) : (
                            <Trash size={18} weight="bold" />
                          )}
                          {t("plan.delete")}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* ── Legend ── */}
        <div className="flex items-center gap-2 flex-wrap mt-3">
          {Object.entries(STATUS_CFG).map(([key, cfg]) => (
            <div
              key={key}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold ${cfg.bg} ${cfg.text} ${cfg.border}`}
            >
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              {t(cfg.labelKey)}
            </div>
          ))}
          <span className="text-xs text-slate-400 ml-1">
            * {t("plan.clickToView")}
          </span>
        </div>
      </div>

      {/* Delete single WO */}
      <ConfirmActionModal
        open={confirmModal.type === "deleteById"}
        title={t("plan.confirmDeletePlan")}
        message={
          <>
            {t("plan.confirmDeleteWO")} <strong>#{confirmModal.id}</strong>?
          </>
        }
        confirmLabel={t("plan.delete")}
        confirmClass="bg-red-600 hover:bg-red-700"
        loading={deletingId === confirmModal.id}
        onConfirm={confirmDeleteById}
        onClose={() => setConfirmModal({ type: null })}
        closeLabel={t("plan.cancel")}
      />

      {/* Close date */}
      <ConfirmActionModal
        open={confirmModal.type === "closeDate"}
        title={t("plan.closeDate")}
        message={
          <>
            {t("plan.closeDate")} <strong>{fmtDate(selectedDate)}</strong>?
          </>
        }
        confirmLabel={t("plan.closeDate")}
        confirmClass="bg-green-700 hover:bg-green-800"
        loading={closing}
        onConfirm={confirmCloseDate}
        onClose={() => setConfirmModal({ type: null })}
        closeLabel={t("plan.cancel")}
      />

      <ConfirmActionModal
        open={confirmModal.type === "deleteByDate"}
        title={t("plan.confirmDeletePlan")}
        message={
          <>
            {t("plan.confirmDeleteAllWO")}{" "}
            <strong>{fmtDate(selectedDate)}</strong>?
          </>
        }
        confirmLabel={t("plan.deleteAll")}
        confirmClass="bg-red-600 hover:bg-red-700"
        loading={deletingDate}
        onConfirm={confirmDeleteByDate}
        onClose={() => setConfirmModal({ type: null })}
        closeLabel={t("plan.cancel")}
      />
    </div>
  );
};

export default PlanPage;
