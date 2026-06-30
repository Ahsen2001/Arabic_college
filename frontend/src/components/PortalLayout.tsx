import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import { 
  LayoutDashboard, ClipboardCheck, Users, GraduationCap, 
  GitBranch, BookOpen, Layers, Calendar, CreditCard, 
  Bookmark, FileText, FileSignature, LogOut, ShieldAlert,
  ClipboardList, Sun, Moon, Megaphone, Settings
} from 'lucide-react';

const PortalLayout: React.FC = () => {
  const { user, logout, hasRole, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { isLightTheme, toggleTheme } = useTheme();

  if (!user) return null;

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const toastId = toast.loading('Logging out...');
    try {
      await logout();
      toast.success('Successfully logged out.', { id: toastId });
      navigate('/login');
    } catch {
      toast.error('Logout failed, clearing session locally.', { id: toastId });
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  interface LinkItem {
    name: string;
    path: string;
    icon: any;
    permission: string | null;
    excludeAdmin?: boolean;
  }

  // Spatie configuration maps for sidebar links
  const menuConfig: { heading: string; links: LinkItem[] }[] = [
    {
      heading: 'Core Operations',
      links: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, permission: null },
        { name: 'Admissions Desk', path: '/admin/admissions', icon: ClipboardCheck, permission: 'process applications' },
        { name: 'Student Directory', path: '/admin/students', icon: Users, permission: 'view users' },
        { name: 'Faculty Dossier', path: '/admin/teachers-staff', icon: GraduationCap, permission: 'view users' },
      ]
    },
    {
      heading: 'Academics & Timetable',
      links: [
        { name: 'Academic Layout', path: '/admin/academic-structure', icon: GitBranch, permission: 'manage programs' },
        { name: 'Curriculum & Syllabi', path: '/admin/subjects-curriculum', icon: BookOpen, permission: 'manage subjects' },
        { name: 'Course Allocations', path: '/admin/course-allocation', icon: Layers, permission: 'manage courses' },
        { name: 'Timetable Builder', path: '/admin/timetable', icon: Calendar, permission: 'manage courses' },
        { name: 'My Schedule', path: '/portal/timetable-calendar', icon: Calendar, permission: null, excludeAdmin: true },
      ]
    },
    {
      heading: 'Examinations',
      links: [
        { name: 'Exam Schedules', path: '/admin/exam-schedules', icon: ClipboardList, permission: 'grade examinations' },
        { name: 'Marks Entry Ledger', path: '/portal/marks-entry', icon: FileSignature, permission: 'edit academic records' },
        { name: 'Recheck Auditing', path: '/portal/exam-rechecks', icon: ShieldAlert, permission: 'edit academic records' },
        { name: 'Cohort Ranks', path: '/admin/exam-ranks', icon: LayoutDashboard, permission: 'view exam results' },
      ]
    },
    {
      heading: 'Operations & Services',
      links: [
        { name: 'Finance & Invoices', path: '/admin/finance', icon: CreditCard, permission: 'manage financial transactions' },
        { name: 'Library Registry', path: '/admin/library', icon: Bookmark, permission: 'issue books' },
        { name: 'Research Desk', path: '/admin/research', icon: FileText, permission: 'view research' },
        { name: 'Document Vault', path: '/admin/documents', icon: FileSignature, permission: 'manage settings' },
        { name: 'Communication Desk', path: '/admin/communication', icon: Megaphone, permission: 'manage settings' },
        { name: 'Academic Calendar', path: '/portal/calendar', icon: Calendar, permission: null },
        { name: 'System Settings', path: '/admin/settings', icon: Settings, permission: 'manage settings' },
      ]
    }
  ];

  return (
    <div className="portal-layout-container">
      {/* Sidebar navigation */}
      <aside className="portal-sidebar no-print">
        <div className="portal-sidebar-logo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen className="logo-icon" size={20} />
            <span>Sharia Portal</span>
          </div>
          <button 
            onClick={toggleTheme} 
            className="btn-theme-toggle" 
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Toggle Light/Dark Theme"
          >
            {isLightTheme ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>

        {/* User Card */}
        <div className="portal-sidebar-user">
          <div className="portal-sidebar-user-name">{user.name}</div>
          <div className="portal-sidebar-user-role">{user.roles?.[0] ?? 'Academic Account'}</div>
        </div>

        {/* Dynamic menu items */}
        <div className="portal-sidebar-menu">
          {menuConfig.map((group, groupIdx) => {
            // Check if any link in this group is permitted
            const permittedLinks = group.links.filter(link => {
              if (link.permission && !hasPermission(link.permission)) return false;
              if (link.excludeAdmin && hasRole('Super Admin')) return false;
              return true;
            });

            if (permittedLinks.length === 0) return null;

            return (
              <React.Fragment key={groupIdx}>
                <div className="portal-sidebar-heading">{group.heading}</div>
                {permittedLinks.map((link, idx) => (
                  <Link
                    key={idx}
                    to={link.path}
                    className={`portal-sidebar-item ${isActive(link.path) ? 'active' : ''}`}
                  >
                    <link.icon size={16} />
                    <span>{link.name}</span>
                  </Link>
                ))}
              </React.Fragment>
            );
          })}
        </div>

        {/* Footer Logout */}
        <div className="portal-sidebar-footer">
          <button 
            onClick={handleLogout} 
            className="portal-sidebar-item" 
            style={{ width: '100%', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            disabled={isLoggingOut}
          >
            <LogOut size={16} style={{ color: 'var(--error)' }} />
            <span style={{ color: 'var(--error)' }}>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="portal-content-area">
        <Outlet />
      </main>
    </div>
  );
};

export default PortalLayout;
