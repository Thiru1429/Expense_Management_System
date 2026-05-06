import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  PiggyBank,
  Search,
} from 'lucide-react';
import Modal from '../components/Modal';
import { useExpense } from '../context/ExpenseContext';
import { formatCurrency, TYPE_COLORS, getPaymentStatus } from '../utils/helpers';

const Row = ({ label, value, color = '#334155', bold = false }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f1f5f9' }}>
    <span style={{ fontSize: '12.5px', color: '#64748b' }}>{label}</span>
    <span style={{ fontSize: '12.5px', fontWeight: bold ? 700 : 500, color }}>{value}</span>
  </div>
);

const PaymentResultCard = ({ actual, paid }) => {
  const status = getPaymentStatus(actual, paid);

  if (status.type === 'paid') {
    return (
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '16px', marginTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <CheckCircle size={18} color="#16a34a" />
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#16a34a' }}>Paid in Full - Exact Match</span>
        </div>
        <Row label="Amount Paid" value={formatCurrency(paid)} color="#16a34a" bold />
        <Row label="Savings / Overrun" value="Rs.0 (exact)" />
      </div>
    );
  }

  if (status.type === 'exceeded') {
    return (
      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '16px', marginTop: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <AlertTriangle size={18} color="#dc2626" />
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#dc2626' }}>Over Budget</span>
        </div>
        <Row label="Budgeted Amount" value={formatCurrency(actual)} />
        <Row label="Overrun (extra)" value={formatCurrency(status.exceeded)} color="#dc2626" bold />
        <Row label="Total Paid" value={formatCurrency(paid)} color="#d97706" bold />
      </div>
    );
  }

  return (
    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '16px', marginTop: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <PiggyBank size={18} color="#16a34a" />
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#16a34a' }}>Under Budget - Savings!</span>
      </div>
      <Row label="Budgeted Amount" value={formatCurrency(actual)} />
      <Row label="Amount Paid" value={formatCurrency(paid)} />
      <Row label="You Saved" value={formatCurrency(status.savings)} color="#16a34a" bold />
    </div>
  );
};

const Payment = () => {
  const { budgets, payments, dispatch } = useExpense();
  const [searchParams] = useSearchParams();
  const [selected, setSelected] = useState(null);
  const [paidAmount, setPaidAmount] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');

  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    if (q) setSearch(q);
  }, [searchParams]);

  const paidBudgetIds = new Set(payments.map((payment) => payment.budgetId));
  const pendingBudgets = budgets.filter((budget) => !paidBudgetIds.has(budget.id));
  const filteredPending = pendingBudgets.filter((budget) =>
    budget.description.toLowerCase().includes(search.toLowerCase())
  );

  const openPayment = (budget) => {
    setSelected(budget);
    setPaidAmount('');
    setModalOpen(true);
  };

  const handleRecord = () => {
    const paid = Number(paidAmount);
    if (!paid || paid <= 0 || !selected) return;

    dispatch({ type: 'ADD_PAYMENT', payload: { budgetId: selected.id, paidAmount: paid } });
    setModalOpen(false);
    setSelected(null);
    setPaidAmount('');
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '20px', maxWidth: '360px', position: 'relative' }}>
        <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
        <input
          type="text"
          className="input-field"
          style={{ paddingLeft: '34px' }}
          placeholder="Search budgets..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '9px', padding: '9px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#d97706' }}>{pendingBudgets.length}</span>
          <span style={{ fontSize: '12px', color: '#d97706', fontWeight: 500 }}>Pending Payment</span>
        </div>
      </div>

      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d97706', display: 'inline-block' }} />
        Pending Payments
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>({filteredPending.length})</span>
      </div>

      {filteredPending.length === 0 ? (
        <div className="enterprise-card" style={{ padding: '36px 20px', textAlign: 'center', marginBottom: '28px' }}>
          {pendingBudgets.length > 0 ? (
            <Search size={38} color="#94a3b8" style={{ margin: '0 auto 10px', display: 'block' }} />
          ) : (
            <CheckCircle2 size={38} color="#16a34a" style={{ margin: '0 auto 10px', display: 'block' }} />
          )}
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
            {pendingBudgets.length > 0 ? 'No matches found' : 'All budgets are paid!'}
          </div>
          <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '4px' }}>
            {search ? `No pending budgets match "${search}"` : 'Add new budgets from the Budget page.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {filteredPending.map((budget) => (
            <div
              key={budget.id}
              className="enterprise-card"
              style={{ padding: '20px', borderLeft: '3px solid #d97706' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <span className={`badge ${TYPE_COLORS[budget.type]?.badge ?? 'badge-info'}`}>{budget.type}</span>
                  <div style={{ fontSize: '14.5px', fontWeight: 600, color: '#0f172a', marginTop: '8px', lineHeight: 1.3 }}>{budget.description}</div>
                </div>
                <div style={{ width: '36px', height: '36px', minWidth: '36px', background: '#fffbeb', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={17} color="#d97706" />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Budgeted</div>
                  <div style={{ fontSize: '19px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>{formatCurrency(budget.amount)}</div>
                </div>
                <button className="btn-primary" style={{ fontSize: '13px', padding: '8px 16px' }} onClick={() => openPayment(budget)}>
                  Pay Now <ChevronRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Record Payment">
          <div className="modal-body">
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', marginBottom: '18px' }}>
              <div style={{ fontSize: '14.5px', fontWeight: 600, color: '#0f172a', marginBottom: '10px' }}>
                {selected.description}
              </div>
              <Row label="Type" value={selected.type} />
              <Row label="Budgeted Amount" value={formatCurrency(selected.amount)} color="#4f46e5" bold />
            </div>

            <div className="form-group">
              <label className="form-label">Actual Amount Paid (Rs.) *</label>
              <input
                type="number"
                min="1"
                className="input-field"
                placeholder="Enter the actual amount paid"
                value={paidAmount}
                onChange={(event) => {
                  const val = event.target.value;
                  if (val.length <= 12) {
                    setPaidAmount(val);
                  }
                }}
              />
              <p style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '5px' }}>
                If the market rate is lower than budget it shows savings. If higher it shows overrun.
              </p>
            </div>

            {paidAmount && Number(paidAmount) > 0 && (
              <PaymentResultCard actual={selected.amount} paid={Number(paidAmount)} />
            )}
          </div>

          <div className="modal-footer">
            <button className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button
              className="btn-primary"
              onClick={handleRecord}
              disabled={!paidAmount || Number(paidAmount) <= 0}
            >
              <CreditCard size={14} /> Confirm Payment
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Payment;
