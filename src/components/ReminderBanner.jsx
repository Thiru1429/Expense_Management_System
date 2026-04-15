import { useState, useEffect, useMemo } from 'react';
import { useExpense } from '../context/ExpenseContext';
import { formatCurrency } from '../utils/helpers';
import {
  Bell,
  X,
  Calendar,
  Clock,
  AlertCircle,
  ChevronRight,
  BellRing,
} from 'lucide-react';
import { format, addDays, parseISO, isValid } from 'date-fns';
import { useNavigate } from 'react-router-dom';

// ─── localStorage helpers ──────────────────────────────────────────────────────
const STORAGE_KEY = 'em_dismissed_reminders';

const loadDismissed = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw); // { [reminderKey]: 'yyyy-MM-dd' } → date it was dismissed
  } catch {
    return {};
  }
};

const saveDismissed = (map) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    console.error('localStorage write error');
  }
};

// ─── Build a stable reminder key ──────────────────────────────────────────────
const reminderKey = (budgetId, label) => `${label}::${budgetId}`;

const ReminderBanner = () => {
  const { budgets, payments } = useExpense();
  const navigate = useNavigate();

  // Build a set of budget IDs that are already paid — reminders for these must not show
  const paidBudgetIds = useMemo(() => new Set(payments.map((p) => p.budgetId)), [payments]);

  const todayStr    = format(new Date(), 'yyyy-MM-dd');
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  // Load which reminders have been dismissed today
  const [dismissed, setDismissed] = useState(() => {
    const stored = loadDismissed();
    // Auto-clear any dismissal that happened on a day before today
    const cleaned = {};
    for (const [key, dismissedDate] of Object.entries(stored)) {
      if (dismissedDate === todayStr) cleaned[key] = dismissedDate;
    }
    if (Object.keys(cleaned).length !== Object.keys(stored).length) {
      saveDismissed(cleaned);
    }
    return cleaned;
  });

  // ─── Derive reminders from budgets ──────────────────────────────────────────
  const reminders = useMemo(() => {
    const list = [];
    const seen = new Set(); // prevent duplicate reminder cards

    budgets.forEach((b) => {
      // Skip budgets that have already been paid
      if (paidBudgetIds.has(b.id)) return;

      // Validate date string
      try {
        if (!isValid(parseISO(b.date))) return;
      } catch {
        return;
      }

      if (b.date === todayStr) {
        const key = `today::${b.id}`;
        if (seen.has(key)) return;
        seen.add(key);
        list.push({
          id:          reminderKey(b.id, 'today'),
          budgetId:    b.id,
          label:       'today',
          urgency:     'high',
          title:       'Payment Due Today',
          description: b.description,
          amount:      b.amount,
          type:        b.type,
          repeat:      b.repeat,
          dateStr:     todayStr,
        });
      } else if (b.date === tomorrowStr) {
        const key = `tomorrow::${b.id}`;
        if (seen.has(key)) return;
        seen.add(key);
        list.push({
          id:          reminderKey(b.id, 'tomorrow'),
          budgetId:    b.id,
          label:       'tomorrow',
          urgency:     'medium',
          title:       'Payment Due Tomorrow',
          description: b.description,
          amount:      b.amount,
          type:        b.type,
          repeat:      b.repeat,
          dateStr:     tomorrowStr,
        });
      } else if (b.repeat === 'monthly') {
        // Show a "coming soon" reminder for monthly recurring items due within 7 days
        const dueDate = parseISO(b.date);
        const daysUntil = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60 * 24));
        if (daysUntil > 1 && daysUntil <= 7) {
          const key = `soon::${b.id}`;
          if (seen.has(key)) return;
          seen.add(key);
          list.push({
            id:          reminderKey(b.id, 'soon'),
            budgetId:    b.id,
            label:       'soon',
            urgency:     'low',
            title:       `Monthly Payment in ${daysUntil} days`,
            description: b.description,
            amount:      b.amount,
            type:        b.type,
            repeat:      'monthly',
            dateStr:     b.date,
          });
        }
      }
    });

    return list;
  }, [budgets, todayStr, tomorrowStr, paidBudgetIds]);

  // ─── Active (not dismissed) ──────────────────────────────────────────────────
  const active = reminders.filter((r) => !dismissed[r.id]);

  if (active.length === 0) return null;

  const dismiss = (id) => {
    const next = { ...dismissed, [id]: todayStr };
    setDismissed(next);
    saveDismissed(next);
  };

  const dismissAll = () => {
    const next = { ...dismissed };
    active.forEach((r) => { next[r.id] = todayStr; });
    setDismissed(next);
    saveDismissed(next);
  };

  // ─── Style per urgency ───────────────────────────────────────────────────────
  const urgencyStyle = {
    high: {
      bg:         '#fef2f2',
      border:     '#fecaca',
      iconColor:  '#dc2626',
      badgeBg:    '#dc2626',
      badgeText:  '#fff',
      titleColor: '#991b1b',
      textColor:  '#7f1d1d',
      Icon:       AlertCircle,
    },
    medium: {
      bg:         '#fffbeb',
      border:     '#fde68a',
      iconColor:  '#d97706',
      badgeBg:    '#d97706',
      badgeText:  '#fff',
      titleColor: '#92400e',
      textColor:  '#78350f',
      Icon:       Clock,
    },
    low: {
      bg:         '#eff6ff',
      border:     '#bfdbfe',
      iconColor:  '#2563eb',
      badgeBg:    '#2563eb',
      badgeText:  '#fff',
      titleColor: '#1e3a8a',
      textColor:  '#1e40af',
      Icon:       Bell,
    },
  };

  return (
    <div
      style={{
        marginBottom: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      {/* ── Header strip ────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: 'linear-gradient(135deg, #eef2ff 0%, #faf5ff 100%)',
          border: '1px solid #c7d2fe',
          borderRadius: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BellRing size={16} color="#4f46e5" />
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#4f46e5' }}>
            Payment Reminders
          </span>
          <span
            style={{
              background: '#4f46e5',
              color: '#fff',
              borderRadius: '20px',
              padding: '1px 8px',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            {active.length}
          </span>
        </div>
        <button
          onClick={dismissAll}
          style={{
            fontSize: '11.5px',
            color: '#64748b',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 500,
            fontFamily: 'inherit',
            padding: '3px 8px',
            borderRadius: '6px',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
        >
          Dismiss all
        </button>
      </div>

      {/* ── Individual reminder cards ────────────────── */}
      {active.map((r) => {
        const s = urgencyStyle[r.urgency];
        const { Icon } = s;

        return (
          <div
            key={r.id}
            className="animate-slide-up"
            style={{
              background: s.bg,
              border: `1px solid ${s.border}`,
              borderRadius: '10px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              position: 'relative',
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: '34px',
                height: '34px',
                minWidth: '34px',
                borderRadius: '8px',
                background: '#ffffff',
                border: `1px solid ${s.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon size={16} color={s.iconColor} />
            </div>

            {/* Text content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: s.titleColor,
                  }}
                >
                  {r.title}
                </span>
                {/* Urgency badge */}
                <span
                  style={{
                    background: s.badgeBg,
                    color: s.badgeText,
                    fontSize: '10.5px',
                    fontWeight: 700,
                    borderRadius: '20px',
                    padding: '1px 8px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                  }}
                >
                  {r.label === 'today' ? '⚡ Today' : r.label === 'tomorrow' ? '📅 Tomorrow' : '🔔 Upcoming'}
                </span>
                {/* Recurring badge */}
                {r.repeat === 'monthly' && (
                  <span
                    style={{
                      background: '#f5f3ff',
                      color: '#7c3aed',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      borderRadius: '20px',
                      padding: '1px 8px',
                      border: '1px solid #ddd6fe',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                    }}
                  >
                    🔁 Recurring
                  </span>
                )}
                {/* Budget type badge */}
                <span
                  style={{
                    background: '#ffffff',
                    color: '#475569',
                    fontSize: '11px',
                    fontWeight: 600,
                    borderRadius: '20px',
                    padding: '1px 8px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  {r.type}
                </span>
              </div>

              <div
                style={{
                  marginTop: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    fontSize: '13px',
                    color: s.textColor,
                    fontWeight: 500,
                  }}
                >
                  {r.description}
                </span>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: s.titleColor,
                  }}
                >
                  {formatCurrency(r.amount)}
                </span>
              </div>

              <div
                style={{
                  marginTop: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '12px',
                  color: '#94a3b8',
                }}
              >
                <Calendar size={11} />
                <span>Due: {r.dateStr}</span>
              </div>
            </div>

            {/* Action: Go to payment */}
            <button
              onClick={() => navigate('/payment')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: s.iconColor,
                background: '#ffffff',
                border: `1px solid ${s.border}`,
                borderRadius: '7px',
                padding: '6px 12px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontFamily: 'inherit',
                flexShrink: 0,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = s.bg;
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Pay Now <ChevronRight size={12} />
            </button>

            {/* Dismiss X */}
            <button
              onClick={() => dismiss(r.id)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                width: '22px',
                height: '22px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '5px',
                transition: 'all 0.15s',
                padding: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0,0,0,0.06)';
                e.currentTarget.style.color = '#475569';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.color = '#94a3b8';
              }}
              title="Dismiss this reminder"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ReminderBanner;
