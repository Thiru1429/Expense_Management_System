import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useExpense } from '../context/ExpenseContext';
import { formatCurrency, formatDate } from '../utils/helpers';
import { format, addDays } from 'date-fns';
import {
  Search,
  Bell,
  Menu,
  X,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  ChevronRight,
  BellRing,
  Inbox,
} from 'lucide-react';

const PAGE_TITLES = {
  '/':           { title: 'Dashboard',           sub: 'Overview of your financial health' },
  '/budget':     { title: 'Budget Manager',      sub: 'Create and manage budget entries' },
  '/projection': { title: 'Projection',          sub: 'View projected expenses from budget data' },
  '/payment':    { title: 'Payment Processing',  sub: 'Record and manage expense payments' },
  '/expense':    { title: 'Expense Tracker',     sub: 'Monitor all completed transactions' },
  '/report':     { title: 'Reports & Analytics', sub: 'Insights and summaries of your spending' },
};

const STATUS_CONFIG = {
  paid:     { label: 'Fully Paid', badge: 'badge-success', Icon: CheckCircle2 },
  exceeded: { label: 'Exceeded',   badge: 'badge-danger',  Icon: AlertTriangle },
  savings:  { label: '💰 Savings', badge: 'badge-success', Icon: CheckCircle2 },
  partial:  { label: '💰 Savings', badge: 'badge-success', Icon: CheckCircle2 }, // backward compat
};

