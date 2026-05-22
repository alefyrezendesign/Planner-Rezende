import React, { useState } from 'react';
import { CarScenario } from '../types';
import { formatCurrency } from '../utils';
import { Plus, Trash2, Calculator, Edit2, Car } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CarSimulatorProps {
  cars: CarScenario[];
  onAddCar: () => void;
  onUpdateCar: (car: CarScenario) => void;
  onDeleteCar: (id: string) => void;
}

export function CarSimulator({ cars, onAddCar, onUpdateCar, onDeleteCar }: CarSimulatorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const calculatePMT = (pv: number, i: number, n: number) => {
    if (i === 0) return pv / n;
    return (pv * i) / (1 - Math.pow(1 + i, -n));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, car: CarScenario, field: keyof CarScenario) => {
    const val = field === 'modelName' ? e.target.value : (Number(e.target.value) || 0);
    onUpdateCar({ ...car, [field]: val });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
            <Car className="text-blue-600" />
            Simulador de Veículos
          </h2>
          <p className="text-sm text-gray-500">Compare diferentes cenários de financiamento.</p>
        </div>
        <button
          onClick={onAddCar}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Plus size={18} />
          <span>Novo Cenário</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence>
          {cars.map((car) => {
            const financedAmount = Math.max(0, car.carValue - car.downPaymentTarget);
            const monthlyRate = car.interestRateMonthly / 100;
            const pmt = calculatePMT(financedAmount, monthlyRate, car.installments || 1);
            const totalFinancedCost = pmt * (car.installments || 1);
            const totalCarCost = car.downPaymentTarget + totalFinancedCost;
            const downPaymentProgress = car.downPaymentTarget > 0 ? (car.downPaymentSaved / car.downPaymentTarget) * 100 : 0;
            
            const isEditing = editingId === car.id;

            return (
              <motion.div
                key={car.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4">
                  {isEditing ? (
                    <input
                      type="text"
                      value={car.modelName}
                      onChange={(e) => handleChange(e, car, 'modelName')}
                      placeholder="Modelo do carro"
                      className="text-lg font-bold bg-gray-50 border border-gray-200 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 w-full max-w-xs"
                    />
                  ) : (
                    <h3 className="text-xl font-bold text-gray-900">{car.modelName || 'Novo Cenário'}</h3>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingId(isEditing ? null : car.id)}
                      className={`p-2 rounded-full transition-colors ${isEditing ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`}
                      title={isEditing ? "Salvar" : "Editar"}
                    >
                      {isEditing ? <Calculator size={18} /> : <Edit2 size={18} />}
                    </button>
                    <button
                      onClick={() => onDeleteCar(car.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Edição / Valores Base */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                          Valor do Carro (R$)
                        </label>
                        {isEditing ? (
                          <input
                            type="number"
                            value={car.carValue || ''}
                            onChange={(e) => handleChange(e, car, 'carValue')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        ) : (
                          <p className="text-lg font-medium text-gray-900">{formatCurrency(car.carValue)}</p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                            Entrada Alvo
                          </label>
                          {isEditing ? (
                            <input
                              type="number"
                              value={car.downPaymentTarget || ''}
                              onChange={(e) => handleChange(e, car, 'downPaymentTarget')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          ) : (
                            <p className="text-base font-medium text-gray-900">{formatCurrency(car.downPaymentTarget)}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                            Já Guardado
                          </label>
                          {isEditing ? (
                            <input
                              type="number"
                              value={car.downPaymentSaved || ''}
                              onChange={(e) => handleChange(e, car, 'downPaymentSaved')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            />
                          ) : (
                            <p className="text-base font-medium text-green-600">{formatCurrency(car.downPaymentSaved)}</p>
                          )}
                        </div>
                      </div>
                      
                      {!isEditing && (
                        <div className="mt-2">
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
                     <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
                              Juros mensais (%)
                            </label>
                            {isEditing ? (
                              <input
                                type="number"
                                step="0.01"
                                value={car.interestRateMonthly || ''}
                                onChange={(e) => handleChange(e, car, 'interestRateMonthly')}
                                className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm"
                              />
                            ) : (
                              <p className="text-base font-medium text-blue-900">{car.interestRateMonthly}%</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
                              Parcelas (Qtd)
                            </label>
                            {isEditing ? (
                              <input
                                type="number"
                                value={car.installments || ''}
                                onChange={(e) => handleChange(e, car, 'installments')}
                                className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm"
                              />
                            ) : (
                              <p className="text-base font-medium text-blue-900">{car.installments}x</p>
                            )}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-blue-100">
                          <label className="block text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
                              Valor a Financiar
                          </label>
                          <p className="text-lg font-bold text-gray-900">{formatCurrency(financedAmount)}</p>
                        </div>
                     </div>
                  </div>
                </div>

                {/* Resultado Final */}
                <div className="mt-4 bg-gray-900 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Valor da Parcela Estimada</p>
                    <p className="text-2xl font-bold text-white">{car.installments > 0 ? formatCurrency(pmt) : 'R$ 0,00'}</p>
                  </div>
                  <div className="h-px md:h-10 w-full md:w-px bg-gray-700"></div>
                  <div className="text-right">
                    <p className="text-gray-400 text-sm">Custo Final Estimado do Veículo</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(totalCarCost)}</p>
                  </div>
                </div>

              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {cars.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
             <Car className="mx-auto text-gray-400 mb-3" size={32} />
             <p className="text-gray-500 font-medium">Nenhum cenário de veículo simulado.</p>
             <p className="text-gray-400 text-sm mt-1">Adicione um novo cenário para começar a simular.</p>
          </div>
        )}
      </div>
    </div>
  );
}
