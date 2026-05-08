import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Trash2, SlidersHorizontal, X } from 'lucide-react';
import Modal from '../components/Modal';
import { useExpense } from '../context/ExpenseContext';
import Table from '../components/Table';
import { formatCurrency, formatDate, TYPE_COLORS, EXPENSE_TYPES, getPaymentDateKey, getSavingsValue } from '../utils/helpers';

const STATUS_OPTIONS = ['All', 'paid', 'exceeded', 'savings'];
const STATUS_LABELS  = { paid: 'Fully Paid', exceeded: 'Exceeded', savings: 'Savings', partial: 'Savings' }; // 'partial' kept for backward compat
const STATUS_BADGE   = { paid: 'badge-success', exceeded: 'badge-danger', savings: 'badge-success', partial: 'badge-success' };

const Expense = () => {
  const { payments, dispatch } = useExpense();
  const [searchParams]           = useSearchParams();

  const [descSearch,   setDescSearch]   = useState(() => searchParams.get('q') ?? '');
  const [dateFilter,   setDateFilter]   = useState('');
  const [typeFilter,   setTypeFilter]   = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showFilters,  setShowFilters]  = useState(false);
  const [viewItem,    setViewItem]     = useState(null);

  // Sync descSearch when URL ?q= changes
  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    if (q) setDescSearch(q);
  }, [searchParams]);

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const matchDesc   = !descSearch.trim() || p.description.toLowerCase().includes(descSearch.toLowerCase());
      const matchDate   = !dateFilter || getPaymentDateKey(p) === dateFilter;
      const matchType   = typeFilter === 'All' || p.type === typeFilter;
      const matchStatus = statusFilter === 'All' || 
                          (statusFilter === 'savings' ? (p.status === 'savings' || p.status === 'partial') : p.status === statusFilter);
      return matchDesc && matchDate && matchType && matchStatus;
    });
  }, [payments, descSearch, dateFilter, typeFilter, statusFilter]);

  const handleDelete = (id) => {
    if (confirm('Delete this payment record?')) {
      dispatch({ type: 'DELETE_PAYMENT', payload: id });
    }
  };

  const totalPaid     = filtered.reduce((s, p) => s + p.paidAmount, 0);
  const totalExceeded = filtered.reduce((s, p) => s + p.exceededAmount, 0);
  const totalSavings  = filtered.reduce((s, p) => s + getSavingsValue(p), 0);
  const hasActiveFilters = descSearch || dateFilter || typeFilter !== 'All' || statusFilter !== 'All';

  const clearFilters = () => {
    setDescSearch('');
    setDateFilter('');
    setTypeFilter('All');
    setStatusFilter('All');
  };

  const columns = [
    { key: 'date', label: 'Date', render: (_, row) => formatDate(getPaymentDateKey(row)) },
    {
      key: 'description',
      label: 'Description',
      render: (v) => <span style={{ color: '#0f172a', fontWeight: 500 }}>{v}</span>,
    },
    {
      key: 'type',
      label: 'Type',
      render: (v) => <span className={`badge ${TYPE_COLORS[v]?.badge ?? 'badge-info'}`}>{v}</span>,
    },
    {
      key: 'actualAmount',
      label: 'Budgeted',
      render: (v) => <span style={{ color: '#64748b' }}>{formatCurrency(v)}</span>,
    },
    {
      key: 'paidAmount',
      label: 'Paid',
      render: (v) => <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatCurrency(v)}</span>,
    },
    {
      key: 'exceededAmount',
      label: 'Exceeded',
      render: (v) =>
        v > 0 ? (
          <span style={{ color: '#dc2626', fontWeight: 600 }}>{formatCurrency(v)}</span>
        ) : (
          <span style={{ color: '#94a3b8' }}>—</span>
        ),
    },
    {
      key: 'savings',
      label: '💰 Savings',
      render: (_, row) => {
        const val = getSavingsValue(row);
        return val > 0
          ? <span style={{ color: '#16a34a', fontWeight: 700 }}>{formatCurrency(val)}</span>
          : <span style={{ color: '#94a3b8' }}>—</span>;
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (v) => (
        <span className={`badge ${STATUS_BADGE[v] ?? 'badge-info'}`}>
          {STATUS_LABELS[v] ?? v}
        </span>
      ),
    },
    {
      key: 'id',
      label: '',
      render: (id) => (
        <button
          className="btn-danger"
          style={{ padding: '5px 9px' }}
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(id);
          }}
        >
          <Trash2 size={12} />
        </button>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* ── Summary + Controls row ──────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        {/* Summary mini-cards */}
        {[
          { label: 'Transactions', val: filtered.length,             badge: 'badge-info' },
          { label: 'Total Paid',   val: formatCurrency(totalPaid),   badge: 'badge-success' },
          { label: 'Total Exceeded', val: formatCurrency(totalExceeded), badge: 'badge-danger' },
          { label: 'Total Savings',  val: formatCurrency(totalSavings), badge: 'badge-success' },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '11px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              minWidth: '130px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {s.label}
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
              {s.val}
            </div>
          </div>
        ))}

        {/* Filter toggle */}
        <button
          className={showFilters ? 'btn-primary' : 'btn-ghost'}
          style={{ marginLeft: 'auto', fontSize: '13px' }}
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={13} />
          Filters
          {hasActiveFilters && (
            <span
              style={{
                background: '#dc2626',
                color: '#fff',
                borderRadius: '10px',
                padding: '0 6px',
                fontSize: '11px',
                fontWeight: 700,
                marginLeft: '2px',
              }}
            >
              {[descSearch ? 1 : 0, dateFilter ? 1 : 0, typeFilter !== 'All' ? 1 : 0, statusFilter !== 'All' ? 1 : 0].reduce((a, b) => a + b, 0)}
            </span>
          )}
        </button>
      </div>

      {/* ── Filter panel ──────────────────────────── */}
      {showFilters && (
        <div
          className="enterprise-card animate-slide-up"
          style={{
            padding: '18px 20px',
            marginBottom: '20px',
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
          }}
        >
          <div>
            <label className="form-label">Description</label>
            <input
              type="text"
              className="input-field"
              style={{ width: '200px' }}
              placeholder="Search description..."
              value={descSearch}
              onChange={(e) => setDescSearch(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Date</label>
            <input
              type="date"
              className="input-field"
              style={{ width: '170px' }}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Type</label>
            <select
              className="input-field"
              style={{ width: '140px' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              {['All', ...EXPENSE_TYPES].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Status</label>
            <select
              className="input-field"
              style={{ width: '160px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === 'All' ? 'All Statuses' : STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          {hasActiveFilters && (
            <button className="btn-ghost" onClick={clearFilters} style={{ fontSize: '13px' }}>
              <X size={12} /> Clear All
            </button>
          )}
        </div>
      )}

      <Table
        columns={columns}
        data={filtered}
        emptyMessage="No expense records match the selected filters."
        onRowClick={(item) => setViewItem(item)}
      />

      {/* ── Detail Modal ────────────────────────────── */}
      <Modal isOpen={!!viewItem} onClose={() => setViewItem(null)} title="Transaction Details">
        {viewItem && (
          <div className="modal-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: 600 }}>Description</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>{viewItem.description}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: 600 }}>Actual Paid</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a' }}>{formatCurrency(viewItem.paidAmount)}</div>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: 600 }}>Budgeted</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#64748b' }}>{formatCurrency(viewItem.actualAmount)}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: 600 }}>Category</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{viewItem.type}</div>
                </div>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: 600 }}>Date</div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>{formatDate(getPaymentDateKey(viewItem))}</div>
                </div>
              </div>

              {viewItem.exceededAmount > 0 ? (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: 600 }}>Over Budget By</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#dc2626' }}>{formatCurrency(viewItem.exceededAmount)}</div>
                </div>
              ) : getSavingsValue(viewItem) > 0 ? (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: 600 }}>Savings Achieved</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#16a34a' }}>{formatCurrency(getSavingsValue(viewItem))}</div>
                </div>
              ) : null}
            </div>
          </div>
        )}
        <div className="modal-footer">
          <button className="btn-primary" onClick={() => setViewItem(null)}>Close</button>
        </div>
      </Modal>

      {filtered.length > 0 && (
        <div
          style={{
            marginTop: '10px',
            textAlign: 'right',
            fontSize: '12px',
            color: '#94a3b8',
          }}
        >
          Showing {filtered.length} of {payments.length} records
        </div>
      )}
    </div>
  );
};

export default Expense;
