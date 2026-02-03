import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';
// Tailwind CSS used

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-dark-text-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-dark-text-primary text-3xl font-bold">Salary Management</h1>
        {(user?.role === 'admin' || user?.role === 'hr' || user?.role === 'subadmin') && (
          <button
            className="px-6 py-3 bg-green-500 text-white border-none rounded-md font-semibold cursor-pointer transition-colors hover:bg-green-600"
            onClick={() => setShowModal(true)}
          >
            + Add Salary Record
          </button>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded-md mb-4 text-center ${
          message.includes('Error')
            ? 'bg-red-500/10 border border-red-500 text-red-500'
            : 'bg-green-500/10 border border-green-500 text-green-500'
        }`}>
          {message}
        </div>
      )}

      <div className="bg-dark-bg-secondary border border-dark-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-dark-bg-tertiary">
              <tr>
                {(user?.role === 'admin' || user?.role === 'hr') && (
                  <th className="p-4 text-left text-dark-text-primary font-semibold border-b-2 border-dark-border">Employee</th>
                )}
                <th className="p-4 text-left text-dark-text-primary font-semibold border-b-2 border-dark-border">Month</th>
                <th className="p-4 text-left text-dark-text-primary font-semibold border-b-2 border-dark-border">Year</th>
                <th className="p-4 text-left text-dark-text-primary font-semibold border-b-2 border-dark-border">Basic</th>
                <th className="p-4 text-left text-dark-text-primary font-semibold border-b-2 border-dark-border">Gross</th>
                <th className="p-4 text-left text-dark-text-primary font-semibold border-b-2 border-dark-border">Net Salary</th>
                <th className="p-4 text-left text-dark-text-primary font-semibold border-b-2 border-dark-border">Status</th>
                <th className="p-4 text-left text-dark-text-primary font-semibold border-b-2 border-dark-border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {salaries.length === 0 ? (
                <tr>
                  <td colSpan={user?.role === 'admin' || user?.role === 'hr' || user?.role === 'subadmin' ? 8 : 7} className="p-8 text-center text-dark-text-secondary">
                    No salary records found
                  </td>
                </tr>
              ) : (
                salaries.map((salary) => (
                  <tr key={salary._id} className="hover:bg-dark-bg-tertiary transition-colors">
                    {(user?.role === 'admin' || user?.role === 'hr' || user?.role === 'subadmin') && (
                      <td className="p-4 text-dark-text-secondary border-b border-dark-border">
                        {typeof salary.emp_id === 'object'
                          ? salary.emp_id.name
                          : 'N/A'}
                      </td>
                    )}
                    <td className="p-4 text-dark-text-secondary border-b border-dark-border">{salary.month}</td>
                    <td className="p-4 text-dark-text-secondary border-b border-dark-border">{salary.year}</td>
                    <td className="p-4 text-dark-text-secondary border-b border-dark-border">₹{salary.basic.toLocaleString()}</td>
                    <td className="p-4 text-dark-text-secondary border-b border-dark-border">₹{salary.gross_salary.toLocaleString()}</td>
                    <td className="p-4 text-dark-text-secondary border-b border-dark-border">₹{salary.net_salary.toLocaleString()}</td>
                    <td className="p-4 border-b border-dark-border">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        salary.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                        salary.status === 'approved' ? 'bg-green-500/20 text-green-500' :
                        'bg-blue-500/20 text-blue-500'
                      }`}>
                        {salary.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 border-b border-dark-border">
                      <div className="flex gap-2">
                        {(user?.role === 'admin' || user?.role === 'hr' || user?.role === 'subadmin') && !salary.payslip_pdf && (
                          <button
                            className="px-4 py-2 bg-blue-500 text-white border-none rounded-md cursor-pointer font-medium text-sm transition-colors hover:bg-blue-600"
                            onClick={() => handleGeneratePayslip(salary._id)}
                          >
                            Generate Payslip
                          </button>
                        )}
                        {salary.payslip_pdf && (
                          <button
                            className="px-4 py-2 bg-green-500 text-white border-none rounded-md cursor-pointer font-medium text-sm transition-colors hover:bg-green-600"
                            onClick={() => handleDownloadPayslip(salary._id)}
                          >
                            Download PDF
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

      {showModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-dark-bg-secondary border border-dark-border rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-dark-border">
              <h2 className="text-dark-text-primary text-2xl font-bold">Add Salary Record</h2>
              <button
                className="bg-transparent border-none text-dark-text-primary text-3xl cursor-pointer w-8 h-8 flex items-center justify-center rounded hover:bg-dark-bg-tertiary transition-colors"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="flex flex-col gap-2">
                  <label className="text-dark-text-primary font-medium text-sm">Employee *</label>
                  <select
                    name="emp_id"
                    value={formData.emp_id}
                    onChange={handleChange}
                    required
                    className="p-3 border border-dark-border rounded-md bg-dark-bg-tertiary text-dark-text-primary focus:outline-none focus:border-blue-500"
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
                  <label className="text-dark-text-primary font-medium text-sm">Month *</label>
                  <select
                    name="month"
                    value={formData.month}
                    onChange={handleChange}
                    required
                    className="p-3 border border-dark-border rounded-md bg-dark-bg-tertiary text-dark-text-primary focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Month</option>
                    {months.map((month, index) => (
                      <option key={index} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-dark-text-primary font-medium text-sm">Year *</label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    required
                    min="2020"
                    max="2099"
                    className="p-3 border border-dark-border rounded-md bg-dark-bg-tertiary text-dark-text-primary focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="mb-6">
                <h3 className="text-dark-text-primary text-lg font-semibold mb-4">Earnings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-dark-text-primary font-medium text-sm">Basic Salary *</label>
                    <input
                      type="number"
                      name="basic"
                      value={formData.basic}
                      onChange={handleChange}
                      required
                      min="0"
                      step="0.01"
                      className="p-3 border border-dark-border rounded-md bg-dark-bg-tertiary text-dark-text-primary focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-dark-text-primary font-medium text-sm">HRA</label>
                    <input
                      type="number"
                      name="hra"
                      value={formData.hra}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="p-3 border border-dark-border rounded-md bg-dark-bg-tertiary text-dark-text-primary focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-dark-text-primary font-medium text-sm">DA</label>
                    <input
                      type="number"
                      name="da"
                      value={formData.da}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="p-3 border border-dark-border rounded-md bg-dark-bg-tertiary text-dark-text-primary focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-dark-text-primary font-medium text-sm">Allowances</label>
                    <input
                      type="number"
                      name="allowances"
                      value={formData.allowances}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="p-3 border border-dark-border rounded-md bg-dark-bg-tertiary text-dark-text-primary focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
              <div className="mb-6">
                <h3 className="text-dark-text-primary text-lg font-semibold mb-4">Deductions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-dark-text-primary font-medium text-sm">PF</label>
                    <input
                      type="number"
                      name="pf"
                      value={formData.pf}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="p-3 border border-dark-border rounded-md bg-dark-bg-tertiary text-dark-text-primary focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-dark-text-primary font-medium text-sm">Tax</label>
                    <input
                      type="number"
                      name="tax"
                      value={formData.tax}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="p-3 border border-dark-border rounded-md bg-dark-bg-tertiary text-dark-text-primary focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-dark-text-primary font-medium text-sm">Other Deductions</label>
                    <input
                      type="number"
                      name="deductions"
                      value={formData.deductions}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="p-3 border border-dark-border rounded-md bg-dark-bg-tertiary text-dark-text-primary focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-dark-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-dark-bg-tertiary text-dark-text-primary border-none rounded-md font-semibold cursor-pointer transition-colors hover:bg-dark-border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-500 text-white border-none rounded-md font-semibold cursor-pointer transition-colors hover:bg-blue-600"
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

