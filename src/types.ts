export type Role = 'Admin' | 'User';

export interface User {
  userId: string;
  name: string;
  role: Role;
  createdAt?: string;
}

export type VikaarName =
  | 'काम'
  | 'क्रोध'
  | 'लोभ'
  | 'मोह'
  | 'माया'
  | 'अहंकार'
  | 'ईर्ष्या'
  | 'डर'
  | 'घृणा'
  | 'आलस्य';

export const VIKAAR_LIST: VikaarName[] = [
  'काम',
  'क्रोध',
  'लोभ',
  'मोह',
  'माया',
  'अहंकार',
  'ईर्ष्या',
  'डर',
  'घृणा',
  'आलस्य',
];

export interface VikaarEntry {
  recordId: string;
  userId: string;
  vikaarName: VikaarName;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO string or HH:mm:ss
}

export interface GoodDeedEntry {
  recordId: string;
  userId: string;
  text: string;
  date: string; // YYYY-MM-DD
  timestamp: string;
}

export interface DailyVikaarSummary {
  date: string;
  counts: Record<VikaarName, number>;
  total: number;
}

export interface UserStats {
  userId: string;
  userName?: string;
  todayCounts: Record<VikaarName, number>;
  overallCounts: Record<VikaarName, number>;
  todayTotal: number;
  overallTotal: number;
  goodDeedsCount: number;
}

export interface DbStatus {
  connected: boolean;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  lastSyncedAt: string | null;
  userCount: number;
  vikaarEntryCount: number;
  goodDeedCount: number;
  storageType: 'Google Sheets' | 'Local Vault (Syncing to Sheets)';
}
