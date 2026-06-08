import React, { useEffect, useState } from 'react';
import { PrintOptions } from './PrintOptionsModal';
import { Task, CarScenario, RealEstateScenario } from '../types';
import { Revenue, Expense, Debt, Caixinha, MONTH_NAMES } from './finances/types';
import { formatCurrency } from '../utils';

interface PrintLayoutProps {
  tasks: Task[];
  cars: CarScenario[];
  houses: RealEstateScenario[];
  options: PrintOptions;
  onFinish: () => void;
}

export const PrintLayout = ({ tasks, cars, houses, options, onFinish }: PrintLayoutProps) => {
  const [finances, setFinances] = useState<{
    revenues: Revenue[];
    expenses: Expense[];
    debts: Debt[];
    caixinhas: Caixinha[];
  } | null>(null);

  useEffect(() => {
    if (options.sections.includes('Finanças')) {
      try {
        const rawRevs = localStorage.getItem('finances_revenues_v3');
        const rawExps = localStorage.getItem('finances_expenses_v3');
        const rawDebts = localStorage.getItem('finances_debts_v3');
        const rawCaixas = localStorage.getItem('finances_caixinhas_v3');

        setFinances({
          revenues: rawRevs ? JSON.parse(rawRevs) : [],
          expenses: rawExps ? JSON.parse(rawExps) : [],
          debts: rawDebts ? JSON.parse(rawDebts) : [],
          caixinhas: rawCaixas ? JSON.parse(rawCaixas) : [],
        });
      } catch (e) {
        setFinances({ revenues: [], expenses: [], debts: [], caixinhas: [] });
      }
    }
  }, [options]);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 500);

    const handleAfterPrint = () => {
      onFinish();
    };

    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [onFinish]);

  const { includeCover, includeDateTime, includeSummary, sections } = options;
  const now = new Date();

  return (
    <div className="bg-white text-black min-h-screen p-8 print-container font-sans">
      <style dangerouslySetInnerHTML={{__html: `
        @page { size: A4 portrait; margin: 20mm 15mm; }
        body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        #root > *:not(.print-container) { display: none !important; }
        .page-break { page-break-before: always; }
        .avoid-break { page-break-inside: avoid; }
      `}} />

      {/* COVER */}
      {includeCover && (
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
          <h1 className="text-5xl font-black mb-6 text-gray-900 border-b-4 border-gray-900 pb-4 inline-block tracking-tight">RELATÓRIO GERAL</h1>
          <h2 className="text-2xl font-bold text-gray-600 mb-12">Replanner</h2>
          
          <div className="bg-gray-50 border border-gray-200 p-8 rounded-2xl w-full max-w-lg text-left shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-4">Módulos Incluídos</h3>
            <ul className="space-y-2 mb-8">
              {sections.map(s => (
                <li key={s} className="flex items-center gap-2 font-bold text-gray-800">
                  <span className="w-2 h-2 rounded-full bg-gray-400"></span> {s}
                </li>
              ))}
            </ul>

            {includeSummary && (
              <>
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-4">Resumo Rápido</h3>
                <div className="space-y-2 text-sm text-gray-600 font-medium">
                  {sections.includes('Tarefas') && <div className="flex justify-between border-b pb-1"><span>Tarefas Ativas:</span> <span className="font-bold text-gray-900">{tasks.filter(t => t.status !== 'Concluído').length}</span></div>}
                  {sections.includes('Tarefas') && <div className="flex justify-between border-b pb-1"><span>Tarefas Concluídas:</span> <span className="font-bold text-gray-900">{tasks.filter(t => t.status === 'Concluído').length}</span></div>}
                  {sections.includes('Veículos') && <div className="flex justify-between border-b pb-1"><span>Veículos:</span> <span className="font-bold text-gray-900">{cars.length}</span></div>}
                  {sections.includes('Imóveis') && <div className="flex justify-between border-b pb-1"><span>Imóveis:</span> <span className="font-bold text-gray-900">{houses.length}</span></div>}
                  {sections.includes('Finanças') && finances && (
                    <div className="flex justify-between border-b pb-1"><span>Parcelamentos Ativos:</span> <span className="font-bold text-gray-900">{finances.debts.filter(d => d.status === 'Ativo').length}</span></div>
                  )}
                  {sections.includes('Finanças') && finances && (
                    <div className="flex justify-between pb-1"><span>Metas de Caixinhas:</span> <span className="font-bold text-gray-900">{finances.caixinhas.length}</span></div>
                  )}
                </div>
              </>
            )}
          </div>

          {includeDateTime && (
            <div className="mt-auto text-xs text-gray-400 font-medium pt-8">
              Gerado em {now.toLocaleDateString('pt-BR')} às {now.toLocaleTimeString('pt-BR')}
            </div>
          )}
        </div>
      )}

      {/* TAREFAS */}
      {sections.includes('Tarefas') && (
        <div className={includeCover ? "page-break" : ""}>
          <div className="mb-6 pb-2 border-b-2 border-gray-900 flex justify-between items-end mt-4">
            <h2 className="text-3xl font-black uppercase tracking-tight text-gray-900">Tarefas e Projetos</h2>
            {includeDateTime && <span className="text-[10px] text-gray-500 font-bold">{now.toLocaleDateString('pt-BR')}</span>}
          </div>

          {tasks.length === 0 ? (
            <p className="text-gray-500 text-sm font-medium italic">Nenhuma tarefa cadastrada nesta seção.</p>
          ) : (
            <div className="space-y-6">
              {['Alta', 'Média', 'Baixa'].map((priority) => {
                const priorityTasks = tasks.filter(t => t.priority === priority);
                if (priorityTasks.length === 0) return null;
                return (
                  <div key={priority} className="space-y-4 pt-2">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">Prioridade {priority}</h3>
                    {priorityTasks.map(task => (
                      <div key={task.id} className="avoid-break border border-gray-300 rounded-xl p-4 bg-gray-50/30">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex flex-col gap-1 w-full">
                            <span className="text-[10px] font-bold text-gray-500 uppercase">{task.category}</span>
                            <h4 className="text-base font-extrabold text-gray-900 leading-tight">{task.title}</h4>
                            
                            <div className="flex gap-3 text-[10px] font-bold text-gray-600 mt-1">
                              <span>Status: <span className="text-gray-900">{task.status}</span></span>
                              {task.dueDate && <span>Vencimento: <span className="text-gray-900">{new Date(task.dueDate).toLocaleDateString('pt-BR')}</span></span>}
                            </div>
                            
                            {task.description && (
                              <p className="text-xs text-gray-600 mt-2 mb-1">{task.description}</p>
                            )}

                            {task.subtasks && task.subtasks.length > 0 && (
                              <div className="mt-3 pl-3 border-l-2 border-gray-200 space-y-1">
                                {task.subtasks.map((st, i) => (
                                  <div key={i} className="flex gap-2 items-center text-[11px]">
                                    <span style={{width: 14, height: 14, border: '1px solid #aaa', borderRadius: 3, display: 'inline-block', backgroundColor: st.completed ? '#4f46e5' : '#fff'}}></span>
                                    <span className={st.completed ? 'text-gray-400 line-through font-medium' : 'text-gray-800 font-semibold'}>{st.title}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {task.imageUrl && (
                              <div className="mt-4 w-full flex justify-center bg-white border border-gray-200 rounded-xl p-1 avoid-break">
                                <img src={task.imageUrl} alt="Anexo" style={{ width: '100%', maxHeight: '260mm', objectFit: 'contain', borderRadius: '8px' }} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* VEÍCULOS */}
      {sections.includes('Veículos') && (
        <div className={(includeCover || sections.includes('Tarefas')) ? "page-break" : ""}>
          <div className="mb-6 pb-2 border-b-2 border-gray-900 flex justify-between items-end mt-4">
            <h2 className="text-3xl font-black uppercase tracking-tight text-gray-900">Veículos</h2>
            {includeDateTime && <span className="text-[10px] text-gray-500 font-bold">{now.toLocaleDateString('pt-BR')}</span>}
          </div>

          {includeSummary && cars.length > 0 && (
            <div className="mb-6 flex gap-4 text-xs font-bold bg-gray-50 border border-gray-200 p-3 rounded-lg avoid-break">
              <div>Total de Veículos: <span className="text-gray-900">{cars.length}</span></div>
            </div>
          )}

          {cars.length === 0 ? (
            <p className="text-gray-500 text-sm font-medium italic">Nenhum veículo cadastrado nesta seção.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {cars.map(car => (
                <div key={car.id} className="avoid-break border border-gray-300 rounded-xl p-5 bg-gray-50/30">
                  <h4 className="text-lg font-extrabold text-gray-900 uppercase tracking-wide mb-3">{car.modelName || 'Sem Modelo'}</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between border-b border-gray-100 pb-1.5"><span>Valor Aproximado:</span> <span className="font-bold text-gray-900">{formatCurrency(car.carValue)}</span></div>
                    <div className="flex justify-between border-b border-gray-100 pb-1.5"><span>Alvo de Entrada:</span> <span className="font-bold text-gray-900">{formatCurrency(car.downPaymentTarget)}</span></div>
                    <div className="flex justify-between pb-1.5"><span>Condições:</span> <span className="font-bold text-gray-900">{car.installments}x de ~{formatCurrency(((car.carValue - car.downPaymentTarget) * (1 + (car.interestRateMonthly/100) * car.installments)) / car.installments)}</span></div>
                  </div>
                  {car.imageUrl && (
                    <div className="mt-4 w-full flex justify-center bg-white border border-gray-200 rounded-xl p-1 avoid-break">
                      <img src={car.imageUrl} alt="Foto do Veículo" style={{ width: '100%', maxHeight: '260mm', objectFit: 'contain', borderRadius: '8px' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* IMÓVEIS */}
      {sections.includes('Imóveis') && (
        <div className={(includeCover || sections.includes('Tarefas') || sections.includes('Veículos')) ? "page-break" : ""}>
          <div className="mb-6 pb-2 border-b-2 border-gray-900 flex justify-between items-end mt-4">
            <h2 className="text-3xl font-black uppercase tracking-tight text-gray-900">Imóveis</h2>
            {includeDateTime && <span className="text-[10px] text-gray-500 font-bold">{now.toLocaleDateString('pt-BR')}</span>}
          </div>

          {includeSummary && houses.length > 0 && (
            <div className="mb-6 flex gap-4 text-xs font-bold bg-gray-50 border border-gray-200 p-3 rounded-lg avoid-break">
              <div>Total de Imóveis: <span className="text-gray-900">{houses.length}</span></div>
            </div>
          )}

          {houses.length === 0 ? (
            <p className="text-gray-500 text-sm font-medium italic">Nenhum imóvel cadastrado nesta seção.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {houses.map(house => (
                <div key={house.id} className="avoid-break border border-gray-300 rounded-xl p-5 bg-gray-50/30">
                  <h4 className="text-lg font-extrabold text-gray-900 uppercase tracking-wide mb-3">{house.propertyName || 'Sem Nome'}</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between border-b border-gray-100 pb-1.5"><span>Valor Avaliado:</span> <span className="font-bold text-gray-900">{formatCurrency(house.propertyValue)}</span></div>
                    <div className="flex justify-between border-b border-gray-100 pb-1.5"><span>Alvo de Entrada:</span> <span className="font-bold text-gray-900">{formatCurrency(house.downPaymentTarget)}</span></div>
                    <div className="flex justify-between pb-1.5"><span>Prazo e Taxa:</span> <span className="font-bold text-gray-900">{house.installments} meses a {house.interestRateAnnual}% a.a.</span></div>
                  </div>
                  {house.imageUrl && (
                    <div className="mt-4 w-full flex justify-center bg-white border border-gray-200 rounded-xl p-1 avoid-break">
                      <img src={house.imageUrl} alt="Foto do Imóvel" style={{ width: '100%', maxHeight: '260mm', objectFit: 'contain', borderRadius: '8px' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FINANÇAS */}
      {sections.includes('Finanças') && finances && (
        <div className={(includeCover || sections.includes('Tarefas') || sections.includes('Veículos') || sections.includes('Imóveis')) ? "page-break" : ""}>
          
          <div className="mb-6 pb-2 border-b-2 border-gray-900 flex justify-between items-end mt-4">
            <h2 className="text-3xl font-black uppercase tracking-tight text-gray-900">Relatório Financeiro</h2>
            {includeDateTime && <span className="text-[10px] text-gray-500 font-bold">Emitido em {now.toLocaleDateString('pt-BR')}</span>}
          </div>

          {!finances.revenues.length && !finances.expenses.length && !finances.debts.length && !finances.caixinhas.length ? (
            <p className="text-gray-500 text-sm font-medium italic">Nenhuma informação financeira cadastrada.</p>
          ) : (
            <div className="space-y-8">
              
              {/* Balanço Anual Consolidado */}
              {includeSummary && (
                <div className="avoid-break mb-8">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-200 pb-1">Balanço Anual Consolidado</h3>
                  {(() => {
                    const totalRevs = finances.revenues.reduce((acc, c) => acc + c.value, 0);
                    const totalExps = finances.expenses.reduce((acc, c) => acc + c.value, 0);
                    // Dívidas do ano = parcelas ativas no ano (simplificado somando todas cadastradas para o escopo anual do relatório)
                    const totalDebts = finances.debts.reduce((acc, c) => acc + (c.installmentValue * c.installmentsCount), 0);
                    const totalSaidas = totalExps + totalDebts;
                    const saldoLiquido = totalRevs - totalSaidas;

                    return (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Receitas Totais</p>
                          <p className="text-lg font-black text-emerald-700">{formatCurrency(totalRevs)}</p>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Saídas Projetadas</p>
                          <p className="text-lg font-black text-rose-700">{formatCurrency(totalSaidas)}</p>
                        </div>
                        <div className={`border rounded-lg p-3 ${saldoLiquido >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                          <p className={`text-[9px] font-bold uppercase tracking-widest ${saldoLiquido >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>Resultado Líquido</p>
                          <p className={`text-lg font-black ${saldoLiquido >= 0 ? 'text-emerald-800' : 'text-rose-800'}`}>{formatCurrency(saldoLiquido)}</p>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* DRE MENSAL (Tabelas Densas) */}
              <div className="avoid-break mt-6">
                <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-200 pb-1">Demonstrativo Mensal (DRE)</h3>
                <div className="space-y-6">
                  {MONTH_NAMES.map((monthName, idx) => {
                    const revs = finances.revenues.filter(r => r.month === idx);
                    const exps = finances.expenses.filter(e => e.month === idx);
                    
                    // Apenas renderiza se o mês tiver alguma movimentação para economizar folha
                    if (revs.length === 0 && exps.length === 0) return null;

                    const sumRevs = revs.reduce((a, b) => a + b.value, 0);
                    const sumExps = exps.reduce((a, b) => a + b.value, 0);
                    const saldo = sumRevs - sumExps;

                    return (
                      <div key={idx} className="avoid-break border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-100 px-3 py-2 flex justify-between items-center border-b border-gray-200">
                          <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider">{monthName}</h4>
                          <span className={`text-xs font-bold ${saldo >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>Saldo: {formatCurrency(saldo)}</span>
                        </div>
                        <div className="p-0">
                          <table className="w-full text-left border-collapse text-[9px]">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="py-1 px-3 font-bold text-gray-500 uppercase">Tipo</th>
                                <th className="py-1 px-3 font-bold text-gray-500 uppercase">Descrição</th>
                                <th className="py-1 px-3 font-bold text-gray-500 uppercase">Categoria</th>
                                <th className="py-1 px-3 font-bold text-gray-500 uppercase text-right">Valor</th>
                              </tr>
                            </thead>
                            <tbody>
                              {revs.map(r => (
                                <tr key={r.id} className="border-b border-gray-100">
                                  <td className="py-1.5 px-3 font-bold text-emerald-600">Receita</td>
                                  <td className="py-1.5 px-3 text-gray-700">{r.description}</td>
                                  <td className="py-1.5 px-3 text-gray-500">{r.category}</td>
                                  <td className="py-1.5 px-3 font-bold text-emerald-700 text-right">{formatCurrency(r.value)}</td>
                                </tr>
                              ))}
                              {exps.map(e => (
                                <tr key={e.id} className="border-b border-gray-100">
                                  <td className="py-1.5 px-3 font-bold text-rose-500">Despesa</td>
                                  <td className="py-1.5 px-3 text-gray-700">{e.description}</td>
                                  <td className="py-1.5 px-3 text-gray-500">{e.category}</td>
                                  <td className="py-1.5 px-3 font-bold text-rose-600 text-right">- {formatCurrency(e.value)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Endividamento / Parcelamentos */}
              {finances.debts.length > 0 && (
                <div className="avoid-break mt-8">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-200 pb-1">Quadro de Endividamento (Parcelamentos)</h3>
                  <table className="w-full text-left border-collapse text-[10px] border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="py-2 px-3 font-bold uppercase tracking-wider text-gray-600">Credor / Passivo</th>
                        <th className="py-2 px-3 font-bold uppercase tracking-wider text-gray-600">Parcela</th>
                        <th className="py-2 px-3 font-bold uppercase tracking-wider text-gray-600 text-right">Progresso</th>
                        <th className="py-2 px-3 font-bold uppercase tracking-wider text-gray-600 text-right">Saldo Devedor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {finances.debts.map(debt => {
                        const paid = debt.paidInstallments || 0;
                        const total = debt.installmentsCount;
                        const remainingValue = debt.totalValue - (paid * debt.installmentValue);
                        return (
                          <tr key={debt.id} className="border-b border-gray-200 last:border-0">
                            <td className="py-2 px-3">
                              <div className="font-extrabold text-gray-900 text-xs">{debt.name}</div>
                              <div className="text-gray-500 text-[9px]">{debt.creditor} • Status: {debt.status}</div>
                            </td>
                            <td className="py-2 px-3 font-bold text-gray-700">{formatCurrency(debt.installmentValue)}<span className="text-gray-400 font-normal"> /mês</span></td>
                            <td className="py-2 px-3 text-right">
                              <div className="font-bold text-gray-800">{paid} de {total}</div>
                              <div className="text-gray-400 text-[9px]">({Math.round((paid/total)*100)}%)</div>
                            </td>
                            <td className="py-2 px-3 text-right font-black text-rose-700">{formatCurrency(remainingValue)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Caixinhas (Ativos Financeiros) */}
              {finances.caixinhas.length > 0 && (
                <div className="avoid-break mt-8">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-3 border-b border-gray-200 pb-1">Posição de Ativos (Caixinhas de Investimento)</h3>
                  <table className="w-full text-left border-collapse text-[10px] border border-gray-200 rounded-lg overflow-hidden">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="py-2 px-3 font-bold uppercase tracking-wider text-gray-600">Caixinha / Objetivo</th>
                        <th className="py-2 px-3 font-bold uppercase tracking-wider text-gray-600">Status</th>
                        <th className="py-2 px-3 font-bold uppercase tracking-wider text-gray-600 text-right">Acumulado</th>
                        <th className="py-2 px-3 font-bold uppercase tracking-wider text-gray-600 text-right">Meta Final</th>
                      </tr>
                    </thead>
                    <tbody>
                      {finances.caixinhas.map(caixinha => {
                        const perc = Math.min(100, (caixinha.currentValue / caixinha.targetValue) * 100);
                        return (
                          <tr key={caixinha.id} className="border-b border-gray-200 last:border-0">
                            <td className="py-2 px-3">
                              <div className="font-extrabold text-gray-900 text-xs">{caixinha.name}</div>
                              <div className="text-gray-500 text-[9px] truncate max-w-[200px]">{caixinha.objective}</div>
                            </td>
                            <td className="py-2 px-3 font-bold text-gray-600">{caixinha.status}</td>
                            <td className="py-2 px-3 text-right">
                              <div className="font-black text-blue-700">{formatCurrency(caixinha.currentValue)}</div>
                              <div className="text-gray-400 text-[9px]">({Math.round(perc)}% da meta)</div>
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-gray-800">{formatCurrency(caixinha.targetValue)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          )}
        </div>
      )}

    </div>
  );
};
