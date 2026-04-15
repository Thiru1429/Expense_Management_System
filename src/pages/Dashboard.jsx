import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import {
  Activity,
  AlertTriangle,
  BarChart2,
  CheckCircle,
  MoveRight,
  PiggyBank,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import Card from '../components/Card';
import { useExpense } from '../context/ExpenseContext';
import { formatCurrency, formatDate, TYPE_COLORS, getPaymentDateKey } from '../utils/helpers';

const buildChartData = (payments) => {
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return { date: format(date, 'MMM d'), key: format(date, 'yyyy-MM-dd'), amount: 0 };
  });

  payments.forEach((payment) => {
    const paymentDate = getPaymentDateKey(payment);
    const day = days.find((item) => item.key === paymentDate);
    if (day) day.amount += payment.paidAmount;
  });

  return days;
};

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: '#0f172a',
        borderRadius: '10px',
        padding: '10px 14px',
        fontSize: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
      }}
    >
      <div style={{ color: '#94a3b8', marginBottom: '4px' }}>{label}</div>
      <div style={{ color: '#a5b4fc', fontWeight: 700, fontSize: '14px' }}>
        {formatCurrency(payload[0].value)}
      </div>
    </div>
  );
};

const StatusBadge = ({ value }) => {
  const map = {
    paid: { label: 'Paid', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
    savings: { label: 'Savings', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
    partial: { label: 'Savings', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
    exceeded: { label: 'Exceeded', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  };

  const status = map[value] ?? { label: value, bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };

  return (
    <span
      style={{
        background: status.bg,
        color: status.color,
        border: `1px solid ${status.border}`,
        borderRadius: 20,
        padding: '2px 9px',
        fontSize: 11.5,
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      {status.label}
    </span>
  );
};

const TYPE_CHART_COLORS = { Office: '#4f46e5', Travel: '#7c3aed', Misc: '#d97706' };

const Dashboard = () => {
  const { stats, payments, budgets } = useExpense();
  const navigate = useNavigate();
  const chartData = buildChartData(payments);
  const recent = payments.slice(0, 5);

  const byType = useMemo(
    () =>
      ['Office', 'Travel', 'Misc'].map((type) => ({
        type,
        budget: budgets.filter((budget) => budget.type === type).reduce((sum, budget) => sum + budget.amount, 0),
        spent: payments.filter((payment) => payment.type === type).reduce((sum, payment) => sum + payment.paidAmount, 0),
      })),
    [budgets, payments]
  );

  const utilizationPct = stats.totalBudget
    ? Math.min(Math.round((stats.totalExpenses / stats.totalBudget) * 100), 100)
    : 0;

  return (
    <div className="animate-fade-in">
      <div
        style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6366f1 100%)',
          borderRadius: '16px',
          padding: '28px 32px',
          marginBottom: '24px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(79,70,229,0.3)',
        }}
      >
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, right: 120, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', position: 'relative' }}>
          <div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 500, marginBottom: '6px', letterSpacing: '0.3px' }}>
              {format(new Date(), 'EEEE, MMMM d yyyy')}
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.5px', lineHeight: 1.2 }}>
              Financial Overview
            </div>
            <div style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.7)', marginTop: '6px' }}>
              {budgets.length} budgets · {payments.length} transactions recorded
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)', borderRadius: '14px', padding: '18px 24px', minWidth: '220px', border: '1px solid rgba(255,255,255,0.15)' }}>
            <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.7)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '12px' }}>
              Budget Utilization
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '34px', fontWeight: 900, color: '#ffffff', letterSpacing: '-1px', lineHeight: 1 }}>
                {utilizationPct}
              </span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}>%</span>
            </div>
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${utilizationPct}%`,
                  background: utilizationPct > 90 ? '#f87171' : utilizationPct > 70 ? '#fbbf24' : '#4ade80',
                  borderRadius: '10px',
                  transition: 'width 1s ease',
                }}
              />
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', marginTop: '6px' }}>
              {formatCurrency(stats.totalExpenses)} of {formatCurrency(stats.totalBudget)}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '16px', marginBottom: '24px' }}>
        <Card title="Total Budget" value={formatCurrency(stats.totalBudget)} icon={Wallet} color="blue" subtitle={`${budgets.length} entries`} />
        <Card title="Total Expenses" value={formatCurrency(stats.totalExpenses)} icon={TrendingDown} color="purple" subtitle={`${payments.length} payments`} />
        <Card title="Total Savings" value={formatCurrency(stats.totalSavings)} icon={PiggyBank} color="green" subtitle="Under-budget wins" />
        <Card title="Balance" value={formatCurrency(stats.remainingBalance)} icon={CheckCircle} color={stats.remainingBalance >= 0 ? 'green' : 'red'} subtitle="Budget - Spent" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: '16px', marginBottom: '20px' }}>
        <div className="enterprise-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.2px' }}>Spending Trend</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>Daily payments - last 7 days</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '20px', padding: '4px 10px', fontSize: '11.5px', fontWeight: 600, color: '#4f46e5' }}>
              <Activity size={11} /> Live
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="spendG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value / 1000}k`} width={44} />
              <Tooltip content={<ChartTip />} cursor={{ stroke: '#c7d2fe', strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#4f46e5"
                strokeWidth={2.5}
                fill="url(#spendG)"
                dot={{ fill: '#4f46e5', stroke: '#eef2ff', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, fill: '#4f46e5', stroke: '#eef2ff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="enterprise-card" style={{ padding: '24px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.2px', marginBottom: '4px' }}>Budget vs Spent</div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '18px' }}>By category</div>

          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={byType} barCategoryGap="35%" margin={{ left: -10, right: 4 }}>
              <CartesianGrid stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="type" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value / 1000}k`} width={40} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="budget" name="Budget" radius={[4, 4, 0, 0]} fill="#e0e7ff" />
              <Bar dataKey="spent" name="Spent" radius={[4, 4, 0, 0]}>
                {byType.map((entry) => (
                  <Cell key={entry.type} fill={TYPE_CHART_COLORS[entry.type]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div style={{ display: 'flex', gap: '14px', marginTop: '12px' }}>
            {[{ color: '#e0e7ff', label: 'Budget' }, { color: '#4f46e5', label: 'Spent' }].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#64748b' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: item.color, flexShrink: 0 }} />
                {item.label}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '16px', padding: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '3px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Savings</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#16a34a' }}>{formatCurrency(stats.totalSavings)}</div>
            </div>
            <div style={{ width: '1px', background: '#e2e8f0' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '3px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Exceeded</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#dc2626' }}>{formatCurrency(stats.totalExceeded)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="enterprise-card">
        <div style={{ padding: '18px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.2px' }}>Recent Transactions</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{recent.length} latest payments</div>
          </div>
          <button
            onClick={() => navigate('/expense')}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12.5px', fontWeight: 600, color: '#4f46e5', background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: '8px', padding: '6px 13px', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s' }}
            onMouseEnter={(event) => (event.currentTarget.style.background = '#e0e7ff')}
            onMouseLeave={(event) => (event.currentTarget.style.background = '#eef2ff')}
          >
            View all <MoveRight size={12} />
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="empty-state">
            <BarChart2 size={38} color="#cbd5e1" style={{ margin: '0 auto 12px', display: 'block' }} />
            <p style={{ fontSize: '13.5px', color: '#94a3b8', fontWeight: 500 }}>No transactions yet. Record payments from the Payment page.</p>
          </div>
        ) : (
          <div>
            {recent.map((payment, index) => {
              const savings = payment.savings ?? payment.remainingBalance ?? 0;
              return (
                <div
                  key={payment.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '14px 24px',
                    borderBottom: index < recent.length - 1 ? '1px solid #f8fafc' : 'none',
                    transition: 'background 0.12s',
                    gap: '14px',
                  }}
                  onMouseEnter={(event) => (event.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(event) => (event.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: '36px', height: '36px', minWidth: '36px', borderRadius: '10px', background: TYPE_COLORS[payment.type]?.iconBg ?? '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrendingDown size={15} color={TYPE_COLORS[payment.type]?.iconColor ?? '#4f46e5'} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {payment.description}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>
                      {formatDate(getPaymentDateKey(payment))} · {payment.type}
                    </div>
                  </div>

                  {(savings > 0 || payment.exceededAmount > 0) && (
                    <div style={{ flexShrink: 0 }}>
                      {savings > 0 ? (
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#16a34a', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '20px', padding: '2px 8px' }}>
                          +{formatCurrency(savings)}
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '20px', padding: '2px 8px' }}>
                          {formatCurrency(payment.exceededAmount)}
                        </span>
                      )}
                    </div>
                  )}

                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{formatCurrency(payment.paidAmount)}</div>
                    <div style={{ marginTop: '3px' }}>
                      <StatusBadge value={payment.status} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
