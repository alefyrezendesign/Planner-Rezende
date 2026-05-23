import React, { useState } from "react";
import { RealEstateScenario } from "../types";
import { formatCurrency } from "../utils";
import {
  Plus,
  Trash2,
  Check,
  Edit2,
  Home,
  Image as ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HouseSimulatorProps {
  houses: RealEstateScenario[];
  globalHousesSavedAmount: number;
  onUpdateGlobalHousesSavedAmount: (val: number) => void;
  onAddHouse: () => void;
  onUpdateHouse: (house: RealEstateScenario) => void;
  onDeleteHouse: (id: string) => void;
}

export function HouseSimulator({
  houses,
  globalHousesSavedAmount,
  onUpdateGlobalHousesSavedAmount,
  onAddHouse,
  onUpdateHouse,
  onDeleteHouse,
}: HouseSimulatorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditingGlobalSaved, setIsEditingGlobalSaved] = useState(false);
  const [tempGlobalSaved, setTempGlobalSaved] = useState("");

  const calculateAmortization = (
    financed: number,
    annualRate: number,
    installments: number,
    type: "SAC" | "PRICE",
  ) => {
    if (financed <= 0 || installments <= 0)
      return { first: 0, last: 0, totalInterest: 0 };

    // In Brazil, nominal rate is usually divided by 12 for monthly rate
    const monthlyRate = annualRate / 100 / 12;

    if (type === "PRICE") {
      const pmt =
        monthlyRate === 0
          ? financed / installments
          : (financed * monthlyRate) /
            (1 - Math.pow(1 + monthlyRate, -installments));
      return {
        first: pmt,
        last: pmt,
        totalInterest: pmt * installments - financed,
      };
    } else {
      // SAC: Constant Amortization System
      const amortization = financed / installments;
      const firstInstallment = amortization + financed * monthlyRate;
      const lastInstallment = amortization + amortization * monthlyRate; // On the last month, the balance is just the amortization amount

      const sumOfInstallments =
        ((firstInstallment + lastInstallment) * installments) / 2;

      return {
        first: firstInstallment,
        last: lastInstallment,
        totalInterest: sumOfInstallments - financed,
      };
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    house: RealEstateScenario,
    field: keyof RealEstateScenario,
  ) => {
    let val: any;
    if (
      field === "propertyName" ||
      field === "amortizationType" ||
      field === "imageUrl"
    ) {
      val = e.target.value;
    } else {
      val = Number(e.target.value) || 0;
    }
    onUpdateHouse({ ...house, [field]: val });
  };

  const handleSaveGlobalAmount = () => {
    onUpdateGlobalHousesSavedAmount(Number(tempGlobalSaved) || 0);
    setIsEditingGlobalSaved(false);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col gap-5 pb-6 border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
              <Home className="text-blue-600" size={28} />
              Lar da Promessa
            </h2>
            <p className="text-sm text-gray-500 mt-1.5 max-w-xl">
              Aqui reunimos os imóveis que desejamos conquistar, simulamos cada cenário com sabedoria e colocamos esse sonho diante de Deus em oração.
            </p>
          </div>
          
          <div className="flex shrink-0 w-full md:w-auto">
            <button
              onClick={onAddHouse}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm w-full md:w-auto"
            >
              <Plus size={20} />
              <span>Novo Cenário</span>
            </button>
          </div>
        </div>

        <div className="flex flex-row items-center gap-3">
          <div className="bg-gray-50 px-4 py-2.5 rounded-xl flex items-center justify-between md:justify-start gap-4 border border-gray-100 shadow-sm w-full md:w-auto">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Imóveis</p>
              <p className="text-lg font-black text-gray-700 leading-none">{houses.length}</p>
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
                    <p className="text-lg font-black text-emerald-600 leading-none">{formatCurrency(globalHousesSavedAmount)}</p>
                    <button
                      onClick={() => {
                        setTempGlobalSaved(globalHousesSavedAmount.toString());
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
          {houses.map((house) => {
            const financedAmount = Math.max(
              0,
              house.propertyValue - house.downPaymentTarget - house.subsidy,
            );
            const { first, last, totalInterest } = calculateAmortization(
              financedAmount,
              house.interestRateAnnual,
              house.installments,
              house.amortizationType,
            );
            const totalCost =
              house.downPaymentTarget + financedAmount + totalInterest;
            const downPaymentProgress =
              house.downPaymentTarget > 0
                ? (globalHousesSavedAmount / house.downPaymentTarget) * 100
                : 0;

            const isEditing = editingId === house.id;

            return (
              <motion.div
                key={house.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Image Section */}
                  <div className="w-full md:w-1/3 flex flex-col border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50">
                    <div className="relative w-full min-h-[220px] flex-1 flex items-center justify-center overflow-hidden bg-gray-100">
                      {house.imageUrl ? (
                        <img
                          src={house.imageUrl}
                          alt={house.propertyName}
                          className="w-full h-full object-cover absolute inset-0"
                        />
                      ) : (
                        <div className="text-gray-300 flex flex-col items-center gap-2 p-6 z-10 w-full">
                          <Home size={48} />
                          <span className="text-sm font-medium">Sem imagem</span>
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <div className="p-4 bg-white border-t border-gray-100 space-y-3">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          Alterar imagem
                        </p>
                        <div className="relative flex items-center">
                          <ImageIcon
                            className="absolute left-3 text-gray-400"
                            size={16}
                          />
                          <input
                            type="text"
                            value={house.imageUrl || ""}
                            onChange={(e) => handleChange(e, house, "imageUrl")}
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
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  onUpdateHouse({
                                    ...house,
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
                              value={house.propertyName}
                              onChange={(e) =>
                                handleChange(e, house, "propertyName")
                              }
                              placeholder="Nome/Endereço do Imóvel"
                              className="text-2xl font-bold bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 w-full"
                            />
                          ) : (
                            <h3 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">
                              {house.propertyName || "Novo Cenário"}
                            </h3>
                          )}
                        </div>
                        <div className="flex items-center gap-1 bg-gray-50 rounded-full p-1 border border-gray-100 shrink-0">
                          <button
                            onClick={() =>
                              setEditingId(isEditing ? null : house.id)
                            }
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
                            onClick={() => onDeleteHouse(house.id)}
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
                              Valor do Imóvel
                            </label>
                            {isEditing ? (
                              <input
                                type="number"
                                value={house.propertyValue || ""}
                                onChange={(e) =>
                                  handleChange(e, house, "propertyValue")
                                }
                                className="w-full max-w-xs px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                              />
                            ) : (
                              <p className="text-2xl font-black text-gray-800 tracking-tight">
                                {formatCurrency(house.propertyValue)}
                              </p>
                            )}
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
                              <span className="text-gray-500 font-medium">Entrada</span>
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={house.downPaymentTarget || ""}
                                  onChange={(e) =>
                                    handleChange(
                                      e,
                                      house,
                                      "downPaymentTarget",
                                    )
                                  }
                                  className="w-24 px-2 py-1 border border-gray-300 rounded text-right text-sm"
                                />
                              ) : (
                                <span className="font-bold text-gray-900">{formatCurrency(house.downPaymentTarget)}</span>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
                              <span className="text-gray-500 font-medium">Subsídio (MCMV)</span>
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={house.subsidy || ""}
                                  onChange={(e) =>
                                    handleChange(e, house, "subsidy")
                                  }
                                  className="w-24 px-2 py-1 border border-gray-300 rounded text-right text-sm"
                                />
                              ) : (
                                <span className="font-bold text-gray-900">{formatCurrency(house.subsidy)}</span>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
                              <span className="text-gray-500 font-medium">Guardado</span>
                              <span className="font-bold text-emerald-600">{formatCurrency(globalHousesSavedAmount)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
                              <span className="text-gray-500 font-medium">Falta</span>
                              <span className="font-bold text-orange-500">
                                {formatCurrency(Math.max(0, house.downPaymentTarget - globalHousesSavedAmount))}
                              </span>
                            </div>
                          </div>

                          {!isEditing && house.downPaymentTarget > 0 && (
                            <div className="mt-4 pt-1">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                  Progresso
                                </span>
                                <span
                                  className={`text-[10px] font-bold ${
                                    downPaymentProgress >= 100
                                      ? "text-emerald-500"
                                      : "text-blue-500"
                                  }`}
                                >
                                  {Math.min(
                                    100,
                                    Math.round(downPaymentProgress),
                                  )}
                                  %
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
                              <span className="text-slate-500 font-medium">Juros (a.a)</span>
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={house.interestRateAnnual || ""}
                                  onChange={(e) =>
                                    handleChange(
                                      e,
                                      house,
                                      "interestRateAnnual",
                                    )
                                  }
                                  className="w-20 px-2 py-1 border border-slate-300 rounded text-right text-sm bg-white"
                                />
                              ) : (
                                <span className="font-bold text-slate-900">
                                  {house.interestRateAnnual}%
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-500 font-medium">Prazo</span>
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={house.installments || ""}
                                  onChange={(e) =>
                                    handleChange(e, house, "installments")
                                  }
                                  className="w-20 px-2 py-1 border border-slate-300 rounded text-right text-sm bg-white"
                                />
                              ) : (
                                <span className="font-bold text-slate-900">
                                  {house.installments}x
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-500 font-medium">Amortização</span>
                              {isEditing ? (
                                <select
                                  value={house.amortizationType}
                                  onChange={(e) =>
                                    handleChange(e, house, "amortizationType")
                                  }
                                  className="w-24 px-2 py-1 border border-slate-300 rounded text-sm bg-white focus:outline-none"
                                >
                                  <option value="SAC">SAC</option>
                                  <option value="PRICE">PRICE</option>
                                </select>
                              ) : (
                                <span className="font-bold text-slate-900 uppercase">
                                  {house.amortizationType}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="pt-5 border-t border-slate-200/60 mt-auto">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                              {house.amortizationType === "SAC"
                                ? "Primeira Parcela"
                                : "Parcela Fixa"}
                            </p>
                            <div className="mb-2">
                              <p className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                                {house.installments > 0
                                  ? formatCurrency(first)
                                  : "R$ 0,00"}
                              </p>
                              {house.amortizationType === "SAC" &&
                                house.installments > 0 && (
                                  <p className="text-[11px] font-medium text-slate-500 mt-1">
                                    Última: {formatCurrency(last)}
                                  </p>
                                )}
                            </div>
                            <p className="text-sm text-slate-500 font-medium mt-3 pt-3 border-t border-slate-200/50">
                              Custo Final: <span className="font-bold text-slate-900">{formatCurrency(totalCost)}</span>
                              <span className="block mt-0.5 text-[10px]">
                                Juros totais: {formatCurrency(totalInterest)}
                              </span>
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

        {houses.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300">
            <Home className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-600 font-medium text-lg">
              Nenhum cenário de imóvel simulado.
            </p>
            <p className="text-gray-400 mt-2 max-w-sm mx-auto">
              Adicione um novo cenário para começar a planejar seu financiamento
              imobiliário.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
