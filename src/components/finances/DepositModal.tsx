import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar } from 'lucide-react';
import { CaixinhaDeposit, MONTH_NAMES } from './types';
import { formatCurrency } from '../../utils';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (deposit: CaixinhaDeposit) => void;
  suggestedValue: number;
  mode: 'deposit' | 'skip';
}

export const DepositModal = ({ isOpen, onClose, onSave, suggestedValue, mode }: DepositModalProps) => {
  const currentDate = new Date();
  const [amount, setAmount] = useState<number | ''>('');
  const [month, setMonth] = useState(currentDate.getMonth());
  const [year, setYear] = useState(currentDate.getFullYear());

  useEffect(() => {
    if (isOpen) {
      setAmount(mode === 'deposit' ? suggestedValue : 0);
      setMonth(currentDate.getMonth());
      setYear(currentDate.getFullYear());
    }
  }, [isOpen, suggestedValue, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'deposit' && (!amount || amount <= 0)) return;

    onSave({
      id: `${mode === 'deposit' ? 'dep' : 'skip'}-${Date.now()}`,
      amount: mode === 'deposit' ? Number(amount) : 0,
      month,
      year,
      date: new Date().toISOString(),
      skipped: mode === 'skip',
    });
    onClose();
  };

  if (!isOpen) return null;

  const isSkip = mode === 'skip';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
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
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full sm:max-w-sm bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col pb-[env(safe-area-inset-bottom)]"
        >
          <div className={`px-6 py-4 flex items-center justify-between border-b border-gray-100 ${isSkip ? 'bg-orange-50/50' : 'bg-emerald-50/50'}`}>
            <h3 className={`text-lg font-black ${isSkip ? 'text-orange-900' : 'text-emerald-900'}`}>
              {isSkip ? 'Pular Aporte' : 'Registrar Depósito'}
            </h3>
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${
                isSkip ? 'text-orange-600 hover:text-orange-800 hover:bg-orange-100' : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            <form id="deposit-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Calendar size={14} /> Mês Referência
                </label>
                <div className="flex gap-2">
                  <select
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    className={`flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 font-bold focus:outline-none focus:ring-2 focus:border-transparent transition-all cursor-pointer ${
                      isSkip ? 'focus:ring-orange-500/20' : 'focus:ring-emerald-500/20'
                    }`}
                  >
                    {MONTH_NAMES.map((m, i) => (
                      <option key={m} value={i}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className={`w-24 bg-gray-50 border border-gray-200 rounded-xl px-2 py-2.5 text-sm text-gray-900 font-bold focus:outline-none focus:ring-2 focus:border-transparent transition-all cursor-pointer text-center ${
                      isSkip ? 'focus:ring-orange-500/20' : 'focus:ring-emerald-500/20'
                    }`}
                  >
                    {[year - 1, year, year + 1, year + 2].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {!isSkip && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 mt-4">
                    Valor Depositado (R$)
                  </label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="Ex: 500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-white border-2 border-emerald-100 rounded-xl px-4 py-3 text-lg text-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-black text-center placeholder:text-emerald-200"
                  />
                </div>
              )}
            </form>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="deposit-form"
              className={`flex-1 py-3 rounded-xl text-sm font-black text-white shadow-sm transition-all border ${
                isSkip 
                  ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/20 border-orange-600' 
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 border-emerald-600'
              }`}
            >
              Confirmar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
