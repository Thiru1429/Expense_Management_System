import { useState, useMemo } from 'react';
import { Trash2, RefreshCw, Calendar, Eye, TrendingUp } from 'lucide-react';
import Modal from '../components/Modal';
import { useExpense } from '../context/ExpenseContext';
import Table from '../components/Table';
import { formatCurrency, formatDate, TYPE_COLORS, filterByDays } from '../utils/helpers';

const DAY_FILTERS = [
  { label: '1 Day',   value: 1 },
  { label: '3 Days',  value: 3 },
  { label: '7 Days',  value: 7 },
  { label: '15 Days', value: 15 },
  { label: '30 Days', value: 30 },
  { label: 'All',     value: null },
];

const Projection = () => {
  const { budgets, dispatch } = useExpense();
  const [dayFilter,  setDayFilter]  = useState(null);
  const [typeFilter, setTypeFilter] = useState('All');
  const [viewItem,   setViewItem]   = useState(null);

  const handleDelete = (id) => {
    if (confirm('Remove this budget from projection?')) {
      dispatch({ type: 'DELETE_BUDGET', payload: id });
    }
  };

  const filtered = useMemo(() => {
    let data = filterByDays(budgets, dayFilter);
    if (typeFilter !== 'All') data = data.filter((b) => b.type === typeFilter);
    return data;
  }, [budgets, dayFilter, typeFilter]);

  const totalProjected = filtered.reduce((s, b) => s + b.amount, 0);
  const monthlyCount   = filtered.filter((b) => b.repeat === 'monthly').length;

  const columns = [
    { key: 'date', label: 'Date', render: (v) => formatDate(v) },
    {
      key: 'description',
      label: 'Description',
      render: (v) => <span style={{ color: '#0f172a', fontWeight: 500 }}>{v}</span>,
    },
    {
      key: 'type',
      label: 'Category',
      render: (v) => (
        <span className={`badge ${TYPE_COLORS[v]?.badge ?? 'badge-info'}`}>{v}</span>
      ),
    },
    {
      key: 'repeat',
      label: 'Frequency',
      render: (v) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '13px',
          }}
        >
          {v === 'monthly' ? (
            <><RefreshCw size={12} color="#7c3aed" /><span style={{ color: '#7c3aed', fontWeight: 500 }}>Monthly</span></>
          ) : (
            <><Calendar size={12} color="#4f46e5" /><span style={{ color: '#4f46e5', fontWeight: 500 }}>One-time</span></>
          )}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Projected Amount',
      render: (v) => (
        <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(v)}</span>
      ),
    },
    {
      key: 'id',
      label: '',
      render: (id) => (
        <button
          className="btn-danger"
          style={{ padding: '5px 10px', fontSize: '12px' }}
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(id);
          }}
        >
          <Trash2 size={12} /> Remove
        </button>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* ── Summary Banner ──────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%)',
          border: '1px solid #c7d2fe',
          borderRadius: '12px',
          padding: '20px 24px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Total Projected Spend
          </div>
          <div
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: '#4f46e5',
              letterSpacing: '-0.5px',
            }}
          >
            {formatCurrency(totalProjected)}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            {filtered.length} entries · {monthlyCount} recurring
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#ffffff',
            border: '1px solid #c7d2fe',
            borderRadius: '9px',
            padding: '8px 14px',
          }}
        >
          <Eye size={14} color="#4f46e5" />
          <span style={{ fontSize: '13px', color: '#475569', fontWeight: 500 }}>
            Read-only projection view
          </span>
        </div>
      </div>

      {/* ── Filter Bar ───────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, marginRight: '4px' }}>
          Period:
        </span>
        {DAY_FILTERS.map((f) => (
          <button
            key={f.label}
            className={`filter-btn ${dayFilter === f.value ? 'active' : ''}`}
            onClick={() => setDayFilter(f.value)}
          >
            {f.label}
          </button>
        ))}

        {/* Divider */}
        <div style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 4px' }} />

        <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, marginRight: '4px' }}>
          Type:
        </span>
        {['All', 'Office', 'Travel', 'Misc'].map((t) => (
          <button
            key={t}
            className={`filter-btn ${typeFilter === t ? 'active' : ''}`}
            onClick={() => setTypeFilter(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <Table
        columns={columns}
        data={filtered}
        emptyMessage="No budget entries match the selected filters."
        onRowClick={(item) => setViewItem(item)}
      />

      {/* ── Detail Modal ────────────────────────────── */}
      <Modal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Projection Details">
        {viewItem && (
          <div className="modal-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: 600 }}>Description</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{viewItem.description}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: 600 }}>Projected Amount</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#4f46e5' }}>{formatCurrency(viewItem.amount)}</div>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: 600 }}>Category</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{viewItem.type}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: 600 }}>Frequency</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#7c3aed' }}>{viewItem.repeat === 'monthly' ? 'Monthly Recurring' : 'One-time'}</div>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: 600 }}>Projection Date</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{formatDate(viewItem.date)}</div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="modal-footer">
          <button className="btn-primary" onClick={() => setViewItem(null)}>Close</button>
        </div>
      </Modal>

      {filtered.length > 0 && (
        <div style={{ marginTop: '10px', textAlign: 'right', fontSize: '12px', color: '#94a3b8' }}>
          Showing {filtered.length} of {budgets.length} entries
        </div>
      )}
    </div>
  );
};

export default Projection;
