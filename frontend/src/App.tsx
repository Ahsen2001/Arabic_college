import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, GuestRoute } from './components/guards';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Login from './screens/Login';
import Register from './screens/Register';
import ForgotPassword from './screens/ForgotPassword';
import VerifyOtp from './screens/VerifyOtp';
import ResetPassword from './screens/ResetPassword';
import Dashboard from './screens/Dashboard';
import Home from './screens/public/Home';
import About from './screens/public/About';
import Programs from './screens/public/Programs';
import Admissions from './screens/public/Admissions';
import Teachers from './screens/public/Teachers';
import News from './screens/public/News';
import Gallery from './screens/public/Gallery';
import Downloads from './screens/public/Downloads';
import FAQ from './screens/public/FAQ';
import Contact from './screens/public/Contact';
import ApplicantAdmissions from './screens/portal/ApplicantAdmissions';
import AdminAdmissionsList from './screens/portal/AdminAdmissionsList';
import AdminApplicationDetail from './screens/portal/AdminApplicationDetail';
import AdminStudentSearch from './screens/portal/AdminStudentSearch';
import AdminStudentDetail from './screens/portal/AdminStudentDetail';
import StudentDashboardView from './screens/portal/StudentDashboardView';
import AdminTeacherStaffList from './screens/portal/AdminTeacherStaffList';
import AdminTeacherDossier from './screens/portal/AdminTeacherDossier';
import AdminStaffDossier from './screens/portal/AdminStaffDossier';
import './App.css';

const PublicLayout: React.FC = () => {
  return (
    <div className="public-layout-wrapper">
      <Navbar />
      <div className="public-layout-content">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Website Pages inside Shared Layout */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/admissions" element={<Admissions />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/news" element={<News />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/downloads" element={<Downloads />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
          </Route>

          {/* Guest Only Portal Authentication Routes */}
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* Secure Protected Portal Route */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/portal/admissions" element={<ApplicantAdmissions />} />
            <Route path="/admin/admissions" element={<AdminAdmissionsList />} />
            <Route path="/admin/admissions/:id" element={<AdminApplicationDetail />} />
            <Route path="/admin/students" element={<AdminStudentSearch />} />
            <Route path="/admin/students/:id" element={<AdminStudentDetail />} />
            <Route path="/portal/student-dashboard" element={<StudentDashboardView />} />
            <Route path="/admin/teachers-staff" element={<AdminTeacherStaffList />} />
            <Route path="/admin/teachers/:id" element={<AdminTeacherDossier />} />
            <Route path="/admin/staff/:id" element={<AdminStaffDossier />} />
          </Route>

          {/* Wildcard Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'custom-toast',
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
            borderRadius: '10px',
          },
        }}
      />
    </AuthProvider>
  );
};

export default App;
