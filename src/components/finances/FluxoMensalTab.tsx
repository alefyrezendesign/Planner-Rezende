import React, { useState } from 'react';
import { AnimatedNumber } from '../AnimatedNumber';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PiggyBank, Search, Plus, Trash2, X, ArrowUpRight, ArrowDownRight, WalletCards, Edit2
} from 'lucide-react';
import { Revenue, Expense, Debt, Caixinha, MONTH_NAMES, CATEGORIES_EXPENSES, CATEGORIES_REVENUES } from './types';
import { formatCurrency } from '../../utils';
import { EditScope, TransactionType } from './TransactionModal';

interface FluxoMensalTabProps {
  selectedMonth: number;
  selectedYear: number;
  revenues: Revenue[];
  expenses: Expense[];
  debts: Debt[];
  caixinhas: Caixinha[];
  onOpenNewTransaction: (type: TransactionType) => void;
  onOpenEditTransaction: (item: Revenue | Expense, type: 'revenue' | 'expense') => void;
  onDeleteTransaction: (id: string, type: 'revenue' | 'expense', scope: EditScope) => void;
  onToggleSkipCaixinha: (caixinhaId: string, month: number, year: number) => void;
}

export const FluxoMensalTab = ({
  selectedMonth,
  selectedYear,
  revenues,
  expenses,
  debts,
  caixinhas,
  onOpenNewTransaction,
  onOpenEditTransaction,
  onDeleteTransaction,
  onToggleSkipCaixinha,
}: FluxoMensalTabProps) => {
  // Filters and search logic
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  
  // Delete Modal State
  const [deleteCandidate, setDeleteCandidate] = useState<{item: Revenue | Expense, type: 'revenue' | 'expense'} | null>(null);
  const [deleteScope, setDeleteScope] = useState<EditScope>('single');

  // Month-specific stats
  const monthRevenues = revenues.filter(r => r.month === selectedMonth && (r.year === undefined || r.year === selectedYear));
  const monthExpenses = expenses.filter(e => e.month === selectedMonth && (e.year === undefined || e.year === selectedYear));

  const totalRevenues = monthRevenues.reduce((acc, r) => acc + (r.active !== false ? r.value : 0), 0);
  const totalExpenses = monthExpenses.reduce((acc, e) => acc + (e.active !== false ? e.value : 0), 0);

  const totalCaixinhas = caixinhas
    .filter(c => {
      if (c.status !== 'Ativo') return false;
      const startY = c.startYear !== undefined ? c.startYear : new Date().getFullYear();
      const startM = c.startMonth !== undefined ? c.startMonth : new Date().getMonth();
      const startTotalMonths = startY * 12 + startM;
      const currentTotalMonths = selectedYear * 12 + selectedMonth;
      if (currentTotalMonths < startTotalMonths) return false;

      if (c.targetValue && c.monthlyPlanned > 0) {
          const monthsPassed = currentTotalMonths - startTotalMonths;
          const projectedValue = c.currentValue + (monthsPassed * c.monthlyPlanned);
          if (projectedValue - c.monthlyPlanned >= c.targetValue) {
             return false;
          }
      }

      return !c.deposits?.some(d => d.month === selectedMonth && d.year === selectedYear && d.skipped);
    })
    .reduce((acc, c) => acc + (c.monthlyPlanned || 0), 0);

  const monthInstallments = debts.filter(d => {
    if (d.status !== 'Ativo') return false;
    const startM = Number(d.startMonth);
    const startY = d.startYear !== undefined ? d.startYear : new Date().getFullYear();
    const startTotalMonths = startY * 12 + startM;
    const currentTotalMonths = selectedYear * 12 + selectedMonth;
    return currentTotalMonths >= startTotalMonths && currentTotalMonths < startTotalMonths + Number(d.installmentsCount);
  });
  
  const totalInstallments = monthInstallments.reduce((acc, d) => acc + (d.installmentValue || 0), 0);

  const totalOutflows = totalExpenses + totalCaixinhas + totalInstallments;
  const saldoLivre = totalRevenues - totalOutflows;

  // Search execution
  const filteredRevenues = monthRevenues.filter(r => 
    (selectedCategory === 'Todas' || r.category === selectedCategory) &&
    r.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredExpenses = monthExpenses.filter(e => 
    (selectedCategory === 'Todas' || e.category === selectedCategory) &&
    e.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const cleanEmojis = (text: string) => {
    return text.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
  };

  const handleConfirmDelete = () => {
    if (deleteCandidate) {
      onDeleteTransaction(deleteCandidate.item.id, deleteCandidate.type, deleteScope);
      setDeleteCandidate(null);
    }
  };

  const openDeleteModal = (item: Revenue | Expense, type: 'revenue' | 'expense') => {
    if (item.recurrenceType && item.recurrenceType !== 'unique' && item.groupId) {
      setDeleteCandidate({ item, type });
      setDeleteScope('single');
    } else {
      // Direct delete if non-recurrent
      onDeleteTransaction(item.id, type, 'single');
    }
  };

  // Compact calculations for percentage progress
  const spentPercentage = totalRevenues > 0 ? Math.round((totalOutflows / totalRevenues) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Visual Balance Card: Clean Light Mode */}
      <div className="p-5 rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <span className="text-[10px] bg-gray-100 font-black uppercase px-2.5 py-1 rounded-full text-gray-500 tracking-widest inline-flex items-center gap-1">
              RESUMO DE {MONTH_NAMES[selectedMonth].toUpperCase()}
            </span>
            <div className="mt-4">
              <p className="text-xs text-gray-500 font-bold mb-0.5">Saldo livre projetado</p>
              <h3 className={`text-4xl font-black tracking-tight leading-none ${saldoLivre >= 0 ? 'text-gray-900' : 'text-rose-600'}`}>
                {formatCurrency(saldoLivre)}
              </h3>
            </div>
          </div>

          {/* Quick Mobile Meter */}
          <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-2 bg-gray-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border border-gray-100 sm:border-transparent self-stretch sm:self-auto justify-between">
            <div className="text-left sm:text-right">
              <span className="block text-[10px] font-bold text-gray-400 uppercase">Comprometido</span>
              <span className="font-black text-base text-gray-800">{spentPercentage}% do caixa</span>
            </div>
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden shrink-0 mt-1">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, spentPercentage)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  spentPercentage < 50 ? 'bg-emerald-500' :
                  spentPercentage < 75 ? 'bg-blue-500' :
                  spentPercentage < 90 ? 'bg-amber-400' :
                  'bg-rose-500'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Dynamic breakdown mini timeline */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-6 pt-5 border-t border-gray-100/80 text-xs">
          <div className="bg-gray-50/50 p-2.5 rounded-2xl border border-gray-100/50">
            <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Receita</span>
            <span className="font-black text-[13px] text-emerald-600">{formatCurrency(totalRevenues)}</span>
          </div>
          <div className="bg-gray-50/50 p-2.5 rounded-2xl border border-gray-100/50">
            <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Despesas</span>
            <span className="font-black text-[13px] text-rose-600">{formatCurrency(totalExpenses)}</span>
          </div>
          <div className="bg-gray-50/50 p-2.5 rounded-2xl border border-gray-100/50">
            <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Caixinhas</span>
            <span className="font-black text-[13px] text-blue-600">{formatCurrency(totalCaixinhas)}</span>
          </div>
          <div className="bg-gray-50/50 p-2.5 rounded-2xl border border-gray-100/50">
            <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Parcelamentos</span>
            <span className="font-black text-[13px] text-indigo-600">{formatCurrency(totalInstallments)}</span>
          </div>
        </div>
      </div>

      {/* Advanced Filter, Search bar and Focus controller - 100% customized for Mobile */}
      <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-2xl space-y-2.5">
        <p className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <Search size={13} className="text-slate-500" /> Buscar e Filtrar Itens
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Active Search text field */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text"
              placeholder="Pesquisar por nome..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-9 pr-8 py-2 text-xs font-medium text-gray-800 transition-all placeholder:text-gray-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Quick categories select REMOVIDO */}
        </div>
      </div>

      {/* Grid of Entradas & Despesas with inline nested, completely safe forms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* ========================================================= */}
        {/* ENTRADAS / RECEITAS SEGMENT */}
        {/* ========================================================= */}
        <div className="border border-gray-200 rounded-2xl bg-white shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="bg-gray-50/50 border-b border-gray-100 px-4 py-3.5 flex justify-between items-center select-none">
              <div className="flex items-center gap-2">
                <ArrowUpRight size={16} className="text-emerald-500 shrink-0" strokeWidth={3} />
                <span className="font-black text-[11px] text-gray-800 uppercase tracking-widest">RECEITA</span>
              </div>
              <button
                onClick={() => onOpenNewTransaction('revenue')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              >
                <Plus size={13} />
                <span>Lançar Receita</span>
              </button>
            </div>

            {/* List of revenues with custom UI cards */}
            <div className="divide-y divide-gray-100 max-h-[340px] overflow-y-auto">
              {filteredRevenues.map((rev) => (
                <div key={rev.id} className="p-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors group">
                  <div className="min-w-0 pr-3 flex items-center gap-3">
                    <div className="w-8 h-8 shrink-0 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center">
                      <ArrowUpRight size={14} className="text-gray-400" />
                    </div>
                    <div className="truncate flex flex-col gap-0.5">
                      <p className="text-xs font-bold text-gray-800 truncate leading-snug flex items-center gap-2">
                        {cleanEmojis(rev.description)}
                        {rev.active === false && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500 uppercase tracking-wider">Pausado</span>}
                      </p>
                      {rev.recurrenceType === 'fixed' && <span className="text-[10px] text-gray-400 font-medium">Recorrente Mensal</span>}
                      {rev.recurrenceType === 'installments' && <span className="text-[10px] text-gray-400 font-medium">Parcela {rev.installmentIndex}/{rev.installmentsCount}</span>}
                      {rev.isRecurring && !rev.recurrenceType && <span className="text-[10px] text-gray-400 font-medium">Fixo (Legado)</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-black ${rev.active === false ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{formatCurrency(rev.value)}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onOpenEditTransaction(rev, 'revenue')}
                        className="text-gray-400 hover:text-blue-600 p-1.5 rounded-xl transition-all bg-white shadow-sm border border-gray-100"
                        title="Editar"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button 
                        onClick={() => openDeleteModal(rev, 'revenue')}
                        className="text-gray-400 hover:text-rose-600 p-1.5 rounded-xl transition-all bg-white shadow-sm border border-gray-100"
                        title="Excluir"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredRevenues.length === 0 && (
                <div className="text-center py-12 text-gray-400 italic font-medium">
                  Nenhuma receita encontrada para os filtros aplicados.
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
            <span className="font-bold uppercase tracking-wider text-[10px]">Total Receitas</span>
            <span className="font-black text-[13px] text-gray-900">{formatCurrency(totalRevenues)}</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* DESPESAS SEGMENT */}
        {/* ========================================================= */}
        <div className="border border-gray-200 rounded-2xl bg-white shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="bg-gray-50/50 border-b border-gray-100 px-4 py-3.5 flex justify-between items-center select-none">
              <div className="flex items-center gap-2">
                <ArrowDownRight size={16} className="text-rose-500 shrink-0" strokeWidth={3} />
                <span className="font-black text-[11px] text-gray-800 uppercase tracking-widest">DESPESAS</span>
              </div>
              <button
                onClick={() => onOpenNewTransaction('expense')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              >
                <Plus size={13} />
                <span>Lançar Despesa</span>
              </button>
            </div>

            {/* List of expenses with customized UI cards */}
            <div className="divide-y divide-gray-100 max-h-[340px] overflow-y-auto">
              {filteredExpenses.map((exp) => (
                <div key={exp.id} className="p-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors group">
                  <div className="min-w-0 pr-3 flex items-center gap-3">
                    <div className="w-8 h-8 shrink-0 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center">
                      <ArrowDownRight size={14} className="text-gray-400" />
                    </div>
                    <div className="truncate flex flex-col gap-0.5">
                      <p className="text-xs font-bold text-gray-800 truncate leading-snug flex items-center gap-2">
                        {cleanEmojis(exp.description)}
                        {exp.active === false && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-500 uppercase tracking-wider">Pausado</span>}
                        {exp.isLimit && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 uppercase tracking-widest border border-indigo-200 shadow-xs">Limite</span>}
                      </p>
                      {exp.recurrenceType === 'fixed' && <span className="text-[10px] text-gray-400 font-medium">Recorrente Mensal</span>}
                      {exp.recurrenceType === 'installments' && <span className="text-[10px] text-gray-400 font-medium">Parcela {exp.installmentIndex}/{exp.installmentsCount}</span>}
                      {exp.isRecurring && !exp.recurrenceType && <span className="text-[10px] text-gray-400 font-medium">Fixo (Legado)</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs font-bold ${exp.active === false ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{formatCurrency(exp.value)}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onOpenEditTransaction(exp, 'expense')}
                        className="text-gray-400 hover:text-blue-600 p-1.5 rounded-xl transition-all bg-white shadow-sm border border-gray-100"
                        title="Editar"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button 
                        onClick={() => openDeleteModal(exp, 'expense')}
                        className="text-gray-400 hover:text-rose-600 p-1.5 rounded-xl transition-all bg-white shadow-sm border border-gray-100"
                        title="Excluir"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredExpenses.length === 0 && (
                <div className="text-center py-12 text-gray-400 italic font-medium">
                  Nenhuma despesa encontrada para os filtros aplicados.
                </div>
              )}
            </div>
          </div>
          
          <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
            <span className="font-bold uppercase tracking-wider text-[10px]">Total Despesas</span>
            <span className="font-black text-[13px] text-gray-900">{formatCurrency(totalExpenses)}</span>
          </div>
        </div>

      </div>

      {/* Linked financial compartments (Aportes Caixinha & Parcelados) in the month */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Aportes Caixinhas linked summary */}
        <div className="p-5 bg-white border border-gray-200 rounded-3xl flex flex-col justify-between text-xs gap-4 shadow-sm">
          <div>
            <p className="font-black text-[11px] uppercase text-gray-800 tracking-widest flex items-center gap-2">
              <PiggyBank size={16} className="text-blue-500" /> Caixinhas
            </p>
            <div className="space-y-1.5 mt-4 max-h-[140px] overflow-y-auto pr-1">
              {caixinhas.filter(c => {
                if (c.status !== 'Ativo') return false;
                const startY = c.startYear !== undefined ? c.startYear : new Date().getFullYear();
                const startM = c.startMonth !== undefined ? c.startMonth : new Date().getMonth();
                const startTotal = startY * 12 + startM;
                const currentTotal = selectedYear * 12 + selectedMonth;
                if (currentTotal < startTotal) return false;
                
                if (c.targetValue && c.monthlyPlanned > 0) {
                    const monthsPassed = currentTotal - startTotal;
                    const projectedValue = c.currentValue + (monthsPassed * c.monthlyPlanned);
                    if (projectedValue - c.monthlyPlanned >= c.targetValue) return false;
                }
                return true;
              }).map(c => {
                const isSkipped = c.deposits?.some(d => d.month === selectedMonth && d.year === selectedYear && d.skipped);
                return (
                <div key={c.id} className="flex flex-col py-2 border-b border-gray-50 last:border-0 group">
                  <div className={`flex justify-between items-center transition-all ${isSkipped ? 'opacity-40 grayscale' : ''}`}>
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                      <span className="truncate text-gray-700 font-bold">{cleanEmojis(c.name)}</span>
                    </div>
                    <span className="font-black text-gray-900 shrink-0 text-[13px]">{formatCurrency(c.monthlyPlanned)}</span>
                  </div>
                  <div className="mt-1 flex justify-end">
                    <button
                      onClick={() => onToggleSkipCaixinha(c.id, selectedMonth, selectedYear)}
                      className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
                    >
                      {isSkipped ? 'Desfazer Pulo' : 'Pular este mês'}
                    </button>
                  </div>
                </div>
              )})}
              {caixinhas.filter(c => {
                if (c.status !== 'Ativo') return false;
                const startY = c.startYear !== undefined ? c.startYear : new Date().getFullYear();
                const startM = c.startMonth !== undefined ? c.startMonth : new Date().getMonth();
                const startTotal = startY * 12 + startM;
                const currentTotal = selectedYear * 12 + selectedMonth;
                if (currentTotal < startTotal) return false;
                
                if (c.targetValue && c.monthlyPlanned > 0) {
                    const monthsPassed = currentTotal - startTotal;
                    const projectedValue = c.currentValue + (monthsPassed * c.monthlyPlanned);
                    if (projectedValue - c.monthlyPlanned >= c.targetValue) return false;
                }
                return true;
              }).length === 0 && (
                <p className="text-gray-400 font-medium py-4 text-center border-2 border-dashed border-gray-100 rounded-xl">Nenhum aporte este mês</p>
              )}
            </div>
          </div>
          <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
             <span className="font-bold uppercase tracking-wider text-[10px] text-gray-400">Total</span>
            <span className="font-black text-[13px] text-gray-900">{formatCurrency(totalCaixinhas)}</span>
          </div>
        </div>

        {/* Parcelamento debts linked summary */}
        <div className="p-5 bg-white border border-gray-200 rounded-3xl flex flex-col justify-between text-xs gap-4 shadow-sm">
          <div>
            <p className="font-black text-[11px] uppercase text-gray-800 tracking-widest flex items-center gap-2">
              <WalletCards size={16} className="text-indigo-500" /> Parcelamentos
            </p>
            <div className="space-y-1.5 mt-4 max-h-[140px] overflow-y-auto pr-1">
              {monthInstallments.map((d) => {
                const startY = d.startYear !== undefined ? d.startYear : new Date().getFullYear();
                const startM = Number(d.startMonth);
                const startTotal = startY * 12 + startM;
                const currentTotal = selectedYear * 12 + selectedMonth;
                const relativeIndex = currentTotal - startTotal + 1;
                return (
                  <div key={d.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                      <span className="truncate text-gray-700 font-bold">{cleanEmojis(d.name)} <span className="font-medium text-gray-400 ml-1">({d.creditor})</span></span>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="font-black text-gray-900 text-[13px] leading-tight">
                        {formatCurrency(d.installmentValue)}
                      </span>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">
                        {relativeIndex}/{d.installmentsCount}
                      </span>
                    </div>
                  </div>
                );
              })}
              {monthInstallments.length === 0 && (
                <p className="text-gray-400 font-medium py-4 text-center border-2 border-dashed border-gray-100 rounded-xl">Nenhum parcelamento este mês</p>
              )}
            </div>
          </div>
          <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
             <span className="font-bold uppercase tracking-wider text-[10px] text-gray-400">Total</span>
            <span className="font-black text-[13px] text-gray-900">{formatCurrency(totalInstallments)}</span>
          </div>
        </div>

      </div>

      {/* Delete Scope Selection Modal */}
      <AnimatePresence>
        {deleteCandidate && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteCandidate(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col p-5"
            >
              <h3 className="text-base font-black text-rose-600 mb-2">Excluir Item Recorrente</h3>
              <p className="text-sm font-bold text-gray-600 mb-4">{deleteCandidate.item.description}</p>
              
              <div className="flex flex-col gap-2 mb-6">
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${deleteScope === 'single' ? 'bg-rose-50 border-rose-500' : 'bg-gray-50 border-gray-200'}`}>
                  <input type="radio" checked={deleteScope === 'single'} onChange={() => setDeleteScope('single')} className="text-rose-500" />
                  <span className="text-xs font-bold text-gray-700">Apenas este lançamento</span>
                </label>
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${deleteScope === 'future' ? 'bg-rose-50 border-rose-500' : 'bg-gray-50 border-gray-200'}`}>
                  <input type="radio" checked={deleteScope === 'future'} onChange={() => setDeleteScope('future')} className="text-rose-500" />
                  <span className="text-xs font-bold text-gray-700">Este e os próximos</span>
                </label>
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${deleteScope === 'all' ? 'bg-rose-50 border-rose-500' : 'bg-gray-50 border-gray-200'}`}>
                  <input type="radio" checked={deleteScope === 'all'} onChange={() => setDeleteScope('all')} className="text-rose-500" />
                  <span className="text-xs font-bold text-gray-700">Toda a recorrência</span>
                </label>
              </div>

              <div className="flex gap-3 mt-auto">
                <button
                  onClick={() => setDeleteCandidate(null)}
                  className="flex-1 py-3 text-xs font-bold bg-white text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 py-3 text-xs font-black bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors shadow-sm shadow-rose-600/20"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
