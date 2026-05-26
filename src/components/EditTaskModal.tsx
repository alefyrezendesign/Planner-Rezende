import React, { useState, useEffect } from "react";
import { Task, Priority, Status, Subtask } from "../types";
import { X, Calendar, Trash2, GripVertical, Upload, Plus, Link } from "lucide-react";
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
          ? "opacity-50 ring-2 ring-blue-500 scale-[1.02] shadow-md bg-blue-50/40 border-blue-400 z-10 relative"
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
        onPointerDown={(e) => e.stopPropagation()}
      />

      <div className="relative flex-shrink-0" onPointerDown={(e) => e.stopPropagation()}>
        <input
          type="date"
          value={subtask.dueDate || ""}
          onChange={(e) => onUpdateDate(subtask.id, e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
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

      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onDelete(subtask.id)}
        className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
      >
        <X size={16} />
      </button>

      {/* Grip handle */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg cursor-grab active:cursor-grabbing transition-colors"
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
  const [formData, setFormData] = useState<Task>(() => ({
    ...task,
    description: task.description || "",
    imageUrl: task.imageUrl || "",
    links: task.links || [],
  }));

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // minimum drag distance before triggering
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex-shrink-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-semibold text-gray-800">
            {task.id ? "Editar Tarefa" : "Nova Tarefa"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-5 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioridade
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Alta">Alta</option>
                <option value="Média">Média</option>
                <option value="Baixa">Baixa</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Não iniciado">Não iniciado</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Pendente">Pendente</option>
              <option value="Concluído">Concluído</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Vencimento
            </label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate || ""}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor Estimado (R$)
              </label>
              <input
                type="number"
                name="estimatedCost"
                value={formData.estimatedCost}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Já Guardado (R$)
              </label>
              <input
                type="number"
                name="savedAmount"
                value={formData.savedAmount}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-semibold">
                Descrição
              </label>
              <textarea
                name="description"
                value={formData.description || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Insira detalhes adicionais, observações ou notas sobre a tarefa..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-semibold">
                Imagem da Tarefa (Opcional)
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  name="imageUrl"
                  value={formData.imageUrl || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="Cole o link (URL) de uma imagem"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
                    className="px-3 py-1.5 border border-dashed border-gray-300 rounded-lg text-xs font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50 cursor-pointer inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Upload size={14} />
                    Fazer upload de imagem
                  </label>
                  {formData.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, imageUrl: "" }))}
                      className="text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors"
                    >
                      Remover imagem
                    </button>
                  )}
                </div>

                {formData.imageUrl && (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200 mt-2">
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

            <div className="pt-2 border-t border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 font-semibold">
                  Links Relacionados
                </label>
                <button
                  type="button"
                  onClick={handleAddLink}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors"
                >
                  <Plus size={12} />
                  Adicionar Link
                </button>
              </div>

              <div className="space-y-2">
                {(formData.links || []).map((link) => (
                  <div key={link.id} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={link.title || ""}
                      onChange={(e) => handleUpdateLink(link.id, "title", e.target.value)}
                      placeholder="Título (rótulo opcional)"
                      className="w-1/3 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <input
                      type="text"
                      value={link.url}
                      onChange={(e) => handleUpdateLink(link.id, "url", e.target.value)}
                      placeholder="URL obrigatória"
                      className="flex-1 min-w-0 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteLink(link.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {(formData.links || []).length === 0 && (
                  <p className="text-xs text-gray-400 italic">Nenhum link associado.</p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Subtarefas
              </label>
              <button
                type="button"
                onClick={handleAddSubtask}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                + Adicionar Subtarefa
              </button>
            </div>

            <div className="space-y-2">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
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
              </DndContext>
              {formData.subtasks.length === 0 && (
                <p className="text-sm text-gray-500 italic">
                  Nenhuma subtarefa.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 bg-gray-50 border-t border-gray-100 p-4 flex justify-between items-center rounded-b-2xl">
          <button
            onClick={() => {
              if (
                window.confirm("Tem certeza que deseja excluir esta tarefa?")
              ) {
                onDelete(task.id);
                onClose();
              }
            }}
            className="px-3 sm:px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center"
            title="Excluir Tarefa"
          >
            <span className="hidden sm:inline">Excluir Tarefa</span>
            <Trash2 size={18} className="sm:hidden" />
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
