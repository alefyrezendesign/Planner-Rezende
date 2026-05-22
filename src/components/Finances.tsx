import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, Target, CreditCard, Receipt, PiggyBank, Plus, TrendingDown,
  TrendingUp, Calendar, ChevronRight, AlertCircle
} from 'lucide-react';
import { formatCurrency } from '../utils';

// Mock Data for visual demonstration
const mockRevenues = [
  { id: '1', description: 'Salário', expectedValue: 5000, realizedValue: 5000 },
  { id: '2', description: 'Freelance', expectedValue: 1000, realizedValue: 800 },
];

const mockExpenses = [
  { id: '1', description: 'Aluguel', expectedValue: 1500, realizedValue: 1500 },
  { id: '2', description: 'Mercado', expectedValue: 800, realizedValue: 950 },
  { id: '3', description: 'Internet', expectedValue: 100, realizedValue: 100 },
];

export const Finances = () => {
  const [activeSubTab, setActiveSubTab] = useState('fluxo');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  return (
    <div className="w-full space-y-4">
      {/* Top Navigation */}
      <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm overflow-x-auto hide-scrollbar">
        <div className="flex gap-1 min-w-max">
          {[
            { id: 'fluxo', label: 'Fluxo Mensal', icon: Wallet },
            { id: 'cartoes', label: 'Cartões', icon: CreditCard },
            { id: 'dividas', label: 'Dívidas', icon: Receipt },
            { id: 'caixinhas', label: 'Caixinhas (Metas)', icon: PiggyBank },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeSubTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-6 min-h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeSubTab === 'fluxo' && <FluxoDeCaixa selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} months={months} />}
            {activeSubTab === 'cartoes' && <Cartoes />}
            {activeSubTab === 'dividas' && <Dividas />}
            {activeSubTab === 'caixinhas' && <Caixinhas />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const FluxoDeCaixa = ({ selectedMonth, setSelectedMonth, months }: any) => {
  const totalReceitasPrevistas = mockRevenues.reduce((acc, curr) => acc + curr.expectedValue, 0);
  const totalReceitasRealizadas = mockRevenues.reduce((acc, curr) => acc + curr.realizedValue, 0);
  const totalDespesasPrevistas = mockExpenses.reduce((acc, curr) => acc + curr.expectedValue, 0) + 1200; // adding cartao and caixinhas simulation
  const totalDespesasRealizadas = mockExpenses.reduce((acc, curr) => acc + curr.realizedValue, 0) + 1200;
  
  const saldoPrevisto = totalReceitasPrevistas - totalDespesasPrevistas;
  const saldoRealizado = totalReceitasRealizadas - totalDespesasRealizadas;

  return (
    <div className="space-y-6">
      {/* Header & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Fluxo de Caixa Mensal</h2>
          <p className="text-sm text-gray-500">Acompanhe suas entradas, saídas e saldo projetado.</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200 self-start sm:self-auto flex-wrap">
          {months.slice(0, 6).map((month: string, idx: number) => (
            <button
              key={month}
              onClick={() => setSelectedMonth(idx)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${selectedMonth === idx ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-900'}`}
            >
              {month}
            </button>
          ))}
          <span className="text-gray-400 px-2 text-xs">...</span>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <TrendingUp size={14} className="text-green-600" /> Receitas
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalReceitasRealizadas)}</p>
              <p className="text-xs text-gray-500 mt-1">Previsto: {formatCurrency(totalReceitasPrevistas)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2">
            <TrendingDown size={14} className="text-red-600" /> Despesas & Apportes
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalDespesasRealizadas)}</p>
              <p className="text-xs text-gray-500 mt-1">Previsto: {formatCurrency(totalDespesasPrevistas)}</p>
            </div>
          </div>
        </div>

        <div className={`${saldoRealizado >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'} border rounded-xl p-4`}>
          <div className="flex items-center gap-2 text-gray-600 text-xs font-semibold uppercase tracking-wider mb-2">
            <Wallet size={14} className={saldoRealizado >= 0 ? 'text-blue-600' : 'text-red-600'} /> Saldo Livre
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className={`text-2xl font-bold ${saldoRealizado >= 0 ? 'text-blue-700' : 'text-red-700'}`}>{formatCurrency(saldoRealizado)}</p>
              <p className={`text-xs mt-1 ${saldoRealizado >= 0 ? 'text-blue-600/70' : 'text-red-600/70'}`}>Previsto: {formatCurrency(saldoPrevisto)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receitas Table */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800 text-sm">Receitas ({months[selectedMonth]})</h3>
            <button className="text-blue-600 hover:text-blue-700 p-1">
              <Plus size={16} />
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {mockRevenues.map(rev => (
              <div key={rev.id} className="p-3 sm:px-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">{rev.description}</p>
                  <p className="text-xs text-gray-500">Previsto: {formatCurrency(rev.expectedValue)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-700">{formatCurrency(rev.realizedValue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Despesas Table */}
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800 text-sm">Despesas Fixas & Variáveis ({months[selectedMonth]})</h3>
            <button className="text-blue-600 hover:text-blue-700 p-1">
              <Plus size={16} />
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {mockExpenses.map(exp => (
              <div key={exp.id} className="p-3 sm:px-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">{exp.description}</p>
                  <p className="text-xs text-gray-500">Previsto: {formatCurrency(exp.expectedValue)}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${exp.realizedValue > exp.expectedValue ? 'text-red-600' : 'text-gray-900'}`}>{formatCurrency(exp.realizedValue)}</p>
                </div>
              </div>
            ))}
            
            {/* Automatic allocations from other tabs */}
            <div className="p-3 sm:px-4 flex flex-col gap-2 bg-blue-50/50 border-t-2 border-dashed border-gray-200">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Compromissos Integrados</div>
              <div className="flex items-center justify-between opacity-80">
                <div className="flex items-center gap-2">
                  <CreditCard size={14} className="text-blue-600" />
                  <p className="text-sm font-medium text-gray-700">Faturas Cartão (2)</p>
                </div>
                <p className="text-sm font-medium text-gray-900">{formatCurrency(700)}</p>
              </div>
              <div className="flex items-center justify-between opacity-80">
                <div className="flex items-center gap-2">
                  <PiggyBank size={14} className="text-green-600" />
                  <p className="text-sm font-medium text-gray-700">Caixinhas Aportes (2 ativas)</p>
                </div>
                <p className="text-sm font-medium text-gray-900">{formatCurrency(500)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Cartoes = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Cartões de Crédito</h2>
          <p className="text-sm text-gray-500">Controle de limites e faturas atuais.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={16} /> <span className="hidden sm:inline">Novo Cartão</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Mock */}
        <div className="border border-gray-200 rounded-xl p-5 bg-gradient-to-br from-gray-900 to-gray-800 text-white relative overflow-hidden shadow-lg">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Nubank</p>
              <h3 className="font-semibold text-lg">**** **** **** 1234</h3>
            </div>
            <CreditCard className="text-gray-400" />
          </div>
          <div className="space-y-3 relative z-10">
            <div>
              <div className="flex justify-between text-xs text-gray-300 mb-1">
                <span>Limite Utilizado</span>
                <span>{formatCurrency(1500)} / {formatCurrency(5000)}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: '30%' }}></div>
              </div>
              <p className="text-xs text-gray-400 mt-1">Disponível: {formatCurrency(3500)}</p>
            </div>
            <div className="flex justify-between items-end pt-2 border-t border-gray-700/50">
              <div>
                <p className="text-[10px] text-gray-400 uppercase">Fatura Atual</p>
                <p className="text-lg font-bold">{formatCurrency(700)}</p>
              </div>
              <p className="text-xs text-gray-400">Vence em 10/Out</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={18} />
        <p className="text-sm text-blue-800">Os valores das faturas são injetados automaticamente no <strong>Fluxo de Caixa Mensal</strong> como despesas, para garantir precisão no saldo livre.</p>
      </div>
    </div>
  );
};

const Dividas = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Dívidas & Financiamentos</h2>
          <p className="text-sm text-gray-500">Controle de passivos em aberto e acompanhamento de parcelas.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={16} /> <span className="hidden sm:inline">Nova Dívida</span>
        </button>
      </div>
      
      <div className="border border-gray-200 rounded-xl overflow-hidden text-sm">
        <div className="bg-gray-50 grid grid-cols-4 p-3 border-b border-gray-200 font-semibold text-gray-700">
          <div className="col-span-2">Credor & Detalhes</div>
          <div>Progresso</div>
          <div className="text-right">Parcela / Status</div>
        </div>
        <div className="p-8 text-center text-gray-500">
          Nenhuma dívida cadastrada no momento.
        </div>
      </div>
    </div>
  );
};

const Caixinhas = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Caixinhas (Reservas & Metas)</h2>
          <p className="text-sm text-gray-500">O que você planeja poupar mensalmente reflete como despesa no fluxo de caixa.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={16} /> <span className="hidden sm:inline">Nova Meta</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Caixinha Mock 1 */}
        <div className="border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-all shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg text-green-700">
                <PiggyBank size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 uppercase tracking-tight">Reserva de Emergência</h3>
                <p className="text-xs text-gray-500">Status: <span className="text-green-600 font-medium select-none">Ativa</span></p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-end mb-1">
                <span className="text-2xl font-bold text-gray-900">{formatCurrency(5000)}</span>
                <span className="text-xs text-gray-500">Alvo: {formatCurrency(20000)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '25%' }}></div>
              </div>
              <p className="text-xs text-gray-500 text-right mt-1">25% atingido</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center text-sm border border-gray-100">
              <span className="text-gray-600">Aporte Mensal Planejado:</span>
              <span className="font-semibold text-gray-900">{formatCurrency(1000)}</span>
            </div>
          </div>
        </div>

        {/* Caixinha Mock 2 */}
        <div className="border border-gray-200 rounded-xl p-5 hover:border-gray-300 transition-all shadow-sm opacity-60 grayscale hover:grayscale-0 focus-within:grayscale-0">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                <Target size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 uppercase tracking-tight">Viagem Europa</h3>
                <p className="text-xs text-gray-500">Status: <span className="text-gray-400 font-medium select-none">Pausada</span></p>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-end mb-1">
                <span className="text-2xl font-bold text-gray-900">{formatCurrency(2000)}</span>
                <span className="text-xs text-gray-500">Alvo: {formatCurrency(15000)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '13%' }}></div>
              </div>
              <p className="text-xs text-gray-500 text-right mt-1">13% atingido</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center text-sm border border-gray-100">
              <span className="text-gray-600">Aporte Mensal Planejado:</span>
              <span className="font-semibold text-gray-400 line-through">{formatCurrency(500)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-gray-50 rounded-xl text-center border border-gray-100 text-sm text-gray-600">
        <p>Aportes marcados como <strong>Ativos</strong> são descontados automaticamente no fluxo de caixa.</p>
      </div>
    </div>
  );
};

