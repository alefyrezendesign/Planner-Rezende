import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, Receipt, PiggyBank, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabase';
import { fetchUserFinances, upsertFinancesItems, deleteFinancesItems } from '../api';

import { Revenue, Expense, Debt, Caixinha, MONTH_NAMES } from './finances/types';
import { MonthSelector } from './finances/MonthSelector';
import { FluxoMensalTab } from './finances/FluxoMensalTab';
import { VisaoAnualTab } from './finances/VisaoAnualTab';
import { VisaoTabelaTab } from './finances/VisaoTabelaTab';
import { CaixinhasTab } from './finances/CaixinhasTab';
import { ParcelamentosTab } from './finances/ParcelamentosTab';
import { TransactionModal, TransactionFormData, EditScope, TransactionType } from './finances/TransactionModal';

// Constants for local storage keys
const STORAGE_KEYS = {
  REVENUES: 'fin_revenues_v2',
  EXPENSES: 'fin_expenses_v2',
  DEBTS: 'fin_debts_v2',
  CAIXINHAS: 'fin_caixinhas_v2',
};

// Empty initial states (removed mock data to prevent it returning on F5)
const INITIAL_REVENUES: Revenue[] = [];
const INITIAL_EXPENSES: Expense[] = [];
const INITIAL_CAIXINHAS: Caixinha[] = [];
const INITIAL_DEBTS: Debt[] = [];

interface FinancesProps {
  session: Session | null;
}

