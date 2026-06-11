import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { upsertFinancesItems } from './api';
import { supabase } from './supabase';

fetch('/financas-recover.txt').then(res => res.json()).then(async (data) => {
  if (localStorage.getItem('migrated_v4')) return;
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return;
  
  const exps = JSON.parse(data.fin_expenses_v2 || '[]');
  const revs = JSON.parse(data.fin_revenues_v2 || '[]');
  const debts = JSON.parse(data.fin_debts_v2 || '[]');
  const caixas = JSON.parse(data.fin_caixinhas_v2 || '[]');
  
  await upsertFinancesItems('fin_expenses', exps, userId);
  await upsertFinancesItems('fin_revenues', revs, userId);
  await upsertFinancesItems('fin_debts', debts, userId);
  await upsertFinancesItems('fin_caixinhas', caixas, userId);
  
  localStorage.setItem('migrated_v4', 'true');
  alert("UFA! O backup salvou a gente. As finanças foram empurradas para as tabelas corretas. Dê OK para recarregar.");
  window.location.reload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
