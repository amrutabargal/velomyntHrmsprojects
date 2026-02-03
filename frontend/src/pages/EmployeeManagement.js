import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
// Tailwind CSS used

// Note: This page is accessible by admin, hr, and subadmin for viewing employees

const EmployeeManagement = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    emp_id: '',
    name: '',
    email: '',
    password: '',
    role: 'employee',
    department: '',
    designation: '',
    bank_details: {
      account_number: '',
      bank_name: '',
      ifsc_code: '',
    },
  });
  const [message, setMessage] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API_URL}/employees`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('bank_')) {
      // Handle bank fields: bank_account_number -> account_number, bank_bank_name -> bank_name, bank_ifsc_code -> ifsc_code
      let bankField = name.replace('bank_', '');
      // Fix the double bank_ prefix issue
      if (bankField === 'bank_name') {
        bankField = 'bank_name';
      }
      setFormData({
        ...formData,
        bank_details: {
          ...formData.bank_details,
          [bankField]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare the data to send - ensure bank_details is properly structured
      const dataToSend = {
        emp_id: formData.emp_id,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        department: formData.department,
        designation: formData.designation,
        bank_details: {
          account_number: formData.bank_details.account_number || '',
          bank_name: formData.bank_details.bank_name || '',
          ifsc_code: formData.bank_details.ifsc_code || '',
        },
      };
      
      await axios.post(`${API_URL}/auth/register`, dataToSend);
      setMessage('Employee registered successfully!');
      setShowModal(false);
      setFormData({
        emp_id: '',
        name: '',
        email: '',
        password: '',
        role: 'employee',
        department: '',
        designation: '',
        bank_details: {
          account_number: '',
          bank_name: '',
          ifsc_code: '',
        },
      });
      fetchEmployees();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error registering employee';
      setMessage(errorMessage);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await axios.delete(`${API_URL}/employees/${id}`);
        setMessage('Employee deleted successfully!');
        fetchEmployees();
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        setMessage(error.response?.data?.message || 'Error deleting employee');
        setTimeout(() => setMessage(''), 3000);
      }
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-dark-text-primary text-3xl font-bold">Employee Management</h1>
        {(user?.role === 'admin' || user?.role === 'hr' || user?.role === 'subadmin') && (
          <button
            className="px-6 py-3 bg-green-500 text-white border-none rounded-md font-semibold cursor-pointer transition-colors hover:bg-green-600"
            onClick={() => setShowModal(true)}
          >
            + Add Employee
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
                <th className="p-4 text-left text-dark-text-primary font-semibold border-b-2 border-dark-border">Emp ID</th>
                <th className="p-4 text-left text-dark-text-primary font-semibold border-b-2 border-dark-border">Name</th>
                <th className="p-4 text-left text-dark-text-primary font-semibold border-b-2 border-dark-border">Email</th>
                <th className="p-4 text-left text-dark-text-primary font-semibold border-b-2 border-dark-border">Department</th>
                <th className="p-4 text-left text-dark-text-primary font-semibold border-b-2 border-dark-border">Designation</th>
                <th className="p-4 text-left text-dark-text-primary font-semibold border-b-2 border-dark-border">Role</th>
                <th className="p-4 text-left text-dark-text-primary font-semibold border-b-2 border-dark-border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-dark-text-secondary">
                    No employees found
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee._id} className="hover:bg-dark-bg-tertiary transition-colors">
                    <td className="p-4 text-dark-text-secondary border-b border-dark-border">{employee.emp_id}</td>
                    <td className="p-4 text-dark-text-secondary border-b border-dark-border">{employee.name}</td>
                    <td className="p-4 text-dark-text-secondary border-b border-dark-border">{employee.email}</td>
                    <td className="p-4 text-dark-text-secondary border-b border-dark-border">{employee.department || 'N/A'}</td>
                    <td className="p-4 text-dark-text-secondary border-b border-dark-border">{employee.designation || 'N/A'}</td>
                    <td className="p-4 border-b border-dark-border">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        employee.role === 'admin' ? 'bg-red-500/20 text-red-500' :
                        employee.role === 'hr' ? 'bg-blue-500/20 text-blue-500' :
                        'bg-green-500/20 text-green-500'
                      }`}>
                        {employee.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 border-b border-dark-border">
                      <button
                        className="px-4 py-2 bg-red-500 text-white border-none rounded-md cursor-pointer font-medium text-sm transition-colors hover:bg-red-600"
                        onClick={() => handleDelete(employee._id)}
                      >
                        Delete
                      </button>
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
            className="bg-dark-bg-secondary border border-dark-border rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-dark-border">
              <h2 className="text-dark-text-primary text-2xl font-bold">Add New Employee</h2>
              <button
                className="bg-transparent border-none text-dark-text-primary text-3xl cursor-pointer w-8 h-8 flex items-center justify-center rounded hover:bg-dark-bg-tertiary transition-colors"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex flex-col gap-2">
                  <label className="text-dark-text-primary font-medium text-sm">Employee ID *</label>
                  <input
                    type="text"
                    name="emp_id"
                    value={formData.emp_id}
                    onChange={handleChange}
                    required
                    className="p-3 border border-dark-border rounded-md bg-dark-bg-tertiary text-dark-text-primary focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-dark-text-primary font-medium text-sm">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="p-3 border border-dark-border rounded-md bg-dark-bg-tertiary text-dark-text-primary focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex flex-col gap-2">
                  <label className="text-dark-text-primary font-medium text-sm">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="p-3 border border-dark-border rounded-md bg-dark-bg-tertiary text-dark-text-primary focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-dark-text-primary font-medium text-sm">Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength="6"
                    className="p-3 border border-dark-border rounded-md bg-dark-bg-tertiary text-dark-text-primary focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex flex-col gap-2">
                  <label className="text-dark-text-primary font-medium text-sm">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    disabled={user?.role === 'subadmin'}
                    className="p-3 border border-dark-border rounded-md bg-dark-bg-tertiary text-dark-text-primary focus:outline-none focus:border-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {user?.role === 'admin' && (
                      <>
                        <option value="employee">Employee</option>
                        <option value="subadmin">Sub Admin</option>
                        <option value="hr">HR</option>
                        <option value="admin">Admin</option>
                      </>
                    )}
                    {(user?.role === 'hr' || user?.role === 'subadmin') && (
                      <option value="employee">Employee</option>
                    )}
                  </select>
                  {user?.role === 'subadmin' && (
                    <p className="text-xs text-dark-text-secondary mt-1">
                      Subadmin can only create employees
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-dark-text-primary font-medium text-sm">Department</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="p-3 border border-dark-border rounded-md bg-dark-bg-tertiary text-dark-text-primary focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="flex flex-col gap-2">
                  <label className="text-dark-text-primary font-medium text-sm">Designation</label>
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    className="p-3 border border-dark-border rounded-md bg-dark-bg-tertiary text-dark-text-primary focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6 mb-6">
                <h3 className="text-dark-text-primary text-lg font-semibold mb-4">Bank Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-dark-text-primary font-medium text-sm">Account Number</label>
                    <input
                      type="text"
                      name="bank_account_number"
                      value={formData.bank_details.account_number}
                      onChange={handleChange}
                      className="p-3 border border-dark-border rounded-md bg-dark-bg-tertiary text-dark-text-primary focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-dark-text-primary font-medium text-sm">Bank Name</label>
                    <input
                      type="text"
                      name="bank_bank_name"
                      value={formData.bank_details.bank_name || ''}
                      onChange={handleChange}
                      className="p-3 border border-dark-border rounded-md bg-dark-bg-tertiary text-dark-text-primary focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-dark-text-primary font-medium text-sm">IFSC Code</label>
                    <input
                      type="text"
                      name="bank_ifsc_code"
                      value={formData.bank_details.ifsc_code}
                      onChange={handleChange}
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
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeManagement;

