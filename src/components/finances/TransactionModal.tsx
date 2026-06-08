import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowUpRight, ArrowDownRight, Save } from 'lucide-react';
import { CATEGORIES_REVENUES, CATEGORIES_EXPENSES, MONTH_NAMES } from './types';

export type TransactionType = 'revenue' | 'expense' | null;

export interface TransactionFormData {
  type: 'revenue' | 'expense';
  description: string;
  value: number;
  month: number;
  category: string;
  recurrenceType: 'unique' | 'fixed' | 'installments';
  installmentsCount?: number;
  active?: boolean;
}

export type EditScope = 'single' | 'future' | 'all';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TransactionFormData, editScope?: EditScope) => void;
  initialType?: TransactionType;
  itemToEdit?: any; // The existing item
}

export const TransactionModal = ({ isOpen, onClose, onSave, initialType, itemToEdit }: TransactionModalProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [type, setType] = useState<'revenue' | 'expense'>('revenue');
  const [desc, setDesc] = useState('');
  const [val, setVal] = useState('');
  const [month, setMonth] = useState(new Date().getMonth());
  const [cat, setCat] = useState('');
  const [recType, setRecType] = useState<'unique' | 'fixed' | 'installments'>('unique');
  const [instCount, setInstCount] = useState('');
  const [activeStatus, setActiveStatus] = useState<boolean>(true);
  const [editScope, setEditScope] = useState<EditScope>('single');

  useEffect(() => {
    if (isOpen) {
      if (itemToEdit) {
        setStep(2);
        setType(itemToEdit.type || initialType || 'revenue');
        setDesc(itemToEdit.description);
        setVal(String(itemToEdit.value));
        setMonth(itemToEdit.month);
        setCat(itemToEdit.category || (type === 'revenue' ? 'Outros' : 'Outros'));
        setRecType(itemToEdit.recurrenceType || 'unique');
        setInstCount(itemToEdit.installmentsCount ? String(itemToEdit.installmentsCount) : '');
        setActiveStatus(itemToEdit.active !== false);
        setEditScope('single'); // default
      } else {
        setStep(initialType ? 2 : 1);
        setType(initialType || 'revenue');
        setDesc('');
        setVal('');
        setMonth(new Date().getMonth());
        setCat('');
        setRecType('unique');
        setInstCount('');
        setActiveStatus(true);
        setEditScope('single');
      }
    }
  }, [isOpen, itemToEdit, initialType]);

  if (!isOpen) return null;

  const isEditing = !!itemToEdit;
  const isRecurrent = recType !== 'unique' || (isEditing && itemToEdit.recurrenceType !== 'unique' && itemToEdit.groupId);

  const handleNext = (selectedType: 'revenue' | 'expense') => {
    setType(selectedType);
    setCat(selectedType === 'revenue' ? 'Salário' : 'Moradia');
    setStep(2);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim() || !val || Number(val) < 0) return;
    if (recType === 'installments' && (!instCount || Number(instCount) < 2)) return;

    onSave({
      type,
      description: desc.trim(),
      value: Number(val),
      month,
      category: cat || (type === 'revenue' ? 'Outros' : 'Outros'),
      recurrenceType: recType,
      installmentsCount: recType === 'installments' ? Number(instCount) : undefined,
      active: activeStatus,
    }, isEditing ? editScope : undefined);
    
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] pb-[env(safe-area-inset-bottom)]"
        >
          <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-base font-black text-gray-800">
              {isEditing ? 'Editar Lançamento' : 'Novo Lançamento'}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="overflow-y-auto p-5">
            {step === 1 && !isEditing ? (
              <div className="space-y-4">
                <p className="text-sm font-bold text-gray-500 text-center mb-6">O que você deseja lançar?</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleNext('revenue')}
                    className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-emerald-100 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                  >
                    <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md">
                      <ArrowUpRight size={24} strokeWidth={3} />
                    </div>
                    <span className="font-black text-emerald-800 text-sm tracking-wider uppercase">Receita</span>
                  </button>
                  <button
                    onClick={() => handleNext('expense')}
                    className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-rose-100 bg-rose-50 hover:bg-rose-100 transition-colors"
                  >
                    <div className="w-12 h-12 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-md">
                      <ArrowDownRight size={24} strokeWidth={3} />
                    </div>
                    <span className="font-black text-rose-800 text-sm tracking-wider uppercase">Despesa</span>
                  </button>
                </div>
              </div>
            ) : (
              <form id="transaction-form" onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Descrição</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ex: Salário, Aluguel, Supermercado"
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Valor (R$)</label>
                    <input 
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      placeholder="0,00"
                      value={val}
                      onChange={(e) => setVal(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-black text-gray-800 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {!isEditing && (
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Mês de Referência</label>
                    <select 
                      value={month}
                      onChange={(e) => setMonth(Number(e.target.value))}
                      className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-800 outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {MONTH_NAMES.map((name, i) => (
                        <option key={i} value={i}>{name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Recurrence config */}
                {!isEditing && (
                  <div className="pt-2 border-t border-gray-100">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Recorrência</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setRecType('unique')}
                        className={`p-2 rounded-xl text-xs font-bold transition-all border ${recType === 'unique' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-500'}`}
                      >
                        Único
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecType('fixed')}
                        className={`p-2 rounded-xl text-xs font-bold transition-all border ${recType === 'fixed' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-500'}`}
                      >
                        Fixo Mensal
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecType('installments')}
                        className={`p-2 rounded-xl text-xs font-bold transition-all border ${recType === 'installments' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-500'}`}
                      >
                        Repetir
                      </button>
                    </div>

                    {recType === 'installments' && (
                      <div className="mt-3">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Repetir por quantas vezes?</label>
                        <input 
                          type="number"
                          min="2"
                          required
                          placeholder="Ex: 6"
                          value={instCount}
                          onChange={(e) => setInstCount(e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-500"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Status Toggle (only makes sense for editing fixed recurrent ones or initially if desired, but user says "status ativo ou pausado"). Let's show for fixed recurrent ones. */}
                {isEditing && recType === 'fixed' && (
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] font-bold text-gray-500 uppercase">Status</span>
                      <span className="text-xs text-gray-400 font-medium">Lançamentos pausados não entram nos cálculos</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={activeStatus} onChange={(e) => setActiveStatus(e.target.checked)} />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      <span className="ml-2 text-xs font-bold text-gray-700">{activeStatus ? 'Ativo' : 'Pausado'}</span>
                    </label>
                  </div>
                )}

                {/* Edit Scope config */}
                {isEditing && isRecurrent && (
                  <div className="pt-2 border-t border-gray-100">
                    <label className="block text-[10px] font-bold text-rose-500 uppercase mb-2">Este é um lançamento recorrente. O que deseja alterar?</label>
                    <div className="flex flex-col gap-2 relative">
                      <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${editScope === 'single' ? 'bg-rose-50 border-rose-500' : 'bg-gray-50 border-gray-200'}`}>
                        <input type="radio" checked={editScope === 'single'} onChange={() => setEditScope('single')} className="text-rose-500" />
                        <span className="text-xs font-bold text-gray-700">Apenas este lançamento</span>
                      </label>
                      <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${editScope === 'future' ? 'bg-rose-50 border-rose-500' : 'bg-gray-50 border-gray-200'}`}>
                        <input type="radio" checked={editScope === 'future'} onChange={() => setEditScope('future')} className="text-rose-500" />
                        <span className="text-xs font-bold text-gray-700">Este e os próximos</span>
                      </label>
                      <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${editScope === 'all' ? 'bg-rose-50 border-rose-500' : 'bg-gray-50 border-gray-200'}`}>
                        <input type="radio" checked={editScope === 'all'} onChange={() => setEditScope('all')} className="text-rose-500" />
                        <span className="text-xs font-bold text-gray-700">Toda a recorrência</span>
                      </label>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex gap-3">
            {step === 2 && !isEditing && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-all"
              >
                Voltar
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-all flex-1"
            >
              Cancelar
            </button>
            {step === 2 && (
              <button
                type="submit"
                form="transaction-form"
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-black text-white shadow-sm transition-all ${
                  type === 'revenue' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                <Save size={16} />
                {isEditing ? 'Salvar Edição' : 'Concluir'}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
