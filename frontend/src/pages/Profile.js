import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
// Tailwind CSS used

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
    if (user?.id) {
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/employees/${user?.id}`);
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
      
      await axios.put(`${API_URL}/employees/${user?.id}`, dataToSend);
      setMessage('Profile updated successfully!');
      setEditing(false);
      fetchProfile();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error updating profile';
      setMessage(errorMessage);
      setTimeout(() => setMessage(''), 3000);
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
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-dark-text-primary text-3xl font-bold">My Profile</h1>
        <button
          className="px-6 py-3 bg-blue-500 text-white border-none rounded-md font-semibold cursor-pointer transition-colors hover:bg-blue-600"
          onClick={() => setEditing(!editing)}
        >
          {editing ? 'Cancel' : 'Edit Profile'}
        </button>
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

      <div className="bg-dark-bg-secondary border border-dark-border rounded-xl p-8">
        <form onSubmit={handleSubmit}>
          <div className="mb-8">
            <h2 className="text-dark-text-primary text-xl font-semibold mb-6 pb-2 border-b border-dark-border">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="flex flex-col gap-2">
                <label className="text-dark-text-secondary text-sm font-medium">Employee ID</label>
                <input
                  type="text"
                  value={profile?.emp_id || ''}
                  disabled
                  className="p-3 border border-dark-border rounded-md bg-dark-bg-primary text-dark-text-primary cursor-not-allowed opacity-70"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-dark-text-secondary text-sm font-medium">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!editing}
                  required
                  className="p-3 border border-dark-border rounded-md bg-dark-bg-tertiary text-dark-text-primary focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-70"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="flex flex-col gap-2">
                <label className="text-dark-text-secondary text-sm font-medium">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!editing}
                  required
                  className="p-3 border border-dark-border rounded-md bg-dark-bg-tertiary text-dark-text-primary focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-70"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-dark-text-secondary text-sm font-medium">Role</label>
                <input
                  type="text"
                  value={profile?.role?.toUpperCase() || ''}
                  disabled
                  className="p-3 border border-dark-border rounded-md bg-dark-bg-primary text-dark-text-primary cursor-not-allowed opacity-70"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-dark-text-secondary text-sm font-medium">Department</label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  disabled={!editing}
                  className="p-3 border border-dark-border rounded-md bg-dark-bg-tertiary text-dark-text-primary focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-70"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-dark-text-secondary text-sm font-medium">Designation</label>
                <input
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  disabled={!editing}
                  className="p-3 border border-dark-border rounded-md bg-dark-bg-tertiary text-dark-text-primary focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-70"
                />
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-dark-text-primary text-xl font-semibold mb-6 pb-2 border-b border-dark-border">
              Bank Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="flex flex-col gap-2">
                <label className="text-dark-text-secondary text-sm font-medium">Account Number</label>
                <input
                  type="text"
                  name="bank_account_number"
                  value={formData.bank_details.account_number}
                  onChange={handleChange}
                  disabled={!editing}
                  className="p-3 border border-dark-border rounded-md bg-dark-bg-tertiary text-dark-text-primary focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-70"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-dark-text-secondary text-sm font-medium">Bank Name</label>
                <input
                  type="text"
                  name="bank_bank_name"
                  value={formData.bank_details.bank_name}
                  onChange={handleChange}
                  disabled={!editing}
                  className="p-3 border border-dark-border rounded-md bg-dark-bg-tertiary text-dark-text-primary focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-70"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-dark-text-secondary text-sm font-medium">IFSC Code</label>
                <input
                  type="text"
                  name="bank_ifsc_code"
                  value={formData.bank_details.ifsc_code}
                  onChange={handleChange}
                  disabled={!editing}
                  className="p-3 border border-dark-border rounded-md bg-dark-bg-tertiary text-dark-text-primary focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-70"
                />
              </div>
            </div>
          </div>

          {editing && (
            <div className="mt-8 pt-8 border-t border-dark-border">
              <button
                type="submit"
                className="px-8 py-3 bg-green-500 text-white border-none rounded-md font-semibold cursor-pointer transition-colors hover:bg-green-600"
              >
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

