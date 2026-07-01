import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Clock, Layers, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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

  const getCleanCode = (code: string) => {
    return code.toLowerCase().replace('-', '_');
  };

  return (
    <div className="public-subpage programs-page">
      <header className="page-header">
        <div className="header-container">
          <h1>{t('programs.title')}</h1>
          <p>{t('programs.subtitle')}</p>
        </div>
      </header>

      <section className="page-content">
        <div className="section-container">
          {loading ? (
            <div className="spinner-center">
              <div className="spinner"></div>
              <p>{t('programs.loading')}</p>
            </div>
          ) : (
            <div className="programs-grid">
              {programs.map((program) => (
                <div key={program.id} className="program-card">
                  <div className="program-card-header">
                    <span className="dept-badge">{t(`programs.dept_${getCleanCode(program.code)}`) || program.department}</span>
                    <span className="code-badge">{program.code}</span>
                  </div>
                  <div className="program-card-body">
                    <h3>{t(`programs.name_${getCleanCode(program.code)}`) || program.name_en}</h3>
                    <h4 className="arabic-text">{program.name_ar}</h4>
                    <div className="program-details">
                      <div className="detail-pill">
                        <Clock size={16} />
                        <span>{t('programs.duration_label')}</span>
                      </div>
                      <div className="detail-pill">
                        <Layers size={16} />
                        <span>{t(`programs.credits_${getCleanCode(program.code)}`) || program.credits}</span>
                      </div>
                    </div>
                  </div>
                  <div className="program-card-footer">
                    <span className="accreditation-tag">
                      <Award size={14} /> {t('programs.acred') || t('programs.accreditation')}
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
