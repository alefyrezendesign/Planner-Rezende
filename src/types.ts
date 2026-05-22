export type Priority = "Alta" | "Média" | "Baixa";
export type Status = "Não iniciado" | "Em andamento" | "Pendente" | "Concluído";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

export interface Task {
  id: string;
  title: string;
  category: string;
  priority: Priority;
  status: Status;
  estimatedCost: number;
  savedAmount: number;
  subtasks: Subtask[];
  dueDate?: string;
}

export interface CarScenario {
  id: string;
  modelName: string;
  imageUrl?: string;
  carValue: number;
  downPaymentTarget: number;
  downPaymentSaved: number;
  interestRateMonthly: number;
  installments: number;
}

export interface RealEstateScenario {
  id: string;
  propertyName: string;
  imageUrl?: string;
  propertyValue: number;
  downPaymentTarget: number;
  downPaymentSaved: number;
  subsidy: number;
  interestRateAnnual: number;
  installments: number;
  amortizationType: "SAC" | "PRICE";
}

export interface FinanceItem {
  id: string;
  type: string;
  category?: string;
  description: string;
  expectedValue: number; // Default expected per month
  monthlyRealized: Record<number, number>; // Month index (0-11) to realized value
  monthlyExpected: Record<number, number>; // Month index (0-11) to expected value
  dueDate?: string; // Day of month
  paymentMethod?: string;
}

export interface CreditCard {
  id: string;
  name: string;
  totalLimit: number;
  usedLimit: number;
  invoiceValue: number; // Simulated monthly value
  dueDay: number;
}

export interface Debt {
  id: string;
  creditor: string;
  type: string;
  remainingValue: number;
  installmentValue: number;
  installmentsCount: number;
  status: "Em aberto" | "Negociada" | "Atrasada" | "Quitada";
}

export interface ReserveGoal {
  id: string;
  name: string;
  objective: string;
  targetValue: number;
  currentValue: number;
  monthlyPlanned: number;
  status: "Ativo" | "Desativado";
}
