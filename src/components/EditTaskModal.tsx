import React, { useState, useEffect } from 'react';
import { Task, Priority, Status } from '../types';
import { X } from 'lucide-react';

interface EditTaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTask: Task) => void;
  onDelete: (taskId: string) => void;
}

export function EditTaskModal({ task, isOpen, onClose, onSave, onDelete }: EditTaskModalProps) {
  const [formData, setFormData] = useState<Task>(task);

  useEffect(() => {
    setFormData(task);
  }, [task]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Parse numbers for financial fields
    if (name === 'estimatedCost' || name === 'savedAmount') {
      setFormData(prev => ({ ...prev, [name]: Number(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddSubtask = () => {
    const newSubtask = {
      id: crypto.randomUUID(),
      title: 'Nova subtarefa',
      completed: false
    };
    setFormData(prev => ({ ...prev, subtasks: [...prev.subtasks, newSubtask] }));
  };

  const handleUpdateSubtask = (id: string, title: string) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(st => st.id === id ? { ...st, title } : st)
    }));
  };

  const handleDeleteSubtask = (id: string) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter(st => st.id !== id)
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
          <h2 className="text-lg font-semibold text-gray-800">{task.id ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-5 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor Estimado (R$)</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Já Guardado (R$)</label>
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
          
          <div className="pt-2 border-t border-gray-100">
             <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Subtarefas</label>
                <button 
                  type="button" 
                  onClick={handleAddSubtask}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Adicionar Subtarefa
                </button>
             </div>
             
             <div className="space-y-2">
                 {formData.subtasks.map((st) => (
                    <div key={st.id} className="flex gap-2">
                      <input 
                         type="text"
                         value={st.title}
                         onChange={(e) => handleUpdateSubtask(st.id, e.target.value)}
                         className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <button 
                         onClick={() => handleDeleteSubtask(st.id)}
                         className="p-2 text-gray-400 hover:text-red-500"
                      >
                         <X size={16} />
                      </button>
                    </div>
                 ))}
                 {formData.subtasks.length === 0 && (
                    <p className="text-sm text-gray-500 italic">Nenhuma subtarefa.</p>
                 )}
             </div>
          </div>
        </div>

        <div className="flex-shrink-0 bg-gray-50 border-t border-gray-100 p-4 flex justify-between items-center rounded-b-2xl">
          <button
            onClick={() => {
              if (window.confirm('Tem certeza que deseja excluir esta tarefa?')) {
                onDelete(task.id);
                onClose();
              }
            }}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors"
          >
            Excluir Tarefa
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
