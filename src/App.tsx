import { useState, useEffect, useMemo } from 'react';
import { initialTasks } from './data';
import { Task, CarScenario, RealEstateScenario } from './types';
import { TaskCard } from './components/TaskCard';
import { DashboardStats } from './components/DashboardStats';
import { EditTaskModal } from './components/EditTaskModal';
import { CarSimulator } from './components/CarSimulator';
import { HouseSimulator } from './components/HouseSimulator';
import { RezendeLogo } from './components/RezendeLogo';
import { Finances } from './components/Finances';
import { Loader2, LogIn, LogOut, ExternalLink, Plus, ListTodo, Car, Link2, Home, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Auth } from './components/Auth';
import { supabase } from './supabase';
import { Session } from '@supabase/supabase-js';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [cars, setCars] = useState<CarScenario[]>([]);
  const [houses, setHouses] = useState<RealEstateScenario[]>([]);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | 'Todas'>('Todas');
  const [activeTab, setActiveTab] = useState<'tasks' | 'cars' | 'houses' | 'finances'>('tasks');

  const [session, setSession] = useState<Session | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setNeedsAuth(!session);
      setIsInitializing(false);
      if (session) {
        setTasks(initialTasks); // temporary mock, will be DB fetch
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setNeedsAuth(!session);
      if (session) {
        setTasks(initialTasks); // temporary mock, will be DB fetch
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setTasks([]);
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    if (!tasks.find(t => t.id === updatedTask.id)) {
      setTasks([updatedTask, ...tasks]);
    } else {
      setTasks(tasks.map(t => (t.id === updatedTask.id ? updatedTask : t)));
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
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-gray-900 font-sans pb-28">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shrink-0">
              <RezendeLogo className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                Planner Rezende
                {syncing && <Loader2 size={14} className="animate-spin text-gray-400" />}
              </h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Deus conduz nossos planos</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm font-medium">
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

        <div className="mb-8 flex flex-col sm:flex-row sm:items-center px-4 gap-4">
          <div className="flex flex-wrap items-center gap-3 text-[13px] font-medium">
            <span className="text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200/60 shadow-sm">{taskStats.totalTasks} Tarefas</span>
            <div className="flex items-center gap-2 text-gray-500">
              <span className="text-gray-600">{taskStats.notStarted} Fazer</span>
              <span className="text-gray-300">•</span>
              <span className="text-blue-600">{taskStats.inProgress} Fazendo</span>
              <span className="text-gray-300">•</span>
              <span className="text-green-600">{taskStats.completed} Feitas</span>
            </div>
          </div>
          <div className="hidden sm:block w-px h-4 bg-gray-300 mx-1"></div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
            <span>{taskStats.totalSubtasks} Subtarefas:</span>
            <span className="text-gray-400">{taskStats.subtasksPending} Pendentes</span>
            <span className="text-gray-300">/</span>
            <span className="text-green-600">{taskStats.subtasksCompleted} Concluídas</span>
          </div>
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'finances' ? (
              <Finances />
            ) : activeTab === 'cars' ? (
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
          </motion.div>
        </AnimatePresence>
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

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200 p-1.5 flex items-center gap-1">
         <button 
           onClick={() => setActiveTab('tasks')}
           className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${activeTab === 'tasks' ? 'bg-white text-gray-900 border border-gray-200 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50 border border-transparent'}`}
         >
            <ListTodo size={18} />
            Tarefas
         </button>
         <button 
           onClick={() => setActiveTab('cars')}
           className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${activeTab === 'cars' ? 'bg-white text-gray-900 border border-gray-200 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50 border border-transparent'}`}
         >
            <Car size={18} />
            Veículos
         </button>
         <button 
           onClick={() => setActiveTab('houses')}
           className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${activeTab === 'houses' ? 'bg-white text-gray-900 border border-gray-200 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50 border border-transparent'}`}
         >
            <Home size={18} />
            Imóveis
         </button>
         <button 
           onClick={() => setActiveTab('finances')}
           className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${activeTab === 'finances' ? 'bg-white text-gray-900 border border-gray-200 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50 border border-transparent'}`}
         >
            <Wallet size={18} />
            Finanças
         </button>
      </div>
    </div>
  );
}
