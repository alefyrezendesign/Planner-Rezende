import React, { useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { MONTH_NAMES, MONTH_SHORT_NAMES } from './types';
import { formatCurrency } from '../../utils';

interface MonthSelectorProps {
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  monthlySobraList: number[];
}

export const MonthSelector = ({
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  monthlySobraList,
}: MonthSelectorProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll selected month into view inside the horizontal container
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.children[selectedMonth] as HTMLElement;
      if (activeEl) {
        scrollContainerRef.current.scrollTo({
          left: activeEl.offsetLeft - scrollContainerRef.current.offsetWidth / 2 + activeEl.offsetWidth / 2,
          behavior: 'smooth',
        });
      }
    }
  }, [selectedMonth]);

  const handlePrev = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNext = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handlePrevYear = () => setSelectedYear(selectedYear - 1);
  const handleNextYear = () => setSelectedYear(selectedYear + 1);

  return (
    <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-2xl space-y-2.5">
      {/* Month Header and Quick selector control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-1 gap-3">
        <div className="flex items-center gap-1.5 text-gray-800 font-bold text-sm">
          <Calendar size={16} className="text-blue-600 shrink-0" />
          <span>Focado em: <span className="text-blue-600 font-extrabold">{MONTH_NAMES[selectedMonth]}</span></span>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Year Selector */}
          <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-xl border border-gray-200 shadow-xs">
            <button
              onClick={handlePrevYear}
              className="p-1 rounded hover:bg-gray-100 text-gray-500 active:scale-95 transition-transform"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-sm font-black text-gray-700 min-w-[36px] text-center">{selectedYear}</span>
            <button
              onClick={handleNextYear}
              className="p-1 rounded hover:bg-gray-100 text-gray-500 active:scale-95 transition-transform"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Month Selector */}
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-600 active:scale-95 transition-transform"
              title="Mês Anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-600 active:scale-95 transition-transform"
              title="Próximo Mês"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Swipeable Months Track */}
      <div 
        ref={scrollContainerRef}
        className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1.5 px-0.5"
        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
      >
        {MONTH_SHORT_NAMES.map((shortName, idx) => {
          const isSelected = selectedMonth === idx;
          const sobra = monthlySobraList[idx] || 0;
          const isNegative = sobra < 0;

          return (
            <button
              key={idx}
              onClick={() => setSelectedMonth(idx)}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl min-w-[72px] cursor-pointer transition-all border shrink-0 relative select-none scroll-snap-align-start ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-1 ring-blue-500/20 active:scale-[0.97]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50 active:bg-slate-100'
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-wider">
                {MONTH_NAMES[idx].slice(0, 3)}
              </span>
              
              {/* Subtle visual balance indicator */}
              <div className="mt-1.5 flex items-center justify-center">
                <span className={`w-2 h-2 rounded-full ${
                  isNegative
                    ? isSelected ? 'bg-amber-300' : 'bg-rose-500'
                    : isSelected ? 'bg-emerald-300' : 'bg-emerald-500'
                }`} />
              </div>

              {/* Ultra-compact value feedback */}
              <span className={`text-[8px] font-bold mt-1 tracking-tight truncate max-w-[62px] ${
                isSelected ? 'text-blue-105 opacity-90' : 'text-gray-400'
              }`}>
                {sobra === 0 ? 'Nenhum' : formatCurrency(Math.abs(sobra)).replace('R$', '').trim()}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
