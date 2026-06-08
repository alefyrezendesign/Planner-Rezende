import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Debt, MONTH_NAMES } from './types';

interface ParcelamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (debt: Partial<Debt>) => void;
  initialData?: Debt | null;
}

export const ParcelamentoModal = ({
  isOpen,
  onClose,
  onSave,
  initialData
}: ParcelamentoModalProps) => {
  const [name, setName] = useState('');
  const [creditor, setCreditor] = useState('');
  const [totalValue, setTotalValue] = useState<number | ''>('');
  const [installmentsCount, setInstallmentsCount] = useState<number | ''>(10);
  const [paidInstallments, setPaidInstallments] = useState<number | ''>(0);
  const [startMonth, setStartMonth] = useState(new Date().getMonth());
  const [status, setStatus] = useState<'Ativo' | 'Pausado' | 'Quitado'>('Ativo');
  const [observations, setObservations] = useState('');
  
  const [calculateMode, setCalculateMode] = useState<'total' | 'installment'>('total');
  const [installmentValue, setInstallmentValue] = useState<number | ''>('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setCreditor(initialData.creditor);
        setTotalValue(initialData.totalValue);
        setInstallmentsCount(initialData.installmentsCount);
        setPaidInstallments(initialData.paidInstallments ?? 0);
        setStartMonth(initialData.startMonth);
        setStatus(initialData.status);
        setObservations(initialData.observations || '');
        setInstallmentValue(initialData.installmentValue);
        setCalculateMode('total');
      } else {
        setName('');
        setCreditor('');
        setTotalValue('');
        setInstallmentsCount(10);
        setPaidInstallments(0);
        setStartMonth(new Date().getMonth());
        setStatus('Ativo');
        setObservations('');
        setInstallmentValue('');
        setCalculateMode('total');
      }
    }
  }, [isOpen, initialData]);

  // Derived calculations based on calculation mode
  const parsedTotal = Number(totalValue) || 0;
  const parsedInstallmentsCount = Number(installmentsCount) || 1;
  const parsedInstallmentValue = Number(installmentValue) || 0;

  const effectiveTotalValue = calculateMode === 'installment' 
    ? parsedInstallmentValue * parsedInstallmentsCount 
    : parsedTotal;
    
  const effectiveInstallmentValue = calculateMode === 'total'
    ? (parsedInstallmentsCount > 0 ? parsedTotal / parsedInstallmentsCount : 0)
    : parsedInstallmentValue;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || effectiveTotalValue <= 0 || parsedInstallmentsCount <= 0) return;

    onSave({
      name: name.trim(),
      creditor: creditor.trim() || 'Desconhecido',
      totalValue: effectiveTotalValue,
      installmentsCount: parsedInstallmentsCount,
      installmentValue: effectiveInstallmentValue,
      startMonth,
      status: Number(paidInstallments) >= parsedInstallmentsCount ? 'Quitado' : status,
      paidInstallments: Number(paidInstallments) || 0,
      observations: observations.trim()
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 bg-blue-50/50">
            <h3 className="text-lg font-black text-blue-900">
              {initialData ? 'Editar Parcelamento' : 'Novo Parcelamento'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto">
            <form id="parcelamento-form" onSubmit={handleSubmit} className="space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Nome do parcelamento *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Celular, Imposto, Geladeira"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 font-bold focus:outline-none focus:ring-2 focus:border-transparent transition-all focus:ring-blue-500/20"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Credor ou Instituição
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Nubank, Mercado Livre, Loja Cem"
                    value={creditor}
                    onChange={(e) => setCreditor(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all focus:ring-blue-500/20"
                  />
                </div>

                <div className="sm:col-span-2 mt-2">
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setCalculateMode('total')}
                      className={`flex-1 text-xs font-bold py-1.5 rounded-lg transition-all ${
                        calculateMode === 'total' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500'
                      }`}
                    >
                      Informar Total
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalculateMode('installment')}
                      className={`flex-1 text-xs font-bold py-1.5 rounded-lg transition-all ${
                        calculateMode === 'installment' ? 'bg-white shadow-sm text-blue-700' : 'text-slate-500'
                      }`}
                    >
                      Informar Parcela
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    {calculateMode === 'total' ? 'Valor Total (R$) *' : 'Valor da Parcela (R$) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={calculateMode === 'total' ? totalValue : installmentValue}
                    onChange={(e) => {
                      if (calculateMode === 'total') {
                        setTotalValue(e.target.value === '' ? '' : Number(e.target.value));
                      } else {
                        setInstallmentValue(e.target.value === '' ? '' : Number(e.target.value));
                      }
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Qtd. de Parcelas
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    placeholder="Ex: 10"
                    value={installmentsCount}
                    onChange={(e) => setInstallmentsCount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all focus:ring-blue-500/20"
                  />
                </div>

                <div className="sm:col-span-2 pt-2 pb-1">
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex justify-between items-center text-xs text-blue-900 font-bold">
                    <span>{calculateMode === 'total' ? 'Valor estimado da parcela:' : 'Valor total do financiamento:'}</span>
                    <span className="font-extrabold text-blue-600">
                      {calculateMode === 'total' 
                        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(effectiveInstallmentValue) + ' /mês'
                        : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(effectiveTotalValue)
                      }
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Mês de Início
                  </label>
                  <select
                    value={startMonth}
                    onChange={(e) => setStartMonth(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 cursor-pointer focus:outline-none focus:ring-2 focus:border-transparent transition-all focus:ring-blue-500/20"
                  >
                    {MONTH_NAMES.map((m, idx) => (
                      <option key={idx} value={idx}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Parcelas Já Pagas
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={parsedInstallmentsCount || 100}
                    step="1"
                    placeholder="Ex: 2"
                    value={paidInstallments}
                    onChange={(e) => setPaidInstallments(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all focus:ring-blue-500/20"
                  />
                </div>

                <div className="sm:col-span-2 border-t border-gray-100 mt-2 pt-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setStatus('Ativo')}
                      className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${
                        status === 'Ativo' ? 'bg-emerald-500 shadow-sm text-white' : 'text-slate-500'
                      }`}
                    >
                      Ativo
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus('Pausado')}
                      className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${
                        status === 'Pausado' ? 'bg-amber-500 shadow-sm text-white' : 'text-slate-500'
                      }`}
                    >
                      Pausado
                    </button>
                    {status === 'Quitado' && (
                      <button
                        type="button"
                        className="flex-1 text-xs font-bold py-2 rounded-lg transition-all bg-indigo-500 shadow-sm text-white"
                      >
                        Quitado
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 text-center">
                    Parcelamentos pausados não impactam a rotina de fluxo mensal.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Observações (opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Algum detalhe sobre esse parcelamento..."
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent transition-all focus:ring-blue-500/20"
                  />
                </div>

              </div>
            </form>
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-all flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="parcelamento-form"
              className="py-3 rounded-xl text-sm font-black bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-all flex-1"
            >
              Salvar parcelamento
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
