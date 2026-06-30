import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
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
import AdminAcademicStructure from './screens/portal/AdminAcademicStructure';
import AdminSubjectCurriculum from './screens/portal/AdminSubjectCurriculum';
import AdminCourseAllocation from './screens/portal/AdminCourseAllocation';
import AdminAcademicDashboard from './screens/portal/AdminAcademicDashboard';
import TeacherGradebookAttendance from './screens/portal/TeacherGradebookAttendance';
import StudentTranscriptView from './screens/portal/StudentTranscriptView';
import AdminPromotionGraduation from './screens/portal/AdminPromotionGraduation';
import TeacherHifzDashboard from './screens/portal/TeacherHifzDashboard';
import StudentHifzDashboard from './screens/portal/StudentHifzDashboard';
import HifzKhatmCertificate from './screens/portal/HifzKhatmCertificate';
import AdminHifzReports from './screens/portal/AdminHifzReports';
import AdminAttendanceAnalytics from './screens/portal/AdminAttendanceAnalytics';
import AttendanceRosterManager from './screens/portal/AttendanceRosterManager';
import LeaveRequestsManager from './screens/portal/LeaveRequestsManager';
import AttendancePDFRoster from './screens/portal/AttendancePDFRoster';
import ExamSchedulesManager from './screens/portal/ExamSchedulesManager';
import MarksEntryLedger from './screens/portal/MarksEntryLedger';
import RecheckRequestsManager from './screens/portal/RecheckRequestsManager';
import CohortRanksDashboard from './screens/portal/CohortRanksDashboard';
import TimetableBuilder from './screens/portal/TimetableBuilder';
import TimetableCalendarView from './screens/portal/TimetableCalendarView';
import FinanceDashboard from './screens/portal/FinanceDashboard';
import InvoiceManager from './screens/portal/InvoiceManager';
import OutstandingDues from './screens/portal/OutstandingDues';
import ScholarshipsManager from './screens/portal/ScholarshipsManager';
import LibraryDashboard from './screens/portal/LibraryDashboard';
import LibraryCirculation from './screens/portal/LibraryCirculation';
import ResearchDashboard from './screens/portal/ResearchDashboard';
import ResearchDetail from './screens/portal/ResearchDetail';
import DocumentGenerator from './screens/portal/DocumentGenerator';
import DocumentVerify from './screens/portal/DocumentVerify';
import CommunicationDashboard from './screens/portal/CommunicationDashboard';
import { AcademicCalendarView } from './screens/portal/AcademicCalendarView';
import SystemSettings from './screens/portal/SystemSettings';
import PortalLayout from './components/PortalLayout';
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
    <ThemeProvider>
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
            <Route path="/verify-document" element={<DocumentVerify />} />
            <Route path="/verify-document/:token" element={<DocumentVerify />} />
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
            <Route element={<PortalLayout />}>
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
              <Route path="/admin/academic-structure" element={<AdminAcademicStructure />} />
              <Route path="/admin/subjects-curriculum" element={<AdminSubjectCurriculum />} />
              <Route path="/admin/course-allocation" element={<AdminCourseAllocation />} />
              <Route path="/admin/academic-analytics" element={<AdminAcademicDashboard />} />
              <Route path="/portal/teacher-gradebook" element={<TeacherGradebookAttendance />} />
              <Route path="/portal/student-transcript" element={<StudentTranscriptView />} />
              <Route path="/portal/student-transcript/:studentId" element={<StudentTranscriptView />} />
              <Route path="/admin/student-promotion" element={<AdminPromotionGraduation />} />
              <Route path="/portal/teacher-hifz" element={<TeacherHifzDashboard />} />
              <Route path="/portal/student-hifz" element={<StudentHifzDashboard />} />
              <Route path="/portal/student-hifz/:studentId" element={<StudentHifzDashboard />} />
              <Route path="/portal/hifz-certificate/:studentId" element={<HifzKhatmCertificate />} />
              <Route path="/admin/hifz-reports" element={<AdminHifzReports />} />
              <Route path="/admin/attendance-analytics" element={<AdminAttendanceAnalytics />} />
              <Route path="/admin/attendance-roster" element={<AttendanceRosterManager />} />
              <Route path="/portal/leave-requests" element={<LeaveRequestsManager />} />
              <Route path="/portal/attendance-report" element={<AttendancePDFRoster />} />
              <Route path="/admin/exam-schedules" element={<ExamSchedulesManager />} />
              <Route path="/portal/marks-entry" element={<MarksEntryLedger />} />
              <Route path="/portal/exam-rechecks" element={<RecheckRequestsManager />} />
              <Route path="/admin/exam-ranks" element={<CohortRanksDashboard />} />
              <Route path="/admin/timetable" element={<TimetableBuilder />} />
              <Route path="/portal/timetable-calendar" element={<TimetableCalendarView />} />
              <Route path="/admin/finance" element={<FinanceDashboard />} />
              <Route path="/admin/finance-invoices" element={<InvoiceManager />} />
              <Route path="/admin/finance-outstanding" element={<OutstandingDues />} />
              <Route path="/admin/finance-scholarships" element={<ScholarshipsManager />} />
              <Route path="/admin/finance-discounts" element={<ScholarshipsManager />} />
              <Route path="/admin/library" element={<LibraryDashboard />} />
              <Route path="/admin/library-circulation" element={<LibraryCirculation />} />
              <Route path="/admin/research" element={<ResearchDashboard />} />
              <Route path="/admin/research/:id" element={<ResearchDetail />} />
              <Route path="/admin/documents" element={<DocumentGenerator />} />
              <Route path="/admin/communication" element={<CommunicationDashboard />} />
              <Route path="/portal/calendar" element={<AcademicCalendarView />} />
              <Route path="/admin/settings" element={<SystemSettings />} />
            </Route>
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
    </ThemeProvider>
  );
};

export default App;
