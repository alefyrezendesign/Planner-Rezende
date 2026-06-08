import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Receipt, Plus, Trash2, Calendar, Edit3, CheckCircle2, PauseCircle, PlayCircle } from 'lucide-react';
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

  const currentMonthIndex = new Date().getMonth();

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-150 pb-3">
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
              className={`bg-white border rounded-2xl p-4 sm:p-5 transition-all shadow-xs space-y-4 relative ${
                isComplete ? 'border-indigo-200 bg-indigo-50/20 opacity-80' : 
                isPaused ? 'border-gray-200 opacity-75 grayscale-[20%]' : 
                'border-gray-200 hover:border-blue-300'
              }`}
            >
              {/* Status Badge Positioned absolutely if needed, or in the flow */}
              
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0 pr-10">
                  <span className="inline-flex items-center gap-1.5 text-[9px] bg-slate-100 text-slate-700 font-black px-2 py-0.5 rounded-full uppercase tracking-wider mb-1">
                    {debt.creditor}
                  </span>
                  <h3 className={`font-extrabold text-base leading-snug truncate ${isComplete ? 'text-indigo-900' : 'text-gray-900'}`}>
                    {debt.name}
                  </h3>
                  
                  {/* Status Badge */}
                  <div className="mt-1.5 inline-flex items-center gap-1">
                    {isComplete ? (
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 size={11} /> Quitado
                      </span>
                    ) : isActive ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        Ativo
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        Pausado
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end shrink-0">
                  <div className="text-right">
                    <span className="text-xs text-gray-400 block font-bold">Parcela</span>
                    <span className={`text-base font-black leading-none ${isComplete ? 'text-indigo-900' : 'text-gray-900'}`}>
                      {formatCurrency(debt.installmentValue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Amortization Visual Gauge Bar */}
              <div className={`${isComplete ? 'bg-indigo-50/50' : 'bg-slate-50'} border border-slate-100 p-3 rounded-xl space-y-2`}>
                <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                  <span>Progresso</span>
                  <span className={isComplete ? 'text-indigo-600' : ''}>
                    {installmentsPaid} de {count} parcelas pagas — {Math.round(paymentProgressPercent)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden border border-gray-150">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      isComplete ? 'bg-indigo-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${paymentProgressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] pt-1">
                  <span className="text-gray-400 font-medium">Pago: <span className="font-bold text-gray-600">{formatCurrency(installmentsPaid * debt.installmentValue)}</span></span>
                  <span className="text-gray-400 font-medium">Restante: <span className="font-bold text-gray-600">{formatCurrency(debt.totalValue - (installmentsPaid * debt.installmentValue))}</span></span>
                </div>
              </div>

              {/* STUNNING VISUAL TIMELINE: Highlighting exactly which of the 12 months are hit by this debt! */}
              <div className={`space-y-1 ${isComplete ? 'opacity-60 grayscale-[50%]' : ''}`}>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-0.5 flex items-center gap-1">
                  <Calendar size={11} /> Impacto Anual
                </p>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 pt-1">
                  {MONTH_SHORT_NAMES.map((shortName, mIdx) => {
                    const isImpacted = mIdx >= startIdx && mIdx < endIdx;
                    const isCurrent = mIdx === currentMonthIndex;

                    return (
                      <div 
                        key={mIdx}
                        className={`py-1 px-1 rounded-lg border text-center transition-all flex flex-col justify-between ${
                          isImpacted
                            ? isCurrent && !isComplete
                              ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-500/20'
                              : 'bg-indigo-50 border-indigo-120/50 text-indigo-805 text-indigo-700'
                            : 'bg-slate-50/60 border-slate-150 text-gray-400'
                        }`}
                        title={`${MONTH_NAMES[mIdx]}: ${isImpacted ? 'Cobrança Ativa' : 'Sem impacto'}`}
                      >
                        <span className="text-[9px] font-black leading-none uppercase">{shortName}</span>
                        <span className={`w-1.5 h-1.5 rounded-full mx-auto mt-1 ${
                          isImpacted 
                            ? isCurrent && !isComplete ? 'bg-amber-300' : 'bg-indigo-500' 
                            : 'bg-transparent'
                        }`} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-between items-center pt-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingDebt(debt);
                      setIsModalOpen(true);
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-blue-600 hover:bg-blue-50 px-2 py-1.5 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                  >
                    <Edit3 size={13} /> Editar
                  </button>
                  <button
                    onClick={() => handleDelete(debt.id)}
                    className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-2 py-1.5 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                  >
                    <Trash2 size={13} /> Excluir
                  </button>
                </div>

                <div className="flex gap-2">
                  {!isComplete && (
                    <>
                      <button
                        onClick={() => handleToggleStatus(debt.id)}
                        className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1.5 rounded-lg transition-colors border ${
                          isActive 
                            ? 'text-amber-600 bg-amber-50 border-amber-100 hover:bg-amber-100' 
                            : 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100'
                        }`}
                      >
                        {isActive ? <PauseCircle size={13} /> : <PlayCircle size={13} />}
                        {isActive ? 'Pausar' : 'Ativar'}
                      </button>

                      <button
                        onClick={() => handleMarkAsPaid(debt.id)}
                        disabled={installmentsPaid >= count}
                        className="flex items-center gap-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                      >
                        <CheckCircle2 size={13} /> +1 Paga
                      </button>
                    </>
                  )}
                  {isComplete && (
                     <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-500 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100">
                       Totalmente Pago
                     </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {debts.length === 0 && (
          <div className="py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl text-gray-500">
            <Receipt className="mx-auto text-gray-300 mb-2" size={40} />
            <p className="font-bold text-gray-700">Nenhum parcelamento cadastrado.</p>
            <p className="text-xs text-gray-400 mt-1">Insira suas dívidas ou negociações para acompanhá-las.</p>
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
