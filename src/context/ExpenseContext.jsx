import { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { SEED_BUDGETS, SEED_PAYMENTS, generateId, getPaymentStatus } from '../utils/helpers';
import { computeRecurringBudgets } from '../utils/recurringEngine';

// ─── Storage helpers ──────────────────────────────────────────────────────────
const load = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const save = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.error('localStorage write error');
  }
};

// ─── Initial state ────────────────────────────────────────────────────────────
const initialState = {
  budgets: load('em_budgets', SEED_BUDGETS),
  payments: load('em_payments', SEED_PAYMENTS),
};

// ─── Reducer ──────────────────────────────────────────────────────────────────
const reducer = (state, action) => {
  switch (action.type) {
    // BUDGET
    case 'ADD_BUDGET': {
      const budgets = [
        { ...action.payload, id: generateId(), createdAt: new Date().toISOString() },
        ...state.budgets,
      ];
      return { ...state, budgets };
    }
    // Inserted by recurringEngine — entry already has id/createdAt set
    case 'ADD_BUDGET_SILENT': {
      // Guard: never insert if this cycleMonth already exists
      const alreadyExists = state.budgets.some(
        (b) =>
          b.generatedFromId === action.payload.generatedFromId &&
          b.cycleMonth      === action.payload.cycleMonth
      );
      if (alreadyExists) return state;
      return { ...state, budgets: [action.payload, ...state.budgets] };
    }
    case 'DELETE_BUDGET': {
      const budgets = state.budgets.filter((b) => b.id !== action.payload);
      const payments = state.payments.filter((p) => p.budgetId !== action.payload);
      return { ...state, budgets, payments };
    }

    // PAYMENT
    case 'ADD_PAYMENT': {
      const { budgetId, paidAmount } = action.payload;
      const budget = state.budgets.find((b) => b.id === budgetId);
      if (!budget) return state;

      const status = getPaymentStatus(budget.amount, paidAmount);
      const paidAt = new Date().toISOString();
      const payment = {
        id: generateId(),
        budgetId,
        date: format(new Date(), 'yyyy-MM-dd'),
        dueDate: budget.date,
        description: budget.description,
        type: budget.type,
        actualAmount: budget.amount,
        paidAmount,
        status: status.type,
        exceededAmount: status.exceeded ?? 0,
        savings: status.savings ?? 0,        // profit when paid < budget
        paidAt,
      };

      return { ...state, payments: [payment, ...state.payments] };
    }
    case 'DELETE_PAYMENT': {
      const payments = state.payments.filter((p) => p.id !== action.payload);
      return { ...state, payments };
    }

    // RESET (dev use)
    case 'RESET': {
      return initialState;
    }

    default:
      return state;
  }
};

// ─── Context ──────────────────────────────────────────────────────────────────
const ExpenseContext = createContext(null);

export const ExpenseProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const recurringProcessed = useRef(false);

  // Persist on every state change
  useEffect(() => {
    save('em_budgets', state.budgets);
  }, [state.budgets]);

  useEffect(() => {
    save('em_payments', state.payments);
  }, [state.payments]);

  // ─── Auto-generate recurring monthly budgets ──────────────────────────────
  // Runs whenever payments change (i.e. a payment was just recorded),
  // plus once on first mount. Idempotent — engine skips already-generated cycles.
  useEffect(() => {
    const newEntries = computeRecurringBudgets(state.budgets, state.payments);
    if (newEntries.length > 0) {
      // Bulk-insert without going through reducer one-by-one
      // (each entry already has a pre-generated id from the engine)
      newEntries.forEach((entry) => {
        dispatch({ type: 'ADD_BUDGET_SILENT', payload: entry });
      });
    }
    recurringProcessed.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.payments]);

  // ─── Derived stats ────────────────────────────────────────────────────────
  const totalBudget = state.budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalExpenses = state.payments.reduce((sum, p) => sum + p.paidAmount, 0);
  
  // Calculate category-level net savings/exceeded
  const categories = ['Office', 'Travel', 'Misc'];
  let totalExceeded = 0;
  let totalSavings = 0;

  categories.forEach(type => {
    const catBudget = state.budgets.filter(b => b.type === type).reduce((sum, b) => sum + b.amount, 0);
    const catSpent  = state.payments.filter(p => p.type === type).reduce((sum, p) => sum + p.paidAmount, 0);
    
    if (catSpent > catBudget) {
      totalExceeded += (catSpent - catBudget);
    } else {
      totalSavings += (catBudget - catSpent);
    }
  });

  const remainingBalance = totalBudget - totalExpenses;

  const value = {
    budgets: state.budgets,
    payments: state.payments,
    stats: { totalBudget, totalExpenses, totalExceeded, totalSavings, remainingBalance },
    dispatch,
  };

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
};

export const useExpense = () => {
  const ctx = useContext(ExpenseContext);
  if (!ctx) throw new Error('useExpense must be used within ExpenseProvider');
  return ctx;
};
