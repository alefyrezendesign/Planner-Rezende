import React, { useState } from "react";
import { RealEstateScenario } from "../types";
import { formatCurrency } from "../utils";
import {
  Plus,
  Trash2,
  Calculator,
  Edit2,
  Home,
  Image as ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HouseSimulatorProps {
  houses: RealEstateScenario[];
  onAddHouse: () => void;
  onUpdateHouse: (house: RealEstateScenario) => void;
  onDeleteHouse: (id: string) => void;
}

export function HouseSimulator({
  houses,
  onAddHouse,
  onUpdateHouse,
  onDeleteHouse,
}: HouseSimulatorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

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

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
            <Home className="text-indigo-600" />
            Simulador de Imóveis
          </h2>
          <p className="text-sm text-gray-500">
            Planeje a compra e compare cenários de financiamento (SAC / PRICE).
          </p>
        </div>
        <button
          onClick={onAddHouse}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Novo Cenário</span>
        </button>
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
                ? (house.downPaymentSaved / house.downPaymentTarget) * 100
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
                  <div className="w-full md:w-1/3 bg-gray-50 relative min-h-[220px] border-b md:border-b-0 md:border-r border-gray-100 flex flex-col justify-center items-center">
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
                    {isEditing && (
                      <div className="absolute top-0 inset-x-0 p-3 flex flex-col gap-2 bg-gradient-to-b from-black/60 to-transparent z-20">
                        <div className="relative flex items-center">
                          <ImageIcon
                            className="absolute left-3 text-white/70"
                            size={16}
                          />
                          <input
                            type="text"
                            value={house.imageUrl || ""}
                            onChange={(e) => handleChange(e, house, "imageUrl")}
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
                                  onUpdateHouse({
                                    ...house,
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
                              value={house.propertyName}
                              onChange={(e) =>
                                handleChange(e, house, "propertyName")
                              }
                              placeholder="Nome/Endereço do Imóvel"
                              className="text-2xl font-bold bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 w-full"
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
                            className={`p-2 rounded-full transition-all ${isEditing ? "bg-indigo-600 text-white shadow-sm" : "text-gray-500 hover:bg-gray-200 hover:text-gray-900"}`}
                            title={isEditing ? "Salvar" : "Editar"}
                          >
                            {isEditing ? (
                              <Calculator size={16} />
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Valores Base */}
                        <div className="space-y-4">
                          <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
                            <div className="mb-3">
                              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                                Valor do Imóvel
                              </label>
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={house.propertyValue || ""}
                                  onChange={(e) =>
                                    handleChange(e, house, "propertyValue")
                                  }
                                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                                />
                              ) : (
                                <p className="text-xl font-bold text-gray-900">
                                  {formatCurrency(house.propertyValue)}
                                </p>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200/60">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                                  Entrada Alvo
                                </label>
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
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                                  />
                                ) : (
                                  <p className="text-sm font-semibold text-gray-900">
                                    {formatCurrency(house.downPaymentTarget)}
                                  </p>
                                )}
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                                  Guardado
                                </label>
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={house.downPaymentSaved || ""}
                                    onChange={(e) =>
                                      handleChange(e, house, "downPaymentSaved")
                                    }
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                                  />
                                ) : (
                                  <p className="text-sm font-bold text-green-600">
                                    {formatCurrency(house.downPaymentSaved)}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 pt-3 mt-3 border-t border-gray-200/60">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                                  Subsídio (Minha Casa Minha Vida)
                                </label>
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={house.subsidy || ""}
                                    onChange={(e) =>
                                      handleChange(e, house, "subsidy")
                                    }
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs"
                                  />
                                ) : (
                                  <p className="text-sm font-semibold text-gray-900">
                                    {formatCurrency(house.subsidy)}
                                  </p>
                                )}
                              </div>
                            </div>

                            {!isEditing && house.downPaymentTarget > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200/60">
                                <div className="flex justify-between text-[10px] font-medium mb-1.5">
                                  <span className="text-gray-500 uppercase tracking-widest">
                                    Progresso da Entrada
                                  </span>
                                  <span
                                    className={
                                      downPaymentProgress >= 100
                                        ? "text-green-600"
                                        : "text-indigo-600"
                                    }
                                  >
                                    {Math.min(
                                      100,
                                      Math.round(downPaymentProgress),
                                    )}
                                    %
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-1.5 rounded-full transition-all duration-500 ${downPaymentProgress >= 100 ? "bg-green-500" : "bg-indigo-500"}`}
                                    style={{
                                      width: `${Math.min(100, downPaymentProgress)}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Financiamento */}
                        <div className="space-y-4">
                          <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div>
                                <label className="block text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1.5">
                                  Juros (a.a)
                                </label>
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
                                    className="w-full px-2 py-1.5 border border-indigo-200 rounded-lg text-sm bg-white"
                                  />
                                ) : (
                                  <p className="text-sm font-semibold text-indigo-900">
                                    {house.interestRateAnnual}%
                                  </p>
                                )}
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1.5">
                                  Prazo
                                </label>
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={house.installments || ""}
                                    onChange={(e) =>
                                      handleChange(e, house, "installments")
                                    }
                                    className="w-full px-2 py-1.5 border border-indigo-200 rounded-lg text-sm bg-white"
                                  />
                                ) : (
                                  <p className="text-sm font-semibold text-indigo-900">
                                    {house.installments}x
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="mb-3">
                              <label className="block text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1.5">
                                Sistema de Amortização
                              </label>
                              {isEditing ? (
                                <select
                                  value={house.amortizationType}
                                  onChange={(e) =>
                                    handleChange(e, house, "amortizationType")
                                  }
                                  className="w-full px-2 py-1.5 border border-indigo-200 rounded-lg text-sm bg-white focus:outline-none focus:border-indigo-500"
                                >
                                  <option value="SAC">SAC (Decrescente)</option>
                                  <option value="PRICE">PRICE (Fixa)</option>
                                </select>
                              ) : (
                                <p className="text-sm font-semibold text-indigo-900 bg-white border border-indigo-100 rounded-lg px-2 py-1 inline-flex uppercase">
                                  {house.amortizationType === "SAC"
                                    ? "SAC"
                                    : "PRICE"}
                                </p>
                              )}
                            </div>

                            <div className="pt-3 border-t border-indigo-200/50">
                              <label className="block text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">
                                Valor a Financiar
                              </label>
                              <p className="text-lg font-bold text-indigo-950">
                                {formatCurrency(financedAmount)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Resultado Final */}
                    <div className="mt-5 bg-gray-900 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                      <div className="z-10 w-full sm:w-auto text-center sm:text-left">
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                          {house.amortizationType === "SAC"
                            ? "Primeira Parcela"
                            : "Parcela Fixa"}
                        </p>
                        <p className="text-2xl font-bold text-white">
                          {house.installments > 0
                            ? formatCurrency(first)
                            : "R$ 0,00"}
                        </p>
                        {house.amortizationType === "SAC" &&
                          house.installments > 0 && (
                            <p className="text-gray-500 text-xs mt-1">
                              Última: {formatCurrency(last)}
                            </p>
                          )}
                      </div>
                      <div className="hidden sm:block h-12 w-px bg-gray-700/50 z-10"></div>
                      <div className="z-10 w-full sm:w-auto text-center sm:text-right border-t sm:border-t-0 border-gray-700/50 pt-4 sm:pt-0">
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                          Custo Final Total
                        </p>
                        <p className="text-xl font-bold text-white">
                          {formatCurrency(totalCost)}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          Juros totais: {formatCurrency(totalInterest)}
                        </p>
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
