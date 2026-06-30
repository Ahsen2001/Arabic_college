import React, { useState, useEffect } from 'react';
import { Target, Eye, Landmark, Compass } from 'lucide-react';
import api from '../../api';

interface AboutCms {
  history?: string;
  mission?: string;
  vision?: string;
}

const About: React.FC = () => {
  const [cms, setCms] = useState<AboutCms>({});

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
          <h1>About the College</h1>
          <p>Rooted in Classical Tradition, Committed to Contemporary Academic Standards</p>
        </div>
      </header>

      <section className="page-content">
        <div className="section-container">
          {/* History */}
          <div className="about-history-block">
            <h2>Our History</h2>
            <p>
              {cms.history || 'Founded in 2012, the Arabic College of Sharia and Linguistic Sciences was established to address the growing need for high-caliber, academically structured education in classical Islamic subjects. Rather than relying on informal study circles, our founders designed a comprehensive university-level curriculum.'}
            </p>
            {!cms.history && (
            <p>
              Today, our campus serves as a leading institution in Sharia jurisprudence, Arabic morphology and syntax, and Hadith criticism. We blend time-tested textual learning of classical Islamic manuals with structured semester formats, coursework grading, and credit-hour criteria.
            </p>
            )}
          </div>

          {/* Mission & Vision */}
          <div className="grid-2 mission-vision-grid">
            <div className="about-card-info">
              <div className="card-info-title">
                <Target size={24} className="info-icon" />
                <h3>Our Mission</h3>
              </div>
              <p>
                {cms.mission || 'To cultivate accomplished scholars and researchers in Sharia sciences and classical Arabic literature, empowering them with critical thinking, research skills, and authentic traditional insights to guide the contemporary community.'}
              </p>
            </div>
            <div className="about-card-info">
              <div className="card-info-title">
                <Eye size={24} className="info-icon" />
                <h3>Our Vision</h3>
              </div>
              <p>
                {cms.vision || 'To be the premier global center of higher learning for traditional Sharia sciences and Arabic linguistic research, recognized for combining classical depth with academic integrity.'}
              </p>
            </div>
          </div>

          {/* Core Values */}
          <div className="core-values-block">
            <h2>Core Pillars</h2>
            <div className="grid-3 values-grid">
              <div className="value-card">
                <Landmark className="value-icon" />
                <h4>Authenticity (Asalah)</h4>
                <p>Upholding chains of narration and classical understandings of early Sharia scholars.</p>
              </div>
              <div className="value-card">
                <Compass className="value-icon" />
                <h4>Critical Thinking</h4>
                <p>Equipping students with comparative analysis methodologies in comparative Fiqh.</p>
              </div>
              <div className="value-card">
                <Target className="value-icon" />
                <h4>Relevance</h4>
                <p>Bridging traditional texts to answer modern, legal, and financial queries.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
