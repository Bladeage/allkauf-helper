export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
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
}

export interface AppConfig {
  appName: string;
  enableHouseModule: boolean;
}
