import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// Material Icons
import PaymentsIcon from '@mui/icons-material/Payments';
import AddIcon from '@mui/icons-material/Add';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const SalaryManagement = () => {
  const { user } = useAuth();
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    emp_id: '',
    month: '',
    year: new Date().getFullYear(),
    basic: 0,
    hra: 0,
    da: 0,
    pf: 0,
    tax: 0,
    allowances: 0,
    deductions: 0,
  });
  const [message, setMessage] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (user) {
      fetchSalaries();
      if (user?.role === 'admin' || user?.role === 'hr' || user?.role === 'subadmin') {
        fetchEmployees();
      }
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSalaries = async () => {
    try {
      const response = await axios.get(`${API_URL}/salary`);
      setSalaries(response.data);
    } catch (error) {
      console.error('Error fetching salaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API_URL}/employees`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'year' || name === 'emp_id' ? value : parseFloat(value) || 0,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/salary`, formData);
      setMessage('Salary record created successfully!');
      setShowModal(false);
      setFormData({
        emp_id: '',
        month: '',
        year: new Date().getFullYear(),
        basic: 0,
        hra: 0,
        da: 0,
        pf: 0,
        tax: 0,
        allowances: 0,
        deductions: 0,
      });
      fetchSalaries();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error creating salary record');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleGeneratePayslip = async (salaryId) => {
    try {
      await axios.post(`${API_URL}/payslip/generate/${salaryId}`);
      setMessage('Payslip generated successfully!');
      fetchSalaries();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error generating payslip');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDownloadPayslip = async (salaryId) => {
    try {
      const response = await axios.get(
        `${API_URL}/payslip/download/${salaryId}`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payslip_${salaryId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error downloading payslip');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'approved': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-primary-100 text-primary-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-text-primary text-3xl font-bold flex items-center gap-3">
            <PaymentsIcon className="text-primary-600" fontSize="large" />
            Salary Management
          </h1>
          <p className="text-text-secondary mt-1">{salaries.length} salary records</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'hr' || user?.role === 'subadmin') && (
          <button
            className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-primary-700 transition-colors shadow-lg"
            onClick={() => setShowModal(true)}
          >
            <AddIcon />
            Add Salary Record
          </button>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded-xl mb-6 text-center flex items-center justify-center gap-2 ${
          message.includes('Error')
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
        }`}>
          <CheckCircleIcon />
          {message}
        </div>
      )}

      <div className="bg-surface-primary border border-border-light rounded-2xl overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-tertiary">
              <tr>
                {(user?.role === 'admin' || user?.role === 'hr' || user?.role === 'subadmin') && (
                  <th className="p-4 text-left text-text-primary font-semibold border-b border-border-light">Employee</th>
                )}
                <th className="p-4 text-left text-text-primary font-semibold border-b border-border-light">Month</th>
                <th className="p-4 text-left text-text-primary font-semibold border-b border-border-light">Year</th>
                <th className="p-4 text-left text-text-primary font-semibold border-b border-border-light">Basic</th>
                <th className="p-4 text-left text-text-primary font-semibold border-b border-border-light">Gross</th>
                <th className="p-4 text-left text-text-primary font-semibold border-b border-border-light">Net Salary</th>
                <th className="p-4 text-left text-text-primary font-semibold border-b border-border-light">Status</th>
                <th className="p-4 text-left text-text-primary font-semibold border-b border-border-light">Actions</th>
              </tr>
            </thead>
            <tbody>
              {salaries.length === 0 ? (
                <tr>
                  <td colSpan={user?.role === 'admin' || user?.role === 'hr' || user?.role === 'subadmin' ? 8 : 7} className="p-12 text-center">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <PaymentsIcon className="text-primary-600" style={{ fontSize: 32 }} />
                    </div>
                    <p className="text-text-primary font-semibold">No salary records found</p>
                    <p className="text-text-secondary text-sm mt-1">Create salary records to get started</p>
                  </td>
                </tr>
              ) : (
                salaries.map((salary) => (
                  <tr key={salary._id} className="hover:bg-surface-tertiary transition-colors">
                    {(user?.role === 'admin' || user?.role === 'hr' || user?.role === 'subadmin') && (
                      <td className="p-4 text-text-primary border-b border-border-light font-medium">
                        {typeof salary.emp_id === 'object' ? salary.emp_id.name : 'N/A'}
                      </td>
                    )}
                    <td className="p-4 text-text-secondary border-b border-border-light">{salary.month}</td>
                    <td className="p-4 text-text-secondary border-b border-border-light">{salary.year}</td>
                    <td className="p-4 text-text-primary border-b border-border-light font-medium">₹{salary.basic.toLocaleString()}</td>
                    <td className="p-4 text-text-secondary border-b border-border-light">₹{salary.gross_salary.toLocaleString()}</td>
                    <td className="p-4 text-emerald-700 border-b border-border-light font-bold">₹{salary.net_salary.toLocaleString()}</td>
                    <td className="p-4 border-b border-border-light">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(salary.status)}`}>
                        {salary.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 border-b border-border-light">
                      <div className="flex gap-2">
                        {(user?.role === 'admin' || user?.role === 'hr' || user?.role === 'subadmin') && !salary.payslip_pdf && (
                          <button
                            className="px-4 py-2 bg-primary-100 text-primary-700 rounded-lg font-medium text-sm flex items-center gap-1 hover:bg-primary-200 transition-colors"
                            onClick={() => handleGeneratePayslip(salary._id)}
                          >
                            <DescriptionIcon fontSize="small" />
                            Generate
                          </button>
                        )}
                        {salary.payslip_pdf && (
                          <button
                            className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-medium text-sm flex items-center gap-1 hover:bg-emerald-200 transition-colors"
                            onClick={() => handleDownloadPayslip(salary._id)}
                          >
                            <DownloadIcon fontSize="small" />
                            Download
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Salary Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-surface-primary border border-border-light rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-border-light">
              <h2 className="text-text-primary text-2xl font-bold flex items-center gap-2">
                <PaymentsIcon className="text-primary-600" />
                Add Salary Record
              </h2>
              <button
                className="p-2 text-text-secondary hover:bg-surface-tertiary rounded-lg transition-colors"
                onClick={() => setShowModal(false)}
              >
                <CloseIcon />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                <div className="flex flex-col gap-2">
                  <label className="text-text-primary font-medium text-sm flex items-center gap-2">
                    <PersonIcon fontSize="small" className="text-text-muted" />
                    Employee *
                  </label>
                  <select
                    name="emp_id"
                    value={formData.emp_id}
                    onChange={handleChange}
                    required
                    className="p-3 border border-border-light rounded-xl bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp.emp_id}>
                        {emp.name} ({emp.emp_id})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-text-primary font-medium text-sm flex items-center gap-2">
                    <CalendarMonthIcon fontSize="small" className="text-text-muted" />
                    Month *
                  </label>
                  <select
                    name="month"
                    value={formData.month}
                    onChange={handleChange}
                    required
                    className="p-3 border border-border-light rounded-xl bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Month</option>
                    {months.map((month, index) => (
                      <option key={index} value={month}>{month}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-text-primary font-medium text-sm">Year *</label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    required
                    min="2020"
                    max="2099"
                    className="p-3 border border-border-light rounded-xl bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Earnings Section */}
              <div className="mb-6 p-5 bg-emerald-50 rounded-xl border border-emerald-200">
                <h3 className="text-emerald-800 text-lg font-semibold mb-4">Earnings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-emerald-700 font-medium text-sm">Basic Salary *</label>
                    <input
                      type="number"
                      name="basic"
                      value={formData.basic}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      className="p-3 border border-emerald-200 rounded-xl bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-emerald-700 font-medium text-sm">HRA</label>
                    <input
                      type="number"
                      name="hra"
                      value={formData.hra}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="p-3 border border-emerald-200 rounded-xl bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-emerald-700 font-medium text-sm">DA</label>
                    <input
                      type="number"
                      name="da"
                      value={formData.da}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="p-3 border border-emerald-200 rounded-xl bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-emerald-700 font-medium text-sm">Allowances</label>
                    <input
                      type="number"
                      name="allowances"
                      value={formData.allowances}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="p-3 border border-emerald-200 rounded-xl bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Deductions Section */}
              <div className="mb-6 p-5 bg-red-50 rounded-xl border border-red-200">
                <h3 className="text-red-800 text-lg font-semibold mb-4">Deductions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-red-700 font-medium text-sm">PF</label>
                    <input
                      type="number"
                      name="pf"
                      value={formData.pf}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="p-3 border border-red-200 rounded-xl bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-red-700 font-medium text-sm">Tax</label>
                    <input
                      type="number"
                      name="tax"
                      value={formData.tax}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="p-3 border border-red-200 rounded-xl bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-red-700 font-medium text-sm">Other Deductions</label>
                    <input
                      type="number"
                      name="deductions"
                      value={formData.deductions}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="p-3 border border-red-200 rounded-xl bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-border-light">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-surface-tertiary text-text-primary rounded-xl font-semibold hover:bg-surface-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors shadow-lg"
                >
                  Create Salary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryManagement;
