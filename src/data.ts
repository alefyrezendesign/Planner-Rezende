import { Task } from './types';

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const initialTasks: Task[] = [
  {
    id: generateId(),
    title: 'Comprar carro novo',
    category: 'Carro',
    priority: 'Alta',
    status: 'Não iniciado',
    estimatedCost: 0,
    savedAmount: 0,
    subtasks: [
      { id: generateId(), title: 'Guardar dinheiro para entrada', completed: false },
      { id: generateId(), title: 'Definir valor da entrada', completed: false },
      { id: generateId(), title: 'Definir valor máximo da parcela', completed: false },
      { id: generateId(), title: 'Pesquisar carros', completed: false },
      { id: generateId(), title: 'Simular financiamento', completed: false },
    ]
  },
  {
    id: generateId(),
    title: 'Vender Peugeot',
    category: 'Carro',
    priority: 'Alta',
    status: 'Não iniciado',
    estimatedCost: 0,
    savedAmount: 0,
    subtasks: [
      { id: generateId(), title: 'Fazer limpeza profunda', completed: false },
      { id: generateId(), title: 'Consertar ar-condicionado', completed: false },
      { id: generateId(), title: 'Consertar vazamento de água/arrefecimento', completed: false },
      { id: generateId(), title: 'Fazer revisão mecânica', completed: false },
      { id: generateId(), title: 'Tirar fotos', completed: false },
      { id: generateId(), title: 'Anunciar o carro', completed: false },
      { id: generateId(), title: 'Vender o carro', completed: false },
    ]
  },
  {
    id: generateId(),
    title: 'Mal Cheiro no Banheiro',
    category: 'Banheiro',
    priority: 'Alta',
    status: 'Não iniciado',
    estimatedCost: 0,
    savedAmount: 0,
    subtasks: [
      { id: generateId(), title: 'Comprar ralo novo que não suba cheiro', completed: false },
      { id: generateId(), title: 'Comprar encanamentos e peças', completed: false },
      { id: generateId(), title: 'Quebrar parte da varanda para corrigir o encanamento', completed: false },
      { id: generateId(), title: 'Refazer acabamento da varanda', completed: false },
      { id: generateId(), title: 'Testar se o cheiro parou', completed: false },
    ]
  },
  {
    id: generateId(),
    title: 'Armário novo',
    category: 'Banheiro',
    priority: 'Média',
    status: 'Não iniciado',
    estimatedCost: 0,
    savedAmount: 0,
    subtasks: [
      { id: generateId(), title: 'Medir espaço do banheiro', completed: false },
      { id: generateId(), title: 'Comprar armário inferior', completed: false },
      { id: generateId(), title: 'Comprar espelho ou armário superior', completed: false },
      { id: generateId(), title: 'Verificar instalação', completed: false },
      { id: generateId(), title: 'Instalar armário novo', completed: false },
    ]
  },
  {
    id: generateId(),
    title: 'Porta do banheiro',
    category: 'Banheiro',
    priority: 'Média',
    status: 'Não iniciado',
    estimatedCost: 0,
    savedAmount: 0,
    subtasks: [
      { id: generateId(), title: 'Ver se a porta atual tem conserto', completed: false },
      { id: generateId(), title: 'Comprar porta nova, se necessário', completed: false },
      { id: generateId(), title: 'Comprar fechadura e dobradiças', completed: false },
      { id: generateId(), title: 'Instalar porta', completed: false },
    ]
  },
  {
    id: generateId(),
    title: 'Suporte de papel higiênico',
    category: 'Banheiro',
    priority: 'Baixa',
    status: 'Não iniciado',
    estimatedCost: 0,
    savedAmount: 0,
    subtasks: [
      { id: generateId(), title: 'Comprar suporte novo', completed: false },
      { id: generateId(), title: 'Instalar suporte', completed: false },
    ]
  },
  {
    id: generateId(),
    title: 'Sofá',
    category: 'Sala',
    priority: 'Média',
    status: 'Não iniciado',
    estimatedCost: 0,
    savedAmount: 0,
    subtasks: [
      { id: generateId(), title: 'Fazer orçamento de higienização', completed: false },
      { id: generateId(), title: 'Fazer orçamento de impermeabilização', completed: false },
      { id: generateId(), title: 'Agendar serviço', completed: false },
      { id: generateId(), title: 'Pagar serviço', completed: false },
    ]
  },
  {
    id: generateId(),
    title: 'Instalação 220V',
    category: 'Elétrica',
    priority: 'Alta',
    status: 'Não iniciado',
    estimatedCost: 500,
    savedAmount: 0,
    subtasks: [
      { id: generateId(), title: 'Reservar R$ 500,00', completed: false },
      { id: generateId(), title: 'Confirmar valor final', completed: false },
      { id: generateId(), title: 'Agendar serviço', completed: false },
      { id: generateId(), title: 'Pagar serviço', completed: false },
    ]
  },
  {
    id: generateId(),
    title: 'Berço maior',
    category: 'Maitê',
    priority: 'Alta',
    status: 'Não iniciado',
    estimatedCost: 0,
    savedAmount: 0,
    subtasks: [
      { id: generateId(), title: 'Medir espaço disponível', completed: false },
      { id: generateId(), title: 'Pesquisar modelos', completed: false },
      { id: generateId(), title: 'Comparar preços', completed: false },
      { id: generateId(), title: 'Comprar berço', completed: false },
      { id: generateId(), title: 'Montar berço', completed: false },
    ]
  }
];
