import React from 'react';
import { BarChart3, Sparkles, ArrowRight, TrendingUp, CalendarDays, Wallet, BarChart2 } from 'lucide-react';
import { MONTH_NAMES } from './types';
import { formatCurrency } from '../../utils';

interface VisaoAnualTabProps {
  allMonthsData: Array<{
    index: number;
    name: string;
    totalRevenues: number;
    totalExpenses: number;
    totalCaixinhas: number;
    totalInstallments: number;
    saldoLivre: number;
  }>;
  onFocusMonth: (monthIndex: number) => void;
}

export const VisaoAnualTab = ({
  allMonthsData,
  onFocusMonth,
}: VisaoAnualTabProps) => {
  const annualTotalRevenues = allMonthsData.reduce((acc, d) => acc + d.totalRevenues, 0);
  const annualTotalExpenses = allMonthsData.reduce((acc, d) => acc + d.totalExpenses, 0);
  const annualTotalCaixinhas = allMonthsData.reduce((acc, d) => acc + d.totalCaixinhas, 0);
  const annualTotalInstallments = allMonthsData.reduce((acc, d) => acc + d.totalInstallments, 0);
  const annualTotalNet = annualTotalRevenues - annualTotalExpenses - annualTotalCaixinhas - annualTotalInstallments;

  // Find peak savings and outflows months
  const monthsWithTotals = allMonthsData.map(d => ({
    name: d.name,
    index: d.index,
    saldoLivre: d.saldoLivre,
    outflows: d.totalExpenses + d.totalCaixinhas + d.totalInstallments
  }));

  const monthWithHighestOutflows = [...monthsWithTotals].sort((a, b) => b.outflows - a.outflows)[0];
  const monthWithHighestSobra = [...monthsWithTotals].sort((a, b) => b.saldoLivre - a.saldoLivre)[0];

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
            <BarChart3 size={24} className="text-primary-600" />
            Visão Anual
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Resumo unificado dos 12 meses. Monitore poupança, picos de gastos e lucros consolidados.
          </p>
        </div>
      </div>

      {/* Functional Consolidated Dashboard */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-0 md:divide-x divide-slate-100">
          
          {/* Coluna 1: Entradas */}
          <div className="md:pr-5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
              <TrendingUp size={12} className="text-emerald-500" /> Entradas Totais
            </p>
            <p className="text-xl font-black text-emerald-600 tracking-tight leading-none">{formatCurrency(annualTotalRevenues)}</p>
            <p className="text-[10px] text-slate-500 font-bold mt-2">Média: {formatCurrency(annualTotalRevenues / 12)}/mês</p>
          </div>

          {/* Coluna 2: Saídas */}
          <div className="md:pl-5 md:pr-5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
              <ArrowRight size={12} className="text-rose-400" /> Saídas Totais
            </p>
            <p className="text-xl font-black text-slate-700 tracking-tight leading-none">{formatCurrency(annualTotalExpenses)}</p>
            <p className="text-[10px] text-slate-500 font-bold mt-2">Média: {formatCurrency(annualTotalExpenses / 12)}/mês</p>
          </div>

          {/* Coluna 3: Picos do Ano */}
          <div className="md:pl-5 md:pr-5 hidden sm:block">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
              <CalendarDays size={12} className="text-slate-400" /> Picos do Ano
            </p>
            <div className="flex flex-col gap-2 pt-0.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 font-bold">Maior Sobra</span>
                <span className="font-black text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">{monthWithHighestSobra?.name.substring(0,3)}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-500 font-bold">Mês + Caro</span>
                <span className="font-black text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{monthWithHighestOutflows?.name.substring(0,3)}</span>
              </div>
            </div>
          </div>

          {/* Coluna 4: Saldo Líquido */}
          <div className="md:pl-5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
              <Wallet size={12} className={annualTotalNet >= 0 ? 'text-primary-500' : 'text-rose-500'} /> Saldo Líquido
            </p>
            <p className={`text-xl font-black tracking-tight leading-none ${annualTotalNet >= 0 ? 'text-primary-600' : 'text-rose-600'}`}>
              {formatCurrency(annualTotalNet)}
            </p>
            <p className="text-[10px] text-slate-500 font-bold mt-2">Acúmulo total projetado</p>
          </div>

        </div>
      </div>

      {/* HYBRID LAYOUT COMPONENT: MOBILE LIST CARDS / DESKTOP SPREADSHEET TABLE */}
      <div>
        {/* 1. MOBILE CARDS VIEW (Displayed on mobile. Hidden on md breakpoint and original) */}
        <div className="block md:hidden space-y-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Meses do Ano (Detalhamento Rápido)</p>
          <div className="space-y-2.5">
            {allMonthsData.map((d) => {
              const isNegative = d.saldoLivre < 0;
              const hasStrongSobra = d.saldoLivre > 2500;

              return (
                <div 
                  key={d.index}
                  onClick={() => onFocusMonth(d.index)}
                  className={`p-4 rounded-2xl border transition-all active:scale-[0.98] ${
                    isNegative 
                      ? 'bg-rose-50 border-rose-100 hover:border-rose-200' 
                      : hasStrongSobra 
                      ? 'bg-emerald-50 border-emerald-100 hover:border-emerald-200'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900">{d.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Clique para carregar e lançar</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-black px-2 py-1 rounded-lg ${
                        isNegative
                          ? 'bg-rose-100 text-rose-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {formatCurrency(d.saldoLivre)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-500 font-medium">
                    <div>
                      <span className="block text-emerald-600 font-extrabold">Entradas</span>
                      <span className="font-bold">{formatCurrency(d.totalRevenues)}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400">Gastos Ord.</span>
                      <span className="font-bold">{formatCurrency(d.totalExpenses)}</span>
                    </div>
                    <div>
                      <span className="block text-amber-500">Caixas</span>
                      <span className="font-bold">{formatCurrency(d.totalCaixinhas)}</span>
                    </div>
                    <div>
                      <span className="block text-indigo-500">Parc.</span>
                      <span className="font-bold">{formatCurrency(d.totalInstallments)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. DESKTOP SPREADSHEET TABLE VIEW (Hidden on mobile. Flex on md and above) */}
        <div className="hidden md:block overflow-x-auto border border-slate-200 rounded-2xl bg-white">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              <tr>
                <th className="p-4 pl-6">Mês Referência</th>
                <th className="p-4 text-emerald-600 font-black">Receitas (+)</th>
                <th className="p-4 text-rose-500 font-black">Despesas (-)</th>
                <th className="p-4 text-amber-600">Caixas</th>
                <th className="p-4 text-indigo-600">Parcelados</th>
                <th className="p-4 text-right">Saldo Livre Projetado</th>
                <th className="p-4 text-center pr-6">Gerir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold">
              {allMonthsData.map((d) => {
                const isNegative = d.saldoLivre < 0;
                const hasStrongSobra = d.saldoLivre > 2500;

                return (
                  <tr 
                    key={d.index}
                    onClick={() => onFocusMonth(d.index)}
                    className={`group cursor-pointer hover:bg-slate-50 transition-colors ${
                      isNegative ? 'bg-rose-50/50' : hasStrongSobra ? 'bg-emerald-50/50' : ''
                    }`}
                  >
                    <td className="p-4 pl-6 font-extrabold text-slate-900 text-sm">
                      {d.name}
                    </td>
                    <td className="p-4 text-emerald-600">
                      {formatCurrency(d.totalRevenues)}
                    </td>
                    <td className="p-4 text-slate-500 font-medium">
                      {formatCurrency(d.totalExpenses)}
                    </td>
                    <td className="p-4 text-slate-500 font-medium">
                      {formatCurrency(d.totalCaixinhas)}
                    </td>
                    <td className="p-4 text-indigo-500">
                      {formatCurrency(d.totalInstallments)}
                    </td>
                    <td className="p-4 text-right text-sm">
                      <span className={isNegative ? 'text-rose-600 bg-rose-100 px-2.5 py-1 rounded-lg font-black' : 'text-blue-600'}>
                        {formatCurrency(d.saldoLivre)}
                      </span>
                    </td>
                    <td className="p-4 text-center pr-6">
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-blue-600 hover:underline">
                        Visualizar <ArrowRight size={13} />
                      </span>
                    </td>
                  </tr>
                );
              })}
              {/* Year totals calculation indicator row */}
              <tr className="bg-slate-50 border-t-2 border-slate-200 font-black text-sm">
                <td className="p-4 pl-6 text-slate-800">TOTAL CONSOLIDADO</td>
                <td className="p-4 text-emerald-600">{formatCurrency(annualTotalRevenues)}</td>
                <td className="p-4 text-slate-700">{formatCurrency(annualTotalExpenses)}</td>
                <td className="p-4 text-amber-700">{formatCurrency(annualTotalCaixinhas)}</td>
                <td className="p-4 text-indigo-700">{formatCurrency(annualTotalInstallments)}</td>
                <td className="p-4 text-right pr-4 text-base">
                  <span className={annualTotalNet >= 0 ? 'text-blue-700 bg-blue-100 px-3 py-1 rounded-xl' : 'text-rose-700 bg-rose-100 px-3 py-1 rounded-xl'}>
                    {formatCurrency(annualTotalNet)}
                  </span>
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Dynamic Graph Matrix */}
      <div className="saas-card p-5 sm:p-6 mt-6">
        <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider mb-5 flex items-center gap-1.5 border-b border-slate-100 pb-3">
          <BarChart2 size={16} className="text-primary-500" /> Gráfico Anual
        </h4>
        <div className="space-y-4">
          {allMonthsData.map((d) => {
            const absoluteMax = Math.max(...allMonthsData.map(m => Math.abs(m.saldoLivre)), 1);
            const barPercentage = Math.min(100, Math.round((Math.abs(d.saldoLivre) / absoluteMax) * 100));
            const isNegative = d.saldoLivre < 0;

            return (
              <div 
                key={d.index} 
                onClick={() => onFocusMonth(d.index)}
                className="flex items-center gap-4 cursor-pointer group active:scale-[0.99] w-full"
              >
                <span className="w-16 font-black text-slate-400 group-hover:text-primary-600 transition-colors shrink-0 uppercase tracking-widest text-[9px] text-right">
                  {d.name.substring(0, 3)}
                </span>
                
                <div className="flex-1 flex items-center gap-4">
                  {/* Container da barra super limpo */}
                  <div className="flex-1 bg-slate-100/60 rounded-full h-3 relative overflow-hidden flex items-center">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 shadow-sm ${
                        isNegative 
                          ? 'bg-linear-to-r from-rose-400 to-rose-500' 
                          : 'bg-linear-to-r from-primary-400 to-primary-600'
                      }`}
                      style={{ width: `${barPercentage}%` }}
                    />
                  </div>
                  
                  {/* Valor exato fixo à direita com fonte bold */}
                  <span className={`w-24 font-black text-[11px] tracking-tight text-right shrink-0 transition-colors ${
                    isNegative ? 'text-rose-500 group-hover:text-rose-600' : 'text-slate-600 group-hover:text-primary-600'
                  }`}>
                    {formatCurrency(d.saldoLivre)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

