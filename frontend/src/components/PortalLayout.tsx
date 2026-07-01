import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { 
  LayoutDashboard, ClipboardCheck, Users, GraduationCap, 
  GitBranch, BookOpen, Layers, Calendar, CreditCard, 
  Bookmark, FileText, FileSignature, LogOut, ShieldAlert,
  ClipboardList, Sun, Moon, Megaphone, Settings, History, Search
} from 'lucide-react';

const PortalLayout: React.FC = () => {
  const { user, logout, hasRole, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState('');

  const { t, i18n } = useTranslation();
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
      heading: t('menu.core_operations'),
      links: [
        { name: t('menu.dashboard'), path: '/dashboard', icon: LayoutDashboard, permission: null },
        { name: t('menu.admissions_desk'), path: '/admin/admissions', icon: ClipboardCheck, permission: 'process applications' },
        { name: t('menu.student_directory'), path: '/admin/students', icon: Users, permission: 'view users' },
        { name: t('menu.faculty_dossier'), path: '/admin/teachers-staff', icon: GraduationCap, permission: 'view users' },
      ]
    },
    {
      heading: t('menu.academics_timetable'),
      links: [
        { name: t('menu.academic_layout'), path: '/admin/academic-structure', icon: GitBranch, permission: 'manage programs' },
        { name: t('menu.curriculum_syllabi'), path: '/admin/subjects-curriculum', icon: BookOpen, permission: 'manage subjects' },
        { name: t('menu.course_allocations'), path: '/admin/course-allocation', icon: Layers, permission: 'manage courses' },
        { name: t('menu.timetable_builder'), path: '/admin/timetable', icon: Calendar, permission: 'manage courses' },
        { name: t('menu.my_schedule'), path: '/portal/timetable-calendar', icon: Calendar, permission: null, excludeAdmin: true },
      ]
    },
    {
      heading: t('menu.examinations'),
      links: [
        { name: t('menu.exam_schedules'), path: '/admin/exam-schedules', icon: ClipboardList, permission: 'grade examinations' },
        { name: t('menu.marks_entry_ledger'), path: '/portal/marks-entry', icon: FileSignature, permission: 'edit academic records' },
        { name: t('menu.recheck_auditing'), path: '/portal/exam-rechecks', icon: ShieldAlert, permission: 'edit academic records' },
        { name: t('menu.cohort_ranks'), path: '/admin/exam-ranks', icon: LayoutDashboard, permission: 'view exam results' },
      ]
    },
    {
      heading: t('menu.operations_services'),
      links: [
        { name: t('menu.finance_invoices'), path: '/admin/finance', icon: CreditCard, permission: 'manage financial transactions' },
        { name: t('menu.library_registry'), path: '/admin/library', icon: Bookmark, permission: 'issue books' },
        { name: t('menu.research_desk'), path: '/admin/research', icon: FileText, permission: 'view research' },
        { name: t('menu.document_vault'), path: '/admin/documents', icon: FileSignature, permission: 'manage settings' },
        { name: t('menu.communication_desk'), path: '/admin/communication', icon: Megaphone, permission: 'manage settings' },
        { name: t('menu.academic_calendar'), path: '/portal/calendar', icon: Calendar, permission: null },
        { name: t('menu.system_settings'), path: '/admin/settings', icon: Settings, permission: 'manage settings' },
        { name: t('menu.audit_logs'), path: '/admin/audit-logs', icon: History, permission: 'view audit logs' },
        { name: t('menu.global_search'), path: '/admin/search', icon: Search, permission: null },
      ]
    }
  ];

  return (
    <div className="portal-layout-container">
      {/* Sidebar navigation */}
      <aside className="portal-sidebar no-print">
        <div className="portal-sidebar-logo">
          <div className="portal-sidebar-logo-text">
            <BookOpen className="logo-icon" size={20} />
            <span>{t('common.sharia_portal')}</span>
          </div>
          <div className="portal-sidebar-actions">
            {/* Language dropdown switcher */}
            <select
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              title={t('common.select_language')}
              aria-label={t('common.select_language')}
              className="portal-language-select"
            >
              <option value="en">EN</option>
              <option value="ar">AR</option>
              <option value="ta">TA</option>
              <option value="si">SI</option>
            </select>

            <button 
              onClick={toggleTheme} 
              className="btn-theme-toggle" 
              title="Toggle Light/Dark Theme"
            >
              {isLightTheme ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>

        {/* User Card */}
        <div className="portal-sidebar-user">
          <div className="portal-sidebar-user-name">{user.name}</div>
          <div className="portal-sidebar-user-role">{user.roles?.[0] ?? 'Academic Account'}</div>
        </div>

        {/* Quick Search */}
        <div className="portal-sidebar-search-container">
          <form onSubmit={(e) => {
            e.preventDefault();
            if (sidebarSearch.trim()) {
              navigate(`/admin/search?q=${encodeURIComponent(sidebarSearch)}`);
              setSidebarSearch('');
            }
          }} className="portal-sidebar-search-form">
            <input
              type="text"
              placeholder={t('common.quick_search')}
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              className="portal-sidebar-search-input"
            />
            <Search 
              size={12} 
              className="portal-sidebar-search-icon" 
            />
          </form>
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
            className="portal-sidebar-item portal-logout-btn" 
            disabled={isLoggingOut}
          >
            <LogOut size={16} />
            <span>{t('menu.logout')}</span>
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
