export type PatrolItemType = 'radio' | 'input';

export interface PatrolItem {
  id: string;
  question: string;
  type: PatrolItemType;
}

export interface PatrolCategory {
  id: string;
  name: string;
  items: PatrolItem[];
}

export interface PatrolStage {
  id: string;
  name: string;
  categories: PatrolCategory[];
}

export interface PatrolImage {
  id: string;
  url: string; // Blob URL or Base64 (using blob for temp mock)
  note: string;
}

export interface PatrolLine {
  id: string;
  name: string;
}

export interface PatrolSheet {
  id: string;
  patrolType: 'daily' | 'weekly';
  lineId: string;
  lineName: string;
  createdAt: string;
  createdBy: string;
  creatorName: string;
  status: 'Pending' | 'Submitted' | 'Approved';
  results: Record<string, string>; // itemId -> value ('OK'/'NG' or text)
  images: PatrolImage[];
  pqcSign?: string;
  leaderSign?: string;
}

// Common Props interface to pass from parent to child components
export interface PatrolSharedProps {
  user: any;
  sheets: PatrolSheet[];
  saveSheets: (newSheets: PatrolSheet[]) => void;
  lines: PatrolLine[];
  saveLines: (newLines: PatrolLine[]) => void;
  dailyTemplate: PatrolStage[];
  weeklyTemplate: PatrolStage[];
  saveDailyTemplate: (newTemplate: PatrolStage[]) => void;
  saveWeeklyTemplate: (newTemplate: PatrolStage[]) => void;
  goToView: (view: 'list' | 'manage' | 'detail' | 'report', id?: string | null, type?: string) => void;
  activeTab?: 'daily' | 'weekly';
  setSearchParams?: any;
  setPreviewImage: (data: { isOpen: boolean, url: string, title: string }) => void;
  type?: 'daily' | 'weekly';
}
