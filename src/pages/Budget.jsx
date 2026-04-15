import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { format, addDays } from 'date-fns';
import Modal from '../components/Modal';
import Table from '../components/Table';
import { useExpense } from '../context/ExpenseContext';
import { formatCurrency, formatDate, TYPE_COLORS, EXPENSE_TYPES } from '../utils/helpers';

const TODAY_STR = format(new Date(), 'yyyy-MM-dd');
const TOMORROW_STR = format(addDays(new Date(), 1), 'yyyy-MM-dd');

const INITIAL_FORM = {
  date: format(new Date(), 'yyyy-MM-dd'),
  description: '',
  type: 'Office',
  amount: '',
  repeat: 'one-time',
};

const Budget = () => {
  const { budgets, payments, dispatch } = useExpense();
  const [searchParams] = useSearchParams();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [filter, setFilter] = useState('All');
  const [textSearch, setTextSearch] = useState(() => searchParams.get('q') ?? '');

  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    if (q) setTextSearch(q);
  }, [searchParams]);

  const validate = () => {
    const nextErrors = {};
    if (!form.description.trim()) nextErrors.description = 'Description is required.';
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) {
      nextErrors.amount = 'Enter a valid positive amount.';
    }
    if (!form.date) nextErrors.date = 'Date is required.';
    if (form.date && form.date < TODAY_STR) {
      nextErrors.date = 'Only today and upcoming dates are allowed.';
    }
    return nextErrors;
  };

  const handleSave = () => {
    const nextErrors = validate();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    dispatch({ type: 'ADD_BUDGET', payload: { ...form, amount: Number(form.amount) } });
    setModal(false);
    setForm(INITIAL_FORM);
    setErrors({});
  };

  const handleDelete = (id) => {
    if (confirm('Delete this budget entry? Associated payments will also be removed.')) {
      dispatch({ type: 'DELETE_BUDGET', payload: id });
    }
  };

  const closeModal = () => {
    setModal(false);
    setErrors({});
    setForm(INITIAL_FORM);
  };

  const paidBudgetIds = new Set(payments.map((payment) => payment.budgetId));

  const filtered = budgets.filter((budget) => {
    const matchType = filter === 'All' || budget.type === filter;
    const matchText = !textSearch.trim() || budget.description.toLowerCase().includes(textSearch.toLowerCase());
    return matchType && matchText;
  });

  const totalFiltered = filtered.reduce((sum, budget) => sum + budget.amount, 0);

  const columns = [
    {
      key: 'date',
      label: 'Date',
      render: (value, row) => {
        const isPaid = paidBudgetIds.has(row.id);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span>{formatDate(value)}</span>
            {isPaid ? (
              <span
                style={{
                  background: '#f0fdf4',
                  color: '#16a34a',
                  border: '1px solid #bbf7d0',
                  borderRadius: '20px',
                  padding: '1px 7px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                }}
              >
                Paid
              </span>
            ) : null}
            {!isPaid && value === TODAY_STR ? (
              <span
                style={{
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  borderRadius: '20px',
                  padding: '1px 7px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                }}
              >
                Today
              </span>
            ) : null}
            {!isPaid && value === TOMORROW_STR ? (
              <span
                style={{
                  background: '#fffbeb',
                  color: '#d97706',
                  border: '1px solid #fde68a',
                  borderRadius: '20px',
                  padding: '1px 7px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                }}
              >
                Tomorrow
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      key: 'description',
      label: 'Description',
      render: (value) => <span style={{ color: '#0f172a', fontWeight: 500 }}>{value}</span>,
    },
    {
      key: 'type',
      label: 'Type',
      render: (value) => <span className={`badge ${TYPE_COLORS[value]?.badge ?? 'badge-info'}`}>{value}</span>,
    },
    {
      key: 'repeat',
      label: 'Frequency',
      render: (value) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
          {value === 'monthly' ? (
            <>
              <RefreshCw size={12} color="#7c3aed" />
              <span style={{ color: '#7c3aed', fontWeight: 500 }}>Monthly</span>
            </>
          ) : (
            <>
              <Calendar size={12} color="#4f46e5" />
              <span style={{ color: '#4f46e5', fontWeight: 500 }}>One-time</span>
            </>
          )}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(value)}</span>,
    },
    {
      key: 'id',
      label: '',
      render: (id) => (
        <button
          className="btn-danger"
          style={{ padding: '5px 10px', fontSize: '12px' }}
          onClick={() => handleDelete(id)}
        >
          <Trash2 size={12} /> Delete
        </button>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            <input
              type="text"
              className="input-field"
              style={{ paddingLeft: '32px', width: '200px', height: '36px', fontSize: '13px' }}
              placeholder="Search description..."
              value={textSearch}
              onChange={(event) => setTextSearch(event.target.value)}
            />
          </div>
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '5px 14px',
              fontSize: '12.5px',
              color: '#475569',
              fontWeight: 500,
            }}
          >
            {filtered.length} entries
          </div>
          <div
            style={{
              background: '#eef2ff',
              border: '1px solid #c7d2fe',
              borderRadius: '20px',
              padding: '5px 14px',
              fontSize: '12.5px',
              color: '#4f46e5',
              fontWeight: 600,
            }}
          >
            Total: {formatCurrency(totalFiltered)}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '5px' }}>
            {['All', ...EXPENSE_TYPES].map((value) => (
              <button
                key={value}
                className={`filter-btn ${filter === value ? 'active' : ''}`}
                onClick={() => setFilter(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={() => setModal(true)}>
            <Plus size={15} /> Add Budget
          </button>
        </div>
      </div>

      <Table
        columns={columns}
        data={filtered}
        emptyMessage="No budget entries. Click 'Add Budget' to create one."
      />

      <Modal isOpen={modal} onClose={closeModal} title="Add Budget Entry">
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input
              type="date"
              className="input-field"
              min={TODAY_STR}
              value={form.date}
              onChange={(event) => setForm({ ...form, date: event.target.value })}
            />
            {errors.date && <p className="form-error">{errors.date}</p>}
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Office Supplies, Flight Ticket"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
            {errors.description && <p className="form-error">{errors.description}</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Type *</label>
              <select
                className="input-field"
                value={form.type}
                onChange={(event) => setForm({ ...form, type: event.target.value })}
              >
                {EXPENSE_TYPES.map((type) => <option key={type}>{type}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Repeat *</label>
              <select
                className="input-field"
                value={form.repeat}
                onChange={(event) => setForm({ ...form, repeat: event.target.value })}
              >
                <option value="one-time">One-time</option>
                <option value="monthly">Monthly Recurring</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Amount (INR) *</label>
            <input
              type="number"
              min="1"
              className="input-field"
              placeholder="Enter budget amount"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
            />
            {errors.amount && <p className="form-error">{errors.amount}</p>}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-ghost" onClick={closeModal}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>
            <Plus size={14} /> Save Budget
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Budget;
