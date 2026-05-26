import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Edit2,
  ListTodo,
  CalendarClock,
  Wallet,
  GripVertical,
  Link
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task, Subtask } from "../types";
import { formatCurrency, calculateProgress } from "../utils";

interface SortableSubtaskItemProps {
  subtask: Subtask;
  onToggle: (id: string) => void;
  renderSubtaskDueDate: (dueDate?: string, completed?: boolean) => React.ReactNode;
}

function SortableSubtaskItem({ subtask, onToggle, renderSubtaskDueDate }: SortableSubtaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subtask.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-start gap-2 w-full text-left p-2 transition-colors rounded-lg group ${
        isDragging
          ? "opacity-50 ring-2 ring-blue-500 scale-[1.02] shadow-md bg-white border border-blue-400 z-10 relative"
          : "hover:bg-gray-100 bg-transparent"
      }`}
    >
      <button
        type="button"
        onClick={() => onToggle(subtask.id)}
        className="flex items-start gap-2 flex-1 text-left"
      >
        <div
          className={`mt-0.5 flex-shrink-0 ${subtask.completed ? "text-green-500" : "text-gray-300 group-hover:text-gray-400"}`}
        >
          {subtask.completed ? (
            <CheckCircle2 size={20} />
          ) : (
            <Circle size={20} />
          )}
        </div>
        <div className="flex-1 flex flex-col gap-1 items-start">
          <span
            className={`text-sm md:text-base ${subtask.completed ? "text-gray-400 line-through" : "text-gray-700"}`}
          >
            {subtask.title}
          </span>
          {renderSubtaskDueDate(subtask.dueDate, subtask.completed)}
        </div>
      </button>
      <div
        {...attributes}
        {...listeners}
        className="mt-0.5 flex-shrink-0 text-gray-400 hover:text-blue-600 cursor-grab active:cursor-grabbing p-0.5 rounded-md hover:bg-gray-200 transition-colors"
        style={{ touchAction: "none" }}
      >
        <GripVertical size={16} />
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  index?: number;
  totalTasks?: number;
  onUpdate: (task: Task) => void;
  onEditClick: (task: Task) => void;
  onDetailClick: (task: Task) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function TaskCard({ task, index, totalTasks, onUpdate, onEditClick, onDetailClick, onMoveUp, onMoveDown }: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = task.subtasks.findIndex(
        (st) => st.id === active.id
      );
      const newIndex = task.subtasks.findIndex(
        (st) => st.id === over.id
      );

      const reorderedSubtasks = arrayMove(task.subtasks, oldIndex, newIndex);
      onUpdate({ ...task, subtasks: reorderedSubtasks });
    }
  };

  const toggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st,
    );
    onUpdate({ ...task, subtasks: updatedSubtasks });
  };

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "Alta":
        return "bg-red-100 text-red-700 border-red-200";
      case "Média":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Baixa":
        return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "Não iniciado":
        return "bg-gray-100 text-gray-700";
      case "Em andamento":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "Pendente":
        return "bg-orange-50 text-orange-700 border-orange-100";
      case "Concluído":
        return "bg-green-50 text-green-700 border-green-100";
    }
  };

  const renderTaskDueDate = (dueDate?: string, isCompleted?: boolean) => {
    if (!dueDate) {
      return (
        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-400">
          <CalendarClock size={16} /> <span>Sem prazo</span>
        </div>
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate + "T00:00:00");
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (isCompleted) {
      return (
        <div className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
          <CalendarClock size={16} /> <span>Prazo: {due.toLocaleDateString("pt-BR")}</span>
        </div>
      );
    }

    if (diffDays < 0) {
      return (
        <div className="flex items-center gap-1.5 text-sm text-red-600 font-bold">
          <CalendarClock size={16} /> <span>Atrasado • {due.toLocaleDateString("pt-BR")}</span>
        </div>
      );
    } else if (diffDays === 0) {
      return (
        <div className="flex items-center gap-1.5 text-sm text-orange-600 font-bold">
          <CalendarClock size={16} /> <span>Vence Hoje</span>
        </div>
      );
    } else if (diffDays <= 7) {
      return (
        <div className="flex items-center gap-1.5 text-sm text-yellow-600 font-bold">
          <CalendarClock size={16} /> <span>Falta {diffDays} {diffDays === 1 ? "dia" : "dias"}</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5 text-sm text-gray-700 font-semibold">
        <CalendarClock size={16} /> <span>{due.toLocaleDateString("pt-BR")}</span>
      </div>
    );
  };

  const renderSubtaskDueDate = (dueDate?: string, isCompleted?: boolean) => {
    if (!dueDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate + "T00:00:00");

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (isCompleted) {
      return (
        <span className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
          <CalendarClock size={12} /> {due.toLocaleDateString("pt-BR")}
        </span>
      );
    }

    if (diffDays < 0) {
      return (
        <span className="flex items-center gap-1 text-[11px] font-medium text-red-600">
          <CalendarClock size={12} /> Atrasado
        </span>
      );
    } else if (diffDays <= 7) {
      return (
        <span className="flex items-center gap-1 text-[11px] font-medium text-orange-600">
          <CalendarClock size={12} /> {due.toLocaleDateString("pt-BR")}
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1 text-[11px] font-medium text-gray-500">
        <CalendarClock size={12} /> {due.toLocaleDateString("pt-BR")}
      </span>
    );
  };

  const progress = calculateProgress(task.savedAmount, task.estimatedCost);
  const completedSubtasks = task.subtasks.filter((st) => st.completed).length;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onDetailClick(task)}
      className={`bg-white border rounded-xl overflow-hidden mb-4 shadow-sm transition-all cursor-pointer ${
        isDragging
          ? "opacity-60 ring-2 ring-blue-500 scale-[1.01] shadow-lg border-blue-400 z-50 relative pointer-events-none"
          : task.status === "Concluído"
          ? "border-green-200 bg-green-50/30"
          : "border-gray-200 hover:shadow-md"
      }`}
    >
      {/* Optional Card Cover Image */}
      {task.imageUrl && (
        <div className="w-full h-28 sm:h-36 overflow-hidden border-b border-gray-100">
          <img
            src={task.imageUrl}
            alt={task.title}
            className="w-full h-full object-cover select-none"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      <div className="p-4 sm:p-5">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2.5">
              {index !== undefined && (
                <div className="flex items-center justify-center h-[22px] px-2 text-[10px] font-bold text-gray-400 bg-gray-100/50 border border-gray-200/60 rounded select-none">
                  #{index}
                </div>
              )}
              <div
                className={`flex items-center h-[22px] text-[10px] uppercase font-bold tracking-wider px-1.5 sm:px-2 border rounded ${getPriorityColor(task.priority)}`}
              >
                {task.priority}
              </div>
              <div className="relative inline-flex items-center h-[22px]" onClick={(e) => e.stopPropagation()}>
                <select
                  value={task.status}
                  onChange={(e) =>
                    onUpdate({
                      ...task,
                      status: e.target.value as Task["status"],
                    })
                  }
                  className={`h-full text-[9px] sm:text-[10px] uppercase font-bold tracking-wider pl-1.5 pr-4 sm:pl-2 sm:pr-5 rounded border focus:outline-none appearance-none cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(task.status)}`}
                >
                  <option value="Não iniciado">NÃO INICIADO</option>
                  <option value="Em andamento">EM ANDAMENTO</option>
                  <option value="Pendente">PENDENTE</option>
                  <option value="Concluído">CONCLUÍDO</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center opacity-50">
                  <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </div>
              </div>
              <div className="hidden sm:flex items-center ml-auto sm:ml-2">
                {renderTaskDueDate(task.dueDate, task.status === "Concluído")}
              </div>
            </div>
            
            <h3
              className={`text-lg font-semibold mb-1 ${task.status === "Concluído" ? "text-gray-500 line-through" : "text-gray-900"}`}
            >
              {task.title}
            </h3>

            {/* Compact Description summary */}
            {task.description && (
              <p className="text-xs text-gray-500 font-medium mt-1 line-clamp-1 max-w-full leading-relaxed">
                {task.description}
              </p>
            )}

            {/* Compact Links count badge */}
            {task.links && task.links.length > 0 && (
              <div className="flex items-center gap-1 mt-1.5 text-xs text-blue-600 font-medium bg-blue-50/50 border border-blue-100/50 px-2 py-0.5 rounded-full w-fit">
                <Link size={11} className="shrink-0 text-blue-400" />
                <span>{task.links.length} {task.links.length === 1 ? "link" : "links"}</span>
              </div>
            )}
            
            <div className="sm:hidden mt-2.5 mb-2">
              {renderTaskDueDate(task.dueDate, task.status === "Concluído")}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => { e.stopPropagation(); onEditClick(task); }}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              title="Editar valores e detalhes"
            >
              <Edit2 size={18} />
            </button>
            <div
              {...attributes}
              {...listeners}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors cursor-grab active:cursor-grabbing"
              style={{ touchAction: "none" }}
              title="Arrastar cartão para reordenar"
            >
              <GripVertical size={18} />
            </div>
          </div>
        </div>

        {/* Finance Section */}
        <div className="mt-4 bg-gray-50 rounded-lg p-3 border border-gray-100">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 font-medium flex items-center gap-1.5">
              <Wallet size={14} className="text-gray-400" />
              Orçamento
            </span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(task.savedAmount)} /{" "}
              <span className="text-gray-500 font-normal">
                {formatCurrency(task.estimatedCost)}
              </span>
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2 overflow-hidden">
            <div
              className={`bg-blue-500 h-2 transition-all duration-500 ease-out ${progress === 100 ? "bg-green-500" : ""}`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Subtasks Toggle */}
        {task.subtasks.length > 0 && (
          <div className="mt-4 border-t border-gray-100/50 pt-3">
            <button
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className="w-full text-sm text-gray-600 hover:text-gray-900 flex flex-col gap-2 group"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <ListTodo
                    size={16}
                    className={`${completedSubtasks === task.subtasks.length ? "text-green-500" : "text-blue-500"}`}
                  />
                  <span className="font-medium">Subtarefas</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                    {completedSubtasks}/{task.subtasks.length}
                  </span>
                  {isExpanded ? (
                    <ChevronUp
                      size={16}
                      className="text-gray-400 group-hover:text-gray-600"
                    />
                  ) : (
                    <ChevronDown
                      size={16}
                      className="text-gray-400 group-hover:text-gray-600"
                    />
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${completedSubtasks === task.subtasks.length ? "bg-green-500" : "bg-blue-400"}`}
                  style={{
                    width: `${(completedSubtasks / task.subtasks.length) * 100}%`,
                  }}
                ></div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Subtasks List */}
      <AnimatePresence>
        {isExpanded && task.subtasks.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="border-t border-gray-100 bg-gray-50/50 overflow-hidden relative z-10"
          >
            <div className="p-4 space-y-2">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={task.subtasks.map((st) => st.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {task.subtasks.map((subtask) => (
                    <SortableSubtaskItem
                      key={subtask.id}
                      subtask={subtask}
                      onToggle={toggleSubtask}
                      renderSubtaskDueDate={renderSubtaskDueDate}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
