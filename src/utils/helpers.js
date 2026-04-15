import { v4 as uuidv4 } from 'uuid';
import { format, subDays, isAfter, parseISO } from 'date-fns';

// ─── Format helpers ──────────────────────────────────────────────────────────
export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount ?? 0);

export const formatDate = (dateStr) => {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
};

export const formatDateTime = (dateStr) => {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy, hh:mm a');
  } catch {
    return dateStr;
  }
};

export const getPaymentDateKey = (payment) => {
  try {
    if (payment?.paidAt) return format(parseISO(payment.paidAt), 'yyyy-MM-dd');
    return payment?.date;
  } catch {
    return payment?.date;
  }
};

// ─── ID generator ────────────────────────────────────────────────────────────
export const generateId = () => uuidv4();

// ─── Date filter helpers ──────────────────────────────────────────────────────
export const filterByDays = (items, days, dateField = 'date') => {
  if (!days) return items;
  const cutoff = subDays(new Date(), days);
  return items.filter((item) => {
    try {
      return isAfter(parseISO(item[dateField]), cutoff);
    } catch {
      return true;
    }
  });
};

// ─── Budget type colors ───────────────────────────────────────────────────────
export const TYPE_COLORS = {
  Office: { badge: 'badge-info',    dot: '#6366f1', iconBg: '#eef2ff', iconColor: '#4f46e5' },
  Travel: { badge: 'badge-purple',  dot: '#c084fc', iconBg: '#faf5ff', iconColor: '#7c3aed' },
  Misc:   { badge: 'badge-warning', dot: '#fbbf24', iconBg: '#fffbeb', iconColor: '#d97706' },
};

export const EXPENSE_TYPES = ['Office', 'Travel', 'Misc'];

// ─── Payment status helpers ───────────────────────────────────────────────────
// 'exceeded' = paid MORE than budgeted  (over-spend)
// 'savings'  = paid LESS than budgeted  (profit / under-budget)
// 'paid'     = paid exactly the budgeted amount
export const getPaymentStatus = (actual, paid) => {
  const diff = paid - actual;
  if (diff > 0) return { type: 'exceeded', exceeded: diff };
  if (diff < 0) return { type: 'savings',  savings:  Math.abs(diff) };
  return { type: 'paid' };
};

// ─── Dummy seed data ──────────────────────────────────────────────────────────
export const SEED_BUDGETS = [
  {
    id: generateId(),
    date: format(subDays(new Date(), 2), 'yyyy-MM-dd'),
    description: 'Office Supplies Q2',
    type: 'Office',
    amount: 8500,
    repeat: 'one-time',
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    date: format(subDays(new Date(), 5), 'yyyy-MM-dd'),
    description: 'Client Visit — Mumbai',
    type: 'Travel',
    amount: 15000,
    repeat: 'one-time',
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    date: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
    description: 'Monthly Office Rentals',
    type: 'Office',
    amount: 45000,
    repeat: 'monthly',
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    date: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    description: 'Team Lunch',
    type: 'Misc',
    amount: 3200,
    repeat: 'one-time',
    createdAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    date: format(subDays(new Date(), 10), 'yyyy-MM-dd'),
    description: 'Flight — Delhi Conference',
    type: 'Travel',
    amount: 22000,
    repeat: 'one-time',
    createdAt: new Date().toISOString(),
  },
];

export const SEED_PAYMENTS = [
  {
    id: generateId(),
    budgetId: SEED_BUDGETS[0].id,
    date: SEED_BUDGETS[0].date,
    description: SEED_BUDGETS[0].description,
    type: SEED_BUDGETS[0].type,
    actualAmount: SEED_BUDGETS[0].amount,
    paidAmount: 9200,
    status: 'exceeded',
    exceededAmount: 700,
    remainingBalance: 0,
    paidAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    budgetId: SEED_BUDGETS[1].id,
    date: SEED_BUDGETS[1].date,
    description: SEED_BUDGETS[1].description,
    type: SEED_BUDGETS[1].type,
    actualAmount: SEED_BUDGETS[1].amount,
    paidAmount: 12000,
    status: 'partial',
    exceededAmount: 0,
    remainingBalance: 3000,
    paidAt: new Date().toISOString(),
  },
  {
    id: generateId(),
    budgetId: SEED_BUDGETS[3].id,
    date: SEED_BUDGETS[3].date,
    description: SEED_BUDGETS[3].description,
    type: SEED_BUDGETS[3].type,
    actualAmount: SEED_BUDGETS[3].amount,
    paidAmount: 3200,
    status: 'paid',
    exceededAmount: 0,
    remainingBalance: 0,
    paidAt: new Date().toISOString(),
  },
];
