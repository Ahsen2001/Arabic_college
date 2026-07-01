import React, { useState, useEffect } from 'react';
import { Target, Eye, Landmark, Compass } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../api';

interface AboutCms {
  history?: string;
  mission?: string;
  vision?: string;
}

const About: React.FC = () => {
  const [cms, setCms] = useState<AboutCms>({});
  const { t } = useTranslation();

  useEffect(() => {
    api.get('/public/cms').then(res => {
      const data = res.data.data;
      if (data?.cms_about_content) setCms(data.cms_about_content);
    }).catch(() => {/* fall back to static */});
  }, []);

  return (
    <div className="public-subpage about-page">
      <header className="page-header">
        <div className="header-container">
          <h1>{t('about.title')}</h1>
          <p>{t('about.subtitle')}</p>
        </div>
      </header>

      <section className="page-content">
        <div className="section-container">
          {/* History */}
          <div className="about-history-block">
            <h2>{t('about.our_history')}</h2>
            <p>
              {cms.history || t('about.history_p1')}
            </p>
            {!cms.history && (
            <p>
              {t('about.history_p2')}
            </p>
            )}
          </div>

          {/* Mission & Vision */}
          <div className="grid-2 mission-vision-grid">
            <div className="about-card-info">
              <div className="card-info-title">
                <Target size={24} className="info-icon" />
                <h3>{t('about.our_mission')}</h3>
              </div>
              <p>
                {cms.mission || t('about.mission_desc')}
              </p>
            </div>
            <div className="about-card-info">
              <div className="card-info-title">
                <Eye size={24} className="info-icon" />
                <h3>{t('about.our_vision')}</h3>
              </div>
              <p>
                {cms.vision || t('about.vision_desc')}
              </p>
            </div>
          </div>

          {/* Core Values */}
          <div className="core-values-block">
            <h2>{t('about.core_pillars')}</h2>
            <div className="grid-3 values-grid">
              <div className="value-card">
                <Landmark className="value-icon" />
                <h4>{t('about.authenticity_title')}</h4>
                <p>{t('about.authenticity_desc')}</p>
              </div>
              <div className="value-card">
                <Compass className="value-icon" />
                <h4>{t('about.critical_thinking_title')}</h4>
                <p>{t('about.critical_thinking_desc')}</p>
              </div>
              <div className="value-card">
                <Target className="value-icon" />
                <h4>{t('about.relevance_title')}</h4>
                <p>{t('about.relevance_desc')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
