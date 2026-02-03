import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
// Tailwind CSS used

const PayslipView = () => {
  const { salaryId } = useParams();
  const navigate = useNavigate();
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchPayslip();
  }, [salaryId]);

  const fetchPayslip = async () => {
    try {
      const response = await axios.get(`${API_URL}/payslip/${salaryId}`);
      setSalary(response.data);
    } catch (error) {
      console.error('Error fetching payslip:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
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
      alert('Error downloading payslip');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-dark-text-secondary">Loading...</div>
      </div>
    );
  }

  if (!salary) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-dark-text-secondary mb-4">Payslip not found</p>
        <button
          onClick={() => navigate('/salary')}
          className="px-6 py-3 bg-blue-500 text-white border-none rounded-md cursor-pointer font-semibold transition-colors hover:bg-blue-600"
        >
          Back to Salary
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <button
          className="px-6 py-3 bg-dark-bg-secondary text-dark-text-primary border border-dark-border rounded-md cursor-pointer font-semibold transition-colors hover:bg-dark-bg-tertiary"
          onClick={() => navigate('/salary')}
        >
          ← Back
        </button>
        {salary.payslip_pdf && (
          <button
            className="px-6 py-3 bg-green-500 text-white border-none rounded-md cursor-pointer font-semibold transition-colors hover:bg-green-600"
            onClick={handleDownload}
          >
            Download PDF
          </button>
        )}
      </div>
      <div className="bg-dark-bg-secondary border border-dark-border rounded-xl p-12">
        <h1 className="text-center text-blue-500 text-4xl font-bold mb-8">PAYSLIP</h1>
        <div className="flex justify-between mb-8 pb-4 border-b-2 border-dark-border">
          <div>
            <p className="text-dark-text-secondary mb-2"><strong className="text-dark-text-primary">Month:</strong> {salary.month}</p>
            <p className="text-dark-text-secondary"><strong className="text-dark-text-primary">Year:</strong> {salary.year}</p>
          </div>
        </div>
        <div className="mb-8">
          <h2 className="text-dark-text-primary text-xl font-semibold mb-4 pb-2 border-b border-dark-border">Earnings</h2>
          <div className="flex justify-between py-3 text-dark-text-secondary">
            <span>Basic Salary</span>
            <span>₹{salary.basic.toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-3 text-dark-text-secondary">
            <span>HRA</span>
            <span>₹{salary.hra.toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-3 text-dark-text-secondary">
            <span>DA</span>
            <span>₹{salary.da.toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-3 text-dark-text-secondary">
            <span>Allowances</span>
            <span>₹{salary.allowances.toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-4 mt-2 pt-4 border-t border-dark-border font-semibold text-dark-text-primary">
            <span>Gross Salary</span>
            <span>₹{salary.gross_salary.toLocaleString()}</span>
          </div>
        </div>
        <div className="mb-8">
          <h2 className="text-dark-text-primary text-xl font-semibold mb-4 pb-2 border-b border-dark-border">Deductions</h2>
          <div className="flex justify-between py-3 text-dark-text-secondary">
            <span>PF</span>
            <span>₹{salary.pf.toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-3 text-dark-text-secondary">
            <span>Tax</span>
            <span>₹{salary.tax.toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-3 text-dark-text-secondary">
            <span>Other Deductions</span>
            <span>₹{salary.deductions.toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-4 mt-2 pt-4 border-t border-dark-border font-semibold text-dark-text-primary">
            <span>Total Deductions</span>
            <span>₹{(salary.pf + salary.tax + salary.deductions).toLocaleString()}</span>
          </div>
        </div>
        <div className="bg-dark-bg-tertiary p-8 rounded-lg text-center">
          <h2 className="text-dark-text-primary text-xl font-semibold mb-4">Net Salary</h2>
          <p className="text-5xl font-bold text-green-500">₹{salary.net_salary.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default PayslipView;

