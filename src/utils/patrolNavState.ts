/* eslint-disable no-empty */
// utils/patrolNavState.ts
import type { PatrolFilter } from "../components/general/PatrolFilterBar";

const KEY = "patrol_nav_state";
const PATROL_DASHBOARD_KEY = "patrol_dashboard_state";

export type PatrolReturnSource = "dashboard" | "list" | "weekly" | "report";

export interface PatrolNavState {
  type: "daily" | "weekly";
  page: number;
  highlightId: number | null;
  filter?: PatrolFilter;
  dashboardShift?: "morning" | "night";

  source?: PatrolReturnSource;
  savedAt?: number;

  fromDashboard?: boolean;
  dashboardDate?: string;
  dashboardReturnPath?: string;
}

export interface PatrolDashboardState {
  date: string;       // yyyy-MM-dd
  shift?: "morning" | "night";
  page: number;       // detailPage
  highlightId: number;
  type?: "patrol" | "eng";
}

export const savePatrolNavState = (state: PatrolNavState) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
};

export const savePatrolNavStateWithTimestamp = (
  state: Omit<PatrolNavState, "savedAt">,
) => {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        ...state,
        savedAt: Date.now(),
      }),
    );
  } catch {}
};

export const readPatrolNavState = (): PatrolNavState | null => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearPatrolNavState = () => {
  try {
    localStorage.removeItem(KEY);
  } catch {}
};

// ── Patrol Dashboard State (sessionStorage) ──────────────────────────────────
export const savePatrolDashboardState = (state: PatrolDashboardState) => {
  try {
    sessionStorage.setItem(PATROL_DASHBOARD_KEY, JSON.stringify(state));
  } catch {}
};

export const readPatrolDashboardState = (): PatrolDashboardState | null => {
  try {
    const raw = sessionStorage.getItem(PATROL_DASHBOARD_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearPatrolDashboardState = () => {
  try {
    sessionStorage.removeItem(PATROL_DASHBOARD_KEY);
  } catch {}
};