import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Receipt, Plus, Minus, Trash2, Calendar, Edit3, CheckCircle2, PauseCircle, PlayCircle } from 'lucide-react';
import { Debt, MONTH_NAMES, MONTH_SHORT_NAMES } from './types';
import { formatCurrency } from '../../utils';
import { ParcelamentoModal } from './ParcelamentoModal';

interface ParcelamentosTabProps {
  debts: Debt[];
  setDebts: (debts: Debt[]) => void;
}

export const ParcelamentosTab = ({
  debts,
  setDebts,
}: ParcelamentosTabProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  const handleSaveDebt = (debtData: Partial<Debt>) => {
    if (editingDebt) {
      setDebts(debts.map(d => d.id === editingDebt.id ? { ...d, ...debtData } as Debt : d));
    } else {
      const newDebt: Debt = {
        id: `debt-${Date.now()}`,
        name: debtData.name!,
        creditor: debtData.creditor!,
        totalValue: debtData.totalValue!,
        installmentsCount: debtData.installmentsCount!,
        installmentValue: debtData.installmentValue!,
        startMonth: debtData.startMonth!,
        status: (debtData.status as 'Ativo' | 'Pausado' | 'Quitado') || 'Ativo',
        paidInstallments: debtData.paidInstallments || 0,
        observations: debtData.observations || '',
      };
      setDebts([...debts, newDebt]);
    }
  };

  const handleDelete = (id: string) => {
    setDebts(debts.filter((d) => d.id !== id));
  };

  const handleToggleStatus = (id: string) => {
    setDebts(debts.map(d => {
      if (d.id === id) {
        if (d.status === 'Quitado') return d;
        const newStatus: 'Ativo' | 'Pausado' = d.status === 'Ativo' ? 'Pausado' : 'Ativo';
        return { ...d, status: newStatus };
      }
      return d;
    }));
  };

  const handleMarkAsPaid = (id: string) => {
    setDebts(debts.map(d => {
      if (d.id === id) {
        const currentPaid = d.paidInstallments || 0;
        if (currentPaid < d.installmentsCount) {
          const newPaid = currentPaid + 1;
          const newStatus: 'Ativo' | 'Pausado' | 'Quitado' = newPaid >= d.installmentsCount ? 'Quitado' : d.status;
          return { ...d, paidInstallments: newPaid, status: newStatus };
        }
      }
      return d;
    }));
  };

  const handleUndoPayment = (id: string) => {
    setDebts(debts.map(d => {
      if (d.id === id) {
        const currentPaid = d.paidInstallments || 0;
        if (currentPaid > 0) {
          const newPaid = currentPaid - 1;
          const newStatus: 'Ativo' | 'Pausado' | 'Quitado' = d.status === 'Quitado' ? 'Ativo' : d.status;
          return { ...d, paidInstallments: newPaid, status: newStatus };
        }
      }
      return d;
    }));
  };

  const currentMonthIndex = new Date().getMonth();

  const activeDebts = debts.filter((d) => d.status === 'Ativo');
  const pausedDebts = debts.filter((d) => d.status === 'Pausado');

  const getRemainingValue = (d: Debt) => {
    const paid = d.paidInstallments || 0;
    return Math.max(0, d.totalValue - (paid * d.installmentValue));
  };

  const totalRemaining = debts.reduce((acc, d) => acc + getRemainingValue(d), 0);
  const activeRemaining = activeDebts.reduce((acc, d) => acc + getRemainingValue(d), 0);
  const pausedRemaining = pausedDebts.reduce((acc, d) => acc + getRemainingValue(d), 0);

  const activeMonthlyImpact = activeDebts.reduce((acc, d) => acc + d.installmentValue, 0);
  const pausedMonthlyImpact = pausedDebts.reduce((acc, d) => acc + d.installmentValue, 0);
  const totalMonthlyImpact = activeMonthlyImpact + pausedMonthlyImpact;

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Receipt className="text-blue-600" size={20} />
            Parcelamentos
          </h2>
          <p className="text-xs text-gray-500">
            Parcelas de negociações, dívidas e empréstimos
          </p>
        </div>
        <button
          onClick={() => {
            setEditingDebt(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-sm"
        >
          <Plus size={14} />
          <span>Novo parcelamento</span>
        </button>
      </div>

      {/* Dashboard */}
      <div className="saas-card p-5 sm:p-6 overflow-hidden relative">
        <div className="absolute -right-6 -top-6 p-4 opacity-[0.03] pointer-events-none">
          <Receipt size={140} />
        </div>
        
        <div className="flex flex-col gap-5 relative">
          {/* Main Balance */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Receipt size={14} className="text-indigo-500" /> 
              Saldo Devedor Restante
            </p>
            <p className="text-4xl sm:text-5xl font-black text-indigo-600 tracking-tight mt-1 leading-none">
              {formatCurrency(totalRemaining)}
            </p>
          </div>
          
          {/* Secondary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 border-t border-slate-100">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar size={12} className="text-primary-500" /> 
                Comprometimento Mensal Total
              </p>
              <p className="text-xl font-black text-primary-600 mt-1 leading-none">
                {formatCurrency(totalMonthlyImpact)}
              </p>
            </div>
            
            <div className="sm:border-l sm:border-slate-100 sm:pl-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                Ativos ({activeDebts.length})
              </p>
              <p className="text-lg font-black text-emerald-600 mt-1 leading-none">
                {formatCurrency(activeRemaining)}
              </p>
              <p className="text-[10px] text-slate-500 mt-1.5 font-bold">
                Parcelas: {formatCurrency(activeMonthlyImpact)}/mês
              </p>
            </div>

            <div className="sm:border-l sm:border-slate-100 sm:pl-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                Pausados ({pausedDebts.length})
              </p>
              <p className="text-lg font-black text-amber-600 mt-1 leading-none">
                {formatCurrency(pausedRemaining)}
              </p>
              <p className="text-[10px] text-slate-400 mt-1.5 font-bold">
                Parcelas: {formatCurrency(pausedMonthlyImpact)}/mês
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog of Ongoing Installments */}
      <div className="space-y-4">
        {debts.map((debt) => {
          const startIdx = Number(debt.startMonth);
          const count = Number(debt.installmentsCount);
          const endIdx = startIdx + count;

          // Paid installments from explicit state
          const installmentsPaid = Math.min(debt.paidInstallments || 0, count);
          const paymentProgressPercent = count > 0 ? (installmentsPaid / count) * 100 : 0;
          const isComplete = installmentsPaid >= count || debt.status === 'Quitado';

          const isActive = debt.status === 'Ativo';
          const isPaused = debt.status === 'Pausado';

          return (
            <div 
              key={debt.id} 
              className={`saas-card p-5 sm:p-6 transition-all relative flex flex-col ${
                isComplete ? 'opacity-70 grayscale-[20%]' : 
                isPaused ? 'opacity-75' : ''
              }`}
            >
              {/* Header */}
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0 pr-10">
                  <span className="inline-flex items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">
                    {debt.creditor}
                  </span>
                  <h3 className={`font-black text-lg sm:text-xl leading-snug truncate ${isComplete ? 'text-slate-500' : 'text-slate-900'}`}>
                    {debt.name}
                  </h3>
                  
                  {/* Status Badge */}
                  <div className="mt-2.5 inline-flex items-center gap-1.5">
                    {isComplete ? (
                      <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 size={11} /> Quitado
                      </span>
                    ) : isActive ? (
                      <span className="text-[10px] bg-emerald-50 border border-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Ativo
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-50 border border-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Pausado
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end shrink-0">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Parcela</span>
                  <span className={`text-xl sm:text-2xl font-black tracking-tight ${isComplete ? 'text-slate-500' : 'text-slate-900'}`}>
                    {formatCurrency(debt.installmentValue)}
                  </span>
                </div>
              </div>

              {/* Progress Amortization Visual Gauge Bar */}
              <div className="pt-5 mt-5 border-t border-slate-100/60 space-y-2.5">
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <span>Progresso da dívida</span>
                  <span className={isComplete ? 'text-indigo-600' : 'text-slate-800'}>
                    {installmentsPaid} de {count} parcelas ({Math.round(paymentProgressPercent)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100/80 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      isComplete ? 'bg-indigo-500' : 'bg-slate-800'
                    }`}
                    style={{ width: `${paymentProgressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] pt-1">
                  <span className="text-slate-500 font-medium">Pago: <span className="font-bold text-slate-800">{formatCurrency(installmentsPaid * debt.installmentValue)}</span></span>
                  <span className="text-slate-500 font-medium">Restante: <span className="font-bold text-slate-800">{formatCurrency(debt.totalValue - (installmentsPaid * debt.installmentValue))}</span></span>
                </div>
              </div>

              {/* IMPACTO ANUAL */}
              <div className={`pt-5 mt-5 border-t border-slate-100/60 space-y-3 ${isComplete ? 'opacity-60' : ''}`}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar size={12} /> Impacto Anual
                </p>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 sm:gap-2">
                  {MONTH_SHORT_NAMES.map((shortName, mIdx) => {
                    const isImpacted = mIdx >= startIdx && mIdx < endIdx;
                    const isCurrent = mIdx === currentMonthIndex;
                    const isPaidMonth = isImpacted && (mIdx - startIdx < installmentsPaid);

                    return (
                      <div 
                        key={mIdx}
                        className={`py-1.5 px-1 rounded-xl border text-center flex flex-col justify-center items-center gap-1 transition-colors ${
                          isPaidMonth
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : isImpacted
                              ? isCurrent && !isComplete
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                : 'bg-indigo-50/70 border-indigo-200 text-indigo-700'
                              : 'bg-transparent border-dashed border-slate-200 text-slate-400'
                        }`}
                        title={`${MONTH_NAMES[mIdx]}: ${isPaidMonth ? 'Parcela Paga' : isImpacted ? 'Cobrança Ativa' : 'Sem impacto'}`}
                      >
                        <span className="text-[9px] font-black leading-none uppercase">{shortName}</span>
                        {isImpacted && (
                           <span className={`w-1.5 h-1.5 rounded-full ${
                             isPaidMonth 
                               ? 'bg-emerald-500'
                               : isCurrent && !isComplete 
                                  ? 'bg-white' 
                                  : 'bg-indigo-500' 
                           }`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-between items-center pt-5 mt-5 border-t border-slate-100/60 mt-auto">
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setEditingDebt(debt);
                      setIsModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-800 transition-colors"
                  >
                    <Edit3 size={13} /> Editar
                  </button>
                  <button
                    onClick={() => handleDelete(debt.id)}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 size={13} /> Excluir
                  </button>
                </div>

                <div className="flex gap-2.5 items-center">
                  {!isComplete && (
                    <button
                      onClick={() => handleToggleStatus(debt.id)}
                      className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all border shadow-sm ${
                        isActive 
                          ? 'text-amber-700 bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50' 
                          : 'text-emerald-700 bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50'
                      }`}
                    >
                      {isActive ? <PauseCircle size={13} /> : <PlayCircle size={13} />}
                      {isActive ? 'Pausar' : 'Ativar'}
                    </button>
                  )}

                  <div className={`flex items-center bg-slate-50 rounded-xl border ${isPaused ? 'border-slate-200/50 opacity-60' : 'border-slate-200/80'} p-0.5`}>
                    <button
                      onClick={() => handleUndoPayment(debt.id)}
                      disabled={installmentsPaid <= 0 || isPaused}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Desfazer pagamento"
                    >
                      <Minus size={13} strokeWidth={3} />
                    </button>
                    
                    <span className={`px-2 text-[11px] font-black whitespace-nowrap min-w-[70px] text-center ${isComplete ? 'text-indigo-600' : 'text-slate-700'}`}>
                      {installmentsPaid} / {count}
                    </span>
                    
                    <button
                      onClick={() => handleMarkAsPaid(debt.id)}
                      disabled={isComplete || isPaused}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                      title="Registrar pagamento"
                    >
                      <Plus size={13} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {debts.length === 0 && (
          <div className="py-16 text-center border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 bg-slate-50">
            <Receipt className="mx-auto text-slate-300 mb-2" size={40} />
            <p className="font-bold text-slate-700">Nenhum parcelamento cadastrado.</p>
            <p className="text-xs text-slate-400 mt-1">Insira suas dívidas ou negociações para acompanhá-las.</p>
          </div>
        )}
      </div>

      <ParcelamentoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveDebt}
        initialData={editingDebt}
      />
    </div>
  );
};
