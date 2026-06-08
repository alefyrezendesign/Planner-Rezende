import React, { useState, useEffect } from "react";
import { Task, Priority, Status, Subtask } from "../types";
import { X, Calendar, Trash2, GripVertical, Upload, Plus, Link } from "lucide-react";
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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableSubtaskProps {
  subtask: Subtask;
  onUpdateTitle: (id: string, title: string) => void;
  onUpdateDate: (id: string, dueDate: string) => void;
  onDelete: (id: string) => void;
}

function SortableSubtask({
  subtask,
  onUpdateTitle,
  onUpdateDate,
  onDelete,
}: SortableSubtaskProps) {
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
      className={`flex gap-2 items-center p-2 rounded-xl border transition-colors select-none ${
        isDragging
          ? "opacity-40 border-2 border-dashed border-blue-400 bg-blue-50/40 pointer-events-none"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      {/* Rest of the subtask row inputs: Text, Calendar, Delete */}
      <input
        type="text"
        value={subtask.title}
        onChange={(e) => onUpdateTitle(subtask.id, e.target.value)}
        className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        placeholder="Nome da subtarefa"
      />

      <div className="relative shrink-0 flex items-center gap-1">
        <div className="relative">
          <input
            type="date"
            value={subtask.dueDate || ""}
            onChange={(e) => onUpdateDate(subtask.id, e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div
            className={`flex items-center justify-center p-2 rounded-lg border transition-colors ${
              subtask.dueDate
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Calendar size={16} />
            {subtask.dueDate && (
              <span className="text-[10px] ml-1 font-medium whitespace-nowrap">
                {new Date(subtask.dueDate + "T12:00:00").toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                })}
              </span>
            )}
          </div>
        </div>
        {subtask.dueDate && (
          <button
            type="button"
            onClick={() => onUpdateDate(subtask.id, "")}
            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Remover data"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDelete(subtask.id)}
        className="shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
      >
        <X size={16} />
      </button>

      {/* Grip handle */}
      <div className="flex items-center gap-1 shrink-0">
        <div
          {...attributes}
          {...listeners}
          className="shrink-0 p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg cursor-grab active:cursor-grabbing transition-colors"
          style={{ touchAction: "none" }}
          title="Segure e arraste para reordenar"
        >
          <GripVertical size={18} />
        </div>
      </div>
    </div>
  );
}

interface EditTaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTask: Task) => void;
  onDelete: (taskId: string) => void;
}

