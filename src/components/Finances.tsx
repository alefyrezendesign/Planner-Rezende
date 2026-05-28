import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, Target, CreditCard, Receipt, PiggyBank, Plus, TrendingDown,
  TrendingUp, Calendar, ChevronRight, AlertCircle, Trash2, Edit2, Check, X
} from 'lucide-react';
import { formatCurrency } from '../utils';

// Localstorage key names matching multi-user or guest modes
const STORAGE_KEYS = {
  REVENUES: 'fin_revenues_v1',
  EXPENSES: 'fin_expenses_v1',
  CARDS: 'fin_cards_v1',
  DEBTS: 'fin_debts_v1',
  CAIXINHAS: 'fin_caixinhas_v1',
};

// Initial backup seed data to give users an immediate mock demo but with full interactivity
const INITIAL_REVENUES = [
  { id: 'rev-1', description: 'Salário Principal', expectedValue: 5000, realizedValue: 5000 },
  { id: 'rev-2', description: 'Trabalho Freelance', expectedValue: 1000, realizedValue: 800 },
];

const INITIAL_EXPENSES = [
  { id: 'exp-1', description: 'Aluguel & Condomínio', expectedValue: 1500, realizedValue: 1500 },
  { id: 'exp-2', description: 'Supermercado Mensal', expectedValue: 800, realizedValue: 950 },
  { id: 'exp-3', description: 'Assinatura Internet Fibra', expectedValue: 100, realizedValue: 100 },
];

const INITIAL_CARDS = [
  { id: 'card-1', name: 'Nubank Gold', totalLimit: 5000, usedLimit: 1500, invoiceValue: 700, dueDay: 10 }
];

const INITIAL_DEBTS = [
  { id: 'debt-1', creditor: 'Banco Santander', type: 'Financiamento', remainingValue: 12000, installmentValue: 450, installmentsCount: 24, status: 'Ativo' }
];

const INITIAL_CAIXINHAS = [
  { id: 'caixa-1', name: 'Reserva de Emergência', targetValue: 20000, currentValue: 5000, monthlyPlanned: 1000, status: 'Ativo' },
  { id: 'caixa-2', name: 'Viagem dos Sonhos', targetValue: 15000, currentValue: 2000, monthlyPlanned: 500, status: 'Pausado' }
];

