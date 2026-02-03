import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// Tailwind CSS used - Layout.css removed

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/profile', label: 'Profile', icon: '👤' },
    { path: '/salary', label: 'Salary & Payslips', icon: '💰' },
  ];

  // Add Attendance for employees
  if (user?.role === 'employee') {
    menuItems.push({ path: '/attendance', label: 'Attendance', icon: '🕐' });
  }

  // Add management menus
  if (user?.role === 'admin') {
    menuItems.push({ path: '/employees', label: 'Employees', icon: '👥' });
    menuItems.push({ path: '/pending-approvals', label: 'Pending Approvals', icon: '⏳' });
  } else if (user?.role === 'hr' || user?.role === 'subadmin') {
    menuItems.push({ path: '/employees', label: 'Employees', icon: '👥' });
    menuItems.push({ path: '/pending-approvals', label: 'Pending Approvals', icon: '⏳' });
  } else if (user?.role === 'manager') {
    menuItems.push({ path: '/employees', label: 'Team', icon: '👥' });
  }

  return (
    <div className="flex min-h-screen bg-dark-bg-primary">
      <nav className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-dark-bg-secondary border-r border-dark-border flex flex-col transition-all duration-300 fixed h-screen z-50`}>
        <div className="p-6 flex justify-between items-center border-b border-dark-border">
          {sidebarOpen && <h2 className="text-blue-500 text-2xl font-bold">Velomynt HRMS</h2>}
          <button
            className="bg-transparent border-none text-dark-text-primary cursor-pointer text-xl p-2 rounded hover:bg-dark-bg-tertiary transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        <ul className="list-none p-4 flex-1 overflow-y-auto">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center p-4 text-dark-text-secondary no-underline transition-all border-l-4 ${
                  isActive(item.path)
                    ? 'bg-dark-bg-tertiary text-blue-500 border-blue-500'
                    : 'border-transparent hover:bg-dark-bg-tertiary hover:text-dark-text-primary'
                }`}
              >
                <span className="text-xl mr-4 min-w-[24px]">{item.icon}</span>
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
        <div className="p-4 border-t border-dark-border">
          <div className="flex items-center mb-4 p-2">
            <span className="text-2xl mr-2">👤</span>
            {sidebarOpen && (
              <div className="flex-1">
                <p className="font-semibold text-dark-text-primary text-sm">{user?.name}</p>
                <p className="text-xs text-dark-text-secondary">{user?.role?.toUpperCase()}</p>
              </div>
            )}
          </div>
          <button
            className="w-full p-3 bg-red-500 text-white border-none rounded-md cursor-pointer font-semibold transition-colors hover:bg-red-600"
            onClick={handleLogout}
          >
            {sidebarOpen ? 'Logout' : '🚪'}
          </button>
        </div>
      </nav>
      <main className={`flex-1 p-8 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'} min-h-screen`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;

