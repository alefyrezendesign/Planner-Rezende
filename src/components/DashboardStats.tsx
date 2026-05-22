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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
      <div className="bg-gray-50 rounded-xl px-4 py-3 flex flex-col justify-between">
        <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Orçamento Total</h3>
        <p className="text-lg font-medium text-gray-800">{formatCurrency(totalEstimated)}</p>
      </div>

      <div className="bg-gray-50 rounded-xl px-4 py-3 flex flex-col justify-between">
        <div className="flex justify-between items-end mb-1">
          <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Arrecadado</h3>
          <span className="text-xs font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded">{progress}%</span>
        </div>
        <p className="text-lg font-medium text-gray-800">{formatCurrency(totalSaved)}</p>
      </div>

      <div className="bg-gray-50 rounded-xl px-4 py-3 flex flex-col justify-between">
        <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Falta Arrecadar</h3>
        <p className="text-lg font-medium text-gray-800">{formatCurrency(remaining)}</p>
      </div>
    </div>
  );
}
