import { useState, useEffect, useRef } from 'react'
import type { ChangeEvent } from 'react'
import {
  ArrowClockwise,
  UploadSimple,
  CheckCircle,
  Spinner,
  Trash,
  FileArrowDown,
  ArrowSquareOut,
} from '@phosphor-icons/react'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import {
  getPlanWorkByDate,
  uploadPlan,
  deletePlanWorkById,
  deletePlanWorkByDate,
  closePlanWorkByDate,
  clearError,
  resetPlanByDate,
} from '../../redux/slices/planWorkSlice'
import type { Plan } from '../../redux/slices/planWorkSlice'
import LoadingSpinner from '../../components/general/LoadingSpinner'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { savePlanDate, getPlanDate } from '../../utils/planState'
import { useTranslation } from 'react-i18next'

// helpers
const toInputDate = (d: Date) => d.toISOString().split('T')[0]
const fmtDate = (iso?: string) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

type StatusKey = 'Pending' | 'In Progress' | 'Done'

const STATUS_CFG: Record<StatusKey, { labelKey: string; bg: string; text: string; border: string; dot: string; rowBg: string }> = {
  Pending:    { labelKey: 'plan.notCreated',   bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-400',   rowBg: 'hover:bg-amber-50/40'   },
  "In Progress": { labelKey: 'plan.inProgress',   bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500',    rowBg: 'hover:bg-blue-50/40'    },
  Done:       { labelKey: 'plan.done', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', rowBg: 'hover:bg-emerald-50/40' },
}

const getStatusCfg = (s?: string) =>
  STATUS_CFG[s as StatusKey] ?? { labelKey: s ?? '—', bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200', dot: 'bg-gray-400', rowBg: 'hover:bg-gray-50/40' }

const StatusBadge = ({ status }: { status?: string }) => {
  const { t } = useTranslation('common')
  const cfg = getStatusCfg(status)
  return (
    <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
      {t(cfg.labelKey)}
    </span>
  )
}

const StatCard = ({ label, value, colorClass, accentClass }: {
  label: string; value: number; colorClass: string; accentClass: string
}) => (
  <div className={`rounded-xl border p-4 flex flex-col gap-2 ${colorClass}`}>
    <span className={`text-[10px] font-bold uppercase tracking-widest opacity-60 ${accentClass}`}>{label}</span>
    <span className={`text-3xl font-black tracking-tight ${accentClass}`}>{value}</span>
  </div>
)

const ConfirmDeleteModal = ({ date, loading, onConfirm, onCancel }: {
  date: string; loading: boolean; onConfirm: () => void; onCancel: () => void
}) => {
  const { t } = useTranslation('common')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white shadow-2xl w-full max-w-sm overflow-hidden p-4">
        <div className="pt-4 pb-2 border-b border-red-100">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">{t('plan.confirmDeletePlan')}</h3>
              <p className="text-xs text-red-600 mt-0.5">{t('plan.cannotUndo')}</p>
            </div>
          </div>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-slate-600">
            {t('plan.confirmDeleteAllWO')} <strong className="text-slate-800">{fmtDate(date)}</strong>?
          </p>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-semibold transition-colors">
            {loading ? <Spinner size={14} className="animate-spin" /> : <Trash size={14} weight="bold" />}
            {t('plan.deleteAll')}
          </button>
          <button onClick={onCancel}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-sm font-semibold transition-colors">
            {t('plan.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── main ─────────────────────────────────────────────────────────────────────

const PlanPage = () => {
  const { t } = useTranslation('common')
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { planByDate, loading } = useAppSelector((s) => s.planSlice)
  const { user } = useAppSelector((s) => s.auth)

  const [selectedDate, setSelectedDate] = useState(getPlanDate() ?? toInputDate(new Date()))
  const [uploading, setUploading] = useState(false)
  const [closing, setClosing] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingDate, setDeletingDate] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    dispatch(getPlanWorkByDate({ date: new Date(selectedDate) }))
    return () => { dispatch(clearError()); dispatch(resetPlanByDate()) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchByDate = (dateStr: string) =>
    dispatch(getPlanWorkByDate({ date: new Date(dateStr) }))

  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value
    setSelectedDate(d)
    savePlanDate(d)
    fetchByDate(d)
  }

  const handleWorkOrderClick = (workOrder: string) => {
    const roleLower = user?.role?.toLowerCase()
    navigate(`/${roleLower}/smd-sheet-logs?workOrder=${encodeURIComponent(workOrder)}`)
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const result = await dispatch(uploadPlan({ file }))
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
    if (uploadPlan.fulfilled.match(result)) {
      toast.success(t('plan.importSuccess'))
      fetchByDate(selectedDate)
    } else {
      toast.error(t('plan.importFailed'))
    }
  }

  const handleDeleteById = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!window.confirm(`${t('plan.confirmDeleteWO')} #${id}?`)) return
    setDeletingId(id)
    const result = await dispatch(deletePlanWorkById({ id }))
    setDeletingId(null)
    if (deletePlanWorkById.fulfilled.match(result)) {
      toast.success(t('plan.deleteSuccess'))
      fetchByDate(selectedDate)
    } else {
      toast.error(t('plan.deleteFailed'))
    }
  }

  const handleDeleteByDate = async () => {
    setDeletingDate(true)
    const result = await dispatch(deletePlanWorkByDate({ date: new Date(selectedDate) }))
    setDeletingDate(false)
    setShowDeleteModal(false)
    if (deletePlanWorkByDate.fulfilled.match(result)) {
      toast.success(`${t('plan.deleteAllSuccess')} ${fmtDate(selectedDate)}`)
    } else {
      toast.error(t('plan.deleteFailed'))
    }
  }

  const handleCloseDate = async () => {
    if (!window.confirm(`${t('plan.closeDate')} ${fmtDate(selectedDate)}?`)) return
    setClosing(true)
    const result = await dispatch(closePlanWorkByDate({ date: selectedDate }))
    setClosing(false)
    if (closePlanWorkByDate.fulfilled.match(result)) {
      toast.success(t('plan.closeDateSuccess'))
      fetchByDate(selectedDate)
    } else {
      toast.error(t('plan.closeDateFailed'))
    }
  }

  const items: Plan[] = planByDate?.items ?? []
  const total      = planByDate?.total   ?? 0
  const created    = planByDate?.created ?? 0
  const notCreated = total - created
  const inProgress = items.filter((p) => p.status === 'In Progress').length
  const done       = items.filter((p) => p.status === 'Done').length

  return (
    <div className="min-h-screen bg-slate-50/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">

        {/* ── Header ── */}
        <div className=" mb-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{t('plan.title')}</h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{t('plan.subtitle')}</p>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 h-[44px] focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400 transition-all shadow-sm">
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
                className="flex items-center gap-2 px-3 h-[44px] bg-white border border-slate-200 hover:border-slate-300! hover:bg-slate-50! rounded-xl text-sm font-semibold text-slate-600 transition-all disabled:opacity-50 shadow-sm"
              >
                <ArrowClockwise size={16} weight="bold" className={loading ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">{t('plan.refresh')}</span>
              </button>

              <button
                onClick={handleCloseDate}
                disabled={loading || closing}
                className="flex items-center gap-2 px-4 h-[44px] bg-blue-600 hover:bg-blue-700! disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-blue-200"
              >
                {closing ? <Spinner size={16} className="animate-spin" /> : <CheckCircle size={18} weight="bold" />}
                <span className="hidden xs:inline">{t('plan.closeDate')}</span>
              </button>

              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading || loading}
                className="flex items-center gap-2 px-4 h-[44px] bg-emerald-600 hover:bg-emerald-700! disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-emerald-200"
              >
                {uploading ? <Spinner size={16} className="animate-spin" /> : <UploadSimple size={16} weight="bold" />}
                <span>{t('plan.importPlan')}</span>
              </button>

              {items.length > 0 && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-2 px-3 h-[44px] bg-white border border-red-200 hover:bg-red-50! hover:border-red-300! text-red-600 rounded-xl text-sm font-semibold transition-all"
                >
                  <Trash size={16} weight="bold" />
                  <span className="hidden sm:inline">{t('plan.deleteThisDay')}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-3">
          <StatCard label={t('plan.totalPlan')} value={total}       colorClass="bg-white border-slate-200 shadow-sm"        accentClass="text-slate-700"   />
          <StatCard label={t('plan.createdSheet')}  value={created}     colorClass="bg-white border-slate-200 shadow-sm"        accentClass="text-slate-700"   />
          <StatCard label={t('plan.notCreated')}      value={notCreated}  colorClass="bg-amber-50 border-amber-200 shadow-sm"     accentClass="text-amber-700"   />
          <StatCard label={t('plan.inProgress')}      value={inProgress}  colorClass="bg-blue-50 border-blue-200 shadow-sm"       accentClass="text-blue-700"    />
          <StatCard label={t('plan.done')}    value={done}        colorClass="bg-emerald-50 border-emerald-200 shadow-sm" accentClass="text-emerald-700" />
        </div>

        {/* ── Data ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Toolbar */}
          <div className="px-4 sm:px-5 py-3 border-b border-slate-100 bg-slate-50/50">
            <span className="text-sm font-semibold text-slate-700">
              {items.length > 0
                ? <>{items.length} <span className="font-normal text-slate-400">{t('plan.workOrders')} —</span> {fmtDate(selectedDate)}</>
                : <span className="font-normal text-slate-400">{t('plan.noData')}</span>
              }
            </span>
          </div>

          {loading ? (
            <div className="py-20"><LoadingSpinner size="sm" /></div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
              <FileArrowDown size={40} weight="thin" />
              <p className="text-sm font-medium">{t('plan.noDataForDay')}</p>
              <p className="text-xs">{t('plan.importExcelHint')}</p>
            </div>
          ) : (
            <>
              {/* ── Desktop Table (md+) ── */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {[t('plan.stt'), t('plan.workOrder'), t('plan.setToWork'), t('plan.quantity'), t('plan.status'), t('plan.delete')].map((h, i) => (
                        <th key={h}
                          className={`px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest ${i === 3 || i === 5 ? 'text-center' : 'text-left'}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.map((plan, idx) => {
                      const cfg = getStatusCfg(plan.status)
                      return (
                        <tr key={plan.id} className={`transition-colors ${cfg.rowBg}`}>
                          <td className="px-5 py-3 text-xs font-mono text-slate-400 w-12">
                            {String(idx + 1).padStart(2, '0')}
                          </td>
                          <td className="px-5 py-3">
                            <button onClick={() => handleWorkOrderClick(plan.workOrder)}
                              className="flex items-center gap-2 group/wo" title={`Xem phiếu của ${plan.workOrder}`}>
                              <span className="font-bold text-slate-800 text-sm group-hover/wo:text-blue-600 transition-colors">
                                {plan.workOrder}
                              </span>
                              <ArrowSquareOut size={12} weight="bold"
                                className="text-slate-300 group-hover/wo:text-blue-500 transition-colors shrink-0" />
                            </button>
                          </td>
                          <td className="px-5 py-3 text-sm text-slate-600 whitespace-nowrap">{fmtDate(plan.setToWork)}</td>
                          <td className="px-5 py-3 text-center">
                            <span className="inline-flex items-center justify-center w-8 h-7 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200">
                              {plan.quantity}
                            </span>
                          </td>
                          <td className="px-5 py-3"><StatusBadge status={plan.status} /></td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-center">
                              <button onClick={(e) => handleDeleteById(plan.id, e)}
                                disabled={deletingId === plan.id}
                                className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 whitespace-nowrap">
                                {deletingId === plan.id
                                  ? <Spinner size={12} className="animate-spin" />
                                  : <Trash size={12} weight="bold" />}
                                {t('plan.delete')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Mobile List (< md) ── */}
              <div className="md:hidden divide-y divide-slate-100">
                {items.map((plan, idx) => {
                  const cfg = getStatusCfg(plan.status)
                  return (
                    <div key={plan.id} className={`px-4 py-3.5 transition-colors ${cfg.rowBg}`}>

                      {/* Line 1: index + workOrder + badge */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-[10px] font-mono text-slate-400 shrink-0 w-5">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <button
                            onClick={() => handleWorkOrderClick(plan.workOrder)}
                            className="flex items-center gap-1 group/wo min-w-0"
                          >
                            <span className="font-bold text-slate-800 text-sm group-hover/wo:text-blue-600 transition-colors truncate">
                              {plan.workOrder}
                            </span>
                            <ArrowSquareOut size={11} weight="bold"
                              className="text-slate-300 group-hover/wo:text-blue-500 shrink-0 transition-colors" />
                          </button>
                        </div>
                        <StatusBadge status={plan.status} />
                      </div>

                      {/* Line 2: meta info */}
                      <div className="flex items-center gap-3 mb-3 pl-7 text-xs text-slate-500">
                        <span>
                          <span className="font-medium text-slate-400">{t('plan.setToWork')}: </span>
                          <span className="font-semibold text-slate-600">{fmtDate(plan.setToWork)}</span>
                        </span>
                        <span className="text-slate-300">·</span>
                        <span>
                          <span className="font-medium text-slate-400">{t('plan.quantity')}: </span>
                          <span className="font-bold text-slate-700">{plan.quantity}</span>
                        </span>
                      </div>

                      {/* Line 3: actions */}
                      <div className="flex gap-2 pl-7">
                        <button
                          onClick={(e) => handleDeleteById(plan.id, e)}
                          disabled={deletingId === plan.id}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                        >
                          {deletingId === plan.id
                            ? <Spinner size={11} className="animate-spin" />
                            : <Trash size={11} weight="bold" />}
                          {t('plan.delete')}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* ── Legend ── */}
        <div className="flex items-center gap-2 flex-wrap mt-3">
          {Object.entries(STATUS_CFG).map(([key, cfg]) => (
            <div key={key} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              {t(cfg.labelKey)}
            </div>
          ))}
          <span className="text-xs text-slate-400 ml-1">* {t('plan.clickToView')}</span>
        </div>

      </div>

      {showDeleteModal && (
        <ConfirmDeleteModal
          date={selectedDate}
          loading={deletingDate}
          onConfirm={handleDeleteByDate}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  )
}

export default PlanPage