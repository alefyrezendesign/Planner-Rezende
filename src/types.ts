export type Priority = 'Alta' | 'Média' | 'Baixa';
export type Status = 'Não iniciado' | 'Em andamento' | 'Pendente' | 'Concluído';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
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
}

export interface CarScenario {
  id: string;
  modelName: string;
  carValue: number;
  downPaymentTarget: number;
  downPaymentSaved: number;
  interestRateMonthly: number;
  installments: number;
}

export interface RealEstateScenario {
  id: string;
  propertyName: string;
  propertyValue: number;
  downPaymentTarget: number;
  downPaymentSaved: number;
  subsidy: number;
  interestRateAnnual: number;
  installments: number;
  amortizationType: 'SAC' | 'PRICE';
}
