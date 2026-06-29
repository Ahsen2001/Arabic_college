import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Clock, Layers, Award } from 'lucide-react';

interface Program {
  id: number;
  code: string;
  name_ar: string;
  name_en: string;
  duration: string;
  credits: string;
  department: string;
}

const Programs: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const response = await api.get('/public/programs');
        setPrograms(response.data.data);
      } catch (error) {
        console.error("Failed to fetch public programs. Using static defaults.", error);
        setPrograms([
          {
            id: 1,
            code: 'B-SHARIA',
            name_ar: 'بكالوريوس في الفقه وأصوله',
            name_en: 'Bachelor of Islamic Jurisprudence (Fiqh & Usul)',
            duration: '4 Years',
            credits: '132 Credits',
            department: 'Department of Islamic Law (Sharia)',
          },
          {
            id: 2,
            code: 'B-ARABIC',
            name_ar: 'بكالوريوس في اللغة العربية وآدابها',
            name_en: 'Bachelor of Arabic Language and Literature',
            duration: '4 Years',
            credits: '128 Credits',
            department: 'Department of Arabic Language and Literature',
          },
          {
            id: 3,
            code: 'B-HADITH',
            name_ar: 'بكالوريوس في علوم الحديث الشريف',
            name_en: 'Bachelor of Hadith Sciences',
            duration: '4 Years',
            credits: '130 Credits',
            department: 'Department of Hadith Sciences',
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  return (
    <div className="public-subpage programs-page">
      <header className="page-header">
        <div className="header-container">
          <h1>Academic Programs</h1>
          <p>Explore our accredited undergraduate degree programs</p>
        </div>
      </header>

      <section className="page-content">
        <div className="section-container">
          {loading ? (
            <div className="spinner-center">
              <div className="spinner"></div>
              <p>Loading programs...</p>
            </div>
          ) : (
            <div className="programs-grid">
              {programs.map((program) => (
                <div key={program.id} className="program-card">
                  <div className="program-card-header">
                    <span className="dept-badge">{program.department}</span>
                    <span className="code-badge">{program.code}</span>
                  </div>
                  <div className="program-card-body">
                    <h3>{program.name_en}</h3>
                    <h4 className="arabic-text">{program.name_ar}</h4>
                    <div className="program-details">
                      <div className="detail-pill">
                        <Clock size={16} />
                        <span>{program.duration}</span>
                      </div>
                      <div className="detail-pill">
                        <Layers size={16} />
                        <span>{program.credits}</span>
                      </div>
                    </div>
                  </div>
                  <div className="program-card-footer">
                    <span className="accreditation-tag">
                      <Award size={14} /> Full Accreditation
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Programs;
