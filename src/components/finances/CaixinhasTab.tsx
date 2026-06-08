import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PiggyBank, Plus, Trash2, TrendingUp, Layers, Wallet, History, Edit3, Play, Pause } from 'lucide-react';
import { Caixinha, CaixinhaDeposit, MONTH_NAMES } from './types';
import { formatCurrency } from '../../utils';
import { CaixinhaModal } from './CaixinhaModal';
import { DepositModal } from './DepositModal';

interface CaixinhasTabProps {
  caixinhas: Caixinha[];
  setCaixinhas: (caixinhas: Caixinha[]) => void;
  totalGuardadoMeta: number;
}

export const CaixinhasTab = ({
  caixinhas,
  setCaixinhas,
  totalGuardadoMeta,
}: CaixinhasTabProps) => {
  const [isCaixinhaModalOpen, setIsCaixinhaModalOpen] = useState(false);
  const [editingCaixinha, setEditingCaixinha] = useState<Caixinha | null>(null);

  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositModalMode, setDepositModalMode] = useState<'deposit' | 'skip'>('deposit');
  const [depositingCaixinhaId, setDepositingCaixinhaId] = useState<string | null>(null);

  const handleSaveCaixinha = (caixinhaData: Partial<Caixinha>) => {
    if (caixinhaData.id) {
      setCaixinhas(caixinhas.map((c) => (c.id === caixinhaData.id ? { ...c, ...caixinhaData } as Caixinha : c)));
    } else {
      const newCaixinha: Caixinha = {
        ...caixinhaData,
        id: `caixa-${Date.now()}`,
        deposits: [],
      } as Caixinha;
      setCaixinhas([...caixinhas, newCaixinha]);
    }
  };

  const handleToggleStatus = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCaixinhas(
      caixinhas.map((c) => {
        if (c.id === id) {
          return { ...c, status: c.status === 'Ativo' ? 'Pausado' : 'Ativo' };
        }
        return c;
      })
    );
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCaixinhas(caixinhas.filter((c) => c.id !== id));
  };

  const handleSaveDeposit = (deposit: CaixinhaDeposit) => {
    setCaixinhas(
      caixinhas.map((c) => {
        if (c.id === depositingCaixinhaId) {
          const currentDeposits = c.deposits || [];
          // Replace or add based on month/year combo
          const existingIndex = currentDeposits.findIndex(d => d.month === deposit.month && d.year === deposit.year);
          let newDeposits = [...currentDeposits];
          let diffAmount = deposit.amount;

          if (existingIndex >= 0) {
            diffAmount = deposit.amount - newDeposits[existingIndex].amount;
            newDeposits[existingIndex] = deposit;
          } else {
            newDeposits.push(deposit);
            // sort desc
            newDeposits.sort((a, b) => {
               if (a.year !== b.year) return b.year - a.year;
               return b.month - a.month;
            });
          }

          return {
            ...c,
            deposits: newDeposits,
            currentValue: c.currentValue + diffAmount,
          };
        }
        return c;
      })
    );
  };

  const activeCaixinhasTotal = caixinhas
    .filter((c) => c.status === 'Ativo')
    .reduce((acc, c) => acc + (c.monthlyPlanned || 0), 0);


  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-150 pb-3">
        <div>
          <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <PiggyBank className="text-blue-600" size={20} />
            Caixinha
          </h2>
          <p className="text-xs text-gray-500">
            Organize e acompanhe seus objetivos financeiros.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingCaixinha(null);
            setIsCaixinhaModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border shrink-0 bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-sm"
        >
          <Plus size={14} />
          <span>Nova Caixinha</span>
        </button>
      </div>

      {/* Compact Unified KPIs Dashboard */}
      <div className="glass-card p-5 sm:p-6 overflow-hidden relative">
        <div className="absolute -right-6 -top-6 p-4 opacity-[0.03] pointer-events-none">
          <PiggyBank size={140} />
        </div>
        
        <div className="flex flex-col gap-5 relative">
          {/* Main Balance */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet size={14} className="text-emerald-500" /> 
              Saldo em Caixinhas
            </p>
            <p className="text-4xl sm:text-5xl font-black text-emerald-600 tracking-tight mt-1 leading-none">
              {formatCurrency(totalGuardadoMeta)}
            </p>
          </div>
          
          {/* Secondary KPIs */}
          <div className="flex items-center gap-4 pt-5 border-t border-slate-100">
            <div className="flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={12} className="text-primary-500" /> 
                Aporte Mensal
              </p>
              <p className="text-xl font-black text-primary-600 mt-1 leading-none">
                {formatCurrency(activeCaixinhasTotal)}
              </p>
            </div>
            
            <div className="w-px h-10 bg-slate-100 shrink-0" />
            
            <div className="flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={12} className="text-slate-400" /> 
                Caixinhas ({caixinhas.length})
              </p>
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="text-xs text-slate-600 font-bold truncate">{caixinhas.filter((c) => c.status === 'Ativo').length}</span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0"></span>
                  <span className="text-xs text-slate-500 font-bold truncate">{caixinhas.filter((c) => c.status === 'Pausado').length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Caixinhas Cards Catalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {caixinhas.map((caixinha) => {
          const progressPercent = caixinha.targetValue > 0 ? (caixinha.currentValue / caixinha.targetValue) * 100 : 0;
          const isAtivo = caixinha.status === 'Ativo';

          return (
            <div
              key={caixinha.id}
              className={`border border-gray-200 rounded-3xl p-5 hover:border-gray-300 shadow-sm transition-all flex flex-col justify-between ${
                !isAtivo ? 'opacity-60 grayscale bg-gray-50/70' : 'bg-white'
              }`}
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                    <div className={`p-3 rounded-2xl transition-colors shrink-0 ${
                      isAtivo ? 'bg-blue-50 text-blue-600' : 'bg-gray-150 text-gray-400'
                    }`}>
                      <PiggyBank size={20} className={isAtivo ? "opacity-100" : "opacity-70"} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold text-gray-900 text-[15px] truncate leading-tight">{caixinha.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[11px] text-gray-400 font-medium truncate">{caixinha.objective}</p>
                        {caixinha.startYear !== undefined && caixinha.startMonth !== undefined && 
                         (caixinha.startYear > new Date().getFullYear() || (caixinha.startYear === new Date().getFullYear() && caixinha.startMonth > new Date().getMonth())) && (
                          <span className="text-[9px] bg-purple-50 text-purple-600 border border-purple-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider whitespace-nowrap">
                            Inicia em {MONTH_NAMES[caixinha.startMonth].slice(0, 3)}/{caixinha.startYear}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center shrink-0">
                    <button
                      onClick={(e) => handleToggleStatus(caixinha.id, e)}
                      className={`p-1.5 rounded-lg transition-all shrink-0 ${isAtivo ? 'text-gray-300 hover:text-orange-500 hover:bg-orange-50/50' : 'text-gray-300 hover:text-emerald-500 hover:bg-emerald-50/50'}`}
                      title={isAtivo ? "Pausar Caixinha" : "Ativar Caixinha"}
                    >
                      {isAtivo ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCaixinha(caixinha);
                        setIsCaixinhaModalOpen(true);
                      }}
                      className="text-gray-300 hover:text-blue-500 p-1.5 rounded-lg hover:bg-blue-50/50 transition-all shrink-0"
                      title="Editar Caixinha"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={(e) => handleDelete(caixinha.id, e)}
                      className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50/50 transition-all shrink-0"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="text-2xl font-black text-gray-900 tracking-tight leading-none">{formatCurrency(caixinha.currentValue)}</span>
                      <span className="text-gray-400 text-[10px] font-bold">Meta: {formatCurrency(caixinha.targetValue)}</span>
                    </div>
                    {/* Visual Progress gauge bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-gray-100">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isAtivo ? 'bg-emerald-500' : 'bg-gray-400'}`}
                        style={{ width: `${Math.min(100, progressPercent)}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-wider">
                      <span>Progresso acumulado</span>
                      <span>{Math.round(Math.min(100, progressPercent))}%</span>
                    </div>

                    {caixinha.targetValue > caixinha.currentValue && caixinha.monthlyPlanned > 0 && (
                      <div className="flex justify-center items-center text-[10px] text-gray-500 mt-3 font-bold uppercase tracking-wider bg-gray-50 py-1.5 rounded-lg border border-gray-100">
                        {(() => {
                          const remainingValue = Math.max(0, caixinha.targetValue - caixinha.currentValue);
                          let remainingPayments = Math.ceil(remainingValue / caixinha.monthlyPlanned);
                          const d = new Date();
                          
                          if (remainingPayments > 0) {
                            let safetyLimit = 1200;
                            while (remainingPayments > 0 && safetyLimit > 0) {
                              const isSkipped = caixinha.deposits?.some(
                                dep => dep.skipped && dep.month === d.getMonth() && dep.year === d.getFullYear()
                              );
                              
                              if (!isSkipped) {
                                remainingPayments--;
                              }
                              
                              if (remainingPayments > 0) {
                                d.setMonth(d.getMonth() + 1);
                              }
                              safetyLimit--;
                            }
                          }
                          
                          return (
                            <div className="flex items-center justify-between w-full px-3">
                              <span>Início: {caixinha.startMonth !== undefined && caixinha.startYear !== undefined ? `${MONTH_NAMES[caixinha.startMonth].slice(0, 3)}/${caixinha.startYear}` : 'Imediato'}</span>
                              <span className="text-gray-300">|</span>
                              <span>Alcança em {MONTH_NAMES[d.getMonth()].slice(0, 3)}/{d.getFullYear()}</span>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic Action and quick funding zone for touchscreens */}
              <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col gap-3">
                
                {/* Simulated connection status block */}
                <div
                  onClick={(e) => handleToggleStatus(caixinha.id, e)}
                  className={`flex justify-between items-center rounded-2xl px-3.5 py-2.5 border shrink-0 cursor-pointer select-none transition-all ${
                    isAtivo
                      ? 'bg-emerald-50/70 border-emerald-100 text-emerald-800 hover:bg-emerald-100/50'
                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    {isAtivo ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Guardando Mês
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        Pausada
                      </>
                    )}
                  </span>
                  <span className="font-extrabold text-xs">{formatCurrency(caixinha.monthlyPlanned)}/mês</span>
                </div>

                {caixinha.deposits && caixinha.deposits.length > 0 && (
                  <div className="flex flex-col gap-1.5 px-1">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <History size={10} /> Depósitos Registrados
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {caixinha.deposits.slice(0, 5).map(dep => (
                        <span key={dep.id} className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase flex gap-1 items-center ${dep.skipped ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-gray-100 text-gray-600'}`}>
                          {MONTH_NAMES[dep.month].slice(0,3)}/{dep.year.toString().slice(-2)}
                          <span className={`${dep.skipped ? 'text-orange-300' : 'text-gray-400'}`}>|</span> 
                          {dep.skipped ? 'Pulado' : formatCurrency(dep.amount)}
                        </span>
                      ))}
                      {caixinha.deposits.length > 5 && (
                        <span className="text-[9px] font-bold bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded flex items-center">...</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setDepositModalMode('deposit');
                      setDepositingCaixinhaId(caixinha.id);
                      setIsDepositModalOpen(true);
                    }}
                    className="flex-1 bg-slate-100/50 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-200 hover:border-emerald-100 text-slate-600 font-extrabold py-2.5 rounded-2xl text-[10px] uppercase tracking-wider transition-colors shadow-sm"
                  >
                    + Adicionar
                  </button>
                  <button
                    onClick={() => {
                      setDepositModalMode('skip');
                      setDepositingCaixinhaId(caixinha.id);
                      setIsDepositModalOpen(true);
                    }}
                    className="flex-1 bg-slate-100/50 hover:bg-orange-50 hover:text-orange-600 border border-slate-200 hover:border-orange-100 text-slate-600 font-extrabold py-2.5 rounded-2xl text-[10px] uppercase tracking-wider transition-colors shadow-sm"
                  >
                    Pular Mês
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {caixinhas.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl text-gray-500 bg-gray-50/50">
            <PiggyBank className="mx-auto text-gray-300 mb-4 animate-bounce" size={48} />
            <p className="font-bold text-gray-700 text-lg">Nenhuma caixinha criada.</p>
            <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">Crie metas para organizar e visualizar o progresso da sua poupança.</p>
          </div>
        )}
      </div>

      <CaixinhaModal
        isOpen={isCaixinhaModalOpen}
        onClose={() => setIsCaixinhaModalOpen(false)}
        initialData={editingCaixinha}
        onSave={handleSaveCaixinha}
      />

      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        suggestedValue={
          caixinhas.find((c) => c.id === depositingCaixinhaId)?.monthlyPlanned || 0
        }
        onSave={handleSaveDeposit}
        mode={depositModalMode}
      />
    </div>
  );
};
