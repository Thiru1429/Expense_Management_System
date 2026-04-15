import { useExpense } from '../context/ExpenseContext';
import { formatCurrency, EXPENSE_TYPES } from '../utils/helpers';
import Card from '../components/Card';
import { TrendingDown, AlertTriangle, PiggyBank, BarChart3, CheckCircle2, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie } from 'recharts';
import { useNavigate } from 'react-router-dom';

/* ── Tooltip ────────────────────────────────────────────────── */
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#0f172a', borderRadius: '10px', padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.18)' }}>
      <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.fill ?? p.color ?? '#a5b4fc', flexShrink: 0 }} />
          <span style={{ fontSize: '12px', color: '#cbd5e1' }}>{p.name}</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', marginLeft: 'auto' }}>
            {formatCurrency(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

const COLORS     = { Office: '#4f46e5', Travel: '#7c3aed', Misc: '#d97706' };
const PIE_COLORS = ['#4f46e5', '#7c3aed', '#d97706'];

/* ── Progress bar row ──────────────────────────────────────── */
const ProgressRow = ({ label, budget, spent, color }) => {
  const pct = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0;
  const over = spent > budget;
  return (
    <div style={{ marginBottom: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: color, flexShrink: 0 }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>{label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>{formatCurrency(spent)} / {formatCurrency(budget)}</span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: over ? '#dc2626' : color, minWidth: '36px', textAlign: 'right' }}>
            {pct}%
          </span>
        </div>
      </div>
      <div style={{ height: '7px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: over ? 'linear-gradient(90deg,#dc2626,#f87171)' : `linear-gradient(90deg,${color},${color}88)`, borderRadius: '10px', transition: 'width 0.8s ease' }} />
      </div>
      {over && (
        <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: 600, marginTop: '4px' }}>
          ⬆ Over budget by {formatCurrency(spent - budget)}
        </div>
      )}
    </div>
  );
};

/* ── Metric mini card ──────────────────────────────────────── */
const MetricChip = ({ label, value, color, bg, border }) => (
  <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: '12px', padding: '16px 20px', flex: 1, minWidth: '120px' }}>
    <div style={{ fontSize: '11px', color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px' }}>{label}</div>
    <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>{value}</div>
  </div>
);

/* ════════════════════════════════════════════════════════════════
   REPORT
════════════════════════════════════════════════════════════════ */
const Report = () => {
  const { stats, payments, budgets } = useExpense();
  const navigate = useNavigate();

  const byType = EXPENSE_TYPES.map((type) => ({
    type,
    budget: budgets.filter((b) => b.type === type).reduce((s, b) => s + b.amount, 0),
    spent:  payments.filter((p) => p.type === type).reduce((s, p) => s + p.paidAmount, 0),
  }));

  const pieData = byType
    .map((d) => ({ name: d.type, value: d.spent }))
    .filter((d) => d.value > 0);

  const utilizationPct = stats.totalBudget
    ? Math.min(Math.round((stats.totalExpenses / stats.totalBudget) * 100), 100)
    : 0;
  const utilColor    = utilizationPct > 90 ? '#dc2626' : utilizationPct > 70 ? '#d97706' : '#16a34a';
  const utilGradient = utilizationPct > 90
    ? 'linear-gradient(90deg,#dc2626,#f87171)'
    : utilizationPct > 70
    ? 'linear-gradient(90deg,#d97706,#fbbf24)'
    : 'linear-gradient(90deg,#16a34a,#4ade80)';

  const paidCount     = payments.filter((p) => p.status === 'paid').length;
  const exceededCount = payments.filter((p) => p.status === 'exceeded').length;
  const savingsCount  = payments.filter((p) => p.status === 'savings' || p.status === 'partial').length;

  return (
    <div className="animate-fade-in">

      {/* ══ KPI ROW ════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: '16px', marginBottom: '24px' }}>
        <Card title="Total Expenses"  value={formatCurrency(stats.totalExpenses)}  icon={TrendingDown}  color="purple" />
        <Card title="Total Exceeded"  value={formatCurrency(stats.totalExceeded)}  icon={AlertTriangle} color="red"    />
        <Card title="Total Savings"   value={formatCurrency(stats.totalSavings)}   icon={PiggyBank}     color="green"  />
        <Card title="Budget Balance"  value={formatCurrency(stats.remainingBalance)} icon={BarChart3}  color={stats.remainingBalance >= 0 ? 'green' : 'red'} />
      </div>

      {/* ══ UTILIZATION BANNER ════════════════════════════════ */}
      <div
        className="enterprise-card"
        style={{
          marginBottom: '20px',
          padding: '28px 32px',
          background: 'linear-gradient(135deg,#f8fafc 0%,#f1f5f9 100%)',
          borderColor: '#e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.2px' }}>Budget Utilization</div>
            <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px' }}>
              Spent <strong style={{ color: '#0f172a' }}>{formatCurrency(stats.totalExpenses)}</strong> of budget <strong style={{ color: '#0f172a' }}>{formatCurrency(stats.totalBudget)}</strong>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
            <span style={{ fontSize: '44px', fontWeight: 900, color: utilColor, letterSpacing: '-2px', lineHeight: 1 }}>{utilizationPct}</span>
            <span style={{ fontSize: '22px', fontWeight: 700, color: utilColor, marginBottom: '4px' }}>%</span>
            <span style={{ fontSize: '12px', fontWeight: 500, color: '#94a3b8', marginBottom: '8px', marginLeft: '4px' }}>used</span>
          </div>
        </div>

        {/* Track */}
        <div style={{ height: '12px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
          <div style={{ height: '100%', width: `${utilizationPct}%`, background: utilGradient, borderRadius: '10px', transition: 'width 1s ease', boxShadow: '0 2px 6px rgba(0,0,0,0.12)' }} />
        </div>

        {/* Scale labels */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
          {['0%','25%','50%','75%','100%'].map(l => (
            <span key={l} style={{ fontSize: '10.5px', color: '#94a3b8', fontWeight: 500 }}>{l}</span>
          ))}
        </div>

        {/* Metric chips */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
          <MetricChip label="Savings" value={formatCurrency(stats.totalSavings)} color="#16a34a" bg="#f0fdf4" border="#bbf7d0" />
          <MetricChip label="Exceeded" value={formatCurrency(stats.totalExceeded)} color="#dc2626" bg="#fef2f2" border="#fecaca" />
          <MetricChip label="Balance" value={formatCurrency(stats.remainingBalance)} color="#4f46e5" bg="#eef2ff" border="#c7d2fe" />
        </div>
      </div>

      {/* ══ CHARTS ROW ═════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: '16px', marginBottom: '20px' }}>

        {/* Grouped Bar Chart */}
        <div className="enterprise-card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>Budget vs Spent — by Category</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '20px' }}>Grouped comparison per expense type</div>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byType} barCategoryGap="30%" barGap={4} margin={{ left: -4, right: 4 }}>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="type" tick={{ fontSize: 13, fill: '#64748b', fontWeight: 500 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} width={46} />
              <Tooltip content={<ChartTip />} cursor={{ fill: 'rgba(79,70,229,0.04)' }} />
              <Bar dataKey="budget" name="Budgeted" radius={[5, 5, 0, 0]} fill="#e0e7ff" maxBarSize={36} />
              <Bar dataKey="spent"  name="Spent"    radius={[5, 5, 0, 0]} maxBarSize={36}>
                {byType.map((e) => <Cell key={e.type} fill={COLORS[e.type]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
            {[{ color: '#e0e7ff', border: '#c7d2fe', label: 'Budgeted' }, ...byType.map(b => ({ color: COLORS[b.type], border: 'transparent', label: b.type }))].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#64748b' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: l.color, border: `1px solid ${l.border}`, flexShrink: 0 }} />
                {l.label}
              </div>
            ))}
          </div>

          {/* Category progress breakdown */}
          <div style={{ marginTop: '20px', paddingTop: '18px', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#64748b', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '11px' }}>
              Category breakdown
            </div>
            {byType.map(b => (
              <ProgressRow key={b.type} label={b.type} budget={b.budget} spent={b.spent} color={COLORS[b.type]} />
            ))}
          </div>
        </div>

        {/* Donut + Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Donut Chart */}
          <div className="enterprise-card" style={{ padding: '24px', flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>Spending Split</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>By expense category</div>
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={76} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, idx) => <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<ChartTip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  {pieData.map((entry, idx) => {
                    const pct = stats.totalExpenses > 0 ? Math.round((entry.value / stats.totalExpenses) * 100) : 0;
                    return (
                      <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: PIE_COLORS[idx], flexShrink: 0 }} />
                        <span style={{ fontSize: '12.5px', color: '#475569', flex: 1 }}>{entry.name}</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="empty-state" style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ fontSize: '13px' }}>No spending data yet.</p>
              </div>
            )}
          </div>

          {/* Status Breakdown */}
          <div className="enterprise-card" style={{ padding: '20px' }}>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>Payment Status</div>

            {[
              { label: 'Fully Paid', count: paidCount,     icon: CheckCircle2, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
              { label: 'Exceeded',   count: exceededCount, icon: AlertTriangle,color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
              { label: '💰 Savings', count: savingsCount,  icon: PiggyBank,    color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ width: '32px', height: '32px', minWidth: '32px', borderRadius: '8px', background: s.bg, border: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={14} color={s.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>{s.label}</div>
                    {/* Mini bar */}
                    <div style={{ height: '4px', background: '#f1f5f9', borderRadius: '10px', marginTop: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: payments.length > 0 ? `${(s.count / payments.length) * 100}%` : '0%', background: s.color, borderRadius: '10px', transition: 'width 0.7s ease' }} />
                    </div>
                  </div>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: s.color, minWidth: '28px', textAlign: 'right' }}>{s.count}</span>
                </div>
              );
            })}

            <button
              onClick={() => navigate('/expense')}
              style={{ width: '100%', marginTop: '8px', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '12.5px', fontWeight: 600, color: '#4f46e5', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', transition: 'background 0.14s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#eef2ff')}
              onMouseLeave={e => (e.currentTarget.style.background = '#f8fafc')}
            >
              Full Transaction History <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report;
