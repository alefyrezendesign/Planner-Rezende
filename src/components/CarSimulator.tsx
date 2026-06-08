import React, { useState } from "react";
import { CarScenario } from "../types";
import { formatCurrency } from "../utils";
import {
  Plus,
  Trash2,
  Check,
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
  const [localEditCar, setLocalEditCar] = useState<CarScenario | null>(null);
  const [isEditingGlobalSaved, setIsEditingGlobalSaved] = useState(false);
  const [tempGlobalSaved, setTempGlobalSaved] = useState("");

  const calculatePMT = (pv: number, i: number, n: number) => {
    if (i === 0) return pv / n;
    return (pv * i) / (1 - Math.pow(1 + i, -n));
  };

  const handleEditClick = (car: CarScenario) => {
    setEditingId(car.id);
    setLocalEditCar({ ...car });
  };

  const handleSaveClick = (carId: string) => {
    if (localEditCar) {
      onUpdateCar(localEditCar);
    }
    setEditingId(null);
    setLocalEditCar(null);
  };

  const handleLocalChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof CarScenario,
  ) => {
    if (!localEditCar) return;
    const val =
      field === "modelName" || field === "imageUrl"
        ? e.target.value
        : Number(e.target.value) || 0;
    setLocalEditCar({ ...localEditCar, [field]: val });
  };

  const handleInsuranceChange = (field: keyof import("../types").CarInsurance, value: any) => {
    if (!localEditCar) return;
    const currentInsurance = localEditCar.insurance || {
      name: "",
      monthlyValue: 0,
      setupFee: 0,
      coverage: { theft: false, collision: false, thirdParty: false, totalLoss: false, assistance24h: false, glass: false },
    };
    setLocalEditCar({
      ...localEditCar,
      insurance: { ...currentInsurance, [field]: value },
    });
  };

  const handleCoverageChange = (field: keyof import("../types").CarInsurance['coverage'], value: boolean) => {
    if (!localEditCar) return;
    const currentInsurance = localEditCar.insurance || {
      name: "",
      monthlyValue: 0,
      setupFee: 0,
      coverage: { theft: false, collision: false, thirdParty: false, totalLoss: false, assistance24h: false, glass: false },
    };
    setLocalEditCar({
      ...localEditCar,
      insurance: {
        ...currentInsurance,
        coverage: { ...currentInsurance.coverage, [field]: value },
      },
    });
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
            const isEditing = editingId === car.id;
            const activeCar = isEditing && localEditCar ? localEditCar : car;

            const baseFinancedAmount = Math.max(
              0,
              activeCar.carValue - activeCar.downPaymentTarget,
            );
            const extraFees = activeCar.additionalFees || 0;
            const totalFinancedAmount = baseFinancedAmount + extraFees;
            const monthlyRate = activeCar.interestRateMonthly / 100;
            const pmt = calculatePMT(
              totalFinancedAmount,
              monthlyRate,
              activeCar.installments || 1,
            );
            
            const insuranceInfo = activeCar.insurance || {
              name: "",
              monthlyValue: 0,
              setupFee: 0,
              coverage: { theft: false, collision: false, thirdParty: false, totalLoss: false, assistance24h: false, glass: false }
            };
            const totalMonthly = pmt + insuranceInfo.monthlyValue;
            
            const totalFinancedCost = pmt * (activeCar.installments || 1);
            const totalCarCost = activeCar.downPaymentTarget + totalFinancedCost + insuranceInfo.setupFee + (insuranceInfo.monthlyValue * (activeCar.installments || 1));
            const missingAmount = Math.max(0, activeCar.downPaymentTarget - globalCarsSavedAmount);
            const downPaymentProgress = activeCar.downPaymentTarget > 0
              ? (globalCarsSavedAmount / activeCar.downPaymentTarget) * 100
              : 0;

            return (
              <motion.div
                key={car.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Image Section */}
                  <div className="w-full md:w-1/3 flex flex-col border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50">
                   <div className="relative w-full min-h-[200px] flex-1 flex items-center justify-center overflow-hidden bg-gray-100">
                      {activeCar.imageUrl ? (
                        <img
                          src={activeCar.imageUrl}
                          alt={activeCar.modelName}
                          className="w-full h-full object-cover absolute inset-0"
                        />
                      ) : (
                        <div className="text-gray-300 flex flex-col items-center gap-2 p-6 z-10 w-full">
                          <Car size={48} />
                          <span className="text-sm font-medium">Sem imagem</span>
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <div className="p-4 bg-white border-t border-gray-100 space-y-3">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          Alterar Imagem
                        </p>
                        <div className="relative flex items-center">
                          <ImageIcon
                            className="absolute left-3 text-gray-400"
                            size={16}
                          />
                          <input
                            type="text"
                            value={activeCar.imageUrl || ""}
                            onChange={(e) => handleLocalChange(e, "imageUrl")}
                            placeholder="URL da imagem"
                            className="bg-white border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-xs w-full focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                          />
                        </div>
                        <div className="relative flex items-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file && localEditCar) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setLocalEditCar({
                                    ...localEditCar,
                                    imageUrl: reader.result as string,
                                  });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="text-xs text-gray-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 w-full cursor-pointer"
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
                              value={activeCar.modelName}
                              onChange={(e) =>
                                handleLocalChange(e, "modelName")
                              }
                              placeholder="Modelo do carro"
                              className="text-2xl font-bold bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 w-full"
                            />
                          ) : (
                            <h3 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">
                              {activeCar.modelName || "Novo Cenário"}
                            </h3>
                          )}
                        </div>
                        <div className="flex items-center gap-1 bg-gray-50 rounded-full p-1 border border-gray-100 shrink-0">
                          <button
                            onClick={() => {
                              if (isEditing) {
                                handleSaveClick(car.id);
                              } else {
                                handleEditClick(car);
                              }
                            }}
                            className={`p-2 rounded-full transition-all ${isEditing ? "bg-emerald-500 text-white shadow-sm hover:bg-emerald-600" : "text-gray-500 hover:bg-blue-50 hover:text-blue-600"}`}
                            title={isEditing ? "Salvar" : "Editar"}
                          >
                            {isEditing ? (
                              <Check size={16} strokeWidth={3} />
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
                                value={activeCar.carValue || ""}
                                onChange={(e) =>
                                  handleLocalChange(e, "carValue")
                                }
                                className="w-full max-w-xs px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                              />
                            ) : (
                              <p className="text-2xl font-black text-gray-800 tracking-tight">
                                {formatCurrency(activeCar.carValue)}
                              </p>
                            )}
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
                              <span className="text-gray-500 font-medium">Entrada</span>
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={activeCar.downPaymentTarget || ""}
                                  onChange={(e) =>
                                    handleLocalChange(e, "downPaymentTarget")
                                  }
                                  className="w-24 px-2 py-1 border border-gray-300 rounded text-right text-sm"
                                />
                              ) : (
                                <span className="font-bold text-gray-900">{formatCurrency(activeCar.downPaymentTarget)}</span>
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

                          {!isEditing && activeCar.downPaymentTarget > 0 && (
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
                              <span className="text-slate-500 font-medium">Valor do Veículo</span>
                              <span className="font-bold text-slate-600">{formatCurrency(baseFinancedAmount)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-500 font-medium" title="IOF, TC, Seguros e demais taxas que acompanham o financiamento.">Extra (IOF/Taxas)</span>
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={activeCar.additionalFees || ""}
                                  onChange={(e) => handleLocalChange(e, "additionalFees")}
                                  className="w-20 px-2 py-1 border border-slate-300 rounded text-right text-sm bg-white"
                                  placeholder="0"
                                />
                              ) : (
                                <span className={`font-bold ${extraFees > 0 ? "text-slate-900" : "text-slate-400"}`}>
                                  {formatCurrency(extraFees)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200">
                              <span className="text-slate-800 font-bold">Total Financiado</span>
                              <span className="font-black text-slate-900">{formatCurrency(totalFinancedAmount)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-500 font-medium">Juros (a.m)</span>
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={activeCar.interestRateMonthly || ""}
                                  onChange={(e) => handleLocalChange(e, "interestRateMonthly")}
                                  className="w-20 px-2 py-1 border border-slate-300 rounded text-right text-sm bg-white"
                                />
                              ) : (
                                <span className="font-bold text-slate-900">{activeCar.interestRateMonthly}%</span>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-500 font-medium">Prazo</span>
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={activeCar.installments || ""}
                                  onChange={(e) => handleLocalChange(e, "installments")}
                                  className="w-20 px-2 py-1 border border-slate-300 rounded text-right text-sm bg-white"
                                />
                              ) : (
                                <span className="font-bold text-slate-900">{activeCar.installments}x</span>
                              )}
                            </div>
                          </div>

                          <div className="pt-5 border-t border-slate-200/60 mt-auto">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                              Parcela Financiamento
                            </p>
                            <p className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-2">
                              {activeCar.installments > 0 ? formatCurrency(pmt) : "R$ 0,00"}
                            </p>
                            <p className="text-sm text-slate-500 font-medium">
                              Custo Final: <span className="font-bold text-slate-900">{formatCurrency(totalCarCost)}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Seguro Auto Section */}
                      <div className="mt-6 bg-slate-50/70 p-5 rounded-2xl border border-slate-100">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                          {/* Config and form */}
                          <div className="flex-1 space-y-4">
                            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                              Seguro Auto
                            </h4>
                            {isEditing ? (
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Nome do Seguro</label>
                                    <input type="text" value={insuranceInfo.name} onChange={(e) => handleInsuranceChange('name', e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm bg-white" placeholder="Ex: Porto Seguro" />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Adesão / Franquia</label>
                                    <input type="number" value={insuranceInfo.setupFee || ""} onChange={(e) => handleInsuranceChange('setupFee', Number(e.target.value))} className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm bg-white" placeholder="0" />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Valor Mensal</label>
                                    <input type="number" value={insuranceInfo.monthlyValue || ""} onChange={(e) => handleInsuranceChange('monthlyValue', Number(e.target.value))} className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm bg-white" placeholder="0" />
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="block text-xs font-medium text-slate-500 mb-2">Coberturas Inclusas:</label>
                                  <div className="flex flex-wrap gap-2">
                                    {[
                                      { id: 'theft', label: 'Roubo/Furto' },
                                      { id: 'collision', label: 'Colisão' },
                                      { id: 'thirdParty', label: 'Danos Terceiros' },
                                      { id: 'totalLoss', label: 'Perda Total' },
                                      { id: 'assistance24h', label: 'Assistência 24h' },
                                      { id: 'glass', label: 'Vidros' },
                                    ].map(cov => (
                                      <button
                                        key={cov.id}
                                        onClick={() => handleCoverageChange(cov.id as any, !insuranceInfo.coverage[cov.id as keyof typeof insuranceInfo.coverage])}
                                        className={`px-3 py-1 text-xs font-bold rounded-full border transition-all ${insuranceInfo.coverage[cov.id as keyof typeof insuranceInfo.coverage] ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
                                      >
                                        {insuranceInfo.coverage[cov.id as keyof typeof insuranceInfo.coverage] ? '✓ ' : ''}{cov.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-xs text-slate-500 font-medium">Cobertura</p>
                                    <p className="text-sm font-bold text-slate-900">{insuranceInfo.name || 'Não informado'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-500 font-medium">Adesão / Franquia</p>
                                    <p className="text-sm font-bold text-slate-900">{formatCurrency(insuranceInfo.setupFee)}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-500 font-medium">Valor Mensal</p>
                                    <p className="text-sm font-bold text-slate-900">{formatCurrency(insuranceInfo.monthlyValue)}</p>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-1.5 pt-2">
                                  {Object.entries(insuranceInfo.coverage).filter(([_, val]) => val).map(([key, _]) => {
                                    const labels: any = { theft: 'Roubo/Furto', collision: 'Colisão', thirdParty: 'Terceiros', totalLoss: 'Perda Total', assistance24h: 'Assistência 24h', glass: 'Vidros' };
                                    return (
                                      <span key={key} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded uppercase tracking-wider">
                                        {labels[key]}
                                      </span>
                                    );
                                  })}
                                  {!Object.values(insuranceInfo.coverage).some(v => v) && (
                                    <span className="text-xs text-slate-400 italic">Nenhuma cobertura selecionada</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Cost Breakdown */}
                          <div className="bg-slate-100/50 p-4 rounded-xl border border-slate-200 min-w-[200px] flex flex-col justify-center">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Custos Mensais Estimados</p>
                            <div className="space-y-2 mb-3">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600">Financiamento:</span>
                                <span className="font-bold text-slate-900">{formatCurrency(pmt)}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-600">Seguro Auto:</span>
                                <span className="font-bold text-slate-900">{formatCurrency(insuranceInfo.monthlyValue)}</span>
                              </div>
                            </div>
                            <div className="pt-3 border-t border-slate-200">
                              <p className="text-xs font-bold text-slate-800 mb-0.5">Total Mensal (Parc + Seg)</p>
                              <p className="text-2xl font-black text-rose-600 tracking-tight leading-none">
                                {formatCurrency(totalMonthly)}
                              </p>
                            </div>
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