export const Finances = ({ session }: FinancesProps) => {
  const [activeSubTab, setActiveSubTab] = useState('fluxo');
  const [fluxoViewMode, setFluxoViewMode] = useState<'mensal' | 'anual' | 'tabela'>('mensal');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<TransactionType>(null);
  const [itemToEdit, setItemToEdit] = useState<any>(null);

  // Main synchronized states with deep persistence and tracking
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [caixinhas, setCaixinhas] = useState<Caixinha[]>([]);

  // Hydration   // Load initial state (from LocalStorage first, then check Cloud)
  useEffect(() => {
    const rawRevs = localStorage.getItem(STORAGE_KEYS.REVENUES);
    const rawExps = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    const rawDebts = localStorage.getItem(STORAGE_KEYS.DEBTS);
    const rawCaixas = localStorage.getItem(STORAGE_KEYS.CAIXINHAS);
    const localTs = Number(localStorage.getItem('finances_last_modified') || '0');

    let finalRevs = rawRevs ? JSON.parse(rawRevs) : INITIAL_REVENUES;
    let finalExps = rawExps ? JSON.parse(rawExps) : INITIAL_EXPENSES;
    let finalDebts = rawDebts ? JSON.parse(rawDebts) : INITIAL_DEBTS;
    let finalCaixas = rawCaixas ? JSON.parse(rawCaixas) : INITIAL_CAIXINHAS;

    // Seta primeiro o local storage para a tela não ficar vazia
    setRevenues(finalRevs);
    setExpenses(finalExps);
    setDebts(finalDebts);
    setCaixinhas(finalCaixas);

    // Busca dados da nova tabela no Supabase em background
    const fetchCloudData = async () => {
      if (!session?.user?.id) return;
      try {
        const cloudData = await fetchUserFinances(session.user.id);
        
        // Se temos dados na nuvem, usamos como fonte da verdade (sobrepondo o LocalStorage)
        // Mas podemos comparar para ver se o LocalStorage tem algo mais recente, porém para simplificar e garantir 
        // a nova arquitetura, sempre forçaremos o uso da nuvem se tiver registros (já que migramos)
        const hasAnyCloudData = cloudData.revenues.length > 0 || cloudData.expenses.length > 0 || cloudData.debts.length > 0 || cloudData.caixinhas.length > 0;
        
        if (hasAnyCloudData) {
          setRevenues(cloudData.revenues);
          setExpenses(cloudData.expenses);
          setDebts(cloudData.debts);
          setCaixinhas(cloudData.caixinhas);
          
          localStorage.setItem(STORAGE_KEYS.REVENUES, JSON.stringify(cloudData.revenues));
          localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(cloudData.expenses));
          localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(cloudData.debts));
          localStorage.setItem(STORAGE_KEYS.CAIXINHAS, JSON.stringify(cloudData.caixinhas));
          updateLocalTs();
        }
      } catch (err) {
        console.error("Erro ao carregar finanças da nuvem:", err);
      }
    };
    
    fetchCloudData();
  }, [session]);

  // Sync state helpers
  const updateLocalTs = () => localStorage.setItem('finances_last_modified', Date.now().toString());

  const syncRevenues = (data: Revenue[]) => {
    const deletedIds = revenues.filter(r => !data.find(d => d.id === r.id)).map(r => r.id);
    setRevenues(data);
    localStorage.setItem(STORAGE_KEYS.REVENUES, JSON.stringify(data));
    updateLocalTs();
    if (!session?.user?.id) return;
    if (deletedIds.length > 0) deleteFinancesItems('fin_revenues', deletedIds);
    if (data.length > 0) upsertFinancesItems('fin_revenues', data, session.user.id);
  };

  const syncExpenses = (data: Expense[]) => {
    const deletedIds = expenses.filter(r => !data.find(d => d.id === r.id)).map(r => r.id);
    setExpenses(data);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(data));
    updateLocalTs();
    if (!session?.user?.id) return;
    if (deletedIds.length > 0) deleteFinancesItems('fin_expenses', deletedIds);
    if (data.length > 0) upsertFinancesItems('fin_expenses', data, session.user.id);
  };

  const syncDebts = (data: Debt[]) => {
    const deletedIds = debts.filter(r => !data.find(d => d.id === r.id)).map(r => r.id);
    setDebts(data);
    localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(data));
    updateLocalTs();
    if (!session?.user?.id) return;
    if (deletedIds.length > 0) deleteFinancesItems('fin_debts', deletedIds);
    if (data.length > 0) upsertFinancesItems('fin_debts', data, session.user.id);
  };

  const syncCaixinhas = (data: Caixinha[]) => {
    const deletedIds = caixinhas.filter(r => !data.find(d => d.id === r.id)).map(r => r.id);
    setCaixinhas(data);
    localStorage.setItem(STORAGE_KEYS.CAIXINHAS, JSON.stringify(data));
    updateLocalTs();
    if (!session?.user?.id) return;
    if (deletedIds.length > 0) deleteFinancesItems('fin_caixinhas', deletedIds);
    if (data.length > 0) upsertFinancesItems('fin_caixinhas', data, session.user.id);
  };

  const handleToggleSkipCaixinha = (caixinhaId: string, month: number, year: number) => {
    const updatedCaixinhas = caixinhas.map(c => {
      if (c.id === caixinhaId) {
        const existingIndex = c.deposits?.findIndex(d => d.month === month && d.year === year && d.skipped) ?? -1;
        if (existingIndex >= 0) {
          const newDeposits = c.deposits?.filter((_, i) => i !== existingIndex) || [];
          return { ...c, deposits: newDeposits };
        } else {
          const newDeposits = [...(c.deposits || []), {
            id: `skip-${Date.now()}`,
            month,
            year,
            amount: 0,
            date: new Date().toISOString(),
            skipped: true,
          }];
          return { ...c, deposits: newDeposits };
        }
      }
      return c;
    });
    syncCaixinhas(updatedCaixinhas);
  };

  // Transaction Event Listeners
  const openNewTransaction = (type: TransactionType) => {
    setModalInitialType(type);
    setItemToEdit(null);
    setIsModalOpen(true);
  };

  const openEditTransaction = (item: Revenue | Expense, type: 'revenue' | 'expense') => {
    setModalInitialType(type);
    setItemToEdit({ ...item, type });
    setIsModalOpen(true);
  };

  const handleSaveTransaction = (data: TransactionFormData, editScope?: EditScope) => {
    const isNew = !itemToEdit;
    const groupId = isNew ? crypto.randomUUID() : (itemToEdit.groupId || crypto.randomUUID());

    const updateList = (list: any[]) => {
      if (isNew) {
        let toAdd: any[] = [];
        if (data.recurrenceType === 'unique') {
          toAdd.push({ ...data, id: `${data.type}-${Date.now()}`, year: selectedYear, groupId, active: true });
        } else if (data.recurrenceType === 'fixed') {
          // Fixed monthly: repeat for the next 5 years (60 months)
          toAdd = Array.from({ length: 60 }, (_, i) => {
            const currentTotalMonths = selectedYear * 12 + data.month + i;
            const y = Math.floor(currentTotalMonths / 12);
            const m = currentTotalMonths % 12;
            return {
              ...data,
              id: `${data.type}-${Date.now()}-${i}`,
              month: m,
              year: y,
              groupId,
              active: true
            };
          });
        } else if (data.recurrenceType === 'installments' && data.installmentsCount) {
          toAdd = Array.from({ length: data.installmentsCount }, (_, i) => {
            const currentTotalMonths = selectedYear * 12 + data.month + i;
            const y = Math.floor(currentTotalMonths / 12);
            const m = currentTotalMonths % 12;
            return {
              ...data,
              id: `${data.type}-${Date.now()}-${i}`,
              month: m,
              year: y,
              groupId,
              installmentIndex: i + 1,
              active: true
            };
          });
        }
        return [...list, ...toAdd];
      } else {
        // Edit existing
        return list.map(item => {
          if (editScope === 'single') {
            if (item.id === itemToEdit.id) {
              return { ...item, description: data.description, value: data.value, category: data.category, recurrenceType: data.recurrenceType, installmentsCount: data.installmentsCount, active: data.active, isLimit: data.isLimit };
            }
          } else if (editScope === 'future') {
            const itemY = item.year !== undefined ? item.year : new Date().getFullYear();
            const editY = itemToEdit.year !== undefined ? itemToEdit.year : new Date().getFullYear();
            const itemTotalMonths = itemY * 12 + item.month;
            const editTotalMonths = editY * 12 + itemToEdit.month;
            
            if (item.groupId === itemToEdit.groupId && itemTotalMonths >= editTotalMonths) {
              return { ...item, description: data.description, value: data.value, category: data.category, recurrenceType: data.recurrenceType, installmentsCount: data.installmentsCount, active: data.active, isLimit: data.isLimit };
            }
          } else if (editScope === 'all') {
            if (item.groupId === itemToEdit.groupId) {
              return { ...item, description: data.description, value: data.value, category: data.category, recurrenceType: data.recurrenceType, installmentsCount: data.installmentsCount, active: data.active, isLimit: data.isLimit };
            }
          }
          return item;
        });
      }
    };

    if (data.type === 'revenue') {
      syncRevenues(updateList(revenues));
    } else {
      syncExpenses(updateList(expenses));
    }
  };

  const handleDeleteTransaction = (id: string, type: 'revenue' | 'expense', deleteScope: EditScope) => {
    const list = type === 'revenue' ? revenues : expenses;
    const itemToDelete = list.find(r => r.id === id);
    if (!itemToDelete) return;

    const newList = list.filter(item => {
      if (deleteScope === 'single') {
        return item.id !== id;
      } else if (deleteScope === 'future') {
        const itemY = item.year !== undefined ? item.year : new Date().getFullYear();
        const delY = itemToDelete.year !== undefined ? itemToDelete.year : new Date().getFullYear();
        const itemTotalMonths = itemY * 12 + item.month;
        const delTotalMonths = delY * 12 + itemToDelete.month;
        if (item.groupId === itemToDelete.groupId && itemTotalMonths >= delTotalMonths) return false;
        return true;
      } else if (deleteScope === 'all') {
        return item.groupId !== itemToDelete.groupId;
      }
      return true;
    });

    if (type === 'revenue') syncRevenues(newList);
    else syncExpenses(newList);
  };

  // Live statistical parser over the full 12 months for the selectedYear
  const getMonthTotals = (monthIdx: number) => {
    const monthRevs = revenues.filter(r => r.month === monthIdx && (r.year === undefined || r.year === selectedYear));
    const monthExps = expenses.filter(e => e.month === monthIdx && (e.year === undefined || e.year === selectedYear));

    const totalRevs = monthRevs.reduce((acc, r) => acc + (r.active !== false ? r.value : 0), 0);
    const totalExps = monthExps.reduce((acc, e) => acc + (e.active !== false ? e.value : 0), 0);

    const totalCaixas = caixinhas
      .filter(c => {
        if (c.status !== 'Ativo') return false;
        
        const startY = c.startYear !== undefined ? c.startYear : new Date().getFullYear();
        const startM = c.startMonth !== undefined ? c.startMonth : new Date().getMonth();
        
        const startTotalMonths = startY * 12 + startM;
        const currentTotalMonths = selectedYear * 12 + monthIdx;
        
        // Don't deduct if we are before the start date
        if (currentTotalMonths < startTotalMonths) return false;

        // Stop deducting if the target is already reached (roughly estimated by months passed)
        if (c.targetValue && c.monthlyPlanned > 0) {
            const monthsPassed = currentTotalMonths - startTotalMonths;
            const projectedValue = c.currentValue + (monthsPassed * c.monthlyPlanned);
            // If the projected value from past months already hit the target, stop deducting this month
            if (projectedValue - c.monthlyPlanned >= c.targetValue) {
               return false;
            }
        }

        return !c.deposits?.some(d => d.month === monthIdx && d.year === selectedYear && d.skipped);
      })
      .reduce((acc, c) => acc + (c.monthlyPlanned || 0), 0);

    const installments = debts.filter(d => {
      if (d.status !== 'Ativo') return false;
      const startM = Number(d.startMonth);
      const startY = d.startYear !== undefined ? d.startYear : new Date().getFullYear();
      
      const startTotalMonths = startY * 12 + startM;
      const currentTotalMonths = selectedYear * 12 + monthIdx;
      
      return currentTotalMonths >= startTotalMonths && currentTotalMonths < startTotalMonths + Number(d.installmentsCount);
    });
    const totalParc = installments.reduce((acc, d) => acc + (d.installmentValue || 0), 0);

    const saldoLivre = totalRevs - totalExps - totalCaixas - totalParc;

    return {
      totalRevenues: totalRevs,
      totalExpenses: totalExps,
      totalCaixinhas: totalCaixas,
      totalInstallments: totalParc,
      saldoLivre,
    };
  };

  // Compile monthly timeline data for visualizations
  const allMonthsCompiled = MONTH_NAMES.map((name, idx) => ({
    index: idx,
    name,
    ...getMonthTotals(idx),
  }));

  const monthlySobraArray = allMonthsCompiled.map(m => m.saldoLivre);
  const totalGuardadoMeta = caixinhas.reduce((acc, c) => acc + c.currentValue, 0);

  // Focus specific month index and jump back to the Flow tab
  const handleFocusMonth = (monthIndex: number) => {
    setSelectedMonth(monthIndex);
    setActiveSubTab('fluxo');
    setFluxoViewMode('mensal');
  };

  return (
    <div className="w-full space-y-5">
      {/* Dynamic Segmented Sub-Tab Navigator - Fully Responsive touch targets */}
      <div className="sticky top-2 z-30 bg-white/60 backdrop-blur-xl p-2 rounded-[24px] border border-white/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar py-1 px-1 w-full md:w-auto">
          {[
            { id: 'fluxo', label: 'Fluxo', icon: Wallet },
            { id: 'caixinhas', label: 'Caixinhas', icon: PiggyBank },
            { id: 'parcelamentos', label: 'Parcelamentos', icon: Receipt },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`relative flex items-center justify-center gap-2 h-12 px-5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex-1 md:flex-initial cursor-pointer ${
                activeSubTab === tab.id
                  ? 'text-primary-700 bg-primary-50/80 shadow-sm border border-primary-100/50'
                  : 'text-slate-400 hover:bg-white hover:text-slate-700 border border-transparent'
              }`}
            >
              <tab.icon size={18} strokeWidth={2.5} className={activeSubTab === tab.id ? "scale-110 transition-transform" : ""} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        {/* Botão de Emergência para Zerar Despesas (Oculto a pedido do usuário)
        <div className="px-2 md:px-4 mt-2 md:mt-0 flex justify-end">
          <button
            onClick={() => {
              if (window.confirm('Tem certeza que deseja apagar TODAS as despesas? Essa ação é irreversível.')) {
                syncExpenses([]);
              }
            }}
            className="flex items-center gap-2 px-3 py-2 text-[10px] sm:text-xs font-bold text-rose-500 hover:text-white bg-rose-50 hover:bg-rose-500 border border-rose-100 rounded-xl transition-all cursor-pointer"
            title="Apagar todas as despesas cadastradas"
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">Zerar Despesas</span>
          </button>
        </div>
        */}

      </div>

      {/* Main Interactive Workboard */}
      <div className="glass-card-premium p-4 sm:p-6 min-h-[480px]">
        {/* Render View Mode Toggle and MonthSelector ONLY if the active tab is fluxo */}
        {activeSubTab === 'fluxo' && (
          <div className="mb-6 flex flex-col gap-5">
            <div className="flex flex-col items-center gap-3">
              <div className="flex bg-slate-100/80 p-1.5 rounded-2xl w-fit border border-slate-200/50">
                <button 
                  onClick={() => setFluxoViewMode('mensal')} 
                  className={`h-10 px-6 text-xs sm:text-sm font-bold rounded-xl transition-all ${fluxoViewMode === 'mensal' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Mensal
                </button>
                <button 
                  onClick={() => setFluxoViewMode('anual')} 
                  className={`h-10 px-6 text-xs sm:text-sm font-bold rounded-xl transition-all ${fluxoViewMode === 'anual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Anual
                </button>
                <button 
                  onClick={() => setFluxoViewMode('tabela')} 
                  className={`h-10 px-6 text-xs sm:text-sm font-bold rounded-xl transition-all ${fluxoViewMode === 'tabela' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Tabela
                </button>
              </div>

              {/* Year Selector - Global (afeta todas as views) */}
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-xs">
                <button
                  onClick={() => setSelectedYear(selectedYear - 1)}
                  className="p-1 rounded hover:bg-gray-100 text-gray-500 active:scale-95 transition-transform cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-sm font-black text-gray-700 min-w-[36px] text-center">{selectedYear}</span>
                <button
                  onClick={() => setSelectedYear(selectedYear + 1)}
                  className="p-1 rounded hover:bg-gray-100 text-gray-500 active:scale-95 transition-transform cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
            
            {fluxoViewMode === 'mensal' && (
              <MonthSelector 
                selectedMonth={selectedMonth} 
                setSelectedMonth={setSelectedMonth}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                monthlySobraList={monthlySobraArray}
              />
            )}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeSubTab}-${fluxoViewMode}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.14 }}
          >
            {/* 1. FLUXO MENSAL DETAIL TAB */}
            {activeSubTab === 'fluxo' && fluxoViewMode === 'mensal' && (
              <FluxoMensalTab
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                revenues={revenues}
                expenses={expenses}
                debts={debts}
                caixinhas={caixinhas}
                onOpenNewTransaction={openNewTransaction}
                onOpenEditTransaction={openEditTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                onToggleSkipCaixinha={handleToggleSkipCaixinha}
              />
            )}

            {/* 2. VISÃO ANUAL CONSOLIDADA TAB (Now inside fluxo) */}
            {activeSubTab === 'fluxo' && fluxoViewMode === 'anual' && (
              <VisaoAnualTab
                allMonthsData={allMonthsCompiled}
                onFocusMonth={handleFocusMonth}
              />
            )}

            {/* 2b. VISÃO TABELA MATRICIAL */}
            {activeSubTab === 'fluxo' && fluxoViewMode === 'tabela' && (
              <VisaoTabelaTab
                selectedYear={selectedYear}
                revenues={revenues}
                expenses={expenses}
                debts={debts}
                caixinhas={caixinhas}
              />
            )}

            {/* 3. METAS & CAIXINHAS TAB */}
            {activeSubTab === 'caixinhas' && (
              <CaixinhasTab
                caixinhas={caixinhas}
                setCaixinhas={syncCaixinhas}
                totalGuardadoMeta={totalGuardadoMeta}
              />
            )}

            {/* 4. COMPROMISSOS & PARCELAMENTOS TAB */}
            {activeSubTab === 'parcelamentos' && (
              <ParcelamentosTab
                debts={debts}
                setDebts={syncDebts}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTransaction}
        initialType={modalInitialType}
        itemToEdit={itemToEdit}
      />
    </div>
  );
};
export default Finances;
