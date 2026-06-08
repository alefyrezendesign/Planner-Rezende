import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calculator, Target, Calendar } from 'lucide-react';
import { Caixinha } from './types';
import { formatCurrency } from '../../utils';

interface CaixinhaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (caixinha: Partial<Caixinha>) => void;
  initialData?: Caixinha | null;
}

export const CaixinhaModal = ({ isOpen, onClose, onSave, initialData }: CaixinhaModalProps) => {
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [target, setTarget] = useState<number | ''>('');
  const [current, setCurrent] = useState<number | ''>(0);
  
  const [calcMode, setCalcMode] = useState<'monthly' | 'duration'>('monthly');
  const [monthlyPlanned, setMonthlyPlanned] = useState<number | ''>('');
  const [durationMonths, setDurationMonths] = useState<number | ''>('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setObjective(initialData.objective);
        setTarget(initialData.targetValue);
        setCurrent(initialData.currentValue);
        setCalcMode(initialData.calculationMode || 'monthly');
        setMonthlyPlanned(initialData.monthlyPlanned || '');
        setDurationMonths(initialData.durationMonths || '');
      } else {
        setName('');
        setObjective('');
        setTarget('');
        setCurrent(0);
        setCalcMode('monthly');
        setMonthlyPlanned('');
        setDurationMonths('');
      }
    }
  }, [isOpen, initialData]);

  // Derived calculations
  const parsedTarget = Number(target) || 0;
  const parsedCurrent = Number(current) || 0;
  const remaining = Math.max(0, parsedTarget - parsedCurrent);

  let calculatedMonthly = 0;
  let calculatedDuration = 0;

  if (calcMode === 'monthly') {
    const pMonthly = Number(monthlyPlanned) || 0;
    calculatedMonthly = pMonthly;
    calculatedDuration = pMonthly > 0 ? Math.ceil(remaining / pMonthly) : 0;
  } else {
    const pDuration = Number(durationMonths) || 0;
    calculatedDuration = pDuration;
    calculatedMonthly = pDuration > 0 ? remaining / pDuration : 0;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || parsedTarget <= 0) return;

    onSave({
      ...(initialData ? { id: initialData.id } : {}),
      name,
      objective: objective.trim() || 'Economias gerais',
      targetValue: parsedTarget,
      currentValue: parsedCurrent,
      calculationMode: calcMode,
      durationMonths: calculatedDuration,
      monthlyPlanned: calculatedMonthly,
      status: initialData?.status || 'Ativo',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100">
            <h3 className="text-lg font-black text-gray-900">
              {initialData ? 'Editar Caixinha' : 'Nova Caixinha'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto">
            <form id="caixinha-form" onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                {/* Nome e Objetivo */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Nome da Caixinha
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Reserva de Emergência, Viagem"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  />
                </div>

                {/* Target and Initial */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Meta Total (R$)
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Ex: 5000"
                      value={target}
                      onChange={(e) => setTarget(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                      Já Guardado (R$)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="Ex: 0"
                      value={current}
                      onChange={(e) => setCurrent(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="h-px bg-gray-100 my-2" />

                {/* Mode Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                    Estratégia para alcançar a meta
                  </label>
                  <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                    <button
                      type="button"
                      onClick={() => setCalcMode('monthly')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                        calcMode === 'monthly'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Target size={14} /> Valor Fixo Mensal
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcMode('duration')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                        calcMode === 'duration'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Calendar size={14} /> Definir Prazo (Meses)
                    </button>
                  </div>

                  {calcMode === 'monthly' ? (
                    <div className="bg-blue-50/50 border border-blue-100/50 rounded-xl p-4">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        Quanto quer guardar por mês?
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="Ex: 500"
                        value={monthlyPlanned}
                        onChange={(e) => setMonthlyPlanned(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold mb-3"
                      />
                      <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm">
                        <div className="p-2 bg-blue-100/50 rounded-lg text-blue-600">
                          <Calculator size={16} />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Tempo Estimado</p>
                          <p className="text-sm font-black text-gray-900">
                            {calculatedDuration > 0 ? `${calculatedDuration} meses` : '--'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50/50 border border-blue-100/50 rounded-xl p-4">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                        Em quantos meses quer alcançar?
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        placeholder="Ex: 12"
                        value={durationMonths}
                        onChange={(e) => setDurationMonths(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold mb-3"
                      />
                      <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm">
                        <div className="p-2 bg-blue-100/50 rounded-lg text-blue-600">
                          <Calculator size={16} />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Valor Mensal Necessário</p>
                          <p className="text-sm font-black text-gray-900">
                            {calculatedMonthly > 0 ? formatCurrency(calculatedMonthly) : '--'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="caixinha-form"
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors"
            >
              {initialData ? 'Salvar Alterações' : 'Criar Caixinha'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
