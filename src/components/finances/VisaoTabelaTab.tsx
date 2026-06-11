import React, { useState } from 'react';
import { Download, ChevronDown, ChevronRight, Circle, PiggyBank, CreditCard, ArrowUp, ArrowDown } from 'lucide-react';
import { Revenue, Expense, Debt, Caixinha, MONTH_NAMES } from './types';
import { formatCurrency, calculateVariation, ItemCategory } from '../../utils';

const DotIcon = (props: any) => <Circle {...props} size={8} fill="currentColor" />;

interface VisaoTabelaTabProps {
  selectedYear: number;
  revenues: Revenue[];
  expenses: Expense[];
  debts: Debt[];
  caixinhas: Caixinha[];
}

export const VisaoTabelaTab = ({
  selectedYear,
  revenues,
  expenses,
  debts,
  caixinhas,
}: VisaoTabelaTabProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Receitas': true,
    'Limites de Gastos': true,
    'Despesas': true,
    'Parcelamentos': true,
    'Caixinhas': true
  });

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  // Helper to build 13-month arrays (index 0 = Dec prev year, index 1-12 = Jan-Dec current year)
  const buildEmptyMonths = () => Array(13).fill(0);

  // 1. Receitas
  const receitasMap = new Map<string, number[]>();
  revenues.forEach(r => {
    if (r.active === false) return;
    const rY = r.year !== undefined ? r.year : new Date().getFullYear();
    let idx = -1;
    if (rY === selectedYear) idx = r.month + 1;
    else if (rY === selectedYear - 1 && r.month === 11) idx = 0;
    
    if (idx >= 0) {
      const desc = r.description.trim();
      if (!receitasMap.has(desc)) receitasMap.set(desc, buildEmptyMonths());
      receitasMap.get(desc)![idx] += r.value;
    }
  });

  // 2. Despesas (Gerais e Limites separadas)
  const despesasMap = new Map<string, number[]>();
  const limitesMap = new Map<string, number[]>();
  
  expenses.forEach(e => {
    if (e.active === false) return;
    const eY = e.year !== undefined ? e.year : new Date().getFullYear();
    let idx = -1;
    if (eY === selectedYear) idx = e.month + 1;
    else if (eY === selectedYear - 1 && e.month === 11) idx = 0;

    if (idx >= 0) {
      const desc = e.description.trim();
      if (e.isLimit) {
        if (!limitesMap.has(desc)) limitesMap.set(desc, buildEmptyMonths());
        limitesMap.get(desc)![idx] += e.value;
      } else {
        if (!despesasMap.has(desc)) despesasMap.set(desc, buildEmptyMonths());
        despesasMap.get(desc)![idx] += e.value;
      }
    }
  });

  // 3. Caixinhas (projeção de aporte)
  const caixinhasMap = new Map<string, number[]>();
  caixinhas.forEach(c => {
    if (c.status !== 'Ativo') return;
    const startY = c.startYear !== undefined ? c.startYear : new Date().getFullYear();
    const startM = c.startMonth !== undefined ? c.startMonth : new Date().getMonth();
    const startTotal = startY * 12 + startM;

    const desc = c.name.trim();
    if (!caixinhasMap.has(desc)) caixinhasMap.set(desc, buildEmptyMonths());
    
    for (let m = -1; m < 12; m++) {
      const currentTotal = selectedYear * 12 + m;
      if (currentTotal < startTotal) continue; // Not started yet

      // Check if target reached (approximate)
      if (c.targetValue && c.monthlyPlanned > 0) {
        const monthsPassed = currentTotal - startTotal;
        const projectedValue = c.currentValue + (monthsPassed * c.monthlyPlanned);
        if (projectedValue - c.monthlyPlanned >= c.targetValue) continue; // Reached
      }

      // Check if skipped
      const checkYear = m === -1 ? selectedYear - 1 : selectedYear;
      const checkMonth = m === -1 ? 11 : m;
      const isSkipped = c.deposits?.some(d => d.month === checkMonth && d.year === checkYear && d.skipped);
      if (!isSkipped) {
        caixinhasMap.get(desc)![m + 1] += (c.monthlyPlanned || 0);
      }
    }
  });

  // 4. Parcelamentos
  const parcelamentosMap = new Map<string, number[]>();
  debts.forEach(d => {
    if (d.status !== 'Ativo') return;
    const startY = d.startYear !== undefined ? d.startYear : new Date().getFullYear();
    const startM = Number(d.startMonth);
    const startTotal = startY * 12 + startM;
    const endTotal = startTotal + Number(d.installmentsCount);

    const desc = d.name.trim();
    if (!parcelamentosMap.has(desc)) parcelamentosMap.set(desc, buildEmptyMonths());

    for (let m = -1; m < 12; m++) {
      const currentTotal = selectedYear * 12 + m;
      if (currentTotal >= startTotal && currentTotal < endTotal) {
        parcelamentosMap.get(desc)![m + 1] += (d.installmentValue || 0);
      }
    }
  });

  // Total Calculators per month
  const totalRevenues = buildEmptyMonths();
  const totalExpenses = buildEmptyMonths();
  const totalLimites = buildEmptyMonths();
  const totalCaixinhas = buildEmptyMonths();
  const totalParcelamentos = buildEmptyMonths();
  
  for (let m = 0; m < 13; m++) {
    receitasMap.forEach(arr => totalRevenues[m] += arr[m]);
    despesasMap.forEach(arr => totalExpenses[m] += arr[m]);
    limitesMap.forEach(arr => totalLimites[m] += arr[m]);
    caixinhasMap.forEach(arr => totalCaixinhas[m] += arr[m]);
    parcelamentosMap.forEach(arr => totalParcelamentos[m] += arr[m]);
  }

  const saldoLivre = buildEmptyMonths();
  for (let m = 0; m < 13; m++) {
    saldoLivre[m] = totalRevenues[m] - (totalExpenses[m] + totalLimites[m] + totalCaixinhas[m] + totalParcelamentos[m]);
  }

  const exportToCSV = () => {
    const lines: string[] = [];
    // Usa ponto e vírgula para o Excel (PT-BR) entender como colunas automaticamente
    const header = ['Categoria/Item', ...MONTH_NAMES, 'Total'];
    lines.push(header.map(h => `"${h}"`).join(';'));

    const addGroupToCSV = (title: string, map: Map<string, number[]>) => {
      const entries = Array.from(map.entries());
      if (entries.length === 0) return;
      
      lines.push(''); // Espaçamento
      lines.push(`"${title.toUpperCase()}"`); // Cabeçalho do Grupo
      
      entries.forEach(([name, values]) => {
        const rowTotal = values.slice(1).reduce((a, b) => a + b, 0);
        const safeName = name.replace(/"/g, '""');
        const formattedValues = values.slice(1).map(v => `"${formatCurrency(v)}"`);
        lines.push(`"${safeName}";${formattedValues.join(';')};"${formatCurrency(rowTotal)}"`);
      });
    };

    const addTotalsToCSV = (title: string, values: number[]) => {
      const rowTotal = values.slice(1).reduce((a, b) => a + b, 0);
      const formattedValues = values.slice(1).map(v => `"${formatCurrency(v)}"`);
      lines.push(`"${title}";${formattedValues.join(';')};"${formatCurrency(rowTotal)}"`);
    };

    addGroupToCSV('Receitas', receitasMap);
    if (receitasMap.size > 0) addTotalsToCSV('Total Receitas', totalRevenues);

    addGroupToCSV('Limites de Gastos', limitesMap);
    addGroupToCSV('Despesas', despesasMap);
    if (despesasMap.size > 0 || limitesMap.size > 0) {
        addTotalsToCSV('Total Despesas + Limites', totalExpenses.map((v, i) => v + totalLimites[i]));
    }

    addGroupToCSV('Parcelamentos', parcelamentosMap);
    if (parcelamentosMap.size > 0) addTotalsToCSV('Total Parcelas', totalParcelamentos);

    addGroupToCSV('Caixinhas', caixinhasMap);
    if (caixinhasMap.size > 0) addTotalsToCSV('Total Caixinhas', totalCaixinhas);

    lines.push(''); // Espaçamento
    addTotalsToCSV('SALDO LIVRE', saldoLivre);

    const csvContent = lines.join('\n');
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM for Excel
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `tabela_anual_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // UI Table Renderer
  const renderRowGroup = (title: string, map: Map<string, number[]>, colorClass: string, isLimit: boolean = false, Icon?: React.ElementType, categoryType: ItemCategory = 'revenue') => {
    const entries = Array.from(map.entries());
    if (entries.length === 0) return null;

    const isExpanded = expandedGroups[title] !== false;

    return (
      <>
        <tr 
          className="bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors border-y border-slate-200"
          onClick={() => toggleGroup(title)}
        >
          <td className={`px-4 py-3 font-black text-[12px] uppercase tracking-widest ${colorClass} sticky left-0 z-10 bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.02)] border-b border-slate-200`}>
            <div className="flex items-center gap-1.5">
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {title}
            </div>
          </td>
          <td colSpan={13} className="bg-slate-50 border-b border-slate-200"></td>
        </tr>
        {isExpanded && entries.map(([name, values], i) => {
          const rowTotal = values.slice(1).reduce((a, b) => a + b, 0);
          return (
            <tr key={i} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100/50">
              <td className="px-4 py-3 text-xs font-bold text-slate-700 sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-10 flex items-center gap-2 border-b border-slate-200">
                {Icon && <Icon size={14} className={colorClass} />}
                {name}
                {isLimit && <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 uppercase tracking-widest border border-indigo-200">Limite</span>}
              </td>
              {values.slice(1).map((v, m) => {
                const prevValue = values[m];
                const variation = calculateVariation(v, prevValue, categoryType);
                const ArrowIcon = variation.direction === 'up' ? ArrowUp : ArrowDown;
                return (
                  <td key={m} className={`px-4 py-3 text-xs font-medium text-center border border-slate-200 relative group`}>
                    <div className={`flex items-center justify-center gap-1.5 ${v > 0 ? 'text-slate-700' : 'text-slate-300'}`}>
                      <span>{v > 0 ? formatCurrency(v) : '-'}</span>
                      {variation.hasChange && variation.direction && (
                        <span title={variation.tooltip} className={`${variation.color} flex items-center justify-center cursor-default bg-slate-50 rounded-full px-0.5`}>
                          <ArrowIcon size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                  </td>
                );
              })}
              <td className="px-4 py-3 text-xs font-black text-slate-800 text-center bg-slate-50/50 border border-slate-200">
                {formatCurrency(rowTotal)}
              </td>
            </tr>
          );
        })}
      </>
    );
  };

  const renderTotalsRow = (title: string, values: number[], colorClass: string, bgClass: string = "bg-slate-50") => {
    const rowTotal = values.slice(1).reduce((a, b) => a + b, 0);
    return (
      <tr className={`${bgClass} border-t-2 border-slate-200/50`}>
        <td className={`px-4 py-3 text-[11px] font-black uppercase tracking-widest sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] z-10 whitespace-nowrap border border-slate-200 bg-white ${colorClass}`}>
          {title}
        </td>
        {values.slice(1).map((v, m) => (
          <td key={m} className={`px-4 py-3 text-xs font-black text-center border border-slate-200 ${colorClass}`}>
            {formatCurrency(v)}
          </td>
        ))}
        <td className={`px-4 py-3 text-xs font-black text-center border border-slate-200 ${colorClass}`}>
          {formatCurrency(rowTotal)}
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
      <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            Tabela Anual ({selectedYear})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualize o fluxo de caixa consolidado mês a mês em formato de planilha.
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <Download size={14} />
          <span>Baixar CSV</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest sticky left-0 z-20 bg-slate-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] border border-slate-200">
                  Categoria / Item
                </th>
                {MONTH_NAMES.map(m => (
                  <th key={m} className="px-4 py-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap min-w-[100px] border border-slate-200">
                    {m.substring(0,3)}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-[10px] font-black text-slate-800 uppercase tracking-widest whitespace-nowrap min-w-[110px] bg-slate-100 border border-slate-200">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Grupos de Itens */}
              {renderRowGroup('Receitas', receitasMap, 'text-emerald-600', false, DotIcon, 'revenue')}
              {renderRowGroup('Limites de Gastos', limitesMap, 'text-indigo-600', true, DotIcon, 'limit')}
              {renderRowGroup('Despesas', despesasMap, 'text-rose-600', false, DotIcon, 'expense')}
              {renderRowGroup('Parcelamentos', parcelamentosMap, 'text-purple-600', false, CreditCard, 'debt')}
              {renderRowGroup('Caixinhas', caixinhasMap, 'text-blue-600', false, PiggyBank, 'caixinha')}

              {/* Separador de Totais */}
              <tr className="bg-slate-200/50">
                <td colSpan={15} className="h-4"></td>
              </tr>
              
              {/* Totais (Agrupados no Final) */}
              {receitasMap.size > 0 && renderTotalsRow('Total Receitas', totalRevenues, 'text-emerald-700', 'bg-emerald-50/30')}
              {(despesasMap.size > 0 || limitesMap.size > 0) && renderTotalsRow('Total Despesas', totalExpenses.map((v, i) => v + totalLimites[i]), 'text-rose-700', 'bg-rose-50/30')}
              {parcelamentosMap.size > 0 && renderTotalsRow('Total Parcelas', totalParcelamentos, 'text-purple-700', 'bg-purple-50/30')}
              {caixinhasMap.size > 0 && renderTotalsRow('Total Caixinhas', totalCaixinhas, 'text-blue-700', 'bg-blue-50/30')}

              {/* Saldo Livre */}
              <tr className="bg-white border-t-[3px] border-slate-300 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)] relative z-20">
                <td className="px-4 py-5 text-[12px] font-black uppercase tracking-widest sticky left-0 bg-white text-slate-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] border border-slate-200">
                  SALDO LIVRE
                </td>
                {saldoLivre.slice(1).map((v, m) => (
                  <td key={m} className="px-4 py-5 text-[13px] font-black text-center bg-white border border-slate-200">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${v > 0 ? 'bg-emerald-500' : v < 0 ? 'bg-rose-500' : 'bg-slate-300'}`} />
                      <span className="text-slate-900">{formatCurrency(v)}</span>
                    </div>
                  </td>
                ))}
                <td className="px-4 py-5 text-[14px] font-black text-center bg-slate-50 border border-slate-200 border-l">
                  <div className="flex items-center justify-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${saldoLivre.slice(1).reduce((a,b)=>a+b,0) > 0 ? 'bg-emerald-500' : saldoLivre.slice(1).reduce((a,b)=>a+b,0) < 0 ? 'bg-rose-500' : 'bg-slate-300'}`} />
                    <span className="text-slate-900">{formatCurrency(saldoLivre.slice(1).reduce((a,b)=>a+b,0))}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
