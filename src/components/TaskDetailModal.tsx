import React from "react";
import { Task } from "../types";
import { motion } from "motion/react";
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
        className="relative bg-white w-full sm:max-w-lg h-[85vh] sm:h-auto sm:max-h-[90vh] flex flex-col rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Handle for mobile pull-to-close (visual only) */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden absolute top-0 z-10 pointer-events-none">
          <div className="w-12 h-1.5 bg-white/50 backdrop-blur-md rounded-full shadow-sm" />
        </div>

        {/* Header Image if exists */}
        {task.imageUrl && (
          <div className="relative w-full h-48 sm:h-56 bg-slate-100 shrink-0">
            <img
              src={task.imageUrl}
              alt={task.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 to-transparent" />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Modal Main Header (If no image) */}
        {!task.imageUrl && (
          <div className="shrink-0 bg-white/90 backdrop-blur-md border-b border-slate-100 p-4 sm:p-5 flex items-center justify-between z-20 pt-8 sm:pt-5">
            <h2 className="text-xl font-bold text-slate-800">Visualização de Tarefa</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <X size={22} />
            </button>
          </div>
        )}

        {/* Scrollable Body */}
        <div className={`p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 hide-scrollbar ${task.imageUrl ? "pt-6" : ""}`}>
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 border rounded-lg ${getPriorityColor(task.priority)}`}>
              <AlertCircle size={14} />
              Prioridade {task.priority}
            </span>
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 border rounded-lg ${getStatusColor(task.status)}`}>
              <CheckCircle2 size={14} />
              {task.status}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg">
              <Tag size={14} className="text-slate-400" />
              {task.category}
            </span>
          </div>

          {/* Title & Date */}
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">
              {task.title}
            </h1>
            {task.status === "Concluído" && task.completedAt ? (
              <p className="flex items-center gap-1.5 text-sm font-semibold text-green-600 mt-3">
                <Calendar size={16} />
                Concluído em: <span>{new Date(task.completedAt).toLocaleDateString("pt-BR")}</span>
              </p>
            ) : task.dueDate ? (
              <p className="flex items-center gap-1.5 text-sm font-medium text-slate-500 mt-3">
                <Calendar size={16} className="text-slate-400" />
                Prazo final: <span className="text-slate-900 font-bold">{new Date(task.dueDate + "T12:00:00").toLocaleDateString("pt-BR")}</span>
              </p>
            ) : (
              <p className="flex items-center gap-1.5 text-sm text-slate-400 mt-3">
                <Calendar size={16} />
                Sem data limite definida
              </p>
            )}
          </div>

          {/* Budget Info */}
          <div className="bg-primary-50/50 rounded-2xl p-5 border border-primary-100/50 space-y-3">
            <h3 className="text-xs font-bold text-primary-600 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet size={16} />
              Planejamento Financeiro
            </h3>
            <div className="flex justify-between items-end">
              <span className="text-sm text-slate-600 font-semibold">Progresso do orçamento</span>
              <span className="text-sm font-black text-slate-900">
                {formatCurrency(task.savedAmount)} <span className="text-slate-400 font-semibold text-xs">de {formatCurrency(task.estimatedCost)}</span>
              </span>
            </div>
            <div className="w-full bg-primary-100/50 rounded-full h-2.5 overflow-hidden shadow-inner">
              <div
                className={`h-full transition-all duration-700 ease-out bg-primary-500 ${progress === 100 ? "bg-green-500" : ""}`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Descrição
            </h3>
            {task.description ? (
              <div className="text-sm text-slate-700 bg-slate-50 p-4 border border-slate-100 rounded-2xl whitespace-pre-wrap leading-relaxed">
                {task.description}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">Nenhuma descrição adicionada.</p>
            )}
          </div>

          {/* Associated Links Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <LinkIcon size={16} />
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
                    className="flex items-center justify-between p-4 bg-primary-50/50 hover:bg-primary-50 border border-primary-100/50 rounded-xl text-primary-700 text-sm font-semibold transition-all group"
                  >
                    <span className="truncate pr-4 flex items-center gap-2">
                      <LinkIcon size={16} className="text-primary-400 shrink-0" />
                      {link.title || link.url}
                    </span>
                    <ExternalLink size={16} className="text-primary-500 group-hover:text-primary-700 transition-colors shrink-0" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">Nenhum link associado.</p>
            )}
          </div>

          {/* Subtasks Section */}
          <div className="space-y-3 pb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ListTodo size={16} />
              Subtarefas ({completedSubtasks}/{task.subtasks.length})
            </h3>
            {task.subtasks.length > 0 ? (
              <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white shadow-sm">
                {task.subtasks.map((st) => (
                  <div key={st.id} className="flex items-start gap-3 p-4 text-sm transition-colors hover:bg-slate-50">
                    <div className={`mt-0.5 shrink-0 ${st.completed ? "text-green-500" : "text-slate-300"}`}>
                      {st.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold ${st.completed ? "text-slate-400 line-through" : "text-slate-700"}`}>
                        {st.title}
                      </p>
                      {st.dueDate && (
                        <p className={`text-xs font-bold mt-1 ${st.completed ? "text-slate-400" : "text-slate-500"}`}>
                          Até {new Date(st.dueDate + "T12:00:00").toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">Nenhuma subtarefa criada.</p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 bg-white/90 backdrop-blur-md border-t border-slate-100 p-4 sm:p-5 flex justify-between items-center rounded-b-3xl">
          <button
            onClick={onClose}
            className="h-12 sm:h-11 px-6 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
          >
            Fechar
          </button>
          
          <button
            onClick={() => {
              onEditClick(task);
              onClose();
            }}
            className="h-12 sm:h-11 px-8 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all shadow-lg shadow-primary-600/20 flex items-center gap-2"
          >
            <Edit2 size={16} />
            Editar Tarefa
          </button>
        </div>

      </motion.div>
    </div>
  );
}
