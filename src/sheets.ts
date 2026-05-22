import { getAccessToken } from './auth';
import { Task, Priority, Status, Subtask, CarScenario, RealEstateScenario } from './types';

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

export async function createSpreadsheet(title: string) {
  const token = getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(SHEETS_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [
        {
          properties: { title: 'Tasks' },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: [
                    { userEnteredValue: { stringValue: 'ID' } },
                    { userEnteredValue: { stringValue: 'Title' } },
                    { userEnteredValue: { stringValue: 'Category' } },
                    { userEnteredValue: { stringValue: 'Priority' } },
                    { userEnteredValue: { stringValue: 'Status' } },
                    { userEnteredValue: { stringValue: 'EstimatedCost' } },
                    { userEnteredValue: { stringValue: 'SavedAmount' } },
                    { userEnteredValue: { stringValue: 'Subtasks' } },
                  ]
                }
              ]
            }
          ]
        },
        {
          properties: { title: 'Cars' },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: [
                    { userEnteredValue: { stringValue: 'ID' } },
                    { userEnteredValue: { stringValue: 'ModelName' } },
                    { userEnteredValue: { stringValue: 'CarValue' } },
                    { userEnteredValue: { stringValue: 'DownPaymentTarget' } },
                    { userEnteredValue: { stringValue: 'DownPaymentSaved' } },
                    { userEnteredValue: { stringValue: 'InterestRateMonthly' } },
                    { userEnteredValue: { stringValue: 'Installments' } },
                  ]
                }
              ]
            }
          ]
        }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create spreadsheet');
  }

  const data = await response.json();
  return data.spreadsheetId;
}

export async function fetchTasks(spreadsheetId: string): Promise<Task[]> {
  const token = getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${SHEETS_API}/${spreadsheetId}/values/Tasks!A2:H1000`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to fetch tasks');
  }

  const data = await response.json();
  const rows = data.values || [];

  const parsed = rows.map((row: any[]) => ({
    id: row[0] || '',
    title: row[1] || '',
    category: row[2] || '',
    priority: (row[3] || 'Média') as Priority,
    status: (row[4] || 'Não iniciado') as Status,
    estimatedCost: Number(row[5]) || 0,
    savedAmount: Number(row[6]) || 0,
    subtasks: JSON.parse(row[7] || '[]') as Subtask[],
  }));

  const unique = new Map<string, Task>();
  parsed.forEach((t: Task) => unique.set(t.id, t));
  return Array.from(unique.values());
}

export async function syncTasksToSheet(spreadsheetId: string, tasks: Task[]) {
  const token = getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const values = tasks.map(task => [
    task.id,
    task.title,
    task.category,
    task.priority,
    task.status,
    task.estimatedCost.toString(),
    task.savedAmount.toString(),
    JSON.stringify(task.subtasks)
  ]);

  // First we clear the existing data below headers
  await fetch(`${SHEETS_API}/${spreadsheetId}/values/Tasks!A2:H1000:clear`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });

  if (values.length === 0) return;

  // Then append to the end 
  const response = await fetch(`${SHEETS_API}/${spreadsheetId}/values/Tasks!A2?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to sync tasks');
  }
}

export async function ensureCarsSheet(spreadsheetId: string) {
  const token = getAccessToken();
  if (!token) return;

  const response = await fetch(`${SHEETS_API}/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await response.json();
  const hasCarsSheet = data.sheets?.some((s: any) => s.properties.title === 'Cars');

  if (!hasCarsSheet) {
    await fetch(`${SHEETS_API}/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: {
                title: 'Cars'
              }
            }
          }
        ]
      })
    });
    
    // Add headers
    await fetch(`${SHEETS_API}/${spreadsheetId}/values/Cars!A1:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [['ID', 'ModelName', 'CarValue', 'DownPaymentTarget', 'DownPaymentSaved', 'InterestRateMonthly', 'Installments']]
      })
    });
  }
}

export async function fetchCars(spreadsheetId: string): Promise<CarScenario[]> {
  await ensureCarsSheet(spreadsheetId);
  const token = getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${SHEETS_API}/${spreadsheetId}/values/Cars!A2:G1000`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) return [];

  const data = await response.json();
  const rows = data.values || [];

  const parsed = rows.map((row: any[]) => ({
    id: row[0] || '',
    modelName: row[1] || '',
    carValue: Number(row[2]) || 0,
    downPaymentTarget: Number(row[3]) || 0,
    downPaymentSaved: Number(row[4]) || 0,
    interestRateMonthly: Number(row[5]) || 0,
    installments: Number(row[6]) || 0,
  }));

  const unique = new Map<string, CarScenario>();
  parsed.forEach((c: CarScenario) => unique.set(c.id, c));
  return Array.from(unique.values());
}

