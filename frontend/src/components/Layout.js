import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Material Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonIcon from '@mui/icons-material/Person';
import PaymentsIcon from '@mui/icons-material/Payments';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupsIcon from '@mui/icons-material/Groups';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const API_URL =
    typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'http://localhost:5001/api'
      : process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    let isMounted = true;

    const fetchUnreadCount = async () => {
      try {
        if (!user) {
          if (isMounted) setUnreadCount(0);
          return;
        }
        const res = await axios.get(`${API_URL}/notifications/unread-count`);
        if (isMounted) {
          setUnreadCount(Number(res.data?.count || 0));
        }
      } catch (_error) {
        if (isMounted) setUnreadCount(0);
      }
    };

    fetchUnreadCount();
    const intervalId = setInterval(fetchUnreadCount, 30000);
    const handleNotificationRefresh = () => fetchUnreadCount();
    window.addEventListener('notifications:updated', handleNotificationRefresh);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener('notifications:updated', handleNotificationRefresh);
    };
  }, [API_URL, user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/profile', label: 'Profile', icon: <PersonIcon /> },
    { path: '/salary', label: 'Salary & Payslips', icon: <PaymentsIcon /> },
  ];

  // Attendance page for all roles except admin
  if (user && user.role !== 'admin') {
    menuItems.push({ path: '/attendance', label: 'Attendance', icon: <AccessTimeIcon /> });
  }

  // Time Tracker available for logged in users
  if (user) {
    menuItems.push({ path: '/time', label: 'Time Tracker', icon: <AccessTimeIcon /> });
  }

  // Leave available for employees and managers/admin/hr/subadmin
  if (user) {
    menuItems.push({ path: '/leave', label: 'Leave', icon: <PendingActionsIcon /> });
  }

  // Timesheet available for employees and approvers
  if (user) {
    menuItems.push({ path: '/timesheet', label: 'Timesheet', icon: <AccessTimeIcon /> });
  }

  // Calendar for all users
  if (user) {
    menuItems.push({ path: '/calendar', label: 'Calendar', icon: <AccessTimeIcon /> });
    menuItems.push({
      path: '/notifications',
      label: 'Notifications',
      icon: <NotificationsIcon />,
      badge: unreadCount > 0 ? unreadCount : null,
    });
  }

  // Add management menus
  if (user?.role === 'admin') {
    menuItems.push({ path: '/employees', label: 'Employees', icon: <GroupsIcon /> });
    menuItems.push({ path: '/pending-approvals', label: 'Pending Approvals', icon: <PendingActionsIcon /> });
  } else if (user?.role === 'subadmin') {
    menuItems.push({ path: '/employees', label: 'Employees', icon: <GroupsIcon /> });
    menuItems.push({ path: '/pending-approvals', label: 'Pending Approvals', icon: <PendingActionsIcon /> });
  } else if (user?.role === 'hr') {
    menuItems.push({ path: '/employees', label: 'Employees', icon: <GroupsIcon /> });
  } else if (user?.role === 'manager') {
    menuItems.push({ path: '/employees', label: 'Team', icon: <GroupsIcon /> });
  }

  return (
    <div className="flex min-h-screen bg-surface-secondary">
      {/* Sidebar */}
      <nav className={`${sidebarOpen ? 'w-72' : 'w-20'} bg-surface-primary border-r border-border-light flex flex-col transition-all duration-300 fixed h-screen z-50 shadow-soft`}>
        {/* Logo */}
        <div className="p-6 flex justify-between items-center border-b border-border-light">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <div>
                <h2 className="text-primary-700 text-lg font-bold">Velomynt</h2>
                <p className="text-text-muted text-xs">HRMS Portal</p>
              </div>
            </div>
          )}
          <button
            className="p-2 text-text-secondary hover:bg-surface-tertiary rounded-lg transition-colors"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <MenuOpenIcon /> : <MenuIcon />}
          </button>
        </div>

        {/* Menu Items */}
        <ul className="list-none p-4 flex-1 overflow-y-auto space-y-1">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl no-underline transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-primary-50 text-primary-700 font-semibold shadow-sm'
                    : 'text-text-secondary hover:bg-surface-tertiary hover:text-text-primary'
                }`}
              >
                <span className={`${isActive(item.path) ? 'text-primary-600' : 'text-text-muted'}`}>
                  {item.icon}
                </span>
                {sidebarOpen && <span>{item.label}</span>}
                {!!item.badge && (
                  <span
                    className={`ml-auto min-w-[22px] h-[22px] px-1 rounded-full text-[11px] font-semibold flex items-center justify-center ${
                      isActive(item.path)
                        ? 'bg-primary-600 text-white'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>

        {/* User Section */}
        <div className="p-4 border-t border-border-light">
          <div className="flex items-center gap-3 mb-4 p-3 bg-surface-tertiary rounded-xl">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <AccountCircleIcon className="text-primary-600" />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-text-primary text-sm truncate">{user?.name}</p>
                <p className="text-xs text-primary-600 font-medium">{user?.role?.toUpperCase()}</p>
              </div>
            )}
          </div>
          <button
            className="w-full p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl cursor-pointer font-semibold transition-all hover:bg-red-100 flex items-center justify-center gap-2"
            onClick={handleLogout}
          >
            <LogoutIcon fontSize="small" />
            {sidebarOpen && 'Logout'}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-72' : 'ml-20'} min-h-screen`}>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
