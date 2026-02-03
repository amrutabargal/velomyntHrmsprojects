import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
// Tailwind CSS used

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalSalaries: 0,
    totalAmount: 0,
    pendingPayslips: 0,
  });
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDashboardData = async () => {
    try {
      if (user?.role === 'admin' || user?.role === 'hr' || user?.role === 'subadmin') {
        const [employeesRes, salaryRes] = await Promise.all([
          axios.get(`${API_URL}/employees`),
          axios.get(`${API_URL}/salary`),
        ]);

        const totalAmount = salaryRes.data.reduce(
          (sum, salary) => sum + salary.net_salary,
          0
        );
        const pendingPayslips = salaryRes.data.filter(
          (salary) => !salary.payslip_pdf
        ).length;

        setStats({
          totalEmployees: employeesRes.data.length,
          totalSalaries: salaryRes.data.length,
          totalAmount,
          pendingPayslips,
        });
      } else {
        const salaryRes = await axios.get(`${API_URL}/salary`);
        setStats({
          totalSalaries: salaryRes.data.length,
          totalAmount: salaryRes.data.reduce(
            (sum, salary) => sum + salary.net_salary,
            0
          ),
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-dark-text-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-dark-text-primary text-3xl font-bold mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-dark-text-secondary">Here's what's happening in your organization</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {(user?.role === 'admin' || user?.role === 'hr' || user?.role === 'subadmin') && (
          <div className="bg-dark-bg-secondary border border-dark-border rounded-xl p-6 flex items-center gap-6 hover:-translate-y-1 hover:shadow-lg transition-all">
            <div className="text-5xl w-20 h-20 flex items-center justify-center bg-dark-bg-tertiary rounded-xl">
              👥
            </div>
            <div>
              <h3 className="text-dark-text-secondary text-sm font-medium mb-1">Total Employees</h3>
              <p className="text-dark-text-primary text-3xl font-bold">{stats.totalEmployees}</p>
            </div>
          </div>
        )}
        <div className="bg-dark-bg-secondary border border-dark-border rounded-xl p-6 flex items-center gap-6 hover:-translate-y-1 hover:shadow-lg transition-all">
          <div className="text-5xl w-20 h-20 flex items-center justify-center bg-dark-bg-tertiary rounded-xl">
            💰
          </div>
          <div>
            <h3 className="text-dark-text-secondary text-sm font-medium mb-1">Salary Records</h3>
            <p className="text-dark-text-primary text-3xl font-bold">{stats.totalSalaries}</p>
          </div>
        </div>
        <div className="bg-dark-bg-secondary border border-dark-border rounded-xl p-6 flex items-center gap-6 hover:-translate-y-1 hover:shadow-lg transition-all">
          <div className="text-5xl w-20 h-20 flex items-center justify-center bg-dark-bg-tertiary rounded-xl">
            💵
          </div>
          <div>
            <h3 className="text-dark-text-secondary text-sm font-medium mb-1">Total Amount</h3>
            <p className="text-dark-text-primary text-3xl font-bold">₹{stats.totalAmount.toLocaleString()}</p>
          </div>
        </div>
        {(user?.role === 'admin' || user?.role === 'hr' || user?.role === 'subadmin') && (
          <div className="bg-dark-bg-secondary border border-dark-border rounded-xl p-6 flex items-center gap-6 hover:-translate-y-1 hover:shadow-lg transition-all">
            <div className="text-5xl w-20 h-20 flex items-center justify-center bg-dark-bg-tertiary rounded-xl">
              📄
            </div>
            <div>
              <h3 className="text-dark-text-secondary text-sm font-medium mb-1">Pending Payslips</h3>
              <p className="text-dark-text-primary text-3xl font-bold">{stats.pendingPayslips}</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-dark-text-primary text-2xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(user?.role === 'admin' || user?.role === 'hr' || user?.role === 'subadmin') && (
            <>
              <div className="bg-dark-bg-secondary border border-dark-border rounded-xl p-6 text-center cursor-pointer hover:bg-dark-bg-tertiary hover:border-blue-500 hover:-translate-y-1 transition-all">
                <span className="text-4xl block mb-4">➕</span>
                <h4 className="text-dark-text-primary text-lg font-semibold mb-2">Add Employee</h4>
                <p className="text-dark-text-secondary text-sm">Register a new employee</p>
              </div>
              <div className="bg-dark-bg-secondary border border-dark-border rounded-xl p-6 text-center cursor-pointer hover:bg-dark-bg-tertiary hover:border-blue-500 hover:-translate-y-1 transition-all">
                <span className="text-4xl block mb-4">💼</span>
                <h4 className="text-dark-text-primary text-lg font-semibold mb-2">Manage Salaries</h4>
                <p className="text-dark-text-secondary text-sm">Create and manage salary records</p>
              </div>
            </>
          )}
          <div className="bg-dark-bg-secondary border border-dark-border rounded-xl p-6 text-center cursor-pointer hover:bg-dark-bg-tertiary hover:border-blue-500 hover:-translate-y-1 transition-all">
            <span className="text-4xl block mb-4">👤</span>
            <h4 className="text-dark-text-primary text-lg font-semibold mb-2">View Profile</h4>
            <p className="text-dark-text-secondary text-sm">Update your profile information</p>
          </div>
          <div className="bg-dark-bg-secondary border border-dark-border rounded-xl p-6 text-center cursor-pointer hover:bg-dark-bg-tertiary hover:border-blue-500 hover:-translate-y-1 transition-all">
            <span className="text-4xl block mb-4">📋</span>
            <h4 className="text-dark-text-primary text-lg font-semibold mb-2">View Payslips</h4>
            <p className="text-dark-text-secondary text-sm">Download your payslip PDFs</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
