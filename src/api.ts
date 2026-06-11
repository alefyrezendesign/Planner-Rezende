import { supabase } from './supabase';
import { Task, CarScenario, RealEstateScenario } from './types';

// ==========================================
// API Layer for Supabase (Frontend queries)
// ==========================================

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  return {data, error};
}

export async function fetchTasks(userId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  if (!data) return [];
  return data.map(parseTaskRecord);
}

export async function saveTask(userId: string, task: Task) {
  const dbSubtasks = [...task.subtasks];
  
  // Clean up any old meta item if it somehow existed in task.subtasks
  const filteredSubtasks = dbSubtasks.filter(st => st.id !== "task-meta-info");
  
  // If there's metadata, add it as a special meta-info subtask record in the array
  if (task.description || task.imageUrl || (task.links && task.links.length > 0) || task.completedAt) {
    filteredSubtasks.push({
      id: "task-meta-info",
      title: JSON.stringify({
        description: task.description,
        imageUrl: task.imageUrl,
        links: task.links,
        completedAt: task.completedAt
      }),
      completed: false
    });
  }

  const record = {
    id: task.id,
    user_id: userId,
    title: task.title,
    category: task.category,
    priority: task.priority,
    status: task.status,
    estimated_cost: task.estimatedCost,
    saved_amount: task.savedAmount,
    subtasks: filteredSubtasks,
    due_date: task.dueDate
  };
  const { data, error } = await supabase.from('tasks').upsert(record).select();
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error("Não foi possível salvar na nuvem. Verifique suas permissões.");
  }
}

export async function deleteTask(userId: string, taskId: string) {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId).eq('user_id', userId);
  if (error) throw error;
}

export async function fetchCars(userId: string) {
  const { data, error } = await supabase.from('cars').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  if (!data) return [];
  return data.map(parseCarRecord);
}

export async function saveCar(userId: string, car: CarScenario) {
  const record = {
    id: car.id,
    user_id: userId,
    model_name: car.modelName,
    image_url: car.imageUrl,
    car_value: car.carValue,
    down_payment_target: car.downPaymentTarget,
    down_payment_saved: car.downPaymentSaved,
    interest_rate_monthly: car.interestRateMonthly,
    installments: car.installments
  };
  const { data, error } = await supabase.from('cars').upsert(record).select();
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error("Não foi possível salvar carro na nuvem. Verifique suas permissões.");
  }
}

export async function deleteCar(userId: string, carId: string) {
  const { error } = await supabase.from('cars').delete().eq('id', carId).eq('user_id', userId);
  if (error) throw error;
}

export async function fetchHouses(userId: string) {
  const { data, error } = await supabase.from('houses').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  if (!data) return [];
  return data.map(parseHouseRecord);
}

export async function saveHouse(userId: string, house: RealEstateScenario) {
  const record = {
    id: house.id,
    user_id: userId,
    property_name: house.propertyName,
    image_url: house.imageUrl,
    property_value: house.propertyValue,
    down_payment_target: house.downPaymentTarget,
    down_payment_saved: house.downPaymentSaved,
    subsidy: house.subsidy,
    interest_rate_annual: house.interestRateAnnual,
    installments: house.installments,
    amortization_type: house.amortizationType
  };
  const { data, error } = await supabase.from('houses').upsert(record).select();
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error("Não foi possível salvar imóvel na nuvem. Verifique suas permissões.");
  }
}

export async function deleteHouse(userId: string, houseId: string) {
  const { error } = await supabase.from('houses').delete().eq('id', houseId).eq('user_id', userId);
  if (error) throw error;
}

// Helpers
function parseTaskRecord(record: any): Task {
  let allSubtasks = [];
  try {
    allSubtasks = Array.isArray(record.subtasks) ? record.subtasks : [];
  } catch(e) {
    console.error("Erro ao ler subtasks", e);
  }
  
  const metaItem = allSubtasks.find((st: any) => st?.id === "task-meta-info");
  let description = undefined;
  let imageUrl = undefined;
  let links = undefined;
  let completedAt = undefined;
  
  if (metaItem) {
    try {
      const meta = JSON.parse(metaItem.title);
      description = meta.description;
      imageUrl = meta.imageUrl;
      links = meta.links;
      completedAt = meta.completedAt;
    } catch (e) {
      console.error("Failed to parse task-meta-info item:", e);
    }
  }
  
  const actualSubtasks = allSubtasks.filter((st: any) => st.id !== "task-meta-info");

  return {
    id: record.id,
    title: record.title,
    category: record.category,
    priority: record.priority,
    status: record.status,
    estimatedCost: record.estimated_cost,
    savedAmount: record.saved_amount,
    subtasks: actualSubtasks,
    dueDate: record.due_date,
    description,
    imageUrl,
    links,
    completedAt
  };
}

