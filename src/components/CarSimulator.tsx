import React, { useState } from "react";
import { CarScenario } from "../types";
import { formatCurrency } from "../utils";
import {
  Plus,
  Trash2,
  Calculator,
  Edit2,
  Car,
  Image as ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CarSimulatorProps {
  cars: CarScenario[];
  globalCarsSavedAmount: number;
  onUpdateGlobalCarsSavedAmount: (val: number) => void;
  onAddCar: () => void;
  onUpdateCar: (car: CarScenario) => void;
  onDeleteCar: (id: string) => void;
}

export function CarSimulator({
  cars,
  globalCarsSavedAmount,
  onUpdateGlobalCarsSavedAmount,
  onAddCar,
  onUpdateCar,
  onDeleteCar,
}: CarSimulatorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditingGlobalSaved, setIsEditingGlobalSaved] = useState(false);
  const [tempGlobalSaved, setTempGlobalSaved] = useState("");

  const calculatePMT = (pv: number, i: number, n: number) => {
    if (i === 0) return pv / n;
    return (pv * i) / (1 - Math.pow(1 + i, -n));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    car: CarScenario,
    field: keyof CarScenario,
  ) => {
    const val =
      field === "modelName" || field === "imageUrl"
        ? e.target.value
        : Number(e.target.value) || 0;
    onUpdateCar({ ...car, [field]: val });
  };

  const handleSaveGlobalAmount = () => {
    onUpdateGlobalCarsSavedAmount(Number(tempGlobalSaved) || 0);
    setIsEditingGlobalSaved(false);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col gap-5 pb-6 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
              <Car className="text-blue-600" size={28} />
              Garagem dos Sonhos
            </h2>
            <p className="text-sm text-gray-500 mt-1.5 max-w-xl">
              Aqui reunimos os carros que desejamos conquistar, simulamos os valores com sabedoria e colocamos cada plano diante de Deus em oração.
            </p>
          </div>
          
          <div className="flex shrink-0 w-full md:w-auto">
            <button
              onClick={onAddCar}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm w-full md:w-auto"
            >
              <Plus size={20} />
              <span>Adicionar Carro</span>
            </button>
          </div>
        </div>

        <div className="flex flex-row items-center gap-3">
          <div className="bg-gray-50 px-4 py-2.5 rounded-xl flex items-center justify-between md:justify-start gap-4 border border-gray-100 shadow-sm w-full md:w-auto">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Veículos</p>
              <p className="text-lg font-black text-gray-700 leading-none">{cars.length}</p>
            </div>
            
            <div className="w-px h-8 bg-gray-200"></div>
            
            <div className="flex items-center gap-2">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Guardado (Global)</p>
                {isEditingGlobalSaved ? (
                  <input
                    type="number"
                    autoFocus
                    className="w-24 text-lg font-black text-emerald-600 bg-white border border-gray-300 rounded px-1.5 min-w-0"
                    value={tempGlobalSaved}
                    onChange={(e) => setTempGlobalSaved(e.target.value)}
                    onBlur={handleSaveGlobalAmount}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveGlobalAmount();
                    }}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-black text-emerald-600 leading-none">{formatCurrency(globalCarsSavedAmount)}</p>
                    <button
                      onClick={() => {
                        setTempGlobalSaved(globalCarsSavedAmount.toString());
                        setIsEditingGlobalSaved(true);
                      }}
                      className="text-gray-400 hover:text-emerald-600 transition-colors bg-white rounded-md p-1 shadow-sm border border-gray-100"
                      title="Ajustar Guardado"
                    >
                      <Edit2 size={12} strokeWidth={3} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence>
          {cars.map((car) => {
            const financedAmount = Math.max(
              0,
              car.carValue - car.downPaymentTarget,
            );
            const monthlyRate = car.interestRateMonthly / 100;
            const pmt = calculatePMT(
              financedAmount,
              monthlyRate,
              car.installments || 1,
            );
            const totalFinancedCost = pmt * (car.installments || 1);
            const totalCarCost = car.downPaymentTarget + totalFinancedCost;
            const missingAmount = Math.max(0, car.downPaymentTarget - globalCarsSavedAmount);
            const downPaymentProgress = car.downPaymentTarget > 0
              ? (globalCarsSavedAmount / car.downPaymentTarget) * 100
              : 0;

            const isEditing = editingId === car.id;

            return (
              <motion.div
                key={car.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Image Section */}
                  <div className="w-full md:w-1/3 bg-gray-50 relative min-h-[200px] border-b md:border-b-0 md:border-r border-gray-100 flex flex-col justify-center items-center">
                    {car.imageUrl ? (
                      <img
                        src={car.imageUrl}
                        alt={car.modelName}
                        className="w-full h-full object-cover absolute inset-0"
                      />
                    ) : (
                      <div className="text-gray-300 flex flex-col items-center gap-2 p-6 z-10 w-full">
                        <Car size={48} />
                        <span className="text-sm font-medium">Sem imagem</span>
                      </div>
                    )}
                    {isEditing && (
                      <div className="absolute top-0 inset-x-0 p-3 flex flex-col gap-2 bg-gradient-to-b from-black/60 to-transparent z-20">
                        <div className="relative flex items-center">
                          <ImageIcon
                            className="absolute left-3 text-white/70"
                            size={16}
                          />
                          <input
                            type="text"
                            value={car.imageUrl || ""}
                            onChange={(e) => handleChange(e, car, "imageUrl")}
                            placeholder="URL da imagem (ex: https://...)"
                            className="bg-black/40 text-white placeholder-white/50 border border-white/20 rounded-lg py-1.5 pl-9 pr-3 text-xs w-full focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm"
                          />
                        </div>
                        <div className="relative flex items-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  onUpdateCar({
                                    ...car,
                                    imageUrl: reader.result as string,
                                  });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="text-xs text-white/80 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-white/20 file:text-white hover:file:bg-white/30 truncate w-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="w-full md:w-2/3 p-5 lg:p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-5">
                        <div className="flex-1 mr-4">
                          {isEditing ? (
                            <input
                              type="text"
                              value={car.modelName}
                              onChange={(e) =>
                                handleChange(e, car, "modelName")
                              }
                              placeholder="Modelo do carro"
                              className="text-2xl font-bold bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 w-full"
                            />
                          ) : (
                            <h3 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">
                              {car.modelName || "Novo Cenário"}
                            </h3>
                          )}
                        </div>
                        <div className="flex items-center gap-1 bg-gray-50 rounded-full p-1 border border-gray-100 shrink-0">
                          <button
                            onClick={() =>
                              setEditingId(isEditing ? null : car.id)
                            }
                            className={`p-2 rounded-full transition-all ${isEditing ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-200 hover:text-gray-900"}`}
                            title={isEditing ? "Salvar" : "Editar"}
                          >
                            {isEditing ? (
                              <Calculator size={16} />
                            ) : (
                              <Edit2 size={16} />
                            )}
                          </button>
                          <button
                            onClick={() => onDeleteCar(car.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Valores Base */}
                        <div className="flex flex-col justify-start">
                          <div className="mb-5">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                              Valor do Carro
                            </label>
                            {isEditing ? (
                              <input
                                type="number"
                                value={car.carValue || ""}
                                onChange={(e) =>
                                  handleChange(e, car, "carValue")
                                }
                                className="w-full max-w-xs px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                              />
                            ) : (
                              <p className="text-2xl font-black text-gray-800 tracking-tight">
                                {formatCurrency(car.carValue)}
                              </p>
                            )}
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
                              <span className="text-gray-500 font-medium">Entrada</span>
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={car.downPaymentTarget || ""}
                                  onChange={(e) =>
                                    handleChange(e, car, "downPaymentTarget")
                                  }
                                  className="w-24 px-2 py-1 border border-gray-300 rounded text-right text-sm"
                                />
                              ) : (
                                <span className="font-bold text-gray-900">{formatCurrency(car.downPaymentTarget)}</span>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
                              <span className="text-gray-500 font-medium">Guardado</span>
                              <span className="font-bold text-emerald-600">{formatCurrency(globalCarsSavedAmount)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
                              <span className="text-gray-500 font-medium">Falta</span>
                              <span className="font-bold text-orange-500">{formatCurrency(missingAmount)}</span>
                            </div>
                          </div>

                          {!isEditing && car.downPaymentTarget > 0 && (
                            <div className="mt-4 pt-1">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                  Progresso
                                </span>
                                <span className={`text-[10px] font-bold ${downPaymentProgress >= 100 ? 'text-emerald-500' : 'text-blue-500'}`}>
                                  {Math.min(100, Math.round(downPaymentProgress))}%
                                </span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${downPaymentProgress >= 100 ? "bg-emerald-500" : "bg-blue-500"}`}
                                  style={{
                                    width: `${Math.min(100, downPaymentProgress)}%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Financiamento */}
                        <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between h-full">
                          <div className="space-y-3 mb-6">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-500 font-medium">Valor a financiar</span>
                              <span className="font-bold text-slate-900">{formatCurrency(financedAmount)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-500 font-medium">Juros (a.m)</span>
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={car.interestRateMonthly || ""}
                                  onChange={(e) => handleChange(e, car, "interestRateMonthly")}
                                  className="w-20 px-2 py-1 border border-slate-300 rounded text-right text-sm bg-white"
                                />
                              ) : (
                                <span className="font-bold text-slate-900">{car.interestRateMonthly}%</span>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-500 font-medium">Prazo</span>
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={car.installments || ""}
                                  onChange={(e) => handleChange(e, car, "installments")}
                                  className="w-20 px-2 py-1 border border-slate-300 rounded text-right text-sm bg-white"
                                />
                              ) : (
                                <span className="font-bold text-slate-900">{car.installments}x</span>
                              )}
                            </div>
                          </div>

                          <div className="pt-5 border-t border-slate-200/60 mt-auto">
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">
                              Parcela Estimada
                            </p>
                            <p className="text-3xl font-black text-blue-600 tracking-tight leading-none mb-2">
                              {car.installments > 0 ? formatCurrency(pmt) : "R$ 0,00"}
                            </p>
                            <p className="text-xs text-slate-500 font-medium">
                              Custo Final: <span className="font-bold text-slate-700">{formatCurrency(totalCarCost)}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {cars.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300">
            <Car className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-600 font-medium text-lg">
              Nenhum cenário de veículo simulado.
            </p>
            <p className="text-gray-400 mt-2 max-w-sm mx-auto">
              Adicione um novo cenário para começar a simular seu financiamento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
