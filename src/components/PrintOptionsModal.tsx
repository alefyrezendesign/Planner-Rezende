import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, FileText, CheckCircle2 } from 'lucide-react';

export type PrintSection = 'Tarefas' | 'Veículos' | 'Imóveis' | 'Finanças';

interface PrintOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: (options: PrintOptions) => void;
}

export interface PrintOptions {
  sections: PrintSection[];
  includeCover: boolean;
  includeDateTime: boolean;
  includeSummary: boolean;
}

const SECTIONS: { id: PrintSection; label: string; desc: string }[] = [
  { id: 'Tarefas', label: 'Tarefas e Projetos', desc: 'Sua lista de tarefas, status, prioridades e subtarefas.' },
  { id: 'Veículos', label: 'Veículos', desc: 'Controle de carros, gastos, manutenções e informações.' },
  { id: 'Imóveis', label: 'Imóveis', desc: 'Seus imóveis, andamento de pagamentos, taxas e informações.' },
  { id: 'Finanças', label: 'Finanças', desc: 'Fluxo de caixa, parcelamentos, dívidas e caixinhas.' },
];

export const PrintOptionsModal = ({ isOpen, onClose, onPrint }: PrintOptionsModalProps) => {
  const [sections, setSections] = useState<PrintSection[]>(['Tarefas', 'Veículos', 'Imóveis', 'Finanças']);
  const [includeCover, setIncludeCover] = useState(true);
  const [includeDateTime, setIncludeDateTime] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);

  if (!isOpen) return null;

  const handleToggleSection = (id: PrintSection) => {
    setSections(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => setSections(SECTIONS.map(s => s.id));
  const handleClear = () => setSections([]);

  const handlePrint = () => {
    if (sections.length === 0) {
      alert("Selecione pelo menos uma seção para gerar o PDF.");
      return;
    }
    onPrint({
      sections,
      includeCover,
      includeDateTime,
      includeSummary,
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
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
            <h3 className="text-lg font-black text-blue-900 flex items-center gap-2">
              <Printer size={20} className="text-blue-600" /> Gerar Relatório PDF
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-end mb-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Seções para incluir no PDF
                </label>
                <div className="space-x-2 text-[10px] font-bold">
                  <button onClick={handleSelectAll} className="text-blue-600 hover:underline">Selecionar tudo</button>
                  <span className="text-gray-300">|</span>
                  <button onClick={handleClear} className="text-gray-500 hover:underline">Limpar</button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SECTIONS.map((section) => {
                  const isSelected = sections.includes(section.id);
                  return (
                    <button
                      key={section.id}
                      onClick={() => handleToggleSection(section.id)}
                      className={`text-left p-3 rounded-xl border transition-all ${
                        isSelected 
                          ? 'bg-blue-50 border-blue-600 shadow-sm' 
                          : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      } flex items-start gap-3`}
                    >
                      <div className={`mt-0.5 shrink-0 w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white'
                      }`}>
                        {isSelected && <CheckCircle2 size={12} strokeWidth={3} />}
                      </div>
                      <div>
                        <div className={`text-sm font-bold ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                          {section.label}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                          {section.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {sections.length === 0 && (
                <p className="text-xs text-rose-500 font-medium">Selecione pelo menos uma seção para gerar o plano.</p>
              )}
            </div>

            <div className="space-y-3 border-t border-gray-100 pt-5">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Opções Extras
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={includeCover}
                    onChange={(e) => setIncludeCover(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Incluir capa do relatório</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={includeDateTime}
                    onChange={(e) => setIncludeDateTime(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Incluir data e hora de geração</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={includeSummary}
                    onChange={(e) => setIncludeSummary(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Incluir resumo geral nas áreas</span>
                </label>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-all flex-1"
            >
              Cancelar
            </button>
            <button
              onClick={handlePrint}
              disabled={sections.length === 0}
              className="py-3 rounded-xl text-sm font-black bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20 transition-all flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText size={18} />
              Gerar PDF
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
