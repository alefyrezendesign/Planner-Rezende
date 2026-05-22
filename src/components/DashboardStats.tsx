import React from 'react';
import { Task } from '../types';
import { formatCurrency } from '../utils';

interface DashboardStatsProps {
  tasks: Task[];
}

export function DashboardStats({ tasks }: DashboardStatsProps) {
  const totalEstimated = tasks.reduce((acc, task) => acc + task.estimatedCost, 0);
  const totalSaved = tasks.reduce((acc, task) => acc + task.savedAmount, 0);
  const remaining = Math.max(0, totalEstimated - totalSaved);
  const progress = totalEstimated > 0 ? Math.round((totalSaved / totalEstimated) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-4 overflow-hidden">
      <div className="grid grid-cols-3 divide-x divide-gray-100">
        <div className="px-3 sm:px-5 py-4 flex flex-col justify-center">
          <h3 className="text-gray-500 text-[9px] sm:text-[11px] font-bold uppercase tracking-wider mb-1">Orçamento Total</h3>
          <p className="text-sm sm:text-lg font-bold text-gray-900 truncate" title={formatCurrency(totalEstimated)}>{formatCurrency(totalEstimated)}</p>
        </div>

        <div className="px-3 sm:px-5 py-4 flex flex-col justify-center">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
            <h3 className="text-gray-500 text-[9px] sm:text-[11px] font-bold uppercase tracking-wider">Total Arrecadado</h3>
          </div>
          <p className="text-sm sm:text-lg font-bold text-gray-900 truncate" title={formatCurrency(totalSaved)}>{formatCurrency(totalSaved)}</p>
        </div>

        <div className="px-3 sm:px-5 py-4 flex flex-col justify-center">
          <h3 className="text-gray-500 text-[9px] sm:text-[11px] font-bold uppercase tracking-wider mb-1">Falta Arrecadar</h3>
          <p className="text-sm sm:text-lg font-bold text-gray-900 truncate" title={formatCurrency(remaining)}>{formatCurrency(remaining)}</p>
        </div>
      </div>
    </div>
  );
}
