import { supabase } from './supabase';
import { Task, CarScenario, RealEstateScenario } from './types';

// ==========================================
// API Layer for Supabase (Frontend queries)
// ==========================================

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
  const record = {
    id: task.id,
    user_id: userId,
    title: task.title,
    category: task.category,
    priority: task.priority,
    status: task.status,
    estimated_cost: task.estimatedCost,
    saved_amount: task.savedAmount,
    subtasks: task.subtasks,
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
  return {
    id: record.id,
    title: record.title,
    category: record.category,
    priority: record.priority,
    status: record.status,
    estimatedCost: record.estimated_cost,
    savedAmount: record.saved_amount,
    subtasks: record.subtasks || [],
    dueDate: record.due_date
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
