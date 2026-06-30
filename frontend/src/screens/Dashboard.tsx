import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Calendar } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="dashboard-wrapper">
      <main className="dashboard-content">
        <header className="dashboard-header">
          <h1>Welcome, {user.name}</h1>
          <p>You have successfully authenticated via Laravel Sanctum session tokens.</p>
        </header>

        <div className="grid-container">
          {/* User Card */}
          <div className="dashboard-card user-profile-card">
            <div className="card-header">
              <User size={20} className="icon-header" />
              <h3>User Details</h3>
            </div>
            <div className="card-body">
              <div className="detail-item">
                <span className="detail-label">Name</span>
                <span className="detail-val">{user.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email</span>
                <span className="detail-val">{user.email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Joined</span>
                <span className="detail-val flex-align">
                  <Calendar size={14} style={{ marginRight: '6px' }} />
                  {user.created_at || 'Recently'}
                </span>
              </div>
            </div>
          </div>

          {/* Spatie Roles */}
          <div className="dashboard-card roles-card">
            <div className="card-header">
              <Shield size={20} className="icon-header" />
              <h3>Active Roles</h3>
            </div>
            <div className="card-body">
              <p className="card-desc">Spatie roles configured on your account:</p>
              <div className="badge-container">
                {user.roles && user.roles.length > 0 ? (
                  user.roles.map((role, idx) => (
                    <span key={idx} className="badge badge-role">
                      {role}
                    </span>
                  ))
                ) : (
                  <span className="no-badge">No assigned roles</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Panels based on Role */}
        <section className="role-based-panel">
          <h2>Institutional Panel</h2>
          <div className="panel-inner">
            {user.roles.includes('Super Admin') && (
              <div className="role-notice admin-notice">
                <h4>System Administrator Notice</h4>
                <p>You have full read/write access to settings, databases, backups, and audit logs.</p>
              </div>
            )}
            {user.roles.includes('Teacher') && (
              <div className="role-notice teacher-notice">
                <h4>Academic Faculty Notice</h4>
                <p>Access active class rosters, submit course sections attendance, and configure examinations.</p>
              </div>
            )}
            {user.roles.includes('Student') && (
              <div className="role-notice student-notice">
                <h4>Student Center Notice</h4>
                <p>Register for courses, view semester transcripts, and inspect your financial invoices.</p>
              </div>
            )}
            {user.roles.includes('Applicant') && (
              <div className="role-notice applicant-notice">
                <h4>Admission Applicant Notice</h4>
                <p>Complete your profile fields and upload academic transcripts to complete your application.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
