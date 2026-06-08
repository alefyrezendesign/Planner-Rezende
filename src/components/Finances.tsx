import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, Receipt, PiggyBank, Plus, Trash2 } from 'lucide-react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabase';

import { Revenue, Expense, Debt, Caixinha, MONTH_NAMES } from './finances/types';
import { MonthSelector } from './finances/MonthSelector';
import { FluxoMensalTab } from './finances/FluxoMensalTab';
import { VisaoAnualTab } from './finances/VisaoAnualTab';
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
  const [fluxoViewMode, setFluxoViewMode] = useState<'mensal' | 'anual'>('mensal');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialType, setModalInitialType] = useState<TransactionType>(null);
  const [itemToEdit, setItemToEdit] = useState<any>(null);

  // Main synchronized states with deep persistence and tracking
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [caixinhas, setCaixinhas] = useState<Caixinha[]>([]);

  // Hydration from LocalStorage AND Supabase if session is ready
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

    if (session?.user?.user_metadata) {
      const meta = session.user.user_metadata;
      const cloudTs = Number(meta.finances_last_modified || '0');
      
      // Apenas sobrescreve o local com dados da nuvem se a nuvem for mais recente (ex: acesso via outro dispositivo)
      // Se der F5 e o updateUser tiver falhado (rate limit), o localTs será mais novo e ignoraremos os "fantasmas" da nuvem.
      if (cloudTs > localTs) {
        if (meta.fin_revenues_v3) finalRevs = meta.fin_revenues_v3;
        if (meta.fin_expenses_v3) finalExps = meta.fin_expenses_v3;
        if (meta.fin_debts_v3) finalDebts = meta.fin_debts_v3;
        if (meta.fin_caixinhas_v3) finalCaixas = meta.fin_caixinhas_v3;
        
        // Atualiza o cache local para refletir a nova versão baixada da nuvem
        localStorage.setItem(STORAGE_KEYS.REVENUES, JSON.stringify(finalRevs));
        localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(finalExps));
        localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(finalDebts));
        localStorage.setItem(STORAGE_KEYS.CAIXINHAS, JSON.stringify(finalCaixas));
        localStorage.setItem('finances_last_modified', cloudTs.toString());
      }
    }

    setRevenues(finalRevs);
    setExpenses(finalExps);
    setDebts(finalDebts);
    setCaixinhas(finalCaixas);
  }, [session]);

  // Sync to Cloud (Supabase user metadata) debounced to avoid rate limit issues
  useEffect(() => {
    if (!session?.user?.id) return;
    
    const delayDebounceFn = setTimeout(() => {
      supabase.auth.updateUser({
        data: {
          fin_revenues_v3: revenues,
          fin_expenses_v3: expenses,
          fin_debts_v3: debts,
          fin_caixinhas_v3: caixinhas,
          finances_last_modified: Number(localStorage.getItem('finances_last_modified') || Date.now())
        }
      }).catch(err => console.error("Erro ao sincronizar finanças no Supabase:", err));
    }, 1500);

    return () => clearTimeout(delayDebounceFn);
  }, [revenues, expenses, debts, caixinhas, session]);

  // Sync state helpers
  const updateLocalTs = () => localStorage.setItem('finances_last_modified', Date.now().toString());

  const syncRevenues = (data: Revenue[]) => {
    setRevenues(data);
    localStorage.setItem(STORAGE_KEYS.REVENUES, JSON.stringify(data));
    updateLocalTs();
  };

  const syncExpenses = (data: Expense[]) => {
    setExpenses(data);
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(data));
    updateLocalTs();
  };

  const syncDebts = (data: Debt[]) => {
    setDebts(data);
    localStorage.setItem(STORAGE_KEYS.DEBTS, JSON.stringify(data));
    updateLocalTs();
  };

  const syncCaixinhas = (data: Caixinha[]) => {
    setCaixinhas(data);
    localStorage.setItem(STORAGE_KEYS.CAIXINHAS, JSON.stringify(data));
    updateLocalTs();
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
          toAdd.push({ ...data, id: `${data.type}-${Date.now()}`, groupId, active: true });
        } else if (data.recurrenceType === 'fixed') {
          // Fixed monthly: repeat for the next 12 months in the year context
          toAdd = Array.from({ length: 12 - data.month }, (_, i) => ({
            ...data,
            id: `${data.type}-${Date.now()}-${i}`,
            month: data.month + i,
            groupId,
            active: true
          }));
        } else if (data.recurrenceType === 'installments' && data.installmentsCount) {
          toAdd = Array.from({ length: Math.min(data.installmentsCount, 12 - data.month) }, (_, i) => ({
            ...data,
            id: `${data.type}-${Date.now()}-${i}`,
            month: data.month + i,
            groupId,
            installmentIndex: i + 1,
            active: true
          }));
        }
        return [...list, ...toAdd];
      } else {
        // Edit existing
        return list.map(item => {
          if (editScope === 'single') {
            if (item.id === itemToEdit.id) {
              return { ...item, description: data.description, value: data.value, category: data.category, recurrenceType: data.recurrenceType, installmentsCount: data.installmentsCount, active: data.active };
            }
          } else if (editScope === 'future') {
            if (item.groupId === itemToEdit.groupId && item.month >= itemToEdit.month) {
              return { ...item, description: data.description, value: data.value, category: data.category, recurrenceType: data.recurrenceType, installmentsCount: data.installmentsCount, active: data.active };
            }
          } else if (editScope === 'all') {
            if (item.groupId === itemToEdit.groupId) {
              return { ...item, description: data.description, value: data.value, category: data.category, recurrenceType: data.recurrenceType, installmentsCount: data.installmentsCount, active: data.active };
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
        if (item.groupId === itemToDelete.groupId && item.month >= itemToDelete.month) return false;
        return true;
      } else if (deleteScope === 'all') {
        return item.groupId !== itemToDelete.groupId;
      }
      return true;
    });

    if (type === 'revenue') syncRevenues(newList);
    else syncExpenses(newList);
  };

  // Live statistical parser over the full 12 months
  const getMonthTotals = (monthIdx: number) => {
    const monthRevs = revenues.filter(r => r.month === monthIdx);
    const monthExps = expenses.filter(e => e.month === monthIdx);

    const totalRevs = monthRevs.reduce((acc, r) => acc + (r.active !== false ? r.value : 0), 0);
    const totalExps = monthExps.reduce((acc, e) => acc + (e.active !== false ? e.value : 0), 0);

    const totalCaixas = caixinhas
      .filter(c => c.status === 'Ativo')
      .reduce((acc, c) => acc + (c.monthlyPlanned || 0), 0);

    const installments = debts.filter(d => {
      if (d.status !== 'Ativo') return false;
      const start = Number(d.startMonth);
      const end = start + Number(d.installmentsCount);
      return monthIdx >= start && monthIdx < end;
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
        

      </div>

      {/* Main Interactive Workboard */}
      <div className="glass-card p-4 sm:p-6 min-h-[480px]">
        {/* Render View Mode Toggle and MonthSelector ONLY if the active tab is fluxo */}
        {activeSubTab === 'fluxo' && (
          <div className="mb-6 flex flex-col gap-5">
            <div className="flex bg-slate-100/80 p-1.5 rounded-2xl w-fit mx-auto border border-slate-200/50">
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
            </div>
            
            {fluxoViewMode === 'mensal' && (
              <MonthSelector
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
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
