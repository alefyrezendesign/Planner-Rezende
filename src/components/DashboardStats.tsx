import React from 'react';
import { Task } from '../types';

interface DashboardStatsProps {
  tasks: Task[];
}

export function DashboardStats({ tasks }: DashboardStatsProps) {
  let notStarted = 0;
  let inProgress = 0;
  let pending = 0;
  let completed = 0;
  let subtasksPending = 0;
  let subtasksCompleted = 0;

  tasks.forEach((task) => {
    if (task.status === "Não iniciado") notStarted++;
    else if (task.status === "Em andamento") inProgress++;
    else if (task.status === "Pendente") pending++;
    else if (task.status === "Concluído") completed++;

    task.subtasks.forEach((sub) => {
      if (sub.completed) subtasksCompleted++;
      else subtasksPending++;
    });
  });

  const totalTasks = tasks.length;
  const taskProgress = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;
  
  const totalSubtasks = subtasksPending + subtasksCompleted;
  const subtaskProgress = totalSubtasks > 0 ? Math.round((subtasksCompleted / totalSubtasks) * 100) : 0;

  const totalItems = totalTasks + totalSubtasks;
  const totalCompletedItems = completed + subtasksCompleted;
  const generalProgress = totalItems > 0 ? Math.round((totalCompletedItems / totalItems) * 100) : 0;

  return (
    <div className="bg-white rounded-[20px] border border-gray-200 shadow-sm mb-6 sm:mb-8 overflow-hidden">
      <div className="p-5 sm:p-6">
        
        {/* Header / Progresso Geral */}
        <div className="flex flex-row items-center justify-between gap-4 mb-4">
          <h2 className="text-base font-bold text-gray-900 tracking-tight">Progresso</h2>
          <p className="text-2xl font-black text-blue-600 leading-none">{generalProgress}%</p>
        </div>

        {/* Barra de Progresso Geral */}
        <div className="w-full bg-slate-100 rounded-full h-2 mb-6 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-green-500 h-full rounded-full transition-all duration-700 w-full" style={{ width: `${generalProgress}%` }}></div>
        </div>

        {/* Breakdown Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 pt-4">
          
          {/* Tarefas */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-[11px] font-bold text-gray-800 uppercase tracking-widest">
                Tarefas 
              </h3>
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-medium">{totalTasks}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100/50 flex flex-col justify-center min-h-[50px]">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">A Fazer</p>
                <p className="text-base font-bold text-gray-700 mt-0.5">{notStarted}</p>
              </div>
              <div className="bg-blue-50/50 rounded-xl px-3 py-2 border border-blue-50 flex flex-col justify-center min-h-[50px]">
                <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Fazendo</p>
                <p className="text-base font-bold text-blue-600 mt-0.5">{inProgress}</p>
              </div>
              <div className="bg-orange-50/50 rounded-xl px-3 py-2 border border-orange-50 flex flex-col justify-center min-h-[50px]">
                <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">Pendentes</p>
                <p className="text-base font-bold text-orange-600 mt-0.5">{pending}</p>
              </div>
              <div className="bg-emerald-50/50 rounded-xl px-3 py-2 border border-emerald-50 flex flex-col justify-center min-h-[50px]">
                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Feitas</p>
                <p className="text-base font-bold text-emerald-600 mt-0.5">{completed}</p>
              </div>
            </div>
          </div>

          {/* Subtarefas */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-[11px] font-bold text-gray-800 uppercase tracking-widest">
                Subtarefas 
              </h3>
              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[10px] font-medium">{totalSubtasks}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 w-full lg:w-2/3">
              <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100/50 flex flex-col justify-center min-h-[50px]">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Pendentes</p>
                <p className="text-base font-bold text-gray-700 mt-0.5">{subtasksPending}</p>
              </div>
              <div className="bg-emerald-50/50 rounded-xl px-3 py-2 border border-emerald-50 flex flex-col justify-center min-h-[50px]">
                <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Concluídas</p>
                <p className="text-base font-bold text-emerald-600 mt-0.5">{subtasksCompleted}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
