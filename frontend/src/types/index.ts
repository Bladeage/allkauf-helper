export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

export type PhaseStatus = 'not_started' | 'in_progress' | 'done';
export type CostCategory =
  | 'allkauf_paket'
  | 'bemusterung_extra'
  | 'eigenleistung_material'
  | 'sonstiges';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export interface Phase {
  id: number;
  orderNumber: number;
  title: string;
  description: string | null;
  status: PhaseStatus;
  startDate: string | null;
  endDate: string | null;
  budget: number | null;
  progress: number;
  doneCount: number;
  taskCount: number;
  _count?: { tasks: number; notes: number; lumpSums: number };
}

export interface Milestone {
  id: number;
  title: string;
  description: string | null;
  actualDate: string | null;
  createdAt?: string;
  _count?: { taskLinks: number };
}

export interface MilestoneLink {
  id: number;
  taskId: number;
  milestoneId: number;
  daysBefore: number;
  milestone?: Milestone;
}

export interface Task {
  id: number;
  phaseId: number;
  title: string;
  description: string | null;
  isDone: boolean;
  isCustom: boolean;
  costCategory: CostCategory | null;
  costAmount: number | null;
  costStatus: CostStatus;
  plannedAmount: number | null;
  estimatedHours: number | null;
  dueDate: string | null;
  vendor: string | null;
  isPaid: boolean;
  paidDate: string | null;
  priority: Priority;
  attachmentUrl: string | null;
  sortOrder: number;
  effectiveDueDate: string | null;
  milestoneLinks?: MilestoneLink[];
  _count?: { notes: number };
  createdAt?: string;
  updatedAt?: string;
}

export interface LumpSum {
  id: number;
  phaseId: number;
  label: string;
  amount: number;
}

export interface Note {
  id: number;
  phaseId: number | null;
  taskId: number | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface PhaseDetail extends Phase {
  tasks: Task[];
  lumpSums: LumpSum[];
  notes: Note[];
}

export interface Reminder {
  id: number;
  title: string;
  phaseId: number;
  phaseTitle: string | null;
  priority: Priority;
  effectiveDueDate: string;
  dueDate: string | null;
  hasMilestone: boolean;
  milestoneTitle: string | null;
  daysBefore: number | null;
  overdue: boolean;
  dueThisWeek: boolean;
}

export interface PhaseCost {
  phaseId: number;
  orderNumber: number;
  title: string;
  byCategory: Record<CostCategory, number>;
  taskCost: number;
  lumpSum: number;
  total: number;
  planned: number;
  paid: number;
  estimatedHours: number;
  phaseBudget: number | null;
}

export interface CostSummary {
  byPhase: PhaseCost[];
  totals: {
    byCategory: Record<CostCategory, number>;
    taskCostTotal: number;
    lumpSumTotal: number;
    grandTotal: number;
    plannedTotal: number;
    paidTotal: number;
    estimatedHoursTotal: number;
    eigenleistungValue: number | null;
  };
  hourlyRate: number | null;
  totalBudget: number | null;
  livingAreaSqm: number | null;
  warnings?: BudgetWarning[];
  forecast?: Forecast;
}

export interface BudgetWarning {
  level: 'warn' | 'danger';
  scope: 'total' | 'phase' | 'forecast';
  phaseId?: number;
  over: number;
  message: string;
}

export interface Forecast {
  expected: number;
  fixed: number;
  committed: number;
  open: number;
  fixedPct: number;
  committedPct: number;
  openPct: number;
  band: number;
  contingencyPercent: number;
  contingencyAmount: number;
  optimistic: number;
  pessimistic: number;
  withContingency: number;
}

export type CostStatus = 'geschaetzt' | 'bemustert' | 'beauftragt' | 'abgerechnet';

export interface CostSnapshot {
  id: number;
  label: string;
  note: string | null;
  phaseOrder: number | null;
  auto: boolean;
  expected: number;
  fixed: number;
  committed: number;
  openAmount: number;
  contingencyPercent: number | null;
  contingencyAmount: number | null;
  optimistic: number;
  pessimistic: number;
  withContingency: number;
  createdAt: string;
}

export interface HouseArea {
  id: number;
  name: string;
  description: string | null;
  planningNotes: string | null;
  icon: string | null;
  sortOrder: number;
}

export interface ProjectSettings {
  id: number;
  projectName: string;
  livingAreaSqm: number | null;
  totalBudget: number | null;
  projectStart: string | null;
  projectEnd: string | null;
  handoverDate: string | null;
  hourlyRateEigenleistung: number | null;
  contingencyPercent: number | null;
}

export interface AppConfig {
  appName: string;
  enableHouseModule: boolean;
}

// ---------- Block 4 ----------
export interface Attachment {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  taskId: number | null;
  phaseId: number | null;
  defectId: number | null;
  diaryEntryId: number | null;
  uploadedAt: string;
}

export type DefectStatus = 'open' | 'in_progress' | 'fixed' | 'rejected';
export type DefectSeverity = 'minor' | 'normal' | 'major' | 'critical';

export interface Defect {
  id: number;
  title: string;
  description: string | null;
  location: string | null;
  phaseId: number | null;
  status: DefectStatus;
  severity: DefectSeverity;
  dueDate: string | null;
  reportedDate: string | null;
  fixedDate: string | null;
  attachments?: Attachment[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DiaryEntry {
  id: number;
  entryDate: string;
  weather: string | null;
  trade: string | null;
  title: string | null;
  content: string;
  attachments?: Attachment[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentInstallment {
  id: number;
  sortOrder: number;
  label: string;
  percent: number | null;
  plannedAmount: number | null;
  dueCondition: string | null;
  dueDate: string | null;
  isPaid: boolean;
  paidDate: string | null;
  paidAmount: number | null;
  note: string | null;
}

export interface PaymentData {
  installments: PaymentInstallment[];
  summary: { plannedTotal: number; paidTotal: number; openTotal: number; paidCount: number; total: number };
}

export interface Contact {
  id: number;
  name: string;
  company: string | null;
  role: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  note: string | null;
  sortOrder: number;
}
