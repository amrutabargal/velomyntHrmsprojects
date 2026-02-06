import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// Material Icons
import PeopleIcon from '@mui/icons-material/People';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PaymentsIcon from '@mui/icons-material/Payments';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DescriptionIcon from '@mui/icons-material/Description';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import GroupsIcon from '@mui/icons-material/Groups';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import AssessmentIcon from '@mui/icons-material/Assessment';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalSalaries: 0,
    totalAmount: 0,
    pendingPayslips: 0,
    pendingApprovals: 0,
    activeEmployees: 0,
  });
  const [loading, setLoading] = useState(true);
  const [salaryData, setSalaryData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDashboardData = async () => {
    try {
      if (user?.role === 'admin' || user?.role === 'hr' || user?.role === 'subadmin') {
        const [employeesRes, salaryRes, pendingRes] = await Promise.all([
          axios.get(`${API_URL}/employees`),
          axios.get(`${API_URL}/salary`),
          axios.get(`${API_URL}/employees/pending`).catch(() => ({ data: [] })),
        ]);

        const totalAmount = salaryRes.data.reduce((sum, salary) => sum + salary.net_salary, 0);
        const pendingPayslips = salaryRes.data.filter((salary) => !salary.payslip_pdf).length;
        const activeEmployees = employeesRes.data.filter((emp) => emp.status === 'active').length;

        setStats({
          totalEmployees: employeesRes.data.length,
          totalSalaries: salaryRes.data.length,
          totalAmount,
          pendingPayslips,
          pendingApprovals: pendingRes.data.length,
          activeEmployees,
        });

        processSalaryDataForCharts(salaryRes.data);
        generateRecentActivities(employeesRes.data, salaryRes.data);
      } else {
        const salaryRes = await axios.get(`${API_URL}/salary`);
        setStats({
          totalSalaries: salaryRes.data.length,
          totalAmount: salaryRes.data.reduce((sum, salary) => sum + salary.net_salary, 0),
        });
        processSalaryDataForCharts(salaryRes.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processSalaryDataForCharts = (salaries) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = months.map((month, index) => {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
      const monthSalaries = salaries.filter(s => monthNames.indexOf(s.month) === index);
      const total = monthSalaries.reduce((sum, s) => sum + s.net_salary, 0);
      const count = monthSalaries.length;
      return {
        name: month,
        salary: total,
        employees: count,
        average: count > 0 ? Math.round(total / count) : 0
      };
    });
    setSalaryData(monthlyData);
  };

  const generateRecentActivities = (employees, salaries) => {
    const activities = [];
    employees.slice(0, 3).forEach(emp => {
      activities.push({
        type: 'employee',
        icon: <PersonAddIcon />,
        title: `New employee: ${emp.name}`,
        subtitle: emp.department || 'No department',
        time: 'Recently added',
        color: 'text-primary-600'
      });
    });
    salaries.slice(0, 2).forEach(sal => {
      activities.push({
        type: 'salary',
        icon: <PaymentsIcon />,
        title: `Salary processed`,
        subtitle: `₹${sal.net_salary?.toLocaleString()} - ${sal.month}`,
        time: 'Recently',
        color: 'text-emerald-600'
      });
    });
    setRecentActivities(activities.slice(0, 5));
  };

  const departmentData = [
    { name: 'Engineering', value: 35, color: '#3b82f6' },
    { name: 'HR', value: 15, color: '#10b981' },
    { name: 'Finance', value: 20, color: '#f59e0b' },
    { name: 'Marketing', value: 18, color: '#ef4444' },
    { name: 'Operations', value: 12, color: '#8b5cf6' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'hr' || user?.role === 'subadmin';

  return (
    <div className="max-w-7xl mx-auto pb-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-text-primary text-3xl font-bold mb-2">
              Welcome back, {user?.name}! 👋
        </h1>
            <p className="text-text-secondary flex items-center gap-2">
              <CalendarTodayIcon fontSize="small" className="text-primary-600" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-surface-primary rounded-xl border border-border-light shadow-card">
            <AccessTimeIcon className="text-primary-600" />
            <span className="text-text-primary font-medium">
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {isAdmin && (
          <div className="bg-surface-primary rounded-2xl p-6 border border-border-light shadow-card hover:shadow-soft transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center">
                <PeopleIcon className="text-primary-600" fontSize="large" />
              </div>
              <div className="flex items-center gap-1 text-sm bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-medium">
                <TrendingUpIcon fontSize="small" />
                <span>+12%</span>
            </div>
            </div>
            <h3 className="text-text-secondary text-sm font-medium mb-1">Total Employees</h3>
            <p className="text-3xl font-bold text-text-primary">{stats.totalEmployees}</p>
            <p className="text-text-muted text-xs mt-2">{stats.activeEmployees} active employees</p>
          </div>
        )}

        <div className="bg-surface-primary rounded-2xl p-6 border border-border-light shadow-card hover:shadow-soft transition-all hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center">
              <AccountBalanceWalletIcon className="text-emerald-600" fontSize="large" />
            </div>
            <div className="flex items-center gap-1 text-sm bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-medium">
              <TrendingUpIcon fontSize="small" />
              <span>+8%</span>
          </div>
          </div>
          <h3 className="text-text-secondary text-sm font-medium mb-1">Total Payroll</h3>
          <p className="text-3xl font-bold text-text-primary">₹{stats.totalAmount.toLocaleString()}</p>
          <p className="text-text-muted text-xs mt-2">This month's total</p>
        </div>

        <div className="bg-surface-primary rounded-2xl p-6 border border-border-light shadow-card hover:shadow-soft transition-all hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
              <ReceiptLongIcon className="text-amber-600" fontSize="large" />
            </div>
            <div className="flex items-center gap-1 text-sm bg-primary-50 text-primary-700 px-3 py-1 rounded-full font-medium">
              <CheckCircleIcon fontSize="small" />
              <span>Active</span>
          </div>
          </div>
          <h3 className="text-text-secondary text-sm font-medium mb-1">Salary Records</h3>
          <p className="text-3xl font-bold text-text-primary">{stats.totalSalaries}</p>
          <p className="text-text-muted text-xs mt-2">All time records</p>
        </div>

        {isAdmin && (
          <div className="bg-surface-primary rounded-2xl p-6 border border-border-light shadow-card hover:shadow-soft transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-rose-100 rounded-xl flex items-center justify-center">
                <PendingActionsIcon className="text-rose-600" fontSize="large" />
              </div>
              <div className="flex items-center gap-1 text-sm bg-amber-50 text-amber-700 px-3 py-1 rounded-full font-medium">
                <HourglassEmptyIcon fontSize="small" />
                <span>Pending</span>
            </div>
            </div>
            <h3 className="text-text-secondary text-sm font-medium mb-1">Pending Actions</h3>
            <p className="text-3xl font-bold text-text-primary">{stats.pendingPayslips + stats.pendingApprovals}</p>
            <p className="text-text-muted text-xs mt-2">{stats.pendingApprovals} approvals, {stats.pendingPayslips} payslips</p>
          </div>
        )}
      </div>

      {/* Charts Section */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Salary Trend Chart */}
          <div className="lg:col-span-2 bg-surface-primary border border-border-light rounded-2xl p-6 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-text-primary text-lg font-semibold flex items-center gap-2">
                  <AssessmentIcon className="text-primary-600" />
                  Salary Trends
                </h3>
                <p className="text-text-secondary text-sm">Monthly salary distribution</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-primary-500 rounded-full"></span>
                  <span className="text-text-secondary">Salary</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                  <span className="text-text-secondary">Average</span>
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salaryData}>
                <defs>
                  <linearGradient id="colorSalary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAverage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `₹${(value/1000)}k`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, '']}
                />
                <Area type="monotone" dataKey="salary" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSalary)" strokeWidth={2} />
                <Area type="monotone" dataKey="average" stroke="#10b981" fillOpacity={1} fill="url(#colorAverage)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Department Distribution */}
          <div className="bg-surface-primary border border-border-light rounded-2xl p-6 shadow-card">
            <div className="mb-6">
              <h3 className="text-text-primary text-lg font-semibold flex items-center gap-2">
                <GroupsIcon className="text-purple-600" />
                Department Distribution
              </h3>
              <p className="text-text-secondary text-sm">Employee breakdown</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {departmentData.map((dept, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color }}></span>
                  <span className="text-text-secondary">{dept.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bar Chart */}
      {isAdmin && (
        <div className="bg-surface-primary border border-border-light rounded-2xl p-6 mb-8 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-text-primary text-lg font-semibold flex items-center gap-2">
                <BusinessCenterIcon className="text-amber-600" />
                Monthly Salary Comparison
              </h3>
              <p className="text-text-secondary text-sm">Compare salary distribution across months</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={salaryData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(value) => `₹${(value/1000)}k`} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                formatter={(value) => [`₹${value.toLocaleString()}`, 'Salary']}
              />
              <Bar dataKey="salary" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                {salaryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <h2 className="text-text-primary text-xl font-bold mb-4 flex items-center gap-2">
            <NotificationsActiveIcon className="text-primary-600" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {isAdmin && (
              <>
                <button
                  onClick={() => navigate('/employees')}
                  className="bg-surface-primary border border-border-light rounded-xl p-5 text-center cursor-pointer hover:border-primary-400 hover:-translate-y-1 transition-all group shadow-card hover:shadow-soft"
                >
                  <div className="w-12 h-12 mx-auto mb-3 bg-primary-100 rounded-xl flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                    <PersonAddIcon className="text-primary-600" fontSize="large" />
                  </div>
                  <h4 className="text-text-primary text-sm font-semibold mb-1">Add Employee</h4>
                  <p className="text-text-secondary text-xs">Register new</p>
                </button>
                <button
                  onClick={() => navigate('/salary')}
                  className="bg-surface-primary border border-border-light rounded-xl p-5 text-center cursor-pointer hover:border-emerald-400 hover:-translate-y-1 transition-all group shadow-card hover:shadow-soft"
                >
                  <div className="w-12 h-12 mx-auto mb-3 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                    <PaymentsIcon className="text-emerald-600" fontSize="large" />
                  </div>
                  <h4 className="text-text-primary text-sm font-semibold mb-1">Manage Salary</h4>
                  <p className="text-text-secondary text-xs">Create records</p>
                </button>
                <button
                  onClick={() => navigate('/pending-approvals')}
                  className="bg-surface-primary border border-border-light rounded-xl p-5 text-center cursor-pointer hover:border-amber-400 hover:-translate-y-1 transition-all group shadow-card hover:shadow-soft"
                >
                  <div className="w-12 h-12 mx-auto mb-3 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-200 transition-colors">
                    <PendingActionsIcon className="text-amber-600" fontSize="large" />
                  </div>
                  <h4 className="text-text-primary text-sm font-semibold mb-1">Approvals</h4>
                  <p className="text-text-secondary text-xs">{stats.pendingApprovals} pending</p>
                </button>
              </>
            )}
            <button
              onClick={() => navigate('/profile')}
              className="bg-surface-primary border border-border-light rounded-xl p-5 text-center cursor-pointer hover:border-purple-400 hover:-translate-y-1 transition-all group shadow-card hover:shadow-soft"
            >
              <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <AccountCircleIcon className="text-purple-600" fontSize="large" />
              </div>
              <h4 className="text-text-primary text-sm font-semibold mb-1">My Profile</h4>
              <p className="text-text-secondary text-xs">View details</p>
            </button>
            <button
              onClick={() => navigate('/salary')}
              className="bg-surface-primary border border-border-light rounded-xl p-5 text-center cursor-pointer hover:border-rose-400 hover:-translate-y-1 transition-all group shadow-card hover:shadow-soft"
            >
              <div className="w-12 h-12 mx-auto mb-3 bg-rose-100 rounded-xl flex items-center justify-center group-hover:bg-rose-200 transition-colors">
                <DescriptionIcon className="text-rose-600" fontSize="large" />
              </div>
              <h4 className="text-text-primary text-sm font-semibold mb-1">Payslips</h4>
              <p className="text-text-secondary text-xs">Download PDF</p>
            </button>
          </div>
        </div>

        {/* Recent Activities */}
        {isAdmin && (
          <div className="bg-surface-primary border border-border-light rounded-2xl p-6 shadow-card">
            <h3 className="text-text-primary text-lg font-semibold mb-4 flex items-center gap-2">
              <AccessTimeIcon className="text-primary-600" />
              Recent Activities
            </h3>
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-tertiary transition-colors">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-surface-tertiary ${activity.color}`}>
                      {activity.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-text-primary text-sm font-medium truncate">{activity.title}</p>
                      <p className="text-text-secondary text-xs">{activity.subtitle}</p>
                      <p className="text-text-muted text-xs mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <HourglassEmptyIcon className="text-text-muted text-4xl mb-2" />
                  <p className="text-text-secondary text-sm">No recent activities</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