function parseCarRecord(record: any): CarScenario {
  return {
    id: record.id,
    modelName: record.model_name,
    imageUrl: record.image_url,
    carValue: record.car_value,
    downPaymentTarget: record.down_payment_target,
    downPaymentSaved: record.down_payment_saved,
    interestRateMonthly: record.interest_rate_monthly,
    installments: record.installments
  };
}

function parseHouseRecord(record: any): RealEstateScenario {
  return {
    id: record.id,
    propertyName: record.property_name,
    imageUrl: record.image_url,
    propertyValue: record.property_value,
    downPaymentTarget: record.down_payment_target,
    downPaymentSaved: record.down_payment_saved,
    subsidy: record.subsidy,
    interestRateAnnual: record.interest_rate_annual,
    installments: record.installments,
    amortizationType: record.amortization_type
  };
}

// ==========================================
// Finances Relational API
// ==========================================

export async function fetchUserFinances(userId: string) {
  const [
    { data: revData },
    { data: expData },
    { data: debtData },
    { data: caixaData }
  ] = await Promise.all([
    supabase.from('fin_revenues').select('*').eq('user_id', userId),
    supabase.from('fin_expenses').select('*').eq('user_id', userId),
    supabase.from('fin_debts').select('*').eq('user_id', userId),
    supabase.from('fin_caixinhas').select('*').eq('user_id', userId)
  ]);

  return {
    revenues: (revData || []).map(r => ({
      id: r.id,
      description: r.description,
      value: Number(r.value),
      month: r.month,
      year: r.year,
      category: r.category,
      recurrenceType: r.recurrence_type,
      groupId: r.group_id,
      installmentsCount: r.installments_count,
      installmentIndex: r.installment_index,
      active: r.active
    })),
    expenses: (expData || []).map(e => ({
      id: e.id,
      description: e.description,
      value: Number(e.value),
      month: e.month,
      year: e.year,
      category: e.category,
      recurrenceType: e.recurrence_type,
      groupId: e.group_id,
      installmentsCount: e.installments_count,
      installmentIndex: e.installment_index,
      active: e.active,
      isLimit: e.is_limit
    })),
    debts: (debtData || []).map(d => ({
      id: d.id,
      name: d.name,
      creditor: d.creditor,
      totalValue: Number(d.total_value),
      installmentsCount: d.installments_count,
      installmentValue: Number(d.installment_value),
      startMonth: d.start_month,
      startYear: d.start_year,
      status: d.status,
      paidInstallments: d.paid_installments,
      observations: d.observations
    })),
    caixinhas: (caixaData || []).map(c => ({
      id: c.id,
      name: c.name,
      objective: c.objective,
      targetValue: Number(c.target_value),
      currentValue: Number(c.current_value),
      monthlyPlanned: Number(c.monthly_planned),
      status: c.status,
      calculationMode: c.calculation_mode,
      durationMonths: c.duration_months,
      startMonth: c.start_month,
      startYear: c.start_year,
      deposits: c.deposits || []
    }))
  };
}

export async function upsertFinancesItems(table: 'fin_revenues' | 'fin_expenses' | 'fin_debts' | 'fin_caixinhas', items: any[], userId: string) {
  if (!items || items.length === 0) return;
  
  let mapped: any[] = [];
  if (table === 'fin_revenues' || table === 'fin_expenses') {
    mapped = items.map(i => ({
      id: i.id,
      user_id: userId,
      description: i.description,
      value: i.value,
      month: i.month,
      year: i.year,
      category: i.category,
      recurrence_type: i.recurrenceType,
      group_id: i.groupId,
      installments_count: i.installmentsCount,
      installment_index: i.installmentIndex,
      active: i.active !== false,
      ...(table === 'fin_expenses' ? { is_limit: i.isLimit || false } : {})
    }));
  } else if (table === 'fin_debts') {
    mapped = items.map(i => ({
      id: i.id,
      user_id: userId,
      name: i.name,
      creditor: i.creditor,
      total_value: i.totalValue,
      installments_count: i.installmentsCount,
      installment_value: i.installmentValue,
      start_month: i.startMonth,
      start_year: i.startYear,
      status: i.status,
      paid_installments: i.paidInstallments,
      observations: i.observations
    }));
  } else if (table === 'fin_caixinhas') {
    mapped = items.map(i => ({
      id: i.id,
      user_id: userId,
      name: i.name,
      objective: i.objective,
      target_value: i.targetValue,
      current_value: i.currentValue,
      monthly_planned: i.monthlyPlanned,
      status: i.status,
      calculation_mode: i.calculationMode,
      duration_months: i.durationMonths,
      start_month: i.startMonth,
      start_year: i.startYear,
      deposits: i.deposits
    }));
  }

  const { error } = await supabase.from(table).upsert(mapped);
  if (error) console.error("Error upserting", table, error);
}

export async function deleteFinancesItems(table: 'fin_revenues' | 'fin_expenses' | 'fin_debts' | 'fin_caixinhas', ids: string[]) {
  if (!ids || ids.length === 0) return;
  const { error } = await supabase.from(table).delete().in('id', ids);
  if (error) console.error("Error deleting", table, error);
}

