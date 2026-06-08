export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export const calculateProgress = (saved: number, total: number) => {
  if (total === 0) return 0;
  if (saved >= total) return 100;
  return Math.round((saved / total) * 100);
};
