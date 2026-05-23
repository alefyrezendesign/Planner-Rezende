import { useState, useEffect, useMemo } from "react";
import { initialTasks } from "./data";
import { Task, CarScenario, RealEstateScenario } from "./types";
import { TaskCard } from "./components/TaskCard";
import { DashboardStats } from "./components/DashboardStats";
import { EditTaskModal } from "./components/EditTaskModal";
import { CarSimulator } from "./components/CarSimulator";
import { HouseSimulator } from "./components/HouseSimulator";
import { RezendeLogo } from "./components/RezendeLogo";
import { Finances } from "./components/Finances";
import {
  Loader2,
  LogIn,
  LogOut,
  ExternalLink,
  Plus,
  ListTodo,
  Car,
  Link2,
  Home,
  Wallet,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Auth } from "./components/Auth";
import { supabase } from "./supabase";
import { Session } from "@supabase/supabase-js";
import * as api from "./api";

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskOrder, setTaskOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("user_tasks_order");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [cars, setCars] = useState<CarScenario[]>([]);
  const [globalCarsSavedAmount, setGlobalCarsSavedAmount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("global_cars_saved");
      return saved ? Number(saved) : 0;
    } catch {
      return 0;
    }
  });

  const handleUpdateGlobalCarsSavedAmount = async (val: number) => {
    setGlobalCarsSavedAmount(val);
    localStorage.setItem("global_cars_saved", val.toString());
    if (session) {
      await supabase.auth.updateUser({
        data: { global_cars_saved: val }
      });
    }
  };
  const [houses, setHouses] = useState<RealEstateScenario[]>([]);
  const [globalHousesSavedAmount, setGlobalHousesSavedAmount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("global_houses_saved");
      return saved ? Number(saved) : 0;
    } catch {
      return 0;
    }
  });

  const handleUpdateGlobalHousesSavedAmount = async (val: number) => {
    setGlobalHousesSavedAmount(val);
    localStorage.setItem("global_houses_saved", val.toString());
    if (session) {
      await supabase.auth.updateUser({
        data: { global_houses_saved: val }
      });
    }
  };
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | "Todas">(
    "Todas",
  );
  const [activeTab, setActiveTab] = useState<
    "tasks" | "cars" | "houses" | "finances"
  >("tasks");

  const [session, setSession] = useState<Session | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const syncUserMetadata = (currentSession: Session) => {
    const meta = currentSession.user?.user_metadata || {};
    const carsLocally = localStorage.getItem("global_cars_saved");
    const housesLocally = localStorage.getItem("global_houses_saved");

    if (meta.global_cars_saved !== undefined) {
      const val = Number(meta.global_cars_saved);
      setGlobalCarsSavedAmount(val);
      localStorage.setItem("global_cars_saved", val.toString());
    } else if (carsLocally) {
      supabase.auth.updateUser({ data: { global_cars_saved: Number(carsLocally) } });
    }

    if (meta.global_houses_saved !== undefined) {
      const val = Number(meta.global_houses_saved);
      setGlobalHousesSavedAmount(val);
      localStorage.setItem("global_houses_saved", val.toString());
    } else if (housesLocally) {
      supabase.auth.updateUser({ data: { global_houses_saved: Number(housesLocally) } });
    }
  };

  // Load all cloud data
  const loadData = async (userId: string, currentSession?: Session) => {
    setSyncing(true);
    try {
      const [fetchedTasks, fetchedCars, fetchedHouses] = await Promise.all([
        api.fetchTasks(userId),
        api.fetchCars(userId),
        api.fetchHouses(userId),
      ]);
      setTasks(fetchedTasks);
      setCars(fetchedCars);
      setHouses(fetchedHouses);

      // Migrate legacy database values to global amount if not already set globally
      const meta = currentSession?.user?.user_metadata || session?.user?.user_metadata || {};
      const carsLocally = localStorage.getItem("global_cars_saved");
      const housesLocally = localStorage.getItem("global_houses_saved");

      if (meta.global_cars_saved === undefined && !carsLocally && fetchedCars.length > 0) {
        const legacyCarSaved = Math.max(0, ...fetchedCars.map(c => c.downPaymentSaved || 0));
        if (legacyCarSaved > 0) {
          setGlobalCarsSavedAmount(legacyCarSaved);
          localStorage.setItem("global_cars_saved", legacyCarSaved.toString());
          await supabase.auth.updateUser({ data: { global_cars_saved: legacyCarSaved } });
        }
      }

      if (meta.global_houses_saved === undefined && !housesLocally && fetchedHouses.length > 0) {
        const legacyHouseSaved = Math.max(0, ...fetchedHouses.map(h => h.downPaymentSaved || 0));
        if (legacyHouseSaved > 0) {
          setGlobalHousesSavedAmount(legacyHouseSaved);
          localStorage.setItem("global_houses_saved", legacyHouseSaved.toString());
          await supabase.auth.updateUser({ data: { global_houses_saved: legacyHouseSaved } });
        }
      }
    } catch (err: any) {
      console.error("Erro ao carregar dados do Supabase:", err);
    } finally {
      setSyncing(false);
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Auth session error:", error.message);
        // On invalid refresh token, we should clear the invalid session
        supabase.auth.signOut();
      }
      setSession(session);
      setNeedsAuth(!session);
      if (session) {
        syncUserMetadata(session);
        loadData(session.user.id, session);
      } else {
        setIsInitializing(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setNeedsAuth(true);
        setTasks([]);
        setCars([]);
        setHouses([]);
        setIsInitializing(false);
        return;
      }
      setSession(session);
      setNeedsAuth(!session);
      if (session) {
        syncUserMetadata(session);
        loadData(session.user.id, session);
      } else {
        setIsInitializing(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setTasks([]);
    setCars([]);
    setHouses([]);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!session?.user?.id) return;
    const previousTasks = [...tasks];
    setTasks(tasks.filter((t) => t.id !== taskId));
    setSyncing(true);
    try {
      await api.deleteTask(session.user.id, taskId);
    } catch (err) {
      console.error(err);
      setTasks(previousTasks); // rollback
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    if (!session?.user?.id) return;
    const isNew = !tasks.find((t) => t.id === updatedTask.id);
    const previousTasks = [...tasks];

    if (isNew) {
      setTasks([updatedTask, ...tasks]);
    } else {
      setTasks(tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
    }

    setSyncing(true);
    try {
      await api.saveTask(session.user.id, updatedTask);
    } catch (err: any) {
      console.error(err);
      alert("Erro ao salvar tarefa: " + (err.message || JSON.stringify(err)));
      setTasks(previousTasks); // rollback
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateNewTask = () => {
    setEditingTask({
      id: crypto.randomUUID(),
      title: "",
      category: "Geral",
      priority: "Média",
      status: "Não iniciado",
      estimatedCost: 0,
      savedAmount: 0,
      subtasks: [],
    });
  };

  const handleUpdateCars = async (newCars: CarScenario[]) => {
    setCars(newCars);
  };

  const handleAddCar = async () => {
    if (!session?.user.id) return;
    const newCar: CarScenario = {
      id: crypto.randomUUID(),
      modelName: "",
      carValue: 50000,
      downPaymentTarget: 10000,
      downPaymentSaved: 0,
      interestRateMonthly: 1.5,
      installments: 48,
    };

    const previousCars = [...cars];
    handleUpdateCars([newCar, ...cars]);
    setSyncing(true);
    try {
      await api.saveCar(session.user.id, newCar);
    } catch (err) {
      console.error(err);
      setCars(previousCars);
    } finally {
      setSyncing(false);
    }
  };

  const onUpdateCarData = async (updatedCar: CarScenario) => {
    if (!session?.user.id) return;
    const previousCars = [...cars];
    handleUpdateCars(
      cars.map((c) => (c.id === updatedCar.id ? updatedCar : c)),
    );
    
    // Debounce API calls to avoid rate limits
    const timeoutKey = `car_${updatedCar.id}`;
    if ((window as any)[timeoutKey]) clearTimeout((window as any)[timeoutKey]);
    
    setSyncing(true);
    (window as any)[timeoutKey] = setTimeout(async () => {
      try {
        await api.saveCar(session!.user.id, updatedCar);
      } catch (err) {
        console.error(err);
        setCars(previousCars);
      } finally {
        setSyncing(false);
      }
    }, 1000);
  };

  const onDeleteCarData = async (id: string) => {
    if (!session?.user.id) return;

    const previousCars = [...cars];
    handleUpdateCars(cars.filter((c) => c.id !== id));
    setSyncing(true);
    try {
      await api.deleteCar(session.user.id, id);
    } catch (err) {
      console.error(err);
      setCars(previousCars);
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateHouses = async (newHouses: RealEstateScenario[]) => {
    setHouses(newHouses);
  };

  const handleAddHouse = async () => {
    if (!session?.user.id) return;
    const newHouse: RealEstateScenario = {
      id: crypto.randomUUID(),
      propertyName: "",
      propertyValue: 300000,
      downPaymentTarget: 60000,
      downPaymentSaved: 0,
      subsidy: 0,
      interestRateAnnual: 8.5,
      installments: 360,
      amortizationType: "SAC",
    };
    const previousHouses = [...houses];
    handleUpdateHouses([newHouse, ...houses]);
    setSyncing(true);
    try {
      await api.saveHouse(session.user.id, newHouse);
    } catch (err) {
      console.error(err);
      setHouses(previousHouses);
    } finally {
      setSyncing(false);
    }
  };

  const onUpdateHouseData = async (updatedHouse: RealEstateScenario) => {
    if (!session?.user.id) return;
    const previousHouses = [...houses];
    handleUpdateHouses(
      houses.map((h) => (h.id === updatedHouse.id ? updatedHouse : h)),
    );
    
    // Debounce API calls to avoid rate limits
    const timeoutKey = `house_${updatedHouse.id}`;
    if ((window as any)[timeoutKey]) clearTimeout((window as any)[timeoutKey]);
    
    setSyncing(true);
    (window as any)[timeoutKey] = setTimeout(async () => {
      try {
        await api.saveHouse(session!.user.id, updatedHouse);
      } catch (err) {
        console.error(err);
        setHouses(previousHouses);
      } finally {
        setSyncing(false);
      }
    }, 1000);
  };

  const onDeleteHouseData = async (id: string) => {
    if (!session?.user.id) return;
    const previousHouses = [...houses];
    handleUpdateHouses(houses.filter((h) => h.id !== id));
    setSyncing(true);
    try {
      await api.deleteHouse(session.user.id, id);
    } catch (err) {
      console.error(err);
      setHouses(previousHouses);
    } finally {
      setSyncing(false);
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(tasks.map((t) => t.category));
    return ["Todas", ...Array.from(cats).sort()];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (selectedCategory !== "Todas") {
      result = tasks.filter((t) => t.category === selectedCategory);
    }

    const priorityWeight = { Alta: 3, Média: 2, Baixa: 1 };

    return [...result].sort((a, b) => {
      const indexA = taskOrder.indexOf(a.id);
      const indexB = taskOrder.indexOf(b.id);
      
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      if (a.status === "Concluído" && b.status !== "Concluído") return 1;
      if (a.status !== "Concluído" && b.status === "Concluído") return -1;
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
  }, [tasks, selectedCategory, taskOrder]);

  const moveTask = (taskId: string, direction: "up" | "down") => {
    const currentList = filteredTasks.map(t => t.id);
    const index = currentList.indexOf(taskId);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === currentList.length - 1) return;
    
    const newIndex = direction === "up" ? index - 1 : index + 1;
    const newList = [...currentList];
    [newList[index], newList[newIndex]] = [newList[newIndex], newList[index]];
    
    let newTaskOrder = [...taskOrder];
    
    // Add missing tasks to the end
    tasks.forEach(t => {
      if (!newTaskOrder.includes(t.id)) {
        newTaskOrder.push(t.id);
      }
    });
    
    const globalIndexA = newTaskOrder.indexOf(newList[newIndex]);
    const globalIndexB = newTaskOrder.indexOf(newList[index]);
    
    if (globalIndexA !== -1 && globalIndexB !== -1) {
      [newTaskOrder[globalIndexA], newTaskOrder[globalIndexB]] = [newTaskOrder[globalIndexB], newTaskOrder[globalIndexA]];
    }
    
    setTaskOrder(newTaskOrder);
    localStorage.setItem("user_tasks_order", JSON.stringify(newTaskOrder));
  };

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
    <div className="min-h-screen bg-neutral-50 text-gray-900 font-sans pb-32 sm:pb-28">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                {!logoError ? (
                  <img 
                    src="/logo.webp" 
                    alt="Replanner" 
                    className="h-12 sm:h-16 object-contain"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="bg-white shrink-0">
                      <img src="/favicon.png" alt="Icon" className="w-8 h-8 object-contain" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                      Replanner
                    </h1>
                  </div>
                )}
                {syncing && (
                  <Loader2 size={14} className="animate-spin text-gray-400" />
                )}
              </div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold mt-1">
                Deus conduz nossos projetos.
              </p>
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
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "finances" ? (
              <Finances />
            ) : activeTab === "cars" ? (
              <CarSimulator
                cars={cars}
                globalCarsSavedAmount={globalCarsSavedAmount}
                onUpdateGlobalCarsSavedAmount={handleUpdateGlobalCarsSavedAmount}
                onAddCar={handleAddCar}
                onUpdateCar={onUpdateCarData}
                onDeleteCar={onDeleteCarData}
              />
            ) : activeTab === "houses" ? (
              <HouseSimulator
                houses={houses}
                globalHousesSavedAmount={globalHousesSavedAmount}
                onUpdateGlobalHousesSavedAmount={handleUpdateGlobalHousesSavedAmount}
                onAddHouse={handleAddHouse}
                onUpdateHouse={onUpdateHouseData}
                onDeleteHouse={onDeleteHouseData}
              />
            ) : (
              <>
                <DashboardStats tasks={tasks} />
                
                {/* Category Filters */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full overflow-hidden">
                  <div className="flex items-center w-full min-w-0">
                    <div className="overflow-x-auto w-full hide-scrollbar pb-1 sm:pb-0" style={{ WebkitOverflowScrolling: 'touch' }}>
                      <div className="flex flex-nowrap items-center gap-2">
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${
                              selectedCategory === cat
                                ? "bg-gray-900 text-white shadow-sm"
                                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Seta lateral indicando que tem mais no mobile */}
                    <div className="sm:hidden flex items-center justify-center pl-2 text-gray-400 shrink-0 pb-1">
                      <ChevronRight size={20} strokeWidth={2.5} />
                    </div>
                  </div>
                  <button
                    onClick={handleCreateNewTask}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-sm w-full sm:w-auto whitespace-nowrap"
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
                          <h3 className="text-lg font-semibold text-gray-900">
                            Nenhuma tarefa encontrada
                          </h3>
                          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                            {selectedCategory === "Todas"
                              ? "Comece adicionando uma nova meta, projeto ou tarefa financeira."
                              : `Não há tarefas na categoria "${selectedCategory}".`}
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
                      filteredTasks.map((task, idx) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          index={idx + 1}
                          totalTasks={filteredTasks.length}
                          onUpdate={handleUpdateTask}
                          onEditClick={setEditingTask}
                          onMoveUp={() => moveTask(task.id, "up")}
                          onMoveDown={() => moveTask(task.id, "down")}
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
      <div className="fixed bottom-0 left-0 w-full sm:w-auto sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 z-40 bg-white/95 sm:bg-white/90 backdrop-blur-md pb-[env(safe-area-inset-bottom)] sm:pb-0 sm:rounded-2xl shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)] sm:shadow-lg border-t sm:border border-gray-200 transition-all">
        <div className="flex items-center justify-around sm:justify-center p-2 sm:p-1.5 gap-1 max-w-md mx-auto sm:max-w-none">
          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-2 sm:py-2.5 sm:px-4 rounded-xl text-[10px] sm:text-sm font-medium transition-all flex-1 sm:flex-none ${activeTab === "tasks" ? "text-blue-600 sm:text-gray-900 sm:bg-white sm:border sm:border-gray-200 sm:shadow-sm" : "text-gray-500 hover:text-gray-700 sm:hover:bg-gray-50/50 sm:border sm:border-transparent"}`}
          >
            <ListTodo className="w-5 h-5 sm:w-[18px] sm:h-[18px]" />
            <span>Tarefas</span>
          </button>
          <button
            onClick={() => setActiveTab("cars")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-2 sm:py-2.5 sm:px-4 rounded-xl text-[10px] sm:text-sm font-medium transition-all flex-1 sm:flex-none ${activeTab === "cars" ? "text-blue-600 sm:text-gray-900 sm:bg-white sm:border sm:border-gray-200 sm:shadow-sm" : "text-gray-500 hover:text-gray-700 sm:hover:bg-gray-50/50 sm:border sm:border-transparent"}`}
          >
            <Car className="w-5 h-5 sm:w-[18px] sm:h-[18px]" />
            <span>Veículos</span>
          </button>
          <button
            onClick={() => setActiveTab("houses")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-2 sm:py-2.5 sm:px-4 rounded-xl text-[10px] sm:text-sm font-medium transition-all flex-1 sm:flex-none ${activeTab === "houses" ? "text-blue-600 sm:text-gray-900 sm:bg-white sm:border sm:border-gray-200 sm:shadow-sm" : "text-gray-500 hover:text-gray-700 sm:hover:bg-gray-50/50 sm:border sm:border-transparent"}`}
          >
            <Home className="w-5 h-5 sm:w-[18px] sm:h-[18px]" />
            <span>Imóveis</span>
          </button>
          <button
            onClick={() => setActiveTab("finances")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-2 sm:py-2.5 sm:px-4 rounded-xl text-[10px] sm:text-sm font-medium transition-all flex-1 sm:flex-none ${activeTab === "finances" ? "text-blue-600 sm:text-gray-900 sm:bg-white sm:border sm:border-gray-200 sm:shadow-sm" : "text-gray-500 hover:text-gray-700 sm:hover:bg-gray-50/50 sm:border sm:border-transparent"}`}
          >
            <Wallet className="w-5 h-5 sm:w-[18px] sm:h-[18px]" />
            <span>Finanças</span>
          </button>
        </div>
      </div>
    </div>
  );
}
