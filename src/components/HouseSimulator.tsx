import React, { useState } from 'react';
import { RealEstateScenario } from '../types';
import { formatCurrency } from '../utils';
import { Plus, Trash2, Calculator, Edit2, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HouseSimulatorProps {
  houses: RealEstateScenario[];
  onAddHouse: () => void;
  onUpdateHouse: (house: RealEstateScenario) => void;
  onDeleteHouse: (id: string) => void;
}

export function HouseSimulator({ houses, onAddHouse, onUpdateHouse, onDeleteHouse }: HouseSimulatorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const calculateAmortization = (financed: number, annualRate: number, installments: number, type: 'SAC' | 'PRICE') => {
    if (financed <= 0 || installments <= 0) return { first: 0, last: 0, totalInterest: 0 };
    
    // In Brazil, nominal rate is usually divided by 12 for monthly rate
    const monthlyRate = (annualRate / 100) / 12;

    if (type === 'PRICE') {
      const pmt = monthlyRate === 0 
        ? financed / installments 
        : (financed * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -installments));
      return {
        first: pmt,
        last: pmt,
        totalInterest: (pmt * installments) - financed
      };
    } else {
      // SAC: Constant Amortization System
      const amortization = financed / installments;
      const firstInstallment = amortization + (financed * monthlyRate);
      const lastInstallment = amortization + (amortization * monthlyRate); // On the last month, the balance is just the amortization amount
      
      const sumOfInstallments = ((firstInstallment + lastInstallment) * installments) / 2;
      
      return {
        first: firstInstallment,
        last: lastInstallment,
        totalInterest: sumOfInstallments - financed
      };
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, house: RealEstateScenario, field: keyof RealEstateScenario) => {
    let val: any;
    if (field === 'propertyName' || field === 'amortizationType') {
      val = e.target.value;
    } else {
      val = Number(e.target.value) || 0;
    }
    onUpdateHouse({ ...house, [field]: val });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
            <Home className="text-indigo-600" />
            Simulador de Imóveis
          </h2>
          <p className="text-sm text-gray-500">Planeje a compra e compare cenários (SAC / PRICE).</p>
        </div>
        <button
          onClick={onAddHouse}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={18} />
          <span>Novo Cenário</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence>
          {houses.map((house) => {
            const financedAmount = Math.max(0, house.propertyValue - house.downPaymentTarget - house.subsidy);
            const { first, last, totalInterest } = calculateAmortization(financedAmount, house.interestRateAnnual, house.installments, house.amortizationType);
            const totalCost = house.downPaymentTarget + financedAmount + totalInterest;
            const downPaymentProgress = house.downPaymentTarget > 0 ? (house.downPaymentSaved / house.downPaymentTarget) * 100 : 0;
            
            const isEditing = editingId === house.id;

            return (
              <motion.div
                key={house.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4">
                  {isEditing ? (
                    <input
                      type="text"
                      value={house.propertyName}
                      onChange={(e) => handleChange(e, house, 'propertyName')}
                      placeholder="Nome do imóvel"
                      className="text-lg font-bold bg-gray-50 border border-gray-200 rounded-lg px-3 py-1 focus:ring-2 focus:ring-indigo-500 w-full max-w-xs"
                    />
                  ) : (
                    <h3 className="text-xl font-bold text-gray-900">{house.propertyName || 'Novo Imóvel'}</h3>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingId(isEditing ? null : house.id)}
                      className={`p-2 rounded-full transition-colors ${isEditing ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`}
                      title={isEditing ? "Salvar" : "Editar"}
                    >
                      {isEditing ? <Calculator size={18} /> : <Edit2 size={18} />}
                    </button>
                    <button
                      onClick={() => onDeleteHouse(house.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Valores Base */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                          Valor do Imóvel (R$)
                        </label>
                        {isEditing ? (
                          <input
                            type="number"
                            value={house.propertyValue || ''}
                            onChange={(e) => handleChange(e, house, 'propertyValue')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        ) : (
                          <p className="text-lg font-medium text-gray-900">{formatCurrency(house.propertyValue)}</p>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 border-t border-gray-200 pt-3 mt-3">
                        <div className="col-span-1">
                          <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                            Subsídio
                          </label>
                          {isEditing ? (
                            <input
                              type="number"
                              value={house.subsidy || ''}
                              onChange={(e) => handleChange(e, house, 'subsidy')}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
                            />
                          ) : (
                            <p className="text-sm font-medium text-gray-700">{formatCurrency(house.subsidy)}</p>
                          )}
                        </div>
                        <div className="col-span-1 border-l border-gray-200 pl-3">
                          <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                            Entrada Alvo
                          </label>
                          {isEditing ? (
                            <input
                              type="number"
                              value={house.downPaymentTarget || ''}
                              onChange={(e) => handleChange(e, house, 'downPaymentTarget')}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
                            />
                          ) : (
                            <p className="text-sm font-medium text-gray-700">{formatCurrency(house.downPaymentTarget)}</p>
                          )}
                        </div>
                        <div className="col-span-1 border-l border-gray-200 pl-3">
                          <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                            Já Guardado
                          </label>
                          {isEditing ? (
                            <input
                              type="number"
                              value={house.downPaymentSaved || ''}
                              onChange={(e) => handleChange(e, house, 'downPaymentSaved')}
                              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-white"
                            />
                          ) : (
                            <p className="text-sm font-medium text-green-600">{formatCurrency(house.downPaymentSaved)}</p>
                          )}
                        </div>
                      </div>
                      
                      {!isEditing && (
                        <div className="mt-2 pt-2">
                           <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500">Progresso da Entrada</span>
                              <span className="font-semibold">{Math.min(100, Math.round(downPaymentProgress))}%</span>
                           </div>
                           <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-green-500 h-1.5 rounded-full" 
                                style={{ width: `${Math.min(100, downPaymentProgress)}%` }}
                              ></div>
                           </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financiamento */}
                  <div className="lg:col-span-2 space-y-4">
                     <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-3 h-full">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-semibold text-indigo-700 uppercase tracking-wider mb-1">
                              Juros Anual (%)
                            </label>
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.1"
                                value={house.interestRateAnnual || ''}
                                onChange={(e) => handleChange(e, house, 'interestRateAnnual')}
                                className="w-full px-2 py-1.5 border border-indigo-200 rounded text-sm bg-white"
                              />
                            ) : (
                              <p className="text-sm font-medium text-indigo-900">{house.interestRateAnnual}%</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-indigo-700 uppercase tracking-wider mb-1">
                              Prazo (Meses)
                            </label>
                            {isEditing ? (
                              <input
                                type="number"
                                value={house.installments || ''}
                                onChange={(e) => handleChange(e, house, 'installments')}
                                className="w-full px-2 py-1.5 border border-indigo-200 rounded text-sm bg-white"
                              />
                            ) : (
                              <p className="text-sm font-medium text-indigo-900">{house.installments}x</p>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-indigo-100 grid grid-cols-2 gap-3 items-center">
                          <div>
                            <label className="block text-[10px] font-semibold text-indigo-700 uppercase tracking-wider mb-1">
                              Sistema
                            </label>
                            {isEditing ? (
                              <select 
                                value={house.amortizationType} 
                                onChange={(e) => handleChange(e, house, 'amortizationType')}
                                className="w-full px-2 py-1.5 border border-indigo-200 rounded text-sm bg-white"
                              >
                                <option value="SAC">SAC (Decrescente)</option>
                                <option value="PRICE">PRICE (Fixa)</option>
                              </select>
                            ) : (
                              <span className="px-2 py-1 rounded bg-indigo-100 text-indigo-800 text-xs font-medium">
                                {house.amortizationType}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                             <label className="block text-[10px] font-semibold text-indigo-700 uppercase tracking-wider mb-1">
                              Valor a Financiar
                            </label>
                            <p className="font-bold text-gray-900">{formatCurrency(financedAmount)}</p>
                          </div>
                        </div>
                     </div>
                  </div>
                </div>

                {/* Resultado Final */}
                <div className="mt-4 bg-gray-900 rounded-xl p-4 flex flex-col md:flex-row justify-between lg:items-center gap-4">
                  <div className="flex-1">
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">Parcelas ({house.amortizationType})</p>
                    {house.amortizationType === 'SAC' ? (
                       <div className="flex items-center gap-2">
                         <span className="text-xl font-bold text-white">{formatCurrency(first)}</span>
                         <span className="text-gray-500">→</span>
                         <span className="text-md font-medium text-gray-300">{formatCurrency(last)}</span>
                       </div>
                    ) : (
                       <div className="text-xl font-bold text-white">{formatCurrency(first)} <span className="text-sm font-normal text-gray-400">fixas</span></div>
                    )}
                  </div>
                  <div className="h-px md:h-10 w-full md:w-px bg-gray-700"></div>
                  <div className="text-right flex-1">
                    <p className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">Custo Final Total</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(totalCost)}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Juros totais: {formatCurrency(totalInterest)}</p>
                  </div>
                </div>

              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {houses.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
             <Home className="mx-auto text-gray-400 mb-3" size={32} />
             <p className="text-gray-500 font-medium">Nenhum cenário de imóvel simulado.</p>
             <p className="text-gray-400 text-sm mt-1">Adicione um novo cenário para começar a simular.</p>
          </div>
        )}
      </div>
    </div>
  );
}
