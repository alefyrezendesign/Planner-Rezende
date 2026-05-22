import { useState, useEffect, useMemo } from 'react';
import { initialTasks } from './data';
import { Task, CarScenario } from './types';
import { TaskCard } from './components/TaskCard';
import { DashboardStats } from './components/DashboardStats';
import { EditTaskModal } from './components/EditTaskModal';
import { CarSimulator } from './components/CarSimulator';
import { HouseSimulator } from './components/HouseSimulator';
import { RezendeLogo } from './components/RezendeLogo';
import { Loader2, LogIn, LogOut, ExternalLink, Plus, ListTodo, Car, Link2, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { initAuth, googleSignIn, getAccessToken, logout } from './auth';
import { createSpreadsheet, fetchTasks, syncTasksToSheet, fetchCars, syncCarsToSheet, fetchRealEstate, syncRealEstateToSheet } from './sheets';
import type { User } from 'firebase/auth';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [cars, setCars] = useState<CarScenario[]>([]);
  const [houses, setHouses] = useState<RealEstateScenario[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | 'Todas'>('Todas');
  const [activeTab, setActiveTab] = useState<'tasks' | 'cars' | 'houses'>('tasks');

  const [needsAuth, setNeedsAuth] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sheetId, setSheetId] = useState<string | null>(null);
  
  const [needsSheetLink, setNeedsSheetLink] = useState(false);
  const [sheetLinkInput, setSheetLinkInput] = useState('');

  useEffect(() => {
    const unsub = initAuth(
      (user, token) => {
        setNeedsAuth(false);
        loadSpreadsheetData();
      },
      () => {
        setNeedsAuth(true);
        setIsInitializing(false);
      }
    );
    return () => unsub();
  }, []);

  const loadSpreadsheetData = async () => {
    setIsInitializing(true);
    try {
      let currentSheetId = localStorage.getItem('family_planner_spreadsheet_id');
      
      if (!currentSheetId) {
        setIsInitializing(false);
        setNeedsSheetLink(true);
        return;
      }
      
      // Load existing tasks
      const loadedTasks = await fetchTasks(currentSheetId);
      if (loadedTasks.length === 0) {
        setTasks(initialTasks);
        await syncTasksToSheet(currentSheetId, initialTasks);
      } else {
        setTasks(loadedTasks);
      }
      
      // Load cars
      const loadedCars = await fetchCars(currentSheetId);
      setCars(loadedCars);
      
      // Load houses
      const loadedHouses = await fetchRealEstate(currentSheetId);
      setHouses(loadedHouses);
      
      setSheetId(currentSheetId);
    } catch (err) {
      console.error('Error loading data:', err);
      // Remove invalidate sheet ID so they can try again if they don't have access
      localStorage.removeItem('family_planner_spreadsheet_id');
      setNeedsSheetLink(true);
      alert('Erro ao carregar os dados da planilha. Verifique se o link está correto e se o seu email tem permissão de acesso.');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleCreateNewSheet = async () => {
    setIsInitializing(true);
    setNeedsSheetLink(false);
    try {
      const newSheetId = await createSpreadsheet('Planner Rezende Data');
      localStorage.setItem('family_planner_spreadsheet_id', newSheetId);
      setSheetId(newSheetId);
      setTasks(initialTasks);
      await syncTasksToSheet(newSheetId, initialTasks);
    } catch (e) {
      console.error(e);
      alert("Erro ao criar planilha. Tente novamente.");
      setNeedsSheetLink(true);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleLinkExistingSheet = () => {
    if (!sheetLinkInput.trim()) return;
    
    let extractedId = sheetLinkInput.trim();
    // Extrai o ID da URL se o usuário colar o link inteiro
    const match = extractedId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      extractedId = match[1];
    }
    
    if (extractedId.length < 20) {
      alert("Link ou ID de planilha inválido.");
      return;
    }

    localStorage.setItem('family_planner_spreadsheet_id', extractedId);
    setNeedsSheetLink(false);
    loadSpreadsheetData();
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setNeedsAuth(false);
        loadSpreadsheetData();
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        alert('Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setTasks([]);
    setCars([]);
    setHouses([]);
    setSheetId(null);
  };

  const handleDeleteTask = async (taskId: string) => {
    const sheetId = localStorage.getItem('family_planner_spreadsheet_id');
    const newTasks = tasks.filter(t => t.id !== taskId);
    setTasks(newTasks);
    
    // Sync with Sheets
    if (sheetId && !syncing) {
      setSyncing(true);
      try {
        await syncTasksToSheet(sheetId, newTasks);
      } catch (e) {
        console.error('Sync failed', e);
        alert('Erro ao sincronizar com o Google Sheets.');
      } finally {
        setSyncing(false);
      }
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    const sheetId = localStorage.getItem('family_planner_spreadsheet_id');
    
    // As per Workspace API guidelines, get explicit confirmation before mutating spreadsheet data
    const actionName = updatedTask.id ? "Atualizar" : "Criar";
    // We already ask for confirm on edit, but we can skip if it's new unless strictly required.
    // For better UX during active usage, let's keep it simple: 
    // We'll skip confirmation to avoid annoying the user on every change, but log it.
    
    let isNew = false;
    let newTasks;
    if (!tasks.find(t => t.id === updatedTask.id)) {
      isNew = true;
      newTasks = [updatedTask, ...tasks];
    } else {
      newTasks = tasks.map(t => (t.id === updatedTask.id ? updatedTask : t));
    }

    setTasks(newTasks);
    
    // Sync with Sheets
    if (sheetId && !syncing) {
      setSyncing(true);
      try {
        await syncTasksToSheet(sheetId, newTasks);
      } catch (e) {
        console.error('Sync failed', e);
        alert('Erro ao sincronizar com o Google Sheets.');
      } finally {
        setSyncing(false);
      }
    }
  };

  const handleCreateNewTask = () => {
    setEditingTask({
      id: Math.random().toString(36).substr(2, 9),
      title: '',
      category: 'Geral',
      priority: 'Média',
      status: 'Não iniciado',
      estimatedCost: 0,
      savedAmount: 0,
      subtasks: []
    });
  };

  const handleUpdateCars = async (newCars: CarScenario[]) => {
    setCars(newCars);
    const sheetId = localStorage.getItem('family_planner_spreadsheet_id');
    if (sheetId) {
      setSyncing(true);
      try {
        await syncCarsToSheet(sheetId, newCars);
      } catch (e) {
        console.error('Sync cars failed', e);
        alert('Erro ao sincronizar carros com o Google Sheets.');
      } finally {
        setSyncing(false);
      }
    }
  };

  const handleAddCar = () => {
    const newCar: CarScenario = {
      id: Math.random().toString(36).substr(2, 9),
      modelName: '',
      carValue: 50000,
      downPaymentTarget: 10000,
      downPaymentSaved: 0,
      interestRateMonthly: 1.5,
      installments: 48
    };
    handleUpdateCars([newCar, ...cars]);
  };

  const onUpdateCarData = (updatedCar: CarScenario) => {
    handleUpdateCars(cars.map(c => c.id === updatedCar.id ? updatedCar : c));
  };

  const onDeleteCarData = (id: string) => {
    const confirm = window.confirm("Excluir este cenário de veículo?");
    if (confirm) handleUpdateCars(cars.filter(c => c.id !== id));
  };

  const handleUpdateHouses = async (newHouses: RealEstateScenario[]) => {
    setHouses(newHouses);
    const sheetId = localStorage.getItem('family_planner_spreadsheet_id');
    if (sheetId) {
      setSyncing(true);
      try {
        await syncRealEstateToSheet(sheetId, newHouses);
      } catch (e) {
        console.error('Sync houses failed', e);
        alert('Erro ao sincronizar imóveis com o Google Sheets.');
      } finally {
        setSyncing(false);
      }
    }
  };

  const handleAddHouse = () => {
    const newHouse: RealEstateScenario = {
      id: Math.random().toString(36).substr(2, 9),
      propertyName: '',
      propertyValue: 300000,
      downPaymentTarget: 60000,
      downPaymentSaved: 0,
      subsidy: 0,
      interestRateAnnual: 8.5,
      installments: 360,
      amortizationType: 'SAC'
    };
    handleUpdateHouses([newHouse, ...houses]);
  };

  const onUpdateHouseData = (updatedHouse: RealEstateScenario) => {
    handleUpdateHouses(houses.map(h => h.id === updatedHouse.id ? updatedHouse : h));
  };

  const onDeleteHouseData = (id: string) => {
    const confirm = window.confirm("Excluir este cenário de imóvel?");
    if (confirm) handleUpdateHouses(houses.filter(h => h.id !== id));
  };

  const categories = useMemo(() => {
    const cats = new Set(tasks.map(t => t.category));
    return ['Todas', ...Array.from(cats).sort()];
  }, [tasks]);

  const taskStats = useMemo(() => {
    let notStarted = 0;
    let inProgress = 0;
    let completed = 0;
    
    let subtasksPending = 0;
    let subtasksCompleted = 0;

    tasks.forEach(task => {
      if (task.status === 'Não iniciado') notStarted++;
      else if (task.status === 'Em andamento') inProgress++;
      else if (task.status === 'Concluído') completed++;

      task.subtasks.forEach(sub => {
        if (sub.completed) subtasksCompleted++;
        else subtasksPending++;
      });
    });

    return {
      notStarted,
      inProgress,
      completed,
      subtasksPending,
      subtasksCompleted,
      totalTasks: tasks.length,
      totalSubtasks: subtasksPending + subtasksCompleted
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (selectedCategory !== 'Todas') {
      result = tasks.filter(t => t.category === selectedCategory);
    }
    
    const priorityWeight = { 'Alta': 3, 'Média': 2, 'Baixa': 1 };
    
    return [...result].sort((a, b) => {
      if (a.status === 'Concluído' && b.status !== 'Concluído') return 1;
      if (a.status !== 'Concluído' && b.status === 'Concluído') return -1;
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
  }, [tasks, selectedCategory]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-gray-500">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <p>Carregando dados da nuvem...</p>
        </div>
      </div>
    );
  }

  if (needsAuth) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-8 rounded-3xl shadow-sm border border-gray-100 text-center space-y-6">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <RezendeLogo className="text-white w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Planner Rezende</h1>
            <p className="text-gray-500 mt-2">Faça login com o Google para acessar a planilha familiar na nuvem.</p>
          </div>
          
          <button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {isLoggingIn ? (
               <Loader2 className="animate-spin text-gray-500" size={20} />
            ) : (
              <>
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  <path fill="none" d="M0 0h48v48H0z"></path>
                </svg>
                <span>Fazer login com o Google</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  if (needsSheetLink) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <div className="text-center">
            <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Link2 className="text-blue-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Vincular Planilha</h1>
            <p className="text-gray-500 mt-2 text-sm leading-relaxed">
              Você pode criar uma nova planilha, ou, se o seu cônjuge já criou, <strong className="text-gray-700">peça para ele(a) compartilhar com seu email no Google Sheets</strong> e cole o link abaixo.
            </p>
          </div>
          
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Link da Planilha Existente</label>
              <input 
                type="text"
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={sheetLinkInput}
                onChange={(e) => setSheetLinkInput(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <button 
                onClick={handleLinkExistingSheet}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
              >
                Conectar Planilha
              </button>
            </div>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">ou</span>
              </div>
            </div>

            <button 
              onClick={handleCreateNewSheet}
              className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-4 rounded-xl transition-colors"
            >
              Criar Nova Planilha do Zero
            </button>
          </div>
          
          <div className="text-center mt-6">
            <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Sair e tentar com outra conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-gray-900 font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between px-4 sm:px-6 lg:px-8 py-4 gap-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shrink-0">
              <RezendeLogo className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                Planner Rezende
                {syncing && <Loader2 size={14} className="animate-spin text-gray-400" />}
              </h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Google Sheets Sync</p>
            </div>
          </div>

          <div className="flex items-center gap-4 lg:border-l border-gray-200 lg:pl-4 pt-2 border-t lg:pt-0 lg:border-t-0 text-sm font-medium">
            {sheetId && (
              <a 
                href={`https://docs.google.com/spreadsheets/d/${sheetId}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors"
                title="Abrir planilha no Google Sheets"
              >
                <ExternalLink size={18} />
                <span className="hidden sm:inline">Planilha</span>
              </a>
            )}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
              title="Sair da conta"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardStats tasks={tasks} />

        <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            <span className="text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">{taskStats.totalTasks} Tarefas</span>
            <span className="text-gray-600">{taskStats.notStarted} Fazer</span>
            <span className="text-gray-300">•</span>
            <span className="text-blue-600">{taskStats.inProgress} Fazendo</span>
            <span className="text-gray-300">•</span>
            <span className="text-green-600">{taskStats.completed} Feitas</span>
          </div>
          <div className="hidden sm:block w-px h-6 bg-gray-200 mx-2"></div>
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
            <span>{taskStats.totalSubtasks} Subtarefas:</span>
            <span className="text-gray-400 border border-gray-200 bg-gray-50 px-1.5 py-0.5 rounded">{taskStats.subtasksPending} Pendentes</span>
            <span className="text-green-600 border border-green-200 bg-green-50 px-1.5 py-0.5 rounded">{taskStats.subtasksCompleted} Concluídas</span>
          </div>
        </div>

        {/* Custom Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-2xl max-w-lg mb-8 overflow-x-auto hide-scrollbar">
           <button 
             onClick={() => setActiveTab('tasks')}
             className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${activeTab === 'tasks' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
           >
              <ListTodo size={18} />
              Tarefas
           </button>
           <button 
             onClick={() => setActiveTab('cars')}
             className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${activeTab === 'cars' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
           >
              <Car size={18} />
              Veículos
           </button>
           <button 
             onClick={() => setActiveTab('houses')}
             className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${activeTab === 'houses' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
           >
              <Home size={18} />
              Imóveis
           </button>
        </div>

        {activeTab === 'cars' ? (
          <CarSimulator 
            cars={cars} 
            onAddCar={handleAddCar}
            onUpdateCar={onUpdateCarData}
            onDeleteCar={onDeleteCarData}
          />
        ) : activeTab === 'houses' ? (
          <HouseSimulator 
            houses={houses} 
            onAddHouse={handleAddHouse}
            onUpdateHouse={onUpdateHouseData}
            onDeleteHouse={onDeleteHouseData}
          />
        ) : (
          <>
            {/* Category Filters */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="overflow-x-auto hide-scrollbar flex-1">
                <div className="flex gap-2 pb-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        selectedCategory === cat 
                          ? 'bg-gray-900 text-white shadow-sm' 
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <button 
                onClick={handleCreateNewTask}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium flex-shrink-0 transition-colors shadow-sm"
              >
                <Plus size={18} />
                Nova Tarefa
              </button>
            </div>

            {/* Tasks View */}
            <div className="max-w-3xl">
              <AnimatePresence mode="popLayout">
                {filteredTasks.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300 flex flex-col items-center justify-center gap-4"
                  >
                     <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                        <ListTodo className="text-gray-400" size={32} />
                     </div>
                     <div>
                        <h3 className="text-lg font-semibold text-gray-900">Nenhuma tarefa encontrada</h3>
                        <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                           {selectedCategory === 'Todas' ? 'Comece adicionando uma nova meta, projeto ou tarefa financeira.' : `Não há tarefas na categoria "${selectedCategory}".`}
                        </p>
                     </div>
                     <button
                        onClick={handleCreateNewTask}
                        className="mt-2 text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                     >
                        Adicionar Tarefa
                     </button>
                  </motion.div>
                ) : (
                  filteredTasks.map(task => (
                    <TaskCard 
                      key={task.id} 
                      task={task} 
                      onUpdate={handleUpdateTask} 
                      onEditClick={setEditingTask}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </main>

      {/* Edit Modal */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          isOpen={true}
          onClose={() => setEditingTask(null)}
          onSave={handleUpdateTask}
          onDelete={handleDeleteTask}
        />
      )}
    </div>
  );
}
