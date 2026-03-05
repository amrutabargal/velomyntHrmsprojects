import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// Material Icons
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import CodeIcon from '@mui/icons-material/Code';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
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
    const userId = user?.id || user?._id;
    if (userId) {
      fetchProfile(userId);
    } else if (user) {
      setProfile(user);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        department: user.department || '',
        designation: user.designation || '',
        bank_details: {
          account_number: user.bank_details?.account_number || '',
          bank_name: user.bank_details?.bank_name || '',
          ifsc_code: user.bank_details?.ifsc_code || '',
        },
      });
      setLoading(false);
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchProfile = async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/employees/${userId}`);
      setProfile(response.data);
      setFormData({
        name: response.data.name || '',
        email: response.data.email || '',
        department: response.data.department || '',
        designation: response.data.designation || '',
        bank_details: {
          account_number: response.data.bank_details?.account_number || '',
          bank_name: response.data.bank_details?.bank_name || '',
          ifsc_code: response.data.bank_details?.ifsc_code || '',
        },
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      if (user) {
        setProfile(user);
        setFormData({
          name: user.name || '',
          email: user.email || '',
          department: user.department || '',
          designation: user.designation || '',
          bank_details: {
            account_number: user.bank_details?.account_number || '',
            bank_name: user.bank_details?.bank_name || '',
            ifsc_code: user.bank_details?.ifsc_code || '',
          },
        });
      }
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
    const userId = user?.id || user?._id;
    if (!userId) {
      setMessage('Error: User ID not found');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    try {
      const dataToSend = {
        name: formData.name,
        email: formData.email,
        department: formData.department || '',
        designation: formData.designation || '',
        bank_details: {
          account_number: formData.bank_details.account_number || '',
          bank_name: formData.bank_details.bank_name || '',
          ifsc_code: formData.bank_details.ifsc_code || '',
        },
      };
      
      await axios.put(`${API_URL}/employees/${userId}`, dataToSend);
      setMessage('Profile updated successfully!');
      setEditing(false);
      fetchProfile(userId);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error updating profile';
      setMessage(errorMessage);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700 border-red-200';
      case 'hr': return 'bg-primary-100 text-primary-700 border-primary-200';
      case 'subadmin': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'manager': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary text-lg">Unable to load profile</p>
          <p className="text-text-muted text-sm mt-2">Please try logging in again</p>
        </div>
      </div>
    );
  }

  const displayData = profile || user;

  return (
    <div className="max-w-5xl mx-auto pb-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-text-primary text-3xl font-bold flex items-center gap-3">
          <PersonIcon className="text-primary-600" fontSize="large" />
          My Profile
        </h1>
        <p className="text-text-secondary mt-1">Manage your personal information and settings</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${
          message.includes('Error')
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
        }`}>
          <CheckCircleIcon />
          {message}
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-surface-primary border border-border-light rounded-2xl overflow-hidden mb-6 shadow-card">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="w-28 h-28 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/30">
              <span className="text-5xl font-bold text-white">
                {displayData?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            {/* Info */}
            <div className="text-center md:text-left">
              <h2 className="text-white text-2xl font-bold mb-1">{displayData?.name || 'User'}</h2>
              <p className="text-white/80 flex items-center justify-center md:justify-start gap-2 mb-3">
                <EmailIcon fontSize="small" />
                {displayData?.email}
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                <span className={`px-4 py-1.5 rounded-full text-sm font-medium border ${getRoleBadgeColor(displayData?.role)}`}>
                  <SecurityIcon fontSize="small" className="mr-1" />
                  {displayData?.role?.toUpperCase()}
                </span>
                <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                  <VerifiedUserIcon fontSize="small" className="mr-1" />
                  {displayData?.status?.toUpperCase() || 'ACTIVE'}
                </span>
              </div>
            </div>
            {/* Edit Button */}
            <div className="md:ml-auto">
              <button
                onClick={() => setEditing(!editing)}
                className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${
                  editing
                    ? 'bg-white/20 text-white hover:bg-white/30'
                    : 'bg-white text-primary-700 hover:bg-white/90 shadow-lg'
                }`}
              >
                {editing ? (
                  <>
                    <CancelIcon />
                    Cancel
                  </>
                ) : (
                  <>
                    <EditIcon />
                    Edit Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="p-8">
          {/* Personal Information */}
          <div className="mb-8">
            <h3 className="text-text-primary text-lg font-semibold mb-6 flex items-center gap-2 pb-3 border-b border-border-light">
              <BadgeIcon className="text-primary-600" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Employee ID */}
              <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-sm font-medium flex items-center gap-2">
                  <BadgeIcon fontSize="small" className="text-text-muted" />
                  Employee ID
                </label>
                <input
                  type="text"
                  value={displayData?.emp_id || 'N/A'}
                  disabled
                  className="p-4 border border-border-light rounded-xl bg-surface-tertiary text-text-primary cursor-not-allowed"
                />
              </div>
              {/* Name */}
              <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-sm font-medium flex items-center gap-2">
                  <PersonIcon fontSize="small" className="text-text-muted" />
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!editing}
                  required
                  className={`p-4 border rounded-xl bg-surface-primary text-text-primary transition-all ${
                    editing 
                      ? 'border-primary-400 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-100' 
                      : 'border-border-light'
                  }`}
                />
              </div>
              {/* Email */}
              <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-sm font-medium flex items-center gap-2">
                  <EmailIcon fontSize="small" className="text-text-muted" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!editing}
                  required
                  className={`p-4 border rounded-xl bg-surface-primary text-text-primary transition-all ${
                    editing 
                      ? 'border-primary-400 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-100' 
                      : 'border-border-light'
                  }`}
                />
              </div>
              {/* Role */}
              <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-sm font-medium flex items-center gap-2">
                  <SecurityIcon fontSize="small" className="text-text-muted" />
                  Role
                </label>
                <input
                  type="text"
                  value={displayData?.role?.toUpperCase() || 'N/A'}
                  disabled
                  className="p-4 border border-border-light rounded-xl bg-surface-tertiary text-text-primary cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Work Information */}
          <div className="mb-8">
            <h3 className="text-text-primary text-lg font-semibold mb-6 flex items-center gap-2 pb-3 border-b border-border-light">
              <WorkIcon className="text-emerald-600" />
              Work Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Department */}
              <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-sm font-medium flex items-center gap-2">
                  <BusinessIcon fontSize="small" className="text-text-muted" />
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="e.g. Engineering"
                  className={`p-4 border rounded-xl bg-surface-primary text-text-primary transition-all ${
                    editing 
                      ? 'border-emerald-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100' 
                      : 'border-border-light'
                  }`}
                />
              </div>
              {/* Designation */}
              <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-sm font-medium flex items-center gap-2">
                  <WorkIcon fontSize="small" className="text-text-muted" />
                  Designation
                </label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="e.g. Software Developer"
                  className={`p-4 border rounded-xl bg-surface-primary text-text-primary transition-all ${
                    editing 
                      ? 'border-emerald-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100' 
                      : 'border-border-light'
                  }`}
                />
              </div>
              {/* Joined Date */}
              <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-sm font-medium flex items-center gap-2">
                  <CalendarTodayIcon fontSize="small" className="text-text-muted" />
                  Joined Date
                </label>
                <input
                  type="text"
                  value={displayData?.createdAt ? new Date(displayData.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                  disabled
                  className="p-4 border border-border-light rounded-xl bg-surface-tertiary text-text-primary cursor-not-allowed"
                />
              </div>
              {/* Status */}
              <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-sm font-medium flex items-center gap-2">
                  <VerifiedUserIcon fontSize="small" className="text-text-muted" />
                  Account Status
                </label>
                <input
                  type="text"
                  value={displayData?.status?.toUpperCase() || 'ACTIVE'}
                  disabled
                  className="p-4 border border-border-light rounded-xl bg-surface-tertiary text-text-primary cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="mb-8">
            <h3 className="text-text-primary text-lg font-semibold mb-6 flex items-center gap-2 pb-3 border-b border-border-light">
              <AccountBalanceIcon className="text-amber-600" />
              Bank Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Account Number */}
              <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-sm font-medium flex items-center gap-2">
                  <CreditCardIcon fontSize="small" className="text-text-muted" />
                  Account Number
                </label>
                <input
                  type="text"
                  name="bank_account_number"
                  value={formData.bank_details.account_number}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Enter account number"
                  className={`p-4 border rounded-xl bg-surface-primary text-text-primary transition-all ${
                    editing 
                      ? 'border-amber-400 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-100' 
                      : 'border-border-light'
                  }`}
                />
              </div>
              {/* Bank Name */}
              <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-sm font-medium flex items-center gap-2">
                  <AccountBalanceIcon fontSize="small" className="text-text-muted" />
                  Bank Name
                </label>
                <input
                  type="text"
                  name="bank_bank_name"
                  value={formData.bank_details.bank_name}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="e.g. State Bank of India"
                  className={`p-4 border rounded-xl bg-surface-primary text-text-primary transition-all ${
                    editing 
                      ? 'border-amber-400 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-100' 
                      : 'border-border-light'
                  }`}
                />
              </div>
              {/* IFSC Code */}
              <div className="flex flex-col gap-2">
                <label className="text-text-secondary text-sm font-medium flex items-center gap-2">
                  <CodeIcon fontSize="small" className="text-text-muted" />
                  IFSC Code
                </label>
                <input
                  type="text"
                  name="bank_ifsc_code"
                  value={formData.bank_details.ifsc_code}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="e.g. SBIN0001234"
                  className={`p-4 border rounded-xl bg-surface-primary text-text-primary transition-all ${
                    editing 
                      ? 'border-amber-400 focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-100' 
                      : 'border-border-light'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          {editing && (
            <div className="flex justify-end pt-6 border-t border-border-light">
              <button
                type="submit"
                className="px-8 py-3 bg-primary-600 text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-primary-700 transition-all shadow-lg hover:shadow-primary-500/25"
              >
                <SaveIcon />
                Save Changes
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Profile;
