export interface Revenue {
  id: string;
  description: string;
  value: number;
  month: number; // Month index for this specific item (0-11)
  category?: string;
  isRecurring?: boolean; // Legacy
  recurrenceType?: 'unique' | 'fixed' | 'installments';
  groupId?: string; // Links related items
  installmentsCount?: number;
  installmentIndex?: number; // 1-based index
  active?: boolean; // For fixed to pause
}

export interface Expense {
  id: string;
  description: string;
  value: number;
  month: number; // Month index for this specific item (0-11)
  category?: string;
  isRecurring?: boolean; // Legacy
  recurrenceType?: 'unique' | 'fixed' | 'installments';
  groupId?: string;
  installmentsCount?: number;
  installmentIndex?: number; // 1-based index
  active?: boolean; // For fixed to pause
}

export interface CaixinhaDeposit {
  id: string;
  month: number;
  year: number;
  amount: number;
  date: string;
  skipped?: boolean;
}

export interface Caixinha {
  id: string;
  name: string;
  objective: string;
  targetValue: number;
  currentValue: number;
  monthlyPlanned: number;
  status: 'Ativo' | 'Pausado';
  calculationMode?: 'monthly' | 'duration';
  durationMonths?: number;
  deposits?: CaixinhaDeposit[];
}

export interface Debt {
  id: string;
  name: string;
  creditor: string;
  totalValue: number;
  installmentsCount: number;
  installmentValue: number;
  startMonth: number;
  status: 'Ativo' | 'Pausado' | 'Quitado';
  paidInstallments?: number;
  observations?: string;
}

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const MONTH_SHORT_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export const CATEGORIES_EXPENSES = [
  { value: 'Moradia', label: 'Moradia 🏠' },
  { value: 'Alimentação', label: 'Alimentação 🛒' },
  { value: 'Transporte', label: 'Transporte 🚗' },
  { value: 'Saúde', label: 'Saúde 💊' },
  { value: 'Educação', label: 'Educação 📚' },
  { value: 'Lazer', label: 'Lazer & Viagem ✈️' },
  { value: 'Investimentos', label: 'Investimentos 📈' },
  { value: 'Outros', label: 'Outros 📦' }
];

export const CATEGORIES_REVENUES = [
  { value: 'Salário', label: 'Salário Principal 💼' },
  { value: 'Freelance', label: 'Freelance 💻' },
  { value: 'Investimentos', label: 'Rendimentos 📈' },
  { value: 'Extra', label: 'Extra & Prêmios 🎁' },
  { value: 'Outros', label: 'Outros ✨' }
];
