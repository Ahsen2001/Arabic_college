import React from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, Calendar, ArrowRight, FileText } from 'lucide-react';

const Admissions: React.FC = () => {
  return (
    <div className="public-subpage admissions-page">
      <header className="page-header">
        <div className="header-container">
          <h1>Admissions Info</h1>
          <p>Begin your academic path at the Arabic College</p>
        </div>
      </header>

      <section className="page-content">
        <div className="section-container">
          <div className="admissions-split-grid">
            {/* Guide & Requirements */}
            <div className="admissions-guide">
              <h2>Admission Requirements</h2>
              <p>
                Arabic College welcomes applicants from all backgrounds who demonstrate a commitment to rigorous academic work and respect for classical academic traditions.
              </p>

              <div className="requirements-checklist">
                <h3>Eligibility Checklist</h3>
                <ul>
                  <li>
                    <CheckSquare className="check-icon" />
                    <span>High School Diploma or equivalent certificate with a minimum grade point average (GPA) of 80%.</span>
                  </li>
                  <li>
                    <CheckSquare className="check-icon" />
                    <span>Basic proficiency in the Arabic language (written and spoken) is required for Sharia and Hadith tracks.</span>
                  </li>
                  <li>
                    <CheckSquare className="check-icon" />
                    <span>Good conduct certificate from the applicant's prior educational institution.</span>
                  </li>
                  <li>
                    <CheckSquare className="check-icon" />
                    <span>Passing the college's standard Arabic proficiency entrance exam.</span>
                  </li>
                </ul>
              </div>

              <div className="documents-checklist">
                <h3>Required Documents</h3>
                <ul className="doc-list">
                  <li>
                    <FileText size={16} className="doc-icon" />
                    <span>Original High School Transcript (stamped/verified)</span>
                  </li>
                  <li>
                    <FileText size={16} className="doc-icon" />
                    <span>Copy of National ID card or Passport</span>
                  </li>
                  <li>
                    <FileText size={16} className="doc-icon" />
                    <span>Passport size photographs (white background)</span>
                  </li>
                  <li>
                    <FileText size={16} className="doc-icon" />
                    <span>Medical fitness certificate</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Schedule & Action */}
            <div className="admissions-schedule-box">
              <div className="schedule-header">
                <Calendar className="sch-icon" />
                <h3>Admission Calendar</h3>
              </div>
              <div className="schedule-body">
                <div className="timeline-item">
                  <span className="timeline-date">June 20 - July 31, 2026</span>
                  <h4>Online Application Window</h4>
                  <p>Submit your personal parameters, phone, and upload transcript documents via the applicant portal.</p>
                </div>
                <div className="timeline-item">
                  <span className="timeline-date">August 10, 2026</span>
                  <h4>Arabic Placement Entrance Exam</h4>
                  <p>Conducted online and on-campus for registered applicants.</p>
                </div>
                <div className="timeline-item">
                  <span className="timeline-date">August 20, 2026</span>
                  <h4>Final Admission Results Released</h4>
                  <p>Approved applicants will be notified and sent tuition invoices.</p>
                </div>
              </div>

              <div className="schedule-footer">
                <p>Ready to start your application?</p>
                <Link to="/register" className="btn btn-primary btn-block">
                  Apply Online Now <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Admissions;
