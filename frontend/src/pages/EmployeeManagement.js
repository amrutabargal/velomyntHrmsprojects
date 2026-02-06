import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Material Icons
import GroupsIcon from '@mui/icons-material/Groups';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import BadgeIcon from '@mui/icons-material/Badge';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      let bankField = name.replace('bank_', '');
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

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700';
      case 'hr': return 'bg-primary-100 text-primary-700';
      case 'subadmin': return 'bg-purple-100 text-purple-700';
      case 'manager': return 'bg-amber-100 text-amber-700';
      default: return 'bg-emerald-100 text-emerald-700';
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
            <GroupsIcon className="text-primary-600" fontSize="large" />
            Employee Management
          </h1>
          <p className="text-text-secondary mt-1">{employees.length} employees total</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'hr' || user?.role === 'subadmin') && (
          <button
            className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-primary-700 transition-colors shadow-lg"
            onClick={() => setShowModal(true)}
          >
            <PersonAddIcon />
            Add Employee
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
                <th className="p-4 text-left text-text-primary font-semibold border-b border-border-light">Emp ID</th>
                <th className="p-4 text-left text-text-primary font-semibold border-b border-border-light">Name</th>
                <th className="p-4 text-left text-text-primary font-semibold border-b border-border-light">Email</th>
                <th className="p-4 text-left text-text-primary font-semibold border-b border-border-light">Department</th>
                <th className="p-4 text-left text-text-primary font-semibold border-b border-border-light">Designation</th>
                <th className="p-4 text-left text-text-primary font-semibold border-b border-border-light">Role</th>
                <th className="p-4 text-left text-text-primary font-semibold border-b border-border-light">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-12 text-center">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <GroupsIcon className="text-primary-600" style={{ fontSize: 32 }} />
                    </div>
                    <p className="text-text-primary font-semibold">No employees found</p>
                    <p className="text-text-secondary text-sm mt-1">Add employees to get started</p>
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee._id} className="hover:bg-surface-tertiary transition-colors">
                    <td className="p-4 text-text-secondary border-b border-border-light font-medium">{employee.emp_id}</td>
                    <td className="p-4 text-text-primary border-b border-border-light font-medium">{employee.name}</td>
                    <td className="p-4 text-text-secondary border-b border-border-light">{employee.email}</td>
                    <td className="p-4 text-text-secondary border-b border-border-light">{employee.department || 'N/A'}</td>
                    <td className="p-4 text-text-secondary border-b border-border-light">{employee.designation || 'N/A'}</td>
                    <td className="p-4 border-b border-border-light">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(employee.role)}`}>
                        {employee.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 border-b border-border-light">
                      <button
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium text-sm flex items-center gap-1 hover:bg-red-200 transition-colors"
                        onClick={() => handleDelete(employee._id)}
                      >
                        <DeleteIcon fontSize="small" />
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

      {/* Add Employee Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-surface-primary border border-border-light rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-border-light">
              <h2 className="text-text-primary text-2xl font-bold flex items-center gap-2">
                <PersonAddIcon className="text-primary-600" />
                Add New Employee
              </h2>
              <button
                className="p-2 text-text-secondary hover:bg-surface-tertiary rounded-lg transition-colors"
                onClick={() => setShowModal(false)}
              >
                <CloseIcon />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div className="flex flex-col gap-2">
                  <label className="text-text-primary font-medium text-sm flex items-center gap-2">
                    <BadgeIcon fontSize="small" className="text-text-muted" />
                    Employee ID *
                  </label>
                  <input
                    type="text"
                    name="emp_id"
                    value={formData.emp_id}
                    onChange={handleChange}
                    required
                    placeholder="EMP001"
                    className="p-3 border border-border-light rounded-xl bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-text-primary font-medium text-sm flex items-center gap-2">
                    <PersonIcon fontSize="small" className="text-text-muted" />
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className="p-3 border border-border-light rounded-xl bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div className="flex flex-col gap-2">
                  <label className="text-text-primary font-medium text-sm flex items-center gap-2">
                    <EmailIcon fontSize="small" className="text-text-muted" />
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="john@example.com"
                    className="p-3 border border-border-light rounded-xl bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-text-primary font-medium text-sm flex items-center gap-2">
                    <LockIcon fontSize="small" className="text-text-muted" />
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength="6"
                    placeholder="Min 6 characters"
                    className="p-3 border border-border-light rounded-xl bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div className="flex flex-col gap-2">
                  <label className="text-text-primary font-medium text-sm flex items-center gap-2">
                    <WorkIcon fontSize="small" className="text-text-muted" />
                    Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    disabled={user?.role === 'subadmin'}
                    className="p-3 border border-border-light rounded-xl bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60"
                  >
                    {user?.role === 'admin' && (
                      <>
                        <option value="employee">Employee</option>
                        <option value="subadmin">Sub Admin</option>
                        <option value="hr">HR</option>
                        <option value="manager">Manager</option>
                      </>
                    )}
                    {(user?.role === 'hr' || user?.role === 'subadmin') && (
                      <option value="employee">Employee</option>
                    )}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-text-primary font-medium text-sm flex items-center gap-2">
                    <BusinessIcon fontSize="small" className="text-text-muted" />
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="IT Department"
                    className="p-3 border border-border-light rounded-xl bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div className="flex flex-col gap-2">
                  <label className="text-text-primary font-medium text-sm flex items-center gap-2">
                    <WorkIcon fontSize="small" className="text-text-muted" />
                    Designation
                  </label>
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    placeholder="Software Developer"
                    className="p-3 border border-border-light rounded-xl bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Bank Details */}
              <div className="pt-6 border-t border-border-light">
                <h3 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
                  <AccountBalanceIcon className="text-primary-600" />
                  Bank Details (Optional)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-text-secondary text-sm">Account Number</label>
                    <input
                      type="text"
                      name="bank_account_number"
                      value={formData.bank_details.account_number}
                      onChange={handleChange}
                      placeholder="Account number"
                      className="p-3 border border-border-light rounded-xl bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-text-secondary text-sm">Bank Name</label>
                    <input
                      type="text"
                      name="bank_bank_name"
                      value={formData.bank_details.bank_name || ''}
                      onChange={handleChange}
                      placeholder="Bank name"
                      className="p-3 border border-border-light rounded-xl bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-text-secondary text-sm">IFSC Code</label>
                    <input
                      type="text"
                      name="bank_ifsc_code"
                      value={formData.bank_details.ifsc_code}
                      onChange={handleChange}
                      placeholder="IFSC code"
                      className="p-3 border border-border-light rounded-xl bg-surface-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-border-light">
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
