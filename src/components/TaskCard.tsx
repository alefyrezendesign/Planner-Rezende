import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Edit2, ListTodo } from 'lucide-react';
import { Task, Subtask } from '../types';
import { formatCurrency, calculateProgress } from '../utils';

interface TaskCardProps {
  task: Task;
  onUpdate: (task: Task) => void;
  onEditClick: (task: Task) => void;
}

export function TaskCard({ task, onUpdate, onEditClick }: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map(st => 
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    onUpdate({ ...task, subtasks: updatedSubtasks });
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'Alta': return 'bg-red-100 text-red-700 border-red-200';
      case 'Média': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Baixa': return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'Não iniciado': return 'bg-gray-100 text-gray-700';
      case 'Em andamento': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Pendente': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'Concluído': return 'bg-green-50 text-green-700 border-green-100';
    }
  };

  const progress = calculateProgress(task.savedAmount, task.estimatedCost);
  const completedSubtasks = task.subtasks.filter(st => st.completed).length;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white border rounded-xl overflow-hidden mb-4 shadow-sm transition-shadow hover:shadow-md ${task.status === 'Concluído' ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
              <select 
                value={task.status}
                onChange={(e) => onUpdate({ ...task, status: e.target.value as Task['status'] })}
                className={`text-xs font-medium px-2 py-0.5 rounded-full border focus:outline-none appearance-none cursor-pointer ${getStatusColor(task.status)}`}
              >
                <option value="Não iniciado">Não iniciado</option>
                <option value="Em andamento">Em andamento</option>
                <option value="Pendente">Pendente</option>
                <option value="Concluído">Concluído</option>
              </select>
            </div>
            <h3 className={`text-lg font-semibold ${task.status === 'Concluído' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
              {task.title}
            </h3>
          </div>
          <button 
            onClick={() => onEditClick(task)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex-shrink-0"
            title="Editar valores e detalhes"
          >
            <Edit2 size={18} />
          </button>
        </div>

        {/* Finance Section */}
        <div className="mt-4 bg-gray-50 rounded-lg p-3 border border-gray-100">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 font-medium">Orçamento</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(task.savedAmount)} / <span className="text-gray-500 font-normal">{formatCurrency(task.estimatedCost)}</span>
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2 overflow-hidden">
            <div 
              className={`bg-blue-500 h-2 transition-all duration-500 ease-out ${progress === 100 ? 'bg-green-500' : ''}`} 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Subtasks Toggle */}
        {task.subtasks.length > 0 && (
          <div className="mt-4 border-t border-gray-100/50 pt-2">
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between text-sm text-gray-600 hover:text-gray-900 py-2 group"
            >
              <div className="flex items-center gap-2">
                <ListTodo size={16} className={`${completedSubtasks === task.subtasks.length ? 'text-green-500' : 'text-blue-500'}`} />
                <span className="font-medium">Subtarefas</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                   <div className="w-16 sm:w-20 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-300 ${completedSubtasks === task.subtasks.length ? 'bg-green-500' : 'bg-blue-400'}`}
                        style={{ width: `${(completedSubtasks / task.subtasks.length) * 100}%` }}
                      ></div>
                   </div>
                   <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{completedSubtasks}/{task.subtasks.length}</span>
                </div>
                {isExpanded ? <ChevronUp size={16} className="text-gray-400 group-hover:text-gray-600" /> : <ChevronDown size={16} className="text-gray-400 group-hover:text-gray-600" />}
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
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100 bg-gray-50/50 overflow-hidden"
          >
            <div className="p-4 space-y-2">
              {task.subtasks.map((subtask) => (
                <button
                  key={subtask.id}
                  onClick={() => toggleSubtask(subtask.id)}
                  className="flex items-start gap-3 w-full text-left p-2 hover:bg-gray-100 transition-colors rounded-lg group"
                >
                  <div className={`mt-0.5 flex-shrink-0 ${subtask.completed ? 'text-green-500' : 'text-gray-300 group-hover:text-gray-400'}`}>
                    {subtask.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  </div>
                  <span className={`text-sm md:text-base ${subtask.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                    {subtask.title}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