export const Finances = () => {
  const [activeSubTab, setActiveSubTab] = useState('fluxo');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  // Reactive state hooks
  const [revenues, setRevenues] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [caixinhas, setCaixinhas] = useState<any[]>([]);

  // Load from LocalStorage
  useEffect(() => {
    const rawRevs = localStorage.getItem(STORAGE_KEYS.REVENUES);
    const rawExps = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    const rawCards = localStorage.getItem(STORAGE_KEYS.CARDS);
    const rawDebts = localStorage.getItem(STORAGE_KEYS.DEBTS);
    const rawCaixas = localStorage.getItem(STORAGE_KEYS.CAIXINHAS);

    setRevenues(rawRevs ? JSON.parse(rawRevs) : INITIAL_REVENUES);
    setExpenses(rawExps ? JSON.parse(rawExps) : INITIAL_EXPENSES);
    setCards(rawCards ? JSON.parse(rawCards) : INITIAL_CARDS);
    setDebts(rawDebts ? JSON.parse(rawDebts) : INITIAL_DEBTS);
    setCaixinhas(rawCaixas ? JSON.parse(rawCaixas) : INITIAL_CAIXINHAS);
  }, []);

  // Sync to database-like client localStorage
  const saveToLocalStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const handleUpdateRevenues = (newRevs: any[]) => {
    setRevenues(newRevs);
    saveToLocalStorage(STORAGE_KEYS.REVENUES, newRevs);
  };

  const handleUpdateExpenses = (newExps: any[]) => {
    setExpenses(newExps);
    saveToLocalStorage(STORAGE_KEYS.EXPENSES, newExps);
  };

  const handleUpdateCards = (newCards: any[]) => {
    setCards(newCards);
    saveToLocalStorage(STORAGE_KEYS.CARDS, newCards);
  };

  const handleUpdateDebts = (newDebts: any[]) => {
    setDebts(newDebts);
    saveToLocalStorage(STORAGE_KEYS.DEBTS, newDebts);
  };

  const handleUpdateCaixinhas = (newCaixas: any[]) => {
    setCaixinhas(newCaixas);
    saveToLocalStorage(STORAGE_KEYS.CAIXINHAS, newCaixas);
  };

  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  return (
    <div className="w-full space-y-4">
      {/* Top Navigation */}
      <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm overflow-x-auto hide-scrollbar">
        <div className="flex gap-1 min-w-max">
          {[
            { id: 'fluxo', label: 'Fluxo Mensal', icon: Wallet },
            { id: 'cartoes', label: 'Cartões', icon: CreditCard },
            { id: 'dividas', label: 'Dívidas & Compromissos', icon: Receipt },
            { id: 'caixinhas', label: 'Caixinhas (Metas)', icon: PiggyBank },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
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
            transition={{ duration: 0.15 }}
          >
            {activeSubTab === 'fluxo' && (
              <FluxoDeCaixa 
                selectedMonth={selectedMonth} 
                setSelectedMonth={setSelectedMonth} 
                months={months} 
                revenues={revenues}
                setRevenues={handleUpdateRevenues}
                expenses={expenses}
                setExpenses={handleUpdateExpenses}
                cards={cards}
                caixinhas={caixinhas}
                debts={debts}
              />
            )}
            {activeSubTab === 'cartoes' && (
              <Cartoes 
                cards={cards}
                setCards={handleUpdateCards}
              />
            )}
            {activeSubTab === 'dividas' && (
              <Dividas 
                debts={debts}
                setDebts={handleUpdateDebts}
              />
            )}
            {activeSubTab === 'caixinhas' && (
              <Caixinhas 
                caixinhas={caixinhas}
                setCaixinhas={handleUpdateCaixinhas}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// ============================================
// Fluxo Mensal Component
// ============================================
const FluxoDeCaixa = ({ 
  selectedMonth, 
  setSelectedMonth, 
  months,
  revenues,
  setRevenues,
  expenses,
  setExpenses,
  cards,
  caixinhas,
  debts,
}: any) => {

  const [showAddRevenue, setShowAddRevenue] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);

  // New item states
  const [newRevDesc, setNewRevDesc] = useState('');
  const [newRevExp, setNewRevExp] = useState('');
  const [newRevReal, setNewRevReal] = useState('');

  const [newExpDesc, setNewExpDesc] = useState('');
  const [newExpExp, setNewExpExp] = useState('');
  const [newExpReal, setNewExpReal] = useState('');

  // 1. Sum up Credit card bills
  const sumOfCardsBills = cards.reduce((acc: number, c: any) => acc + (c.invoiceValue || 0), 0);

  // 2. Sum up Active goals caixinhas contributions
  const sumOfActiveCaixinhas = caixinhas
    .filter((c: any) => c.status === 'Ativo')
    .reduce((acc: number, c: any) => acc + (c.monthlyPlanned || 0), 0);

  // 3. Sum up Active debts installment value
  const sumOfActiveDebts = debts
    .filter((d: any) => d.status === 'Ativo')
    .reduce((acc: number, d: any) => acc + (d.installmentValue || 0), 0);

  // Totals calculations
  const totalReceitasPrevistas = revenues.reduce((acc: number, curr: any) => acc + (curr.expectedValue || 0), 0);
  const totalReceitasRealizadas = revenues.reduce((acc: number, curr: any) => acc + (curr.realizedValue || 0), 0);

  // Base expenses from the list plus dynamic commitments
  const baseExpensesExpected = expenses.reduce((acc: number, curr: any) => acc + (curr.expectedValue || 0), 0);
  const baseExpensesRealized = expenses.reduce((acc: number, curr: any) => acc + (curr.realizedValue || 0), 0);

  const totalDespesasPrevistas = baseExpensesExpected + sumOfCardsBills + sumOfActiveCaixinhas + sumOfActiveDebts;
  const totalDespesasRealizadas = baseExpensesRealized + sumOfCardsBills + sumOfActiveCaixinhas + sumOfActiveDebts;
  
  const saldoPrevisto = totalReceitasPrevistas - totalDespesasPrevistas;
  const saldoRealizado = totalReceitasRealizadas - totalDespesasRealizadas;

  const handleAddRevenueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRevDesc.trim()) return;
    const newItem = {
      id: `rev-${Date.now()}`,
      description: newRevDesc,
      expectedValue: Number(newRevExp) || 0,
      realizedValue: Number(newRevReal) || 0,
    };
    setRevenues([...revenues, newItem]);
    setNewRevDesc('');
    setNewRevExp('');
    setNewRevReal('');
    setShowAddRevenue(false);
  };

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpDesc.trim()) return;
    const newItem = {
      id: `exp-${Date.now()}`,
      description: newExpDesc,
      expectedValue: Number(newExpExp) || 0,
      realizedValue: Number(newExpReal) || 0,
    };
    setExpenses([...expenses, newItem]);
    setNewExpDesc('');
    setNewExpExp('');
    setNewExpReal('');
    setShowAddExpense(false);
  };

  const handleDeleteRevenue = (id: string) => {
    setRevenues(revenues.filter((r: any) => r.id !== id));
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter((e: any) => e.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header & Month Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet size={22} className="text-blue-600" />
            Fluxo de Caixa Mensal
          </h2>
          <p className="text-xs text-gray-500">Acompanhe suas entradas, saídas e saldo livre em tempo real.</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100 self-start lg:self-auto flex-wrap">
          {months.slice(0, 12).map((month: string, idx: number) => (
            <button
              key={month}
              onClick={() => setSelectedMonth(idx)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedMonth === idx 
                  ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
              }`}
            >
              {month}
            </button>
          ))}
        </div>
      </div>

      {/* Main KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 shadow-sm hover:border-gray-200 transition-all">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
            <TrendingUp size={16} className="text-emerald-500 animate-pulse" /> Recebidos
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-600">{formatCurrency(totalReceitasRealizadas)}</p>
            <p className="text-[11px] text-gray-500 font-medium mt-1">Previsto: <span className="font-bold">{formatCurrency(totalReceitasPrevistas)}</span></p>
          </div>
        </div>
        
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 shadow-sm hover:border-gray-200 transition-all">
          <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">
            <TrendingDown size={16} className="text-rose-500" /> Compromissos totais
          </div>
          <div>
            <p className="text-2xl font-black text-rose-500">{formatCurrency(totalDespesasRealizadas)}</p>
            <p className="text-[11px] text-gray-500 font-medium mt-1">Previsto: <span className="font-bold">{formatCurrency(totalDespesasPrevistas)}</span></p>
          </div>
        </div>

        <div className={`${saldoRealizado >= 0 ? 'bg-blue-50 border-blue-100 text-blue-900' : 'bg-rose-50 border-rose-100 text-rose-900'} border rounded-xl p-4 shadow-sm`}>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2 opacity-80">
            <Wallet size={16} className={saldoRealizado >= 0 ? 'text-blue-600' : 'text-rose-600'} /> Saldo Líquido
          </div>
          <div>
            <p className={`text-2xl font-black ${saldoRealizado >= 0 ? 'text-blue-700' : 'text-rose-700'}`}>{formatCurrency(saldoRealizado)}</p>
            <p className={`text-[11px] font-medium mt-1 opacity-70`}>Planejado: <span className="font-bold">{formatCurrency(saldoPrevisto)}</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receitas Card Section */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="bg-gray-50/70 px-4 py-3.5 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-500" />
                <h3 className="font-bold text-gray-800 text-sm">Minhas Receitas - {months[selectedMonth]}</h3>
              </div>
              <button 
                onClick={() => setShowAddRevenue(!showAddRevenue)}
                className={`p-1.5 rounded-lg border transition-all ${
                  showAddRevenue ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' : 'bg-white text-blue-600 border-gray-200 hover:bg-gray-50 shadow-sm'
                }`}
                title="Cadastrar Receita"
              >
                {showAddRevenue ? <X size={14} strokeWidth={2.5} /> : <Plus size={14} strokeWidth={2.5} />}
              </button>
            </div>

            <AnimatePresence>
              {showAddRevenue && (
                <motion.form 
                  onSubmit={handleAddRevenueSubmit}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-4 border-b border-gray-100 bg-gray-50/50 space-y-3 overflow-hidden text-sm"
                >
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Nova Entrada de Capital</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Salário CLT" 
                      value={newRevDesc}
                      onChange={(e) => setNewRevDesc(e.target.value)}
                      className="border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-xs text-gray-800"
                    />
                    <input 
                      type="number" 
                      placeholder="Planejado (R$)" 
                      value={newRevExp}
                      onChange={(e) => setNewRevExp(e.target.value)}
                      className="border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-xs text-gray-800"
                    />
                    <input 
                      type="number" 
                      placeholder="Realizado (R$)" 
                      value={newRevReal}
                      onChange={(e) => setNewRevReal(e.target.value)}
                      className="border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-xs text-gray-800"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-1.5 text-xs font-bold transition-colors"
                  >
                    Adicionar Receita
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="divide-y divide-gray-100 max-h-[350px] overflow-y-auto custom-scrollbar">
              {revenues.map(rev => (
                <div key={rev.id} className="p-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors group">
                  <div className="flex-1 mr-4">
                    <p className="text-sm font-semibold text-gray-800">{rev.description}</p>
                    <p className="text-xs text-gray-400">Previsto: {formatCurrency(rev.expectedValue)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600">{formatCurrency(rev.realizedValue)}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteRevenue(rev.id)}
                      className="text-gray-300 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {revenues.length === 0 && (
                <div className="p-10 text-center text-gray-400 text-xs">
                  Nenhuma receita registrada para este período.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Despesas Card Section */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="bg-gray-50/70 px-4 py-3.5 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <TrendingDown size={16} className="text-rose-500" />
                <h3 className="font-bold text-gray-800 text-sm">Minhas Despesas Fixas - {months[selectedMonth]}</h3>
              </div>
              <button 
                onClick={() => setShowAddExpense(!showAddExpense)}
                className={`p-1.5 rounded-lg border transition-all ${
                  showAddExpense ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' : 'bg-white text-blue-600 border-gray-200 hover:bg-gray-50 shadow-sm'
                }`}
                title="Cadastrar Despesa"
              >
                {showAddExpense ? <X size={14} strokeWidth={2.5} /> : <Plus size={14} strokeWidth={2.5} />}
              </button>
            </div>

            <AnimatePresence>
              {showAddExpense && (
                <motion.form 
                  onSubmit={handleAddExpenseSubmit}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-4 border-b border-gray-100 bg-gray-50/50 space-y-3 overflow-hidden text-sm"
                >
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Nova Despesa / Saída</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Conta de Luz" 
                      value={newExpDesc}
                      onChange={(e) => setNewExpDesc(e.target.value)}
                      className="border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-xs text-gray-800"
                    />
                    <input 
                      type="number" 
                      placeholder="Planejado (R$)" 
                      value={newExpExp}
                      onChange={(e) => setNewExpExp(e.target.value)}
                      className="border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-xs text-gray-800"
                    />
                    <input 
                      type="number" 
                      placeholder="Realizado (R$)" 
                      value={newExpReal}
                      onChange={(e) => setNewExpReal(e.target.value)}
                      className="border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white text-xs text-gray-800"
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-1.5 text-xs font-bold transition-colors"
                  >
                    Adicionar Despesa
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="divide-y divide-gray-100 max-h-[350px] overflow-y-auto custom-scrollbar">
              {expenses.map(exp => (
                <div key={exp.id} className="p-3.5 flex items-center justify-between hover:bg-gray-50/50 transition-colors group">
                  <div className="flex-1 mr-4">
                    <p className="text-sm font-semibold text-gray-800">{exp.description}</p>
                    <p className="text-xs text-gray-400">Previsto: {formatCurrency(exp.expectedValue)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`text-sm font-bold ${exp.realizedValue > exp.expectedValue ? 'text-rose-600' : 'text-gray-950'}`}>{formatCurrency(exp.realizedValue)}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="text-gray-300 hover:text-rose-600 p-1 rounded-md hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}

              {expenses.length === 0 && (
                <div className="p-10 text-center text-gray-400 text-xs">
                  Nenhuma despesa fixa registrada. Use o botão + acima.
                </div>
              )}
              
              {/* Automated system-compiled liabilities feed */}
              <div className="p-4 bg-slate-50/70 border-t-2 border-dashed border-gray-200 space-y-3">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Compromissos Integrados Dinamicamente</div>
                
                {sumOfCardsBills > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-medium text-slate-600">
                      <CreditCard size={14} className="text-slate-500" />
                      <span>Faturas Mensais de Cartão ({cards.length})</span>
                    </div>
                    <span className="font-bold text-slate-800">{formatCurrency(sumOfCardsBills)}</span>
                  </div>
                )}

                {sumOfActiveCaixinhas > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-medium text-slate-600">
                      <PiggyBank size={14} className="text-emerald-500" />
                      <span>Poupança Programada (Caixinhas Ativas)</span>
                    </div>
                    <span className="font-bold text-emerald-600">{formatCurrency(sumOfActiveCaixinhas)}</span>
                  </div>
                )}

                {sumOfActiveDebts > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-medium text-slate-600">
                      <Receipt size={14} className="text-amber-500" />
                      <span>Parcelas de Dívidas / Passivos Simples</span>
                    </div>
                    <span className="font-bold text-amber-600">{formatCurrency(sumOfActiveDebts)}</span>
                  </div>
                )}

                {sumOfCardsBills === 0 && sumOfActiveCaixinhas === 0 && sumOfActiveDebts === 0 && (
                  <p className="text-[10px] text-gray-400 text-center italic">Nenhum compromisso financeiro secundário ativo.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// ============================================
// Cartões de Crédito Component
// ============================================
const Cartoes = ({ cards, setCards }: any) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [limit, setLimit] = useState('');
  const [used, setUsed] = useState('');
  const [invoice, setInvoice] = useState('');
  const [due, setDue] = useState('10');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCard = {
      id: `card-${Date.now()}`,
      name,
      totalLimit: Number(limit) || 0,
      usedLimit: Number(used) || 0,
      invoiceValue: Number(invoice) || 0,
      dueDay: Number(due) || 10
    };

    setCards([...cards, newCard]);
    setName('');
    setLimit('');
    setUsed('');
    setInvoice('');
    setDue('10');
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    setCards(cards.filter((c: any) => c.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="text-blue-600" size={24} />
            Cartões de Crédito
          </h2>
          <p className="text-xs text-gray-500">Controle seus limites, vencimentos e faturas num piscar de olhos.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            showAddForm ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {showAddForm ? (
            <>
              <X size={16} /> <span>Fechar</span>
            </>
          ) : (
            <>
              <Plus size={16} /> <span className="hidden sm:inline">Novo Cartão</span>
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.form 
            onSubmit={handleSubmit}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-5 border border-gray-200 rounded-2xl bg-gray-50/50 space-y-4 overflow-hidden text-sm max-w-xl"
          >
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">Cadastrar Novo Cartão</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Instituição / Nome</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Nubank Ultravioleta" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 bg-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Dia de Vencimento</label>
                <input 
                  type="number" 
                  required
                  min="1" max="31"
                  value={due} 
                  onChange={(e) => setDue(e.target.value)} 
                  className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 bg-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Limite Total (R$)</label>
                <input 
                  type="number" 
                  required
                  value={limit} 
                  onChange={(e) => setLimit(e.target.value)} 
                  className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 bg-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Limite já Consumido (R$)</label>
                <input 
                  type="number" 
                  required
                  value={used} 
                  onChange={(e) => setUsed(e.target.value)} 
                  className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 bg-white"
                />
              </div>
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Fatura Atual do Mês (R$)</label>
                <input 
                  type="number" 
                  required
                  value={invoice} 
                  onChange={(e) => setInvoice(e.target.value)} 
                  className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 bg-white"
                />
              </div>
            </div>
            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs transition-colors"
            >
              Confirmar e Adicionar
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card: any) => {
          const usagePercent = card.totalLimit > 0 ? (card.usedLimit / card.totalLimit) * 100 : 0;
          const availableLimit = Math.max(0, card.totalLimit - card.usedLimit);

          return (
            <div key={card.id} className="border border-gray-200 rounded-2xl p-5 bg-gradient-to-br from-gray-900 to-gray-800 text-white relative overflow-hidden shadow-md hover:shadow-lg transition-shadow group">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
              
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">{card.name}</p>
                  <h3 className="font-semibold text-sm">•••• •••• •••• {card.id.slice(-4)}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <CreditCard className="text-gray-400" size={20} />
                  <button 
                    onClick={() => handleDelete(card.id)}
                    className="text-gray-500 hover:text-red-400 p-1 rounded-md bg-white/5 hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Remover Cartão"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <div className="space-y-4 relative z-10 text-xs">
                <div>
                  <div className="flex justify-between text-gray-300 mb-1.5">
                    <span>Limite Consumido</span>
                    <span className="font-medium">{formatCurrency(card.usedLimit)} / {formatCurrency(card.totalLimit)}</span>
                  </div>
                  <div className="w-full bg-gray-700/60 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${usagePercent > 80 ? 'bg-red-500' : 'bg-blue-400'}`} 
                      style={{ width: `${Math.min(100, usagePercent)}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Disponível para compras: <span className="font-bold text-gray-200">{formatCurrency(availableLimit)}</span></p>
                </div>
                
                <div className="flex justify-between items-end pt-3 border-t border-gray-700/50">
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest">Fatura Estimada</p>
                    <p className="text-base font-black text-emerald-400">{formatCurrency(card.invoiceValue)}</p>
                  </div>
                  <div className="text-right text-[10px] text-gray-400 bg-black/20 px-2 py-1 rounded-md">
                    Vence no Dia: <span className="font-black text-white">{card.dueDay}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {cards.length === 0 && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl text-gray-500">
            <CreditCard className="mx-auto text-gray-300 mb-3" size={36} />
            <p className="font-semibold text-gray-700">Nenhum cartão cadastrado.</p>
            <p className="text-xs text-gray-400 mt-1">Adicione um cartão de crédito para monitorar suas parcelas integradas.</p>
          </div>
        )}
      </div>
      
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={18} />
        <p className="text-xs text-blue-800">Os valores de faturas são integrados instantaneamente ao painel do <strong>Fluxo de Caixa Mensal</strong> para manter seu cálculo de saldo livre sempre correto.</p>
      </div>
    </div>
  );
};


// ============================================
// Dívidas Component
// ============================================
const Dividas = ({ debts, setDebts }: any) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [creditor, setCreditor] = useState('');
  const [type, setType] = useState('Financiamento');
  const [remaining, setRemaining] = useState('');
  const [installment, setInstallment] = useState('');
  const [installmentsCount, setInstallmentsCount] = useState('');
  const [status, setStatus] = useState('Ativo');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditor.trim()) return;

    const newDebt = {
      id: `debt-${Date.now()}`,
      creditor,
      type,
      remainingValue: Number(remaining) || 0,
      installmentValue: Number(installment) || 0,
      installmentsCount: Number(installmentsCount) || 12,
      status
    };

    setDebts([...debts, newDebt]);
    setCreditor('');
    setType('Financiamento');
    setRemaining('');
    setInstallment('');
    setInstallmentsCount('');
    setStatus('Ativo');
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    setDebts(debts.filter((d: any) => d.id !== id));
  };

  const handlePayInstallment = (id: string) => {
    setDebts(debts.map((d: any) => {
      if (d.id === id) {
        const nextRemaining = Math.max(0, d.remainingValue - d.installmentValue);
        const nextCount = Math.max(0, d.installmentsCount - 1);
        return {
          ...d,
          remainingValue: nextRemaining,
          installmentsCount: nextCount,
          status: nextRemaining === 0 ? 'Quitada' : d.status
        };
      }
      return d;
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="text-blue-600" size={24} />
            Dívidas & Compromissos parcelados
          </h2>
          <p className="text-xs text-gray-500">Mapeie e gerencie seus passivos para sair das dívidas mais rapidamente.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            showAddForm ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {showAddForm ? (
            <>
              <X size={16} /> <span>Fechar</span>
            </>
          ) : (
            <>
              <Plus size={16} /> <span className="hidden sm:inline">Nova Dívida</span>
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.form 
            onSubmit={handleSubmit}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-5 border border-gray-200 rounded-2xl bg-gray-50/50 space-y-4 overflow-hidden text-sm max-w-xl"
          >
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">Cadastrar Novo Compromisso</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Credor</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Banco Itaú" 
                  value={creditor} 
                  onChange={(e) => setCreditor(e.target.value)} 
                  className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 bg-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Tipo de Passivo</label>
                <select 
                  value={type} 
                  onChange={(e) => setType(e.target.value)} 
                  className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 bg-white"
                >
                  <option value="Empréstimo">Empréstimo</option>
                  <option value="Financiamento">Financiamento</option>
                  <option value="Cheque Especial">Cheque Especial</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Valor Devedor Restante (R$)</label>
                <input 
                  type="number" 
                  required
                  value={remaining} 
                  onChange={(e) => setRemaining(e.target.value)} 
                  className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 bg-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Valor da Parcela Mensal (R$)</label>
                <input 
                  type="number" 
                  required
                  value={installment} 
                  onChange={(e) => setInstallment(e.target.value)} 
                  className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 bg-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Parcelas Restantes (Contagem)</label>
                <input 
                  type="number" 
                  required
                  value={installmentsCount} 
                  onChange={(e) => setInstallmentsCount(e.target.value)} 
                  className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 bg-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Status de Atividade</label>
                <select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)} 
                  className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 bg-white"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Atrasada">Em Atraso</option>
                  <option value="Quitada">Liquidada</option>
                </select>
              </div>
            </div>
            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs transition-colors"
            >
              Adicionar Compromisso
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm text-xs">
        <div className="bg-gray-50 grid grid-cols-12 px-4 py-3 border-b border-gray-200 font-bold text-gray-500 uppercase tracking-widest text-[9px]">
          <div className="col-span-5 sm:col-span-4">Credor & Detalhes</div>
          <div className="col-span-3 sm:col-span-3">Dívida de Partida</div>
          <div className="col-span-2 sm:col-span-2">Mensalidade</div>
          <div className="col-span-2 col-start-11 text-right">Ações</div>
        </div>

        <div className="divide-y divide-gray-100">
          {debts.map((debt: any) => (
            <div key={debt.id} className="grid grid-cols-12 px-4 py-4 items-center hover:bg-gray-50/40 transition-colors group">
              <div className="col-span-5 sm:col-span-4 pr-2">
                <p className="font-bold text-gray-800 text-sm">{debt.creditor}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 font-bold text-slate-500 uppercase">{debt.type}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                    debt.status === 'Ativo' ? 'bg-emerald-50 text-emerald-600' :
                    debt.status === 'Quitada' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
                  }`}>{debt.status}</span>
                </div>
              </div>

              <div className="col-span-3 sm:col-span-3 flex flex-col justify-center">
                <span className="font-semibold text-gray-900">{formatCurrency(debt.remainingValue)}</span>
                <span className="text-[10px] text-gray-400 mt-0.5">{debt.installmentsCount} parcelas a pagar</span>
              </div>

              <div className="col-span-2 sm:col-span-2 font-black text-gray-700">
                {formatCurrency(debt.installmentValue)}
              </div>

              <div className="col-span-2 col-start-11 text-right flex items-center justify-end gap-2">
                {debt.status !== 'Quitada' && (
                  <button
                    onClick={() => handlePayInstallment(debt.id)}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold px-2 py-1 rounded-lg text-[10px] transition-all"
                    title="Dar baixa em uma parcela paga"
                  >
                    Pagar Parcela
                  </button>
                )}
                <button
                  onClick={() => handleDelete(debt.id)}
                  className="text-gray-300 hover:text-red-500 p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                  title="remover dívida"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {debts.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              Nenhuma dívida ou compromisso financeiro cadastrado no momento.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// ============================================
// Caixinhas Component
// ============================================
const Caixinhas = ({ caixinhas, setCaixinhas }: any) => {
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Create state variables for forms
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [monthly, setMonthly] = useState('');

  // Active inputs per Caixinha for depositing money
  const [depositingId, setDepositingId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCaixinha = {
      id: `caixa-${Date.now()}`,
      name,
      targetValue: Number(target) || 0,
      currentValue: Number(current) || 0,
      monthlyPlanned: Number(monthly) || 0,
      status: 'Ativo'
    };

    setCaixinhas([...caixinhas, newCaixinha]);
    setName('');
    setTarget('');
    setCurrent('');
    setMonthly('');
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    setCaixinhas(caixinhas.filter((c: any) => c.id !== id));
  };

  const handleToggleStatus = (id: string) => {
    setCaixinhas(caixinhas.map((c: any) => {
      if (c.id === id) {
        return {
          ...c,
          status: c.status === 'Ativo' ? 'Pausado' : 'Ativo'
        };
      }
      return c;
    }));
  };

  const handleDepositSubmit = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    const amount = Number(depositAmount);
    if (!amount || amount <= 0) return;

    setCaixinhas(caixinhas.map((c: any) => {
      if (c.id === id) {
        return {
          ...c,
          currentValue: c.currentValue + amount
        };
      }
      return c;
    }));

    setDepositAmount('');
    setDepositingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <PiggyBank className="text-blue-600" size={24} />
            Caixinhas (Reservas & Metas)
          </h2>
          <p className="text-xs text-gray-500">Aportes programados mensais são mostrados automaticamente como saídas de planejamento.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            showAddForm ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {showAddForm ? (
            <>
              <X size={16} /> <span>Fechar</span>
            </>
          ) : (
            <>
              <Plus size={16} /> <span className="hidden sm:inline">Nova Meta</span>
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {showAddForm && (
          <motion.form 
            onSubmit={handleSubmit}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-5 border border-gray-200 rounded-2xl bg-gray-50/50 space-y-4 overflow-hidden text-sm max-w-xl"
          >
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">Criar Nova Caixinha</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Nome do Objetivo</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Reserva para Aluguel / Carro Novo" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 bg-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Meta Alvo Global (R$)</label>
                <input 
                  type="number" 
                  required
                  value={target} 
                  onChange={(e) => setTarget(e.target.value)} 
                  className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 bg-white"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Valor já Guardado Inicial (R$)</label>
                <input 
                  type="number" 
                  required
                  value={current} 
                  onChange={(e) => setCurrent(e.target.value)} 
                  className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 bg-white"
                />
              </div>
              <div className="flex flex-col gap-1 sm:col-span-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Aporte planejado por mês (R$)</label>
                <input 
                  type="number" 
                  required
                  value={monthly} 
                  onChange={(e) => setMonthly(e.target.value)} 
                  className="border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-800 bg-white"
                />
              </div>
            </div>
            <button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs transition-colors"
            >
              Criar Caixinha
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {caixinhas.map((caixinha: any) => {
          const progressPercent = caixinha.targetValue > 0 ? (caixinha.currentValue / caixinha.targetValue) * 100 : 0;
          const isAtivo = caixinha.status === 'Ativo';

          return (
            <div 
              key={caixinha.id} 
              className={`border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-all shadow-sm bg-white flex flex-col justify-between ${
                !isAtivo ? 'opacity-65 grayscale bg-gray-50/50' : ''
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${isAtivo ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                      {caixinha.name.toLowerCase().includes('viagem') ? <Target size={20} /> : <PiggyBank size={20} />}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm uppercase tracking-tight">{caixinha.name}</h3>
                      <button 
                        onClick={() => handleToggleStatus(caixinha.id)}
                        className={`text-[10px] font-bold underline cursor-pointer mt-0.5 ${isAtivo ? 'text-emerald-600' : 'text-gray-400'}`}
                      >
                        Status: {caixinha.status} (Clique para alternar)
                      </button>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(caixinha.id)}
                    className="text-gray-300 hover:text-red-500 p-1 rounded-md"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-xl font-extrabold text-slate-850">{formatCurrency(caixinha.currentValue)}</span>
                      <span className="text-gray-400 text-[10px]">Alvo: {formatCurrency(caixinha.targetValue)}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isAtivo ? 'bg-emerald-500' : 'bg-gray-400'}`} 
                        style={{ width: `${Math.min(100, progressPercent)}%` }}
                      ></div>
                    </div>
                    <p className="text-[10px] text-gray-400 text-right mt-1 font-semibold">{Math.round(Math.min(100, progressPercent))}% acumulado</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col gap-3">
                <div className="flex justify-between items-center bg-slate-50 rounded-xl px-3 py-2 text-xs border border-slate-100">
                  <span className="text-gray-500">Aporte mensal planejado:</span>
                  <span className={`font-bold ${isAtivo ? 'text-gray-800' : 'text-gray-400 line-through'}`}>{formatCurrency(caixinha.monthlyPlanned)}</span>
                </div>

                {depositingId === caixinha.id ? (
                  <form 
                    onSubmit={(e) => handleDepositSubmit(e, caixinha.id)}
                    className="flex gap-2 items-center bg-gray-50 px-2 py-1 rounded-lg border border-gray-200"
                  >
                    <input 
                      type="number" 
                      required
                      placeholder="Valor (R$)"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 py-1 text-xs w-full bg-white text-gray-800"
                    />
                    <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg p-1.5 shrink-0">
                      <Check size={12} strokeWidth={3} />
                    </button>
                    <button type="button" onClick={() => setDepositingId(null)} className="text-gray-400 hover:text-gray-600 p-1.5">
                      <X size={12} strokeWidth={3} />
                    </button>
                  </form>
                ) : (
                  <button 
                    onClick={() => setDepositingId(caixinha.id)}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1.5 rounded-lg text-[10px] transition-colors"
                  >
                    + Guardar Dinheiro nesta Caixinha
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {caixinhas.length === 0 && (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-200 rounded-2xl text-gray-500">
            <PiggyBank className="mx-auto text-gray-300 mb-3" size={36} />
            <p className="font-semibold text-gray-700">Nenhuma caixinha cadastrada.</p>
            <p className="text-xs text-gray-400 mt-1">Crie metas para monitorar suas economias programadas.</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-50 rounded-xl text-center border border-gray-100 text-xs text-gray-500">
        <p>Aportes programados em caixinhas com status <strong>Ativo</strong> são contabilizados diretamente como saídas no seu planejamento mensal de fluxo de caixa.</p>
      </div>
    </div>
  );
};
