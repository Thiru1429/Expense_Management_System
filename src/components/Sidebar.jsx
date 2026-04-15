import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  CreditCard,
  Receipt,
  BarChart3,
  Zap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const navItems = [
  { to: '/',           icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/budget',     icon: Wallet,          label: 'Budget' },
  { to: '/projection', icon: TrendingUp,      label: 'Projection' },
  { to: '/payment',    icon: CreditCard,      label: 'Payment' },
  { to: '/expense',    icon: Receipt,         label: 'Expenses' },
  { to: '/report',     icon: BarChart3,       label: 'Reports' },
];

const Sidebar = ({ isOpen, isMobile, onToggle }) => {
  const width = isOpen ? 240 : 64;

  const baseStyle = {
    width: `${width}px`,
    minHeight: '100vh',
    background: '#ffffff',
    borderRight: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: isMobile && !isOpen ? '-240px' : 0,
    top: 0,
    bottom: 0,
    zIndex: 30,
    transition: 'width 0.25s ease, left 0.25s ease',
    overflow: 'hidden',
    boxShadow: isMobile && isOpen ? '4px 0 20px rgba(0,0,0,0.1)' : 'none',
  };

  return (
    <aside style={baseStyle}>
      {/* Logo */}
      <div
        style={{
          padding: isOpen ? '20px 16px 16px' : '20px 12px 16px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isOpen ? 'space-between' : 'center',
          gap: '8px',
          minHeight: '65px',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              minWidth: '34px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(79,70,229,0.3)',
            }}
          >
            <Zap size={17} color="white" />
          </div>
          {isOpen && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>
                Expense
              </div>
              <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '1px', whiteSpace: 'nowrap' }}>
                Management Suite
              </div>
            </div>
          )}
        </div>

        {/* Collapse toggle — desktop only */}
        {!isMobile && (
          <button
            onClick={onToggle}
            style={{
              width: '24px',
              height: '24px',
              minWidth: '24px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
            title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isOpen ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
          </button>
        )}
      </div>

      {/* Nav */}
      <nav
        style={{
          flex: 1,
          padding: '12px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {isOpen && (
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#cbd5e1',
              letterSpacing: '0.9px',
              padding: '4px 10px 8px',
              textTransform: 'uppercase',
            }}
          >
            Main Menu
          </div>
        )}

        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={!isOpen ? label : undefined}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            style={{
              justifyContent: isOpen ? 'flex-start' : 'center',
              padding: isOpen ? '9px 12px' : '9px',
            }}
          >
            <Icon size={16} style={{ flexShrink: 0 }} />
            {isOpen && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Profile Footer */}
      <div
        style={{
          padding: isOpen ? '14px 12px' : '14px 8px',
          borderTop: '1px solid #f1f5f9',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: isOpen ? '8px 10px' : '8px',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background 0.15s',
            justifyContent: isOpen ? 'flex-start' : 'center',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          {/* Avatar */}
          <div
            style={{
              width: '32px',
              height: '32px',
              minWidth: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 700,
              color: 'white',
              boxShadow: '0 2px 6px rgba(79,70,229,0.25)',
            }}
          >
            E
          </div>
          {isOpen && (
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Admin User
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px', whiteSpace: 'nowrap' }}>
                Finance Manager
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