// ─── Navbar ────────────────────────────────────────────────────────────────────
const Navbar = ({ sidebarOpen, onToggleSidebar, isMobile }) => {
  const { pathname }                = useLocation();
  const navigate                    = useNavigate();
  const { stats, budgets, payments } = useExpense();
  const meta = PAGE_TITLES[pathname] ?? { title: 'Expense', sub: '' };

  const todayStr    = format(new Date(), 'yyyy-MM-dd');
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const isPositive  = stats.remainingBalance >= 0;

  // ── Search ────────────────────────────────────────────────────────────────
  const [query, setQuery]         = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef                 = useRef(null);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return { budgets: [], payments: [] };
    return {
      budgets:  budgets.filter(b  => b.description.toLowerCase().includes(q)).slice(0, 4),
      payments: payments.filter(p => p.description.toLowerCase().includes(q)).slice(0, 4),
    };
  }, [query, budgets, payments]);

  const hasSearchResults = searchResults.budgets.length > 0 || searchResults.payments.length > 0;
  const showDropdown     = searchOpen && query.trim().length >= 2;

  const handleSearchSelect = (type, item) => {
    setQuery('');
    setSearchOpen(false);
    const encoded = encodeURIComponent(item.description);
    if (type === 'budget')  navigate(`/budget?q=${encoded}`);
    if (type === 'payment') navigate(`/expense?q=${encoded}`);
  };

  // ── Notifications ─────────────────────────────────────────────────────────
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef                  = useRef(null);

  const paidBudgetIds = useMemo(() => new Set(payments.map((p) => p.budgetId)), [payments]);
  const unpaidBudgets = budgets.filter((b) => !paidBudgetIds.has(b.id));

  const dueToday    = unpaidBudgets.filter(b => b.date === todayStr);
  const dueTomorrow = unpaidBudgets.filter(b => b.date === tomorrowStr);
  const recentPaid  = payments.slice(0, 6);
  const notifCount  = dueToday.length + dueTomorrow.length;

  // ── Click-outside closes both panels ─────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Escape key closes any open panel ─────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setNotifOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <header
      style={{
        height: '64px',
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        gap: '10px',
      }}
    >
      {/* ── LEFT ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
        {/* Sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          style={{
            width: '34px', height: '34px', borderRadius: '8px',
            border: '1px solid #e2e8f0', background: '#f8fafc',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#64748b', transition: 'all 0.15s', flexShrink: 0,
          }}
        >
          {sidebarOpen ? <X size={15} /> : <Menu size={15} />}
        </button>

        {/* Page title — hide sub on mobile */}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: isMobile ? '120px' : '240px' }}>
            {meta.title}
          </div>
          {!isMobile && (
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px', whiteSpace: 'nowrap' }}>
              {meta.sub}
            </div>
          )}
        </div>
      </div>

      {/* ── CENTER: Search ───────────────────────────────────────────── */}
      <div
        ref={searchRef}
        style={{ flex: 1, maxWidth: isMobile ? '160px' : '320px', position: 'relative' }}
      >
        <Search
          size={14}
          style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none', zIndex: 1 }}
        />
        <input
          type="text"
          value={query}
          placeholder={isMobile ? 'Search...' : 'Search expenses, budgets...'}
          onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
          onFocus={() => setSearchOpen(true)}
          style={{
            width: '100%',
            paddingLeft: '34px',
            paddingRight: query ? '32px' : '12px',
            paddingTop: '7px',
            paddingBottom: '7px',
            background: searchOpen ? '#ffffff' : '#f8fafc',
            border: `1px solid ${searchOpen ? '#6366f1' : '#e2e8f0'}`,
            boxShadow: searchOpen ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#0f172a',
            outline: 'none',
            fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}
        />
        {/* Clear button */}
        {query && (
          <button
            onClick={() => { setQuery(''); setSearchOpen(false); }}
            style={{
              position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8',
              display: 'flex', alignItems: 'center', padding: '2px',
            }}
          >
            <X size={13} />
          </button>
        )}

        {/* ── Search Dropdown ───────────────────────────────── */}
        {showDropdown && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              minWidth: '300px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
              zIndex: 100,
              overflow: 'hidden',
              animation: 'slideUp 0.15s ease',
            }}
          >
            {!hasSearchResults ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                <Inbox size={28} color="#cbd5e1" style={{ margin: '0 auto 8px', display: 'block' }} />
                No results for "{query}"
              </div>
            ) : (
              <>
                {/* Budget results */}
                {searchResults.budgets.length > 0 && (
                  <div>
                    <div style={{ padding: '9px 14px 5px', fontSize: '10.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                      <Wallet size={11} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                      Budgets
                    </div>
                    {searchResults.budgets.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => handleSearchSelect('budget', b)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 14px', background: 'none', border: 'none', borderBottom: '1px solid #f1f5f9',
                          cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s', fontFamily: 'inherit',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a' }}>{b.description}</div>
                          <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>{formatDate(b.date)} · {b.type}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#4f46e5' }}>{formatCurrency(b.amount)}</span>
                          <ChevronRight size={13} color="#94a3b8" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Payment results */}
                {searchResults.payments.length > 0 && (
                  <div>
                    <div style={{ padding: '9px 14px 5px', fontSize: '10.5px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                      <Receipt size={11} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                      Payments
                    </div>
                    {searchResults.payments.map((p) => {
                      const cfg = STATUS_CONFIG[p.status];
                      return (
                        <button
                          key={p.id}
                          onClick={() => handleSearchSelect('payment', p)}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '10px 14px', background: 'none', border: 'none', borderBottom: '1px solid #f1f5f9',
                            cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s', fontFamily: 'inherit',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                        >
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a' }}>{p.description}</div>
                            <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '2px' }}>{formatDate(p.date)} · {p.type}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            <span className={`badge ${cfg?.badge ?? 'badge-info'}`}>{cfg?.label ?? p.status}</span>
                            <ChevronRight size={13} color="#94a3b8" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Footer hint */}
                <div style={{ padding: '8px 14px', fontSize: '11px', color: '#94a3b8', background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
                  Click a result to navigate to its page
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── RIGHT ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>

        {/* Balance pill — hide on small mobile */}
        {!isMobile && (
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: isPositive ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${isPositive ? '#bbf7d0' : '#fecaca'}`,
              borderRadius: '20px', padding: '5px 11px',
              fontSize: '12px', fontWeight: 600,
              color: isPositive ? '#16a34a' : '#dc2626',
            }}
          >
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span style={{ fontSize: '10px', fontWeight: 500, opacity: 0.8 }}>Bal</span>
            {formatCurrency(stats.remainingBalance)}
          </div>
        )}

        {/* ── Bell / Notification ─────────────────────────────────── */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            style={{
              width: '36px', height: '36px', borderRadius: '8px',
              border: `1px solid ${notifOpen ? '#c7d2fe' : '#e2e8f0'}`,
              background: notifOpen ? '#eef2ff' : '#f8fafc',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: notifOpen ? '#4f46e5' : '#64748b',
              position: 'relative', transition: 'all 0.15s',
            }}
            title="Notifications"
          >
            <Bell size={15} />
            {/* Live count badge */}
            {notifCount > 0 && (
              <span
                style={{
                  position: 'absolute', top: '-5px', right: '-5px',
                  background: '#dc2626', color: '#fff',
                  borderRadius: '10px', minWidth: '17px', height: '17px',
                  fontSize: '10px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid #ffffff', padding: '0 3px',
                }}
              >
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </button>

          {/* ── Notification Panel ───────────────────────────────── */}
          {notifOpen && (
            <div
              style={{
                position: 'fixed',
                top: '70px',
                right: isMobile ? '8px' : '16px',
                width: isMobile ? 'calc(100vw - 16px)' : '380px',
                maxHeight: '520px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                boxShadow: '0 12px 40px rgba(0,0,0,0.13)',
                zIndex: 100,
                overflow: 'hidden',
                animation: 'scaleIn 0.18s ease',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Panel header */}
              <div
                style={{
                  padding: '14px 16px 12px',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#ffffff',
                  flexShrink: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BellRing size={15} color="#4f46e5" />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    Notifications
                  </span>
                  {notifCount > 0 && (
                    <span style={{ background: '#4f46e5', color: '#fff', borderRadius: '20px', padding: '1px 7px', fontSize: '11px', fontWeight: 700 }}>
                      {notifCount} upcoming
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setNotifOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: '2px' }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Scrollable body */}
              <div style={{ overflowY: 'auto', flex: 1 }}>

                {/* ── SECTION: Upcoming Today ───────────────────────── */}
                {dueToday.length > 0 && (
                  <Section
                    title="Due Today"
                    color="#dc2626"
                    bg="#fef2f2"
                    Icon={AlertTriangle}
                  >
                    {dueToday.map((b) => (
                      <NotifItem
                        key={b.id}
                        title={b.description}
                        sub={`${b.type} · ${formatCurrency(b.amount)}`}
                        badge="⚡ Today"
                        badgeBg="#fef2f2"
                        badgeColor="#dc2626"
                        badgeBorder="#fecaca"
                        iconColor="#dc2626"
                        iconBg="#fef2f2"
                        Icon={AlertTriangle}
                        onAction={() => { setNotifOpen(false); navigate('/payment'); }}
                        actionLabel="Pay Now"
                      />
                    ))}
                  </Section>
                )}

                {/* ── SECTION: Upcoming Tomorrow ────────────────────── */}
                {dueTomorrow.length > 0 && (
                  <Section
                    title="Due Tomorrow"
                    color="#d97706"
                    bg="#fffbeb"
                    Icon={Clock}
                  >
                    {dueTomorrow.map((b) => (
                      <NotifItem
                        key={b.id}
                        title={b.description}
                        sub={`${b.type} · ${formatCurrency(b.amount)}`}
                        badge="📅 Tomorrow"
                        badgeBg="#fffbeb"
                        badgeColor="#d97706"
                        badgeBorder="#fde68a"
                        iconColor="#d97706"
                        iconBg="#fffbeb"
                        Icon={Clock}
                        onAction={() => { setNotifOpen(false); navigate('/payment'); }}
                        actionLabel="View"
                      />
                    ))}
                  </Section>
                )}

                {/* ── SECTION: Recent Payments ──────────────────────── */}
                <Section title="Recent Payments" color="#4f46e5" bg="#eef2ff" Icon={Receipt}>
                  {recentPaid.length === 0 ? (
                    <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                      No payments recorded yet.
                    </div>
                  ) : (
                    recentPaid.map((p) => {
                      const cfg = STATUS_CONFIG[p.status] ?? {};
                      const colors = {
                        paid:     { iconBg: '#f0fdf4', icon: '#16a34a' },
                        exceeded: { iconBg: '#fef2f2', icon: '#dc2626' },
                        partial:  { iconBg: '#fffbeb', icon: '#d97706' },
                      };
                      const c = colors[p.status] ?? { iconBg: '#eef2ff', icon: '#4f46e5' };
                      return (
                        <NotifItem
                          key={p.id}
                          title={p.description}
                          sub={`${formatDate(p.date)} · Paid ${formatCurrency(p.paidAmount)}`}
                          badge={cfg.label}
                          badgeBg={c.iconBg}
                          badgeColor={c.icon}
                          badgeBorder="transparent"
                          iconColor={c.icon}
                          iconBg={c.iconBg}
                          Icon={cfg.Icon ?? CheckCircle2}
                          onAction={() => { setNotifOpen(false); navigate('/expense'); }}
                          actionLabel="View"
                        />
                      );
                    })
                  )}
                </Section>

                {/* No upcoming and no payments */}
                {dueToday.length === 0 && dueTomorrow.length === 0 && recentPaid.length === 0 && (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    <Inbox size={36} color="#cbd5e1" style={{ margin: '0 auto 10px', display: 'block' }} />
                    <div style={{ fontSize: '13.5px', fontWeight: 500 }}>All caught up!</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>No upcoming payments or recent activity.</div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: '10px 16px',
                  borderTop: '1px solid #f1f5f9',
                  background: '#f8fafc',
                  flexShrink: 0,
                }}
              >
                <button
                  onClick={() => { setNotifOpen(false); navigate('/report'); }}
                  style={{
                    width: '100%', padding: '8px', borderRadius: '8px',
                    border: '1px solid #e2e8f0', background: '#ffffff',
                    fontSize: '12.5px', fontWeight: 600, color: '#4f46e5',
                    cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#eef2ff')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                >
                  View Full Report <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '4px 8px 4px 4px',
            borderRadius: '10px', border: '1px solid #e2e8f0',
            background: '#f8fafc', cursor: 'pointer', transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#f8fafc')}
        >
          <div
            style={{
              width: '28px', height: '28px', borderRadius: '7px',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: 700, color: 'white', flexShrink: 0,
            }}
          >
            E
          </div>
          {!isMobile && (
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>
              Admin
            </span>
          )}
        </div>
      </div>
    </header>
  );
};

// ─── Section wrapper ───────────────────────────────────────────────────────────
const Section = ({ title, color, bg, Icon, children }) => (
  <div>
    <div
      style={{
        padding: '9px 16px 6px',
        fontSize: '10.5px',
        fontWeight: 700,
        color,
        textTransform: 'uppercase',
        letterSpacing: '0.6px',
        background: bg,
        borderBottom: '1px solid #f1f5f9',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
      }}
    >
      <Icon size={11} />
      {title}
    </div>
    {children}
  </div>
);

// ─── Single notification item ──────────────────────────────────────────────────
const NotifItem = ({
  title, sub, badge, badgeBg, badgeColor, badgeBorder,
  iconColor, iconBg, Icon, onAction, actionLabel,
}) => (
  <div
    style={{
      padding: '11px 16px',
      borderBottom: '1px solid #f8fafc',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      transition: 'background 0.12s',
    }}
    onMouseEnter={(e) => (e.currentTarget.style.background = '#fafafa')}
    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
  >
    {/* Icon */}
    <div
      style={{
        width: '32px', height: '32px', minWidth: '32px',
        background: iconBg, borderRadius: '8px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Icon size={14} color={iconColor} />
    </div>

    {/* Text */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {title}
      </div>
      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>{sub}</div>
      {badge && (
        <span
          style={{
            display: 'inline-flex', marginTop: '4px',
            background: badgeBg, color: badgeColor,
            border: `1px solid ${badgeBorder}`,
            borderRadius: '20px', padding: '1px 7px',
            fontSize: '10.5px', fontWeight: 700,
          }}
        >
          {badge}
        </span>
      )}
    </div>

    {/* Action link */}
    <button
      onClick={onAction}
      style={{
        flexShrink: 0, fontSize: '11.5px', fontWeight: 600, color: '#4f46e5',
        background: '#eef2ff', border: '1px solid #c7d2fe',
        borderRadius: '6px', padding: '4px 9px',
        cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
        transition: 'background 0.12s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#e0e7ff')}
      onMouseLeave={(e) => (e.currentTarget.style.background = '#eef2ff')}
    >
      {actionLabel}
    </button>
  </div>
);

export default Navbar;
