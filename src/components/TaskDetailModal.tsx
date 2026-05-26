import React from "react";
import { Task } from "../types";
import {
  X,
  Calendar,
  Wallet,
  Tag,
  AlertCircle,
  ExternalLink,
  Edit2,
  CheckCircle2,
  Circle,
  ListTodo,
  Link as LinkIcon
} from "lucide-react";
import { formatCurrency, calculateProgress } from "../utils";

interface TaskDetailModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onEditClick: (task: Task) => void;
}

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  onEditClick,
}: TaskDetailModalProps) {
  if (!isOpen) return null;

  const progress = calculateProgress(task.savedAmount, task.estimatedCost);
  const completedSubtasks = task.subtasks.filter((st) => st.completed).length;

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "Alta":
        return "bg-red-50 text-red-700 border-red-200";
      case "Média":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "Baixa":
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "Não iniciado":
        return "bg-gray-100 text-gray-700 border-gray-200";
      case "Em andamento":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "Pendente":
        return "bg-orange-50 text-orange-700 border-orange-100";
      case "Concluído":
        return "bg-green-50 text-green-700 border-green-100";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Image if exists */}
        {task.imageUrl && (
          <div className="relative w-full h-48 sm:h-56 bg-gray-100">
            <img
              src={task.imageUrl}
              alt={task.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Modal Main Header (If no image) */}
        {!task.imageUrl && (
          <div className="flex-shrink-0 bg-white border-b border-gray-100 p-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Visualização de Tarefa</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Scrollable Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 border rounded-full ${getPriorityColor(task.priority)}`}>
              <AlertCircle size={12} />
              Prioridade {task.priority}
            </span>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 border rounded-full ${getStatusColor(task.status)}`}>
              <CheckCircle2 size={12} />
              {task.status}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
              <Tag size={12} className="text-gray-400" />
              {task.category}
            </span>
          </div>

          {/* Title & Date */}
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
              {task.title}
            </h1>
            {task.dueDate ? (
              <p className="flex items-center gap-1.5 text-sm font-medium text-gray-500 mt-2">
                <Calendar size={15} className="text-gray-400" />
                Prazo final: <span className="text-gray-900">{new Date(task.dueDate + "T12:00:00").toLocaleDateString("pt-BR")}</span>
              </p>
            ) : (
              <p className="flex items-center gap-1.5 text-sm text-gray-400 mt-2">
                <Calendar size={15} />
                Sem data limite definida
              </p>
            )}
          </div>

          {/* Budget Info */}
          <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet size={14} />
              Planejamento Financeiro
            </h3>
            <div className="flex justify-between items-end">
              <span className="text-sm text-gray-600 font-medium">Progresso do orçamento</span>
              <span className="text-sm font-bold text-gray-900">
                {formatCurrency(task.savedAmount)} <span className="text-gray-400 font-normal">de {formatCurrency(task.estimatedCost)}</span>
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ease-out bg-blue-500 ${progress === 100 ? "bg-green-500" : ""}`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Descrição
            </h3>
            {task.description ? (
              <div className="text-sm text-gray-700 bg-gray-50 p-3 border border-gray-100 rounded-xl whitespace-pre-wrap leading-relaxed">
                {task.description}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Nenhuma descrição adicionada.</p>
            )}
          </div>

          {/* Associated Links Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <LinkIcon size={14} />
              Links Associados
            </h3>
            {task.links && task.links.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {task.links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url.startsWith("http") ? link.url : `https://${link.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 bg-blue-50/30 hover:bg-blue-50 border border-blue-100 rounded-xl text-blue-700 text-sm font-medium transition-colors group"
                  >
                    <span className="truncate pr-4 flex items-center gap-2">
                      <LinkIcon size={14} className="text-blue-400 shrink-0" />
                      {link.title || link.url}
                    </span>
                    <ExternalLink size={14} className="text-blue-400 group-hover:text-blue-700 transition-colors shrink-0" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Nenhum link associado.</p>
            )}
          </div>

          {/* Subtasks Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <ListTodo size={14} />
              Subtarefas ({completedSubtasks}/{task.subtasks.length})
            </h3>
            {task.subtasks.length > 0 ? (
              <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100 bg-white">
                {task.subtasks.map((st) => (
                  <div key={st.id} className="flex items-start gap-2.5 p-3 text-sm">
                    <div className={`mt-0.5 shrink-0 ${st.completed ? "text-green-500" : "text-gray-300"}`}>
                      {st.completed ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${st.completed ? "text-gray-400 line-through" : "text-gray-700"}`}>
                        {st.title}
                      </p>
                      {st.dueDate && (
                        <p className={`text-[11px] font-medium mt-0.5 ${st.completed ? "text-gray-400" : "text-gray-500"}`}>
                          Até {new Date(st.dueDate + "T12:00:00").toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Nenhuma subtarefa criada.</p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 bg-gray-50 border-t border-gray-100 p-4 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Fechar
          </button>
          
          <button
            onClick={() => {
              onEditClick(task);
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <Edit2 size={14} />
            Editar Tarefa
          </button>
        </div>

      </div>
    </div>
  );
}
