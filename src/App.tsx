import { useState, useEffect, useMemo, Fragment } from "react";
import { initialTasks } from "./data";
import { Task, CarScenario, RealEstateScenario } from "./types";
import { TaskCard } from "./components/TaskCard";
import { DashboardStats } from "./components/DashboardStats";
import { EditTaskModal } from "./components/EditTaskModal";
import { TaskDetailModal } from "./components/TaskDetailModal";
import { CarSimulator } from "./components/CarSimulator";
import { HouseSimulator } from "./components/HouseSimulator";
import { RezendeLogo } from "./components/RezendeLogo";
import { Finances } from "./components/Finances";
import { PrintOptionsModal, PrintOptions } from "./components/PrintOptionsModal";
import { PrintLayout } from "./components/PrintLayout";
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
  X,
  Check,
  Printer,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
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
      }).catch(console.error);
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
      }).catch(console.error);
    }
  };
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isCategoryFilterExpanded, setIsCategoryFilterExpanded] = useState(false);
  const [isStatusFilterExpanded, setIsStatusFilterExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "tasks" | "cars" | "houses" | "finances"
  >("tasks");

  const [session, setSession] = useState<Session | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printOptions, setPrintOptions] = useState<PrintOptions | null>(null);

  const syncUserMetadata = (currentSession: Session) => {
    const meta = currentSession.user?.user_metadata || {};
    const carsLocally = localStorage.getItem("global_cars_saved");
    const housesLocally = localStorage.getItem("global_houses_saved");
    const taskOrderLocally = localStorage.getItem("user_tasks_order");

    if (meta.global_cars_saved !== undefined) {
      const val = Number(meta.global_cars_saved);
      setGlobalCarsSavedAmount(val);
      localStorage.setItem("global_cars_saved", val.toString());
    } else if (carsLocally) {
      supabase.auth.updateUser({ data: { global_cars_saved: Number(carsLocally) } }).catch(console.error);
    }

    if (meta.global_houses_saved !== undefined) {
      const val = Number(meta.global_houses_saved);
      setGlobalHousesSavedAmount(val);
      localStorage.setItem("global_houses_saved", val.toString());
    } else if (housesLocally) {
      supabase.auth.updateUser({ data: { global_houses_saved: Number(housesLocally) } }).catch(console.error);
    }

    if (meta.user_tasks_order !== undefined) {
      const val = meta.user_tasks_order;
      if (Array.isArray(val)) {
        setTaskOrder(val);
        localStorage.setItem("user_tasks_order", JSON.stringify(val));
      }
    } else if (taskOrderLocally) {
      try {
        const val = JSON.parse(taskOrderLocally);
        if (Array.isArray(val)) {
          supabase.auth.updateUser({ data: { user_tasks_order: val } }).catch(console.error);
        }
      } catch (e) {
        console.error(e);
      }
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

      // Consolidate current task order and sync missing task IDs
      let currentOrder: string[] = [];
      try {
        const saved = localStorage.getItem("user_tasks_order");
        currentOrder = saved ? JSON.parse(saved) : [];
      } catch {
        currentOrder = [];
      }

      let updatedOrder = [...currentOrder];
      let orderChanged = false;
      fetchedTasks.forEach(t => {
        if (!updatedOrder.includes(t.id)) {
          updatedOrder.push(t.id);
          orderChanged = true;
        }
      });

      if (orderChanged) {
        setTaskOrder(updatedOrder);
        localStorage.setItem("user_tasks_order", JSON.stringify(updatedOrder));
        await supabase.auth.updateUser({ data: { user_tasks_order: updatedOrder } }).catch(console.error);
      } else {
        setTaskOrder(currentOrder);
      }

      // Migrate legacy database values to global amount if not already set globally
      const meta = currentSession?.user?.user_metadata || session?.user?.user_metadata || {};
      const carsLocally = localStorage.getItem("global_cars_saved");
      const housesLocally = localStorage.getItem("global_houses_saved");

      if (meta.global_cars_saved === undefined && !carsLocally && fetchedCars.length > 0) {
        const legacyCarSaved = Math.max(0, ...fetchedCars.map(c => c.downPaymentSaved || 0));
        if (legacyCarSaved > 0) {
          setGlobalCarsSavedAmount(legacyCarSaved);
          localStorage.setItem("global_cars_saved", legacyCarSaved.toString());
          await supabase.auth.updateUser({ data: { global_cars_saved: legacyCarSaved } }).catch(console.error);
        }
      }

      if (meta.global_houses_saved === undefined && !housesLocally && fetchedHouses.length > 0) {
        const legacyHouseSaved = Math.max(0, ...fetchedHouses.map(h => h.downPaymentSaved || 0));
        if (legacyHouseSaved > 0) {
          setGlobalHousesSavedAmount(legacyHouseSaved);
          localStorage.setItem("global_houses_saved", legacyHouseSaved.toString());
          await supabase.auth.updateUser({ data: { global_houses_saved: legacyHouseSaved } }).catch(console.error);
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
        supabase.auth.signOut().catch(console.error);
      }
      setSession(session);
      setNeedsAuth(!session);
      if (session) {
        syncUserMetadata(session);
        loadData(session.user.id, session);
      } else {
        setIsInitializing(false);
      }
    }).catch(err => {
      console.error("Session fetch error:", err);
      setIsInitializing(false);
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
    await supabase.auth.signOut().catch(console.error);
    setTasks([]);
    setCars([]);
    setHouses([]);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!session?.user?.id) return;
    const previousTasks = [...tasks];
    setTasks(tasks.filter((t) => t.id !== taskId));

    const newTaskOrder = taskOrder.filter((id) => id !== taskId);
    setTaskOrder(newTaskOrder);
    localStorage.setItem("user_tasks_order", JSON.stringify(newTaskOrder));
    supabase.auth.updateUser({ data: { user_tasks_order: newTaskOrder } }).catch(console.error);

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

    // Enforce smart status rules based on subtasks
    let enforcedStatus = updatedTask.status;
    const totalSubtasks = updatedTask.subtasks?.length || 0;
    const completedCount = updatedTask.subtasks?.filter(st => st.completed).length || 0;

    if (enforcedStatus !== "Pendente" && totalSubtasks > 0) {
      if (completedCount === totalSubtasks) {
        enforcedStatus = "Concluído";
      } else if (completedCount > 0) {
        enforcedStatus = "Em andamento";
      } else if (completedCount === 0 && (updatedTask.status === "Concluído" || updatedTask.status === "Em andamento")) {
        enforcedStatus = "Não iniciado";
      }
    }

    let taskToSave = { ...updatedTask, status: enforcedStatus };

    const oldTask = tasks.find((t) => t.id === taskToSave.id);
    const wasCompleted = oldTask?.status === "Concluído";
    const isCompleted = taskToSave.status === "Concluído";

    if (isCompleted && !wasCompleted) {
      taskToSave.completedAt = new Date().toISOString();
    } else if (!isCompleted && wasCompleted) {
      taskToSave.completedAt = undefined;
    }

    if (isNew) {
      if (isCompleted) {
         taskToSave.completedAt = new Date().toISOString();
      }
      setTasks([taskToSave, ...tasks]);
      const newTaskOrder = [taskToSave.id, ...taskOrder];
      setTaskOrder(newTaskOrder);
      localStorage.setItem("user_tasks_order", JSON.stringify(newTaskOrder));
      supabase.auth.updateUser({ data: { user_tasks_order: newTaskOrder } }).catch(console.error);
    } else {
      setTasks(tasks.map((t) => (t.id === taskToSave.id ? taskToSave : t)));

      if (wasCompleted && !isCompleted) {
        const newTaskOrder = [taskToSave.id, ...taskOrder.filter((id) => id !== taskToSave.id)];
        setTaskOrder(newTaskOrder);
        localStorage.setItem("user_tasks_order", JSON.stringify(newTaskOrder));
        supabase.auth.updateUser({ data: { user_tasks_order: newTaskOrder } }).catch(console.error);
      } else if (!wasCompleted && isCompleted) {
        const newTaskOrder = [...taskOrder.filter((id) => id !== taskToSave.id), taskToSave.id];
        setTaskOrder(newTaskOrder);
        localStorage.setItem("user_tasks_order", JSON.stringify(newTaskOrder));
        supabase.auth.updateUser({ data: { user_tasks_order: newTaskOrder } }).catch(console.error);
      }
    }

    setSyncing(true);
    try {
      await api.saveTask(session.user.id, taskToSave);
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

    // Filters integration (will be based on states selectedCategories and selectedStatuses)
    if (selectedCategories.length > 0) {
      result = result.filter(t => selectedCategories.includes(t.category));
    }
    if (selectedStatuses.length > 0) {
      result = result.filter(t => selectedStatuses.includes(t.status));
    }

    const priorityWeight = { Alta: 3, Média: 2, Baixa: 1 };

    return [...result].sort((a, b) => {
      if (a.status === "Concluído" && b.status !== "Concluído") return 1;
      if (a.status !== "Concluído" && b.status === "Concluído") return -1;
      if (a.status === "Concluído" && b.status === "Concluído") return 0;

      const isTopA = a.status === "Em andamento" || a.status === "Pendente";
      const isTopB = b.status === "Em andamento" || b.status === "Pendente";
      if (isTopA && !isTopB) return -1;
      if (!isTopA && isTopB) return 1;

      const indexA = taskOrder.indexOf(a.id);
      const indexB = taskOrder.indexOf(b.id);
      
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
  }, [tasks, selectedCategories, selectedStatuses, taskOrder]);

  const activeFilteredTasks = useMemo(() => {
    return filteredTasks.filter((t) => t.status !== "Concluído");
  }, [filteredTasks]);

  const completedFilteredTasks = useMemo(() => {
    return filteredTasks.filter((t) => t.status === "Concluído");
  }, [filteredTasks]);

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
    if (session) {
      supabase.auth.updateUser({ data: { user_tasks_order: newTaskOrder } }).catch(console.error);
    }
  };

  const taskSensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 50,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleTaskDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const currentList = activeFilteredTasks.map((t) => t.id);
    const oldIndex = currentList.indexOf(active.id.toString());
    const newIndex = currentList.indexOf(over.id.toString());
    if (oldIndex === -1 || newIndex === -1) return;

    // Build complete current list of tasks to reorder
    let newTaskOrder = [...taskOrder];
    
    // Fill taskOrder with present tasks
    tasks.forEach((t) => {
      if (!newTaskOrder.includes(t.id)) {
        newTaskOrder.push(t.id);
      }
    });

    const globalOldIndex = newTaskOrder.indexOf(active.id.toString());
    const globalNewIndex = newTaskOrder.indexOf(over.id.toString());

    if (globalOldIndex !== -1 && globalNewIndex !== -1) {
      const reorderedOrder = arrayMove(newTaskOrder, globalOldIndex, globalNewIndex);
      setTaskOrder(reorderedOrder);
      localStorage.setItem("user_tasks_order", JSON.stringify(reorderedOrder));
      if (session) {
        supabase.auth.updateUser({ data: { user_tasks_order: reorderedOrder } }).catch(console.error);
      }
    }
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

  if (printOptions) {
    return (
      <PrintLayout
        tasks={tasks}
        cars={cars}
        houses={houses}
        options={printOptions}
        onFinish={() => setPrintOptions(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-gray-900 font-sans pb-32 sm:pb-28">
      {/* Header Mobile-First */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4 max-w-7xl mx-auto h-16 sm:h-20">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {!logoError ? (
                <img 
                  src="/logo.webp" 
                  alt="Replanner" 
                  className="h-8 sm:h-12 object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="bg-primary-50 p-1.5 rounded-lg shrink-0">
                    <img src="/favicon.png" alt="Icon" className="w-6 h-6 object-contain" />
                  </div>
                  <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
                    Replanner
                  </h1>
                </div>
              )}
              {syncing && (
                <Loader2 size={14} className="animate-spin text-primary-400" />
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 text-sm font-medium">
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="hidden sm:flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2 rounded-xl bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors border border-primary-100/50"
              title="Gerar PDF"
            >
              <Printer size={18} />
              <span className="hidden sm:inline font-semibold ml-2">Imprimir</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-200"
              title="Sair da conta"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline font-semibold ml-2">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "finances" ? (
              <Finances session={session} />
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
                
                {/* Advanced Inline Mobile Filters */}
                <div className="mb-6 flex flex-col gap-3.5 bg-gray-50/70 border border-gray-100 p-4 rounded-3xl">
                  <div className="flex items-center justify-between gap-3 w-full">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 hide-scrollbar w-full sm:w-auto">
                      <button
                        onClick={() => {
                          setSelectedCategories([]);
                          setSelectedStatuses([]);
                          setIsCategoryFilterExpanded(false);
                          setIsStatusFilterExpanded(false);
                        }}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                          selectedCategories.length === 0 && selectedStatuses.length === 0
                            ? "bg-slate-900 text-white shadow-sm"
                            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        Todas
                      </button>
                      <button
                        onClick={() => {
                          setIsCategoryFilterExpanded(!isCategoryFilterExpanded);
                          setIsStatusFilterExpanded(false);
                        }}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                          selectedCategories.length > 0 || isCategoryFilterExpanded
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        Categorias 
                        {selectedCategories.length > 0 ? (
                          <span className="bg-white text-blue-600 text-[10px] font-black leading-none px-1.5 py-0.5 rounded-full">{selectedCategories.length}</span>
                        ) : (
                          <ChevronRight size={12} className={`transition-transform duration-200 ${isCategoryFilterExpanded ? 'rotate-90' : ''}`} />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setIsStatusFilterExpanded(!isStatusFilterExpanded);
                          setIsCategoryFilterExpanded(false);
                        }}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                          selectedStatuses.length > 0 || isStatusFilterExpanded
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        Status 
                        {selectedStatuses.length > 0 ? (
                          <span className="bg-white text-blue-600 text-[10px] font-black leading-none px-1.5 py-0.5 rounded-full">{selectedStatuses.length}</span>
                        ) : (
                          <ChevronRight size={12} className={`transition-transform duration-200 ${isStatusFilterExpanded ? 'rotate-90' : ''}`} />
                        )}
                      </button>
                    </div>
                    
                    <button
                      onClick={handleCreateNewTask}
                      className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-xs font-black transition-colors shadow-sm select-none shrink-0"
                    >
                      <Plus size={16} />
                      <span className="hidden sm:inline">Nova Tarefa</span>
                    </button>
                  </div>

                  {/* Smooth, Animated Collapsible Selectors */}
                  <AnimatePresence>
                    {isCategoryFilterExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden pt-2.5 border-t border-gray-200/50"
                      >
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-0.5">Filtrar por Categoria (Toque para ativar/desativar):</p>
                        <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto py-0.5">
                          {categories.filter(c => c !== "Todas").map((cat) => {
                            const isSelected = selectedCategories.includes(cat);
                            return (
                              <button
                                key={`pills-cat-${cat}`}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedCategories(prev => prev.filter(c => c !== cat));
                                  } else {
                                    setSelectedCategories(prev => [...prev, cat]);
                                  }
                                }}
                                className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 select-none ${
                                  isSelected
                                    ? "bg-blue-50 border-blue-300 text-blue-700 shadow-xs"
                                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100"
                                }`}
                              >
                                <span>{cat}</span>
                                {isSelected && <Check size={12} className="text-blue-600 shrink-0" strokeWidth={3} />}
                              </button>
                            );
                          })}
                          {categories.length <= 1 && (
                            <span className="text-xs text-gray-400 italic py-1 pl-0.5">Nenhuma categoria encontrada nas tarefas.</span>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {isStatusFilterExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden pt-2.5 border-t border-gray-200/50"
                      >
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-0.5">Filtrar por Status:</p>
                        <div className="flex flex-wrap gap-1.5 py-0.5">
                          {(["Não iniciado", "Em andamento", "Pendente", "Concluído"] as const).map((status) => {
                            const isSelected = selectedStatuses.includes(status);
                            return (
                              <button
                                key={`pills-status-${status}`}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedStatuses(prev => prev.filter(s => s !== status));
                                  } else {
                                    setSelectedStatuses(prev => [...prev, status]);
                                  }
                                }}
                                className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 select-none ${
                                  isSelected
                                    ? "bg-blue-50 border-blue-300 text-blue-700 shadow-xs"
                                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-100"
                                }`}
                              >
                                <span>{status}</span>
                                {isSelected && <Check size={12} className="text-blue-600 shrink-0" strokeWidth={3} />}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Active Filter Chips with Fast Reset */}
                  {(selectedCategories.length > 0 || selectedStatuses.length > 0) && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-150/40">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1 select-none">Filtros ativos:</span>
                      {selectedCategories.map(cat => (
                        <span key={`cat-${cat}`} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 text-gray-700 rounded-full text-xs font-semibold shadow-xs">
                          <span>{cat}</span>
                          <button onClick={() => setSelectedCategories(prev => prev.filter(c => c !== cat))} className="text-gray-400 hover:text-red-500 rounded-full p-0.5 transition-colors">
                            <X size={12} strokeWidth={2.5} />
                          </button>
                        </span>
                      ))}
                      {selectedStatuses.map(status => (
                        <span key={`status-${status}`} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 text-gray-700 rounded-full text-xs font-semibold shadow-xs">
                          <span className="text-[11px]">{status}</span>
                          <button onClick={() => setSelectedStatuses(prev => prev.filter(s => s !== status))} className="text-gray-400 hover:text-red-500 rounded-full p-0.5 transition-colors">
                            <X size={12} strokeWidth={2.5} />
                          </button>
                        </span>
                      ))}
                      <button onClick={() => { setSelectedCategories([]); setSelectedStatuses([]); }} className="text-xs text-blue-600 hover:text-blue-800 font-extrabold ml-1 hover:underline">
                        Limpar todos
                      </button>
                    </div>
                  )}
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
                            {selectedCategories.length === 0 && selectedStatuses.length === 0
                              ? "Comece adicionando uma nova meta, projeto ou tarefa financeira."
                              : "Nenhuma tarefa corresponde aos filtros selecionados."}
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
                      <div className="space-y-6">
                        {/* Seção de Tarefas Ativas / Pendentes */}
                        {activeFilteredTasks.length > 0 ? (
                          <DndContext
                            sensors={taskSensors}
                            collisionDetection={closestCenter}
                            onDragStart={(event) => setActiveTaskId(event.active.id.toString())}
                            onDragEnd={(event) => {
                              handleTaskDragEnd(event);
                              setActiveTaskId(null);
                            }}
                            onDragCancel={() => setActiveTaskId(null)}
                          >
                            <SortableContext
                              items={activeFilteredTasks.map((t) => t.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="space-y-4">
                                {activeFilteredTasks.map((task, idx) => {
                                  const isPriority = task.status === "Em andamento" || task.status === "Pendente";
                                  const prevTask = idx > 0 ? activeFilteredTasks[idx - 1] : null;
                                  const prevIsPriority = prevTask ? (prevTask.status === "Em andamento" || prevTask.status === "Pendente") : false;
                                  
                                  const renderDivider = idx > 0 && prevIsPriority && !isPriority;

                                  return (
                                    <Fragment key={task.id}>
                                      {renderDivider && (
                                        <div className="py-4 flex justify-center" aria-hidden="true">
                                          <div className="w-3/4 sm:w-1/2 border-t border-gray-200/60 border-dashed"></div>
                                        </div>
                                      )}
                                      <TaskCard
                                        task={task}
                                        index={idx + 1}
                                        totalTasks={activeFilteredTasks.length}
                                        onUpdate={handleUpdateTask}
                                        onEditClick={setEditingTask}
                                        onDetailClick={setViewingTask}
                                      />
                                    </Fragment>
                                  );
                                })}
                              </div>
                            </SortableContext>
                            <DragOverlay adjustScale={false} dropAnimation={{ duration: 150 }}>
                              {activeTaskId ? (
                                <TaskCard
                                  task={tasks.find((t) => t.id === activeTaskId)!}
                                  isOverlay={true}
                                  onUpdate={() => {}}
                                  onEditClick={() => {}}
                                  onDetailClick={() => {}}
                                />
                              ) : null}
                            </DragOverlay>
                          </DndContext>
                        ) : (
                          <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <span className="text-sm font-semibold text-gray-500">
                              Todas as tarefas desta categoria estão concluídas! 🎉
                            </span>
                          </div>
                        )}

                        {/* Seção de Tarefas Concluídas */}
                        {completedFilteredTasks.length > 0 && (
                          <div className="mt-8 border-t border-gray-200 pt-6">
                            <div className="flex items-center gap-2 mb-4 px-1">
                              <span className="flex h-2.5 w-2.5 rounded-full bg-green-500" />
                              <h3 className="text-xs font-black text-gray-500 tracking-wider uppercase">
                                Concluídas ({completedFilteredTasks.length})
                              </h3>
                            </div>
                            <div className="space-y-4 opacity-75 hover:opacity-100 transition-opacity duration-300">
                              {completedFilteredTasks.map((task, idx) => (
                                <TaskCard
                                  key={task.id}
                                  task={task}
                                  index={activeFilteredTasks.length + idx + 1}
                                  totalTasks={filteredTasks.length}
                                  onUpdate={handleUpdateTask}
                                  onEditClick={setEditingTask}
                                  onDetailClick={setViewingTask}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
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

      {/* Detail Modal */}
      {viewingTask && (
        <TaskDetailModal
          task={viewingTask}
          isOpen={true}
          onClose={() => setViewingTask(null)}
          onEditClick={setEditingTask}
        />
      )}

      {/* Mobile-First Bottom Navigation */}
      <div className="fixed bottom-0 left-0 w-full z-40 bg-white/80 backdrop-blur-xl border-t border-white/50 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.1)] pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2 px-4 transition-all sm:w-auto sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 sm:rounded-3xl sm:pb-2 sm:px-2 sm:border sm:border-white/60 sm:shadow-2xl sm:bg-white/90">
        <div className="flex items-center justify-around sm:justify-center gap-2 max-w-md mx-auto sm:max-w-none">
          <button
            onClick={() => setActiveTab("tasks")}
            className={`relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 h-14 sm:h-12 w-full sm:w-auto sm:px-5 rounded-2xl text-[10px] sm:text-sm font-semibold transition-all flex-1 sm:flex-none ${
              activeTab === "tasks" ? "text-primary-600 bg-primary-50/50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            }`}
          >
            {activeTab === "tasks" && (
              <motion.div layoutId="nav-indicator" className="absolute inset-0 bg-white rounded-2xl shadow-sm border border-slate-100/50 -z-10" />
            )}
            <ListTodo className={`w-[22px] h-[22px] sm:w-[18px] sm:h-[18px] transition-all ${activeTab === "tasks" ? "scale-110" : "scale-100"}`} />
            <span className="tracking-wide">Tarefas</span>
          </button>
          
          <button
            onClick={() => setActiveTab("cars")}
            className={`relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 h-14 sm:h-12 w-full sm:w-auto sm:px-5 rounded-2xl text-[10px] sm:text-sm font-semibold transition-all flex-1 sm:flex-none ${
              activeTab === "cars" ? "text-primary-600 bg-primary-50/50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            }`}
          >
            {activeTab === "cars" && (
              <motion.div layoutId="nav-indicator" className="absolute inset-0 bg-white rounded-2xl shadow-sm border border-slate-100/50 -z-10" />
            )}
            <Car className={`w-[22px] h-[22px] sm:w-[18px] sm:h-[18px] transition-all ${activeTab === "cars" ? "scale-110" : "scale-100"}`} />
            <span className="tracking-wide">Veículos</span>
          </button>
          
          <button
            onClick={() => setActiveTab("houses")}
            className={`relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 h-14 sm:h-12 w-full sm:w-auto sm:px-5 rounded-2xl text-[10px] sm:text-sm font-semibold transition-all flex-1 sm:flex-none ${
              activeTab === "houses" ? "text-primary-600 bg-primary-50/50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            }`}
          >
            {activeTab === "houses" && (
              <motion.div layoutId="nav-indicator" className="absolute inset-0 bg-white rounded-2xl shadow-sm border border-slate-100/50 -z-10" />
            )}
            <Home className={`w-[22px] h-[22px] sm:w-[18px] sm:h-[18px] transition-all ${activeTab === "houses" ? "scale-110" : "scale-100"}`} />
            <span className="tracking-wide">Imóveis</span>
          </button>
          
          <button
            onClick={() => setActiveTab("finances")}
            className={`relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 h-14 sm:h-12 w-full sm:w-auto sm:px-5 rounded-2xl text-[10px] sm:text-sm font-semibold transition-all flex-1 sm:flex-none ${
              activeTab === "finances" ? "text-primary-600 bg-primary-50/50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            }`}
          >
            {activeTab === "finances" && (
              <motion.div layoutId="nav-indicator" className="absolute inset-0 bg-white rounded-2xl shadow-sm border border-slate-100/50 -z-10" />
            )}
            <Wallet className={`w-[22px] h-[22px] sm:w-[18px] sm:h-[18px] transition-all ${activeTab === "finances" ? "scale-110" : "scale-100"}`} />
            <span className="tracking-wide">Finanças</span>
          </button>
        </div>
      </div>

      {/* Category Filter Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsCategoryModalOpen(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-lg text-gray-900">Filtrar por Categoria</h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-2">
              {categories.filter(c => c !== "Todas").map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedCategories(prev => prev.filter(c => c !== cat));
                      } else {
                        setSelectedCategories(prev => [...prev, cat]);
                      }
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-colors ${
                      isSelected ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span className="font-medium text-sm">{cat}</span>
                    {isSelected && <Check size={18} className="text-blue-600" />}
                  </button>
                );
              })}
              {categories.length <= 1 && (
                <div className="text-center text-gray-500 text-sm py-4">Nenhuma categoria encontrada.</div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
              <button onClick={() => setSelectedCategories([])} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                Limpar
              </button>
              <button onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">
                Aplicar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Status Filter Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsStatusModalOpen(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-lg text-gray-900">Filtrar por Status</h3>
              <button onClick={() => setIsStatusModalOpen(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-2">
              {(["Não iniciado", "Em andamento", "Pendente", "Concluído"] as const).map((status) => {
                const isSelected = selectedStatuses.includes(status);
                return (
                  <button
                    key={status}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedStatuses(prev => prev.filter(s => s !== status));
                      } else {
                        setSelectedStatuses(prev => [...prev, status]);
                      }
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-colors ${
                      isSelected ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span className="font-medium text-sm">{status}</span>
                    {isSelected && <Check size={18} className="text-blue-600" />}
                  </button>
                );
              })}
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
              <button onClick={() => setSelectedStatuses([])} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                Limpar
              </button>
              <button onClick={() => setIsStatusModalOpen(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">
                Aplicar
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Print Options Modal */}
      <PrintOptionsModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        onPrint={(options) => {
          setIsPrintModalOpen(false);
          setPrintOptions(options);
        }}
      />
    </div>
  );
}
