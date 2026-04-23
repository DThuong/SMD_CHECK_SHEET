const PLAN_DATE_KEY = 'plan_selected_date'

export const savePlanDate = (date: string) => {
  sessionStorage.setItem(PLAN_DATE_KEY, date)
}

export const getPlanDate = (): string | null => {
  return sessionStorage.getItem(PLAN_DATE_KEY)
}

export const clearPlanDate = () => {
  sessionStorage.removeItem(PLAN_DATE_KEY)
}