import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import EmployeeManagement from './pages/EmployeeManagement';
import SalaryManagement from './pages/SalaryManagement';
import PayslipView from './pages/PayslipView';
import PendingApprovals from './pages/PendingApprovals';
import Attendance from './pages/Attendance';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="/employees"
              element={
                <PrivateRoute allowedRoles={['admin', 'hr', 'subadmin']}>
                  <EmployeeManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="/salary"
              element={
                <PrivateRoute>
                  <SalaryManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="/payslip/:salaryId"
              element={
                <PrivateRoute>
                  <PayslipView />
                </PrivateRoute>
              }
            />
            <Route
              path="/pending-approvals"
              element={
                <PrivateRoute allowedRoles={['admin', 'subadmin']}>
                  <PendingApprovals />
                </PrivateRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <PrivateRoute>
                  <Attendance />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

