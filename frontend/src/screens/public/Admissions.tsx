import React from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, Calendar, ArrowRight, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Admissions: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="public-subpage admissions-page">
      <header className="page-header">
        <div className="header-container">
          <h1>{t('admissions.title')}</h1>
          <p>{t('admissions.subtitle')}</p>
        </div>
      </header>

      <section className="page-content">
        <div className="section-container">
          <div className="admissions-split-grid">
            {/* Guide & Requirements */}
            <div className="admissions-guide">
              <h2>{t('admissions.req_title')}</h2>
              <p>
                {t('admissions.req_desc')}
              </p>

              <div className="requirements-checklist">
                <h3>{t('admissions.eligibility_title')}</h3>
                <ul>
                  <li>
                    <CheckSquare className="check-icon" />
                    <span>{t('admissions.eligibility_1')}</span>
                  </li>
                  <li>
                    <CheckSquare className="check-icon" />
                    <span>{t('admissions.eligibility_2')}</span>
                  </li>
                  <li>
                    <CheckSquare className="check-icon" />
                    <span>{t('admissions.eligibility_3')}</span>
                  </li>
                  <li>
                    <CheckSquare className="check-icon" />
                    <span>{t('admissions.eligibility_4')}</span>
                  </li>
                </ul>
              </div>

              <div className="documents-checklist">
                <h3>{t('admissions.docs_title')}</h3>
                <ul className="doc-list">
                  <li>
                    <FileText size={16} className="doc-icon" />
                    <span>{t('admissions.doc_1')}</span>
                  </li>
                  <li>
                    <FileText size={16} className="doc-icon" />
                    <span>{t('admissions.doc_2')}</span>
                  </li>
                  <li>
                    <FileText size={16} className="doc-icon" />
                    <span>{t('admissions.doc_3')}</span>
                  </li>
                  <li>
                    <FileText size={16} className="doc-icon" />
                    <span>{t('admissions.doc_4')}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Schedule & Action */}
            <div className="admissions-schedule-box">
              <div className="schedule-header">
                <Calendar className="sch-icon" />
                <h3>{t('admissions.calendar_title')}</h3>
              </div>
              <div className="schedule-body">
                <div className="timeline-item">
                  <span className="timeline-date">{t('admissions.cal_date_1')}</span>
                  <h4>{t('admissions.cal_title_1')}</h4>
                  <p>{t('admissions.cal_desc_1')}</p>
                </div>
                <div className="timeline-item">
                  <span className="timeline-date">{t('admissions.cal_date_2')}</span>
                  <h4>{t('admissions.cal_title_2')}</h4>
                  <p>{t('admissions.cal_desc_2')}</p>
                </div>
                <div className="timeline-item">
                  <span className="timeline-date">{t('admissions.cal_date_3')}</span>
                  <h4>{t('admissions.cal_title_3')}</h4>
                  <p>{t('admissions.cal_desc_3')}</p>
                </div>
              </div>

              <div className="schedule-footer">
                <p>{t('admissions.ready_msg')}</p>
                <Link to="/register" className="btn btn-primary btn-block">
                  {t('admissions.apply_now')} <ArrowRight size={16} />
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
