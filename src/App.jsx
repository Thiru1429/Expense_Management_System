import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ExpenseProvider } from './context/ExpenseContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Budget from './pages/Budget';
import Projection from './pages/Projection';
import Payment from './pages/Payment';
import Expense from './pages/Expense';
import Report from './pages/Report';
import ReminderBanner from './components/ReminderBanner';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile breakpoint
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const sidebarWidth = sidebarOpen ? 240 : 64;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Mobile overlay backdrop */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.4)',
            zIndex: 29,
            animation: 'fadeIn 0.2s ease',
          }}
        />
      )}

      <Sidebar
        isOpen={sidebarOpen}
        isMobile={isMobile}
        onToggle={() => setSidebarOpen((v) => !v)}
      />

      {/* Main content column */}
      <div
        style={{
          marginLeft: isMobile ? 0 : `${sidebarWidth}px`,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          transition: 'margin-left 0.25s ease',
          minWidth: 0,
        }}
      >
        <Navbar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          isMobile={isMobile}
        />
        <main
          style={{
            flex: 1,
            padding: '24px 28px 40px',
            maxWidth: '1440px',
            width: '100%',
            margin: '0 auto',
          }}
        >
          <ReminderBanner />
          {children}
        </main>
      </div>
    </div>
  );
};

const App = () => (
  <BrowserRouter>
    <ExpenseProvider>
      <Layout>
        <Routes>
          <Route path="/"           element={<Dashboard />} />
          <Route path="/budget"     element={<Budget />} />
          <Route path="/projection" element={<Projection />} />
          <Route path="/payment"    element={<Payment />} />
          <Route path="/expense"    element={<Expense />} />
          <Route path="/report"     element={<Report />} />
          <Route path="*"           element={<Dashboard />} />
        </Routes>
      </Layout>
    </ExpenseProvider>
  </BrowserRouter>
);

export default App;