export async function syncCarsToSheet(spreadsheetId: string, cars: CarScenario[]) {
  const token = getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const values = cars.map(car => [
    car.id,
    car.modelName,
    car.carValue.toString(),
    car.downPaymentTarget.toString(),
    car.downPaymentSaved.toString(),
    car.interestRateMonthly.toString(),
    car.installments.toString()
  ]);

  await fetch(`${SHEETS_API}/${spreadsheetId}/values/Cars!A2:G1000:clear`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });

  if (values.length === 0) return;

  const response = await fetch(`${SHEETS_API}/${spreadsheetId}/values/Cars!A2?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to sync cars');
  }
}

export async function ensureRealEstateSheet(spreadsheetId: string) {
  const token = getAccessToken();
  if (!token) return;

  const response = await fetch(`${SHEETS_API}/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await response.json();
  const hasRealEstateSheet = data.sheets?.some((s: any) => s.properties.title === 'RealEstate');

  if (!hasRealEstateSheet) {
    await fetch(`${SHEETS_API}/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: {
                title: 'RealEstate'
              }
            }
          }
        ]
      })
    });
    
    // Add headers
    await fetch(`${SHEETS_API}/${spreadsheetId}/values/RealEstate!A1:append?valueInputOption=USER_ENTERED`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [['ID', 'PropertyName', 'PropertyValue', 'DownPaymentTarget', 'DownPaymentSaved', 'Subsidy', 'InterestRateAnnual', 'Installments', 'AmortizationType']]
      })
    });
  }
}

export async function fetchRealEstate(spreadsheetId: string): Promise<RealEstateScenario[]> {
  await ensureRealEstateSheet(spreadsheetId);
  const token = getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${SHEETS_API}/${spreadsheetId}/values/RealEstate!A2:I1000`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) return [];

  const data = await response.json();
  const rows = data.values || [];

  const parsed = rows.map((row: any[]) => ({
    id: row[0] || '',
    propertyName: row[1] || '',
    propertyValue: Number(row[2]) || 0,
    downPaymentTarget: Number(row[3]) || 0,
    downPaymentSaved: Number(row[4]) || 0,
    subsidy: Number(row[5]) || 0,
    interestRateAnnual: Number(row[6]) || 0,
    installments: Number(row[7]) || 0,
    amortizationType: (row[8] === 'SAC' || row[8] === 'PRICE') ? row[8] : 'SAC',
  }));

  const unique = new Map<string, RealEstateScenario>();
  parsed.forEach((h: RealEstateScenario) => unique.set(h.id, h));
  return Array.from(unique.values());
}

export async function syncRealEstateToSheet(spreadsheetId: string, houses: RealEstateScenario[]) {
  const token = getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const values = houses.map(house => [
    house.id,
    house.propertyName,
    house.propertyValue.toString(),
    house.downPaymentTarget.toString(),
    house.downPaymentSaved.toString(),
    house.subsidy.toString(),
    house.interestRateAnnual.toString(),
    house.installments.toString(),
    house.amortizationType
  ]);

  await fetch(`${SHEETS_API}/${spreadsheetId}/values/RealEstate!A2:I1000:clear`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });

  if (values.length === 0) return;

  const response = await fetch(`${SHEETS_API}/${spreadsheetId}/values/RealEstate!A2?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to sync real estate');
  }
}
