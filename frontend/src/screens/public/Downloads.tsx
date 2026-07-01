import React, { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { FileDown, DownloadCloud, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DownloadItem {
  title: string;
  file_name: string;
  file_size: string;
}

const Downloads: React.FC = () => {
  const { t } = useTranslation();
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDownloads = async () => {
      try {
        const response = await api.get('/public/downloads');
        setDownloads(response.data.data);
      } catch (error) {
        console.error("Failed to fetch downloads list. Using fallback.", error);
        setDownloads([
          { title: t('downloads.fallback_1'), file_name: 'college_prospectus_2026.pdf', file_size: '4.2 MB' },
          { title: t('downloads.fallback_2'), file_name: 'syllabus_b_sharia.pdf', file_size: '1.8 MB' },
          { title: t('downloads.fallback_3'), file_name: 'syllabus_b_arabic.pdf', file_size: '1.5 MB' },
          { title: t('downloads.fallback_4'), file_name: 'syllabus_b_hadith.pdf', file_size: '1.9 MB' },
          { title: t('downloads.fallback_5'), file_name: 'academic_calendar_2026.pdf', file_size: '850 KB' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchDownloads();
  }, [t]);

  const handleDownload = (title: string, fileName: string) => {
    toast.success(t('downloads.toast_start', { title }));
    // Simulate file download trigger in production
    const link = document.createElement('a');
    link.href = `#`; // Mock link or pointing to storage
    link.setAttribute('download', fileName);
    // Since it's a mock action in local sandbox, we show toast confirmation.
  };

  return (
    <div className="public-subpage downloads-page">
      <header className="page-header">
        <div className="header-container">
          <h1>{t('downloads.title')}</h1>
          <p>{t('downloads.subtitle')}</p>
        </div>
      </header>

      <section className="page-content">
        <div className="section-container">
          {loading ? (
            <div className="spinner-center">
              <div className="spinner"></div>
              <p>{t('downloads.loading')}</p>
            </div>
          ) : (
            <div className="downloads-wrapper">
              <div className="notice-banner">
                <AlertCircle className="notice-icon" />
                <p>
                  {t('downloads.notice')}
                </p>
              </div>

              <div className="downloads-table-container">
                <table className="downloads-table">
                  <thead>
                    <tr>
                      <th>{t('downloads.table_title')}</th>
                      <th>{t('downloads.table_name')}</th>
                      <th>{t('downloads.table_size')}</th>
                      <th style={{ textAlign: 'center' }}>{t('downloads.table_action')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {downloads.map((item, idx) => (
                      <tr key={idx}>
                        <td className="doc-title-cell">
                          <FileDown size={18} className="doc-icon" />
                          <span>{item.title}</span>
                        </td>
                        <td className="filename-cell"><code>{item.file_name}</code></td>
                        <td>{item.file_size}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => handleDownload(item.title, item.file_name)}
                            className="btn btn-outline btn-sm flex-center"
                            style={{ margin: '0 auto' }}
                          >
                            <DownloadCloud size={14} style={{ marginRight: '6px' }} /> {t('downloads.download_btn')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Downloads;