export function EditTaskModal({
  task,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: EditTaskModalProps) {
  const [activeSubtaskId, setActiveSubtaskId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Task>(() => ({
    ...task,
    description: task.description || "",
    imageUrl: task.imageUrl || "",
    links: task.links || [],
  }));

  const sensors = useSensors(
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFormData((prev) => {
        const oldIndex = prev.subtasks.findIndex(
          (st) => st.id === active.id
        );
        const newIndex = prev.subtasks.findIndex(
          (st) => st.id === over.id
        );

        return {
          ...prev,
          subtasks: arrayMove(prev.subtasks, oldIndex, newIndex),
        };
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          imageUrl: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddLink = () => {
    const newLink = {
      id: crypto.randomUUID(),
      url: "",
      title: "",
    };
    setFormData((prev) => ({
      ...prev,
      links: [...(prev.links || []), newLink],
    }));
  };

  const handleUpdateLink = (id: string, field: "url" | "title", value: string) => {
    setFormData((prev) => ({
      ...prev,
      links: (prev.links || []).map((lnk) =>
        lnk.id === id ? { ...lnk, [field]: value } : lnk
      ),
    }));
  };

  const handleDeleteLink = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      links: (prev.links || []).filter((lnk) => lnk.id !== id),
    }));
  };

  useEffect(() => {
    setFormData({
      ...task,
      description: task.description || "",
      imageUrl: task.imageUrl || "",
      links: task.links || [],
    });
  }, [task]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    // Parse numbers for financial fields
    if (name === "estimatedCost" || name === "savedAmount") {
      setFormData((prev) => ({ ...prev, [name]: Number(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddSubtask = () => {
    const newSubtask = {
      id: crypto.randomUUID(),
      title: "Nova subtarefa",
      completed: false,
    };
    setFormData((prev) => ({
      ...prev,
      subtasks: [...prev.subtasks, newSubtask],
    }));
  };

  const handleUpdateSubtask = (id: string, title: string) => {
    setFormData((prev) => ({
      ...prev,
      subtasks: prev.subtasks.map((st) =>
        st.id === id ? { ...st, title } : st,
      ),
    }));
  };

  const handleUpdateSubtaskDate = (id: string, dueDate: string) => {
    setFormData((prev) => ({
      ...prev,
      subtasks: prev.subtasks.map((st) =>
        st.id === id ? { ...st, dueDate } : st,
      ),
    }));
  };

  const handleDeleteSubtask = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      subtasks: prev.subtasks.filter((st) => st.id !== id),
    }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />
      
      {/* Modal / Bottom Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative bg-white w-full sm:max-w-lg h-[90vh] sm:h-auto sm:max-h-[90vh] flex flex-col rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Handle for mobile pull-to-close (visual only) */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden absolute top-0 z-10 pointer-events-none">
          <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
        </div>

        <div className="shrink-0 bg-white/90 backdrop-blur-md border-b border-slate-100 p-4 sm:p-5 flex items-center justify-between z-20 pt-8 sm:pt-5">
          <h2 className="text-xl font-bold text-slate-800">
            {task.id ? "Editar Tarefa" : "Nova Tarefa"}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 hide-scrollbar">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Título
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 h-12 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-slate-50 focus:bg-white transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Categoria
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 h-12 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-slate-50 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Prioridade
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 h-12 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-slate-50 focus:bg-white transition-colors appearance-none"
              >
                <option value="Alta">Alta</option>
                <option value="Média">Média</option>
                <option value="Baixa">Baixa</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 h-12 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-slate-50 focus:bg-white transition-colors appearance-none"
            >
              <option value="Não iniciado">Não iniciado</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Pendente">Pendente</option>
              <option value="Concluído">Concluído</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Data de Vencimento
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate || ""}
                onChange={handleChange}
                className="flex-1 px-4 h-12 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-slate-50 focus:bg-white transition-colors"
              />
              {formData.dueDate && (
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, dueDate: "" }))}
                  className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-colors"
                  title="Remover data"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Valor Estimado (R$)
              </label>
              <input
                type="number"
                inputMode="decimal"
                name="estimatedCost"
                value={formData.estimatedCost}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 h-12 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-slate-50 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Já Guardado (R$)
              </label>
              <input
                type="number"
                inputMode="decimal"
                name="savedAmount"
                value={formData.savedAmount}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-4 h-12 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-slate-50 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Descrição
              </label>
              <textarea
                name="description"
                value={formData.description || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Insira detalhes adicionais, observações ou notas sobre a tarefa..."
                rows={4}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-slate-50 focus:bg-white transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Imagem da Tarefa (Opcional)
              </label>
              <div className="space-y-3">
                <input
                  type="text"
                  name="imageUrl"
                  value={formData.imageUrl || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="Cole o link (URL) de uma imagem"
                  className="w-full px-4 h-12 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-slate-50 focus:bg-white transition-colors text-sm"
                />
                
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="edit-modal-image-file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="edit-modal-image-file"
                    className="h-11 px-4 border border-dashed border-slate-300 rounded-xl text-sm font-semibold text-slate-600 hover:text-primary-600 hover:bg-primary-50 cursor-pointer inline-flex items-center justify-center gap-2 transition-colors w-full sm:w-auto"
                  >
                    <Upload size={16} />
                    Fazer upload
                  </label>
                  {formData.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, imageUrl: "" }))}
                      className="h-11 text-sm font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-4 rounded-xl transition-colors"
                    >
                      Remover
                    </button>
                  )}
                </div>

                {formData.imageUrl && (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-200 mt-3 shadow-inner">
                    <img
                      src={formData.imageUrl}
                      alt="Pré-visualização"
                      className="absolute inset-0 w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-semibold text-slate-700">
                  Links Relacionados
                </label>
                <button
                  type="button"
                  onClick={handleAddLink}
                  className="text-xs text-primary-600 hover:text-primary-700 font-bold inline-flex items-center gap-1.5 px-3 h-8 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                >
                  <Plus size={14} />
                  Adicionar
                </button>
              </div>

              <div className="space-y-3">
                {(formData.links || []).map((link) => (
                  <div key={link.id} className="flex flex-col sm:flex-row gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <input
                      type="text"
                      value={link.title || ""}
                      onChange={(e) => handleUpdateLink(link.id, "title", e.target.value)}
                      placeholder="Título opcional"
                      className="w-full sm:w-1/3 px-3 h-10 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white"
                    />
                    <div className="flex gap-2 w-full">
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) => handleUpdateLink(link.id, "url", e.target.value)}
                        placeholder="URL obrigatória"
                        className="flex-1 min-w-0 px-3 h-10 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteLink(link.id)}
                        className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                {(formData.links || []).length === 0 && (
                  <p className="text-sm text-slate-400 italic">Nenhum link associado.</p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 pb-8">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-semibold text-slate-700">
                Subtarefas
              </label>
              <button
                type="button"
                onClick={handleAddSubtask}
                className="text-sm text-primary-600 hover:text-primary-700 font-bold bg-primary-50 px-3 h-8 rounded-lg"
              >
                + Adicionar
              </button>
            </div>

            <div className="space-y-2">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={(event) => setActiveSubtaskId(event.active.id.toString())}
                onDragEnd={(event) => {
                  handleDragEnd(event);
                  setActiveSubtaskId(null);
                }}
                onDragCancel={() => setActiveSubtaskId(null)}
              >
                <SortableContext
                  items={formData.subtasks.map((st) => st.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {formData.subtasks.map((st) => (
                    <SortableSubtask
                      key={st.id}
                      subtask={st}
                      onUpdateTitle={handleUpdateSubtask}
                      onUpdateDate={handleUpdateSubtaskDate}
                      onDelete={handleDeleteSubtask}
                    />
                  ))}
                </SortableContext>
                <DragOverlay dropAnimation={{ duration: 150 }}>
                  {activeSubtaskId ? (
                    <div className="flex gap-2 items-center p-3 rounded-xl border-2 border-primary-400 bg-white shadow-2xl scale-[1.02] rotate-2 select-none w-full pointer-events-none z-50">
                      <div className="flex-1 min-w-0 px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 flex items-center">
                        <span className="text-slate-700 truncate">{formData.subtasks.find(st => st.id === activeSubtaskId)?.title || "Subtarefa"}</span>
                      </div>
                      <div className="shrink-0 p-2 text-primary-500 rounded-lg">
                        <GripVertical size={20} />
                      </div>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
              {formData.subtasks.length === 0 && (
                <p className="text-sm text-slate-400 italic">
                  Nenhuma subtarefa adicionada.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 bg-white/90 backdrop-blur-md border-t border-slate-100 p-4 sm:p-5 flex flex-col-reverse sm:flex-row justify-between items-center gap-3 rounded-b-3xl">
          <button
            onClick={() => {
              if (
                window.confirm("Tem certeza que deseja excluir esta tarefa?")
              ) {
                onDelete(task.id);
                onClose();
              }
            }}
            className="w-full sm:w-auto h-12 sm:h-11 px-5 text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
            title="Excluir Tarefa"
          >
            <Trash2 size={18} />
            <span>Excluir Tarefa</span>
          </button>
          
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none h-12 sm:h-11 px-5 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex-1 sm:flex-none h-12 sm:h-11 px-8 text-sm font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 focus:ring-4 focus:ring-primary-500/30 transition-all shadow-lg shadow-primary-600/20"
            >
              Salvar
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
