export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export const calculateProgress = (saved: number, total: number) => {
  if (total === 0) return 0;
  if (saved >= total) return 100;
  return Math.round((saved / total) * 100);
};

export type ItemCategory = 'revenue' | 'expense' | 'limit' | 'caixinha' | 'debt';

export interface VariationResult {
  hasChange: boolean;
  direction: 'up' | 'down' | null;
  color: string;
  diff: number;
  percent: number;
  tooltip: string;
}

export const calculateVariation = (
  current: number,
  previous: number,
  categoryType: ItemCategory
): VariationResult => {
  const diff = current - previous;
  const hasChange = diff !== 0 && !(current === 0 && previous === 0);
  let direction: 'up' | 'down' | null = null;
  let percent = 0;

  if (hasChange) {
    direction = diff > 0 ? 'up' : 'down';
    if (previous > 0) {
      percent = Math.abs((diff / previous) * 100);
    }
  }

  let color = 'text-slate-400';
  if (hasChange) {
    if (categoryType === 'revenue') {
      color = 'text-emerald-500';
    } else if (categoryType === 'expense') {
      color = 'text-rose-500';
    } else if (categoryType === 'debt') {
      color = 'text-purple-500';
    } else if (categoryType === 'limit' || categoryType === 'caixinha') {
      color = 'text-blue-500';
    }
  }

  let tooltip = '';
  if (hasChange) {
    if (previous === 0 && current > 0) {
      tooltip = `Novo valor em relação ao mês anterior`;
    } else if (current === 0 && previous > 0) {
      tooltip = `Item removido em relação ao mês anterior`;
    } else {
      const verb = diff > 0 ? 'Aumentou' : 'Reduziu';
      const sign = diff > 0 ? '+' : '-';
      const percentStr = percent > 0 ? ` (${sign}${percent.toFixed(2).replace('.', ',')}%)` : '';
      tooltip = `${verb} ${formatCurrency(Math.abs(diff))}${percentStr} em relação ao mês anterior`;
    }
  }

  return {
    hasChange,
    direction,
    color,
    diff: Math.abs(diff),
    percent,
    tooltip
  };
};
